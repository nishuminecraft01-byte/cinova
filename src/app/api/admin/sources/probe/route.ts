import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/sources/probe
 * Tests reachability, CORS support, status code, and latency of a video stream URL.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const streamUrl = (body.streamUrl || "").trim();

    if (!streamUrl || (!streamUrl.startsWith("http://") && !streamUrl.startsWith("https://"))) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid HTTP or HTTPS stream URL." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const startMs = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let res: Response;
    try {
      // Try HEAD first; fallback to range GET if HEAD is rejected by CDN (403, 405, 400)
      res = await fetch(streamUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CINOVA/2.0",
        },
      });

      if (!res.ok && (res.status === 405 || res.status === 403 || res.status === 400 || res.status === 501)) {
        res = await fetch(streamUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Range: "bytes=0-1024",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CINOVA/2.0",
          },
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - startMs;
    const contentType = res.headers.get("content-type") || "unknown";
    const acceptRanges = res.headers.get("accept-ranges") || "none";
    const corsHeader = res.headers.get("access-control-allow-origin");
    const isSuccess = res.ok || res.status === 206 || res.status === 302 || res.status === 304;

    const isHls =
      contentType.includes("mpegurl") ||
      contentType.includes("application/vnd.apple.mpegurl") ||
      streamUrl.includes(".m3u8");
    const isDash = contentType.includes("dash+xml") || streamUrl.includes(".mpd");
    const isMp4 = contentType.includes("video/mp4") || streamUrl.includes(".mp4");

    return NextResponse.json(
      {
        success: true,
        reachable: isSuccess,
        statusCode: res.status,
        statusText: res.statusText,
        contentType,
        latencyMs,
        detectedFormat: isHls ? "hls" : isDash ? "dash" : isMp4 ? "mp4" : "other",
        acceptsRanges: acceptRanges.toLowerCase().includes("bytes"),
        corsOpen: corsHeader === "*" || Boolean(corsHeader),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        reachable: false,
        error: err?.name === "AbortError" ? "Request timed out after 6 seconds." : err?.message || "Probe failed",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
