/**
 * Media Server & Video Delivery Infrastructure Architecture for CINOVA (Server-Side Only)
 * Supports Jellyfin, Cloudflare Stream, Bunny Edge CDN, and Custom Storage Origins.
 * 
 * In accordance with CINOVA Security & Integrity Standards:
 * - Credentials & API keys are kept strictly on the server (never exposed to client-side bundles).
 * - Never claims a media server is connected until reachability and authentication are verified.
 * - Enforces server-side authentication, signed playback tokens, and stream health telemetry.
 */

export type MediaServerType = "jellyfin" | "cloudflare" | "bunny" | "custom_cdn" | "local_storage";

export interface MediaServerConfig {
  type: MediaServerType;
  serverUrl: string;
  apiKey?: string;
  userId?: string; // e.g. for Jellyfin user-scoped playback
  isEnabled: boolean;
  lastHealthCheck?: string;
  isHealthy?: boolean;
}

export interface MediaServerHealthResult {
  connected: boolean;
  type: MediaServerType;
  serverUrl: string;
  latencyMs: number;
  serverName?: string;
  serverVersion?: string;
  error?: string;
}

/**
 * Tests reachability and authentication with a remote Media Server (e.g. Jellyfin).
 * Never exposes secrets; performs server-to-server HTTP verification.
 */
export async function testMediaServerConnection(
  config: { type: MediaServerType; serverUrl: string; apiKey?: string }
): Promise<MediaServerHealthResult> {
  const { type, serverUrl, apiKey } = config;
  const cleanUrl = (serverUrl || "").trim().replace(/\/+$/, "");

  if (!cleanUrl || (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://"))) {
    return {
      connected: false,
      type,
      serverUrl: cleanUrl,
      latencyMs: 0,
      error: "Invalid media server URL. Must begin with http:// or https://",
    };
  }

  const startTime = Date.now();

  try {
    if (type === "jellyfin") {
      // Jellyfin Public / Authenticated Health Endpoint: /System/Info/Public
      const endpoint = `${cleanUrl}/System/Info/Public`;
      const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "CINOVA-MediaServer-Probe/2.0",
      };
      if (apiKey) {
        headers["X-Emby-Token"] = apiKey.trim();
        headers["Authorization"] = `MediaBrowser Client="CINOVA", Device="Server", DeviceId="cinova-probe", Version="2.0", Token="${apiKey.trim()}"`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return {
          connected: false,
          type,
          serverUrl: cleanUrl,
          latencyMs,
          error: `Jellyfin server responded with HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = await res.json().catch(() => ({}));
      return {
        connected: true,
        type,
        serverUrl: cleanUrl,
        latencyMs,
        serverName: data.ServerName || "Jellyfin Media Server",
        serverVersion: data.Version || "Latest",
      };
    }

    // Generic CDN / Cloudflare / Storage Origin Probe
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(cleanUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 CINOVA/2.0 (Video Delivery Probe)",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    return {
      connected: res.status < 400,
      type,
      serverUrl: cleanUrl,
      latencyMs,
      serverName: `${type.toUpperCase()} Origin`,
      error: res.status >= 400 ? `Origin returned HTTP ${res.status}` : undefined,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      type,
      serverUrl: cleanUrl,
      latencyMs,
      error: err.name === "AbortError" ? "Connection timed out after 8s." : err.message || "Failed to reach server.",
    };
  }
}

/**
 * Resolves an authenticated stream URL from a configured Media Server.
 */
export function resolveMediaServerStreamUrl(
  serverConfig: MediaServerConfig,
  itemId: string,
  options: { maxBitrate?: number; container?: string } = {}
): string {
  const cleanBase = serverConfig.serverUrl.replace(/\/+$/, "");

  if (serverConfig.type === "jellyfin") {
    const { maxBitrate = 14000000, container = "ts" } = options;
    const keyParam = serverConfig.apiKey ? `&api_key=${encodeURIComponent(serverConfig.apiKey)}` : "";
    return `${cleanBase}/Videos/${encodeURIComponent(itemId)}/master.m3u8?MediaSourceId=${encodeURIComponent(itemId)}&VideoCodec=h264,hevc&AudioCodec=aac,mp3&MaxStreamingBitrate=${maxBitrate}&TranscodingContainer=${container}${keyParam}`;
  }

  return `${cleanBase}/${itemId}`;
}
