import crypto from "node:crypto";

export interface PlaybackTokenPayload {
  viewerKey: string;
  movieId: string;
  dateIst: string;
  role: "user" | "creator" | "admin";
  exp: number; // Unix ms expiry
}

const DEFAULT_TOKEN_TTL_MS = 90 * 1000; // 90 seconds; refreshed by active heartbeats

function getSigningSecret(): string {
  return (
    process.env.PLAYBACK_TOKEN_SECRET ||
    process.env.ADMIN_API_KEY ||
    process.env.CRON_SECRET ||
    "cinova-dev-playback-hmac-secret-v1"
  );
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
}

export function signPlaybackToken(
  payload: Omit<PlaybackTokenPayload, "exp">,
  ttlMs: number = DEFAULT_TOKEN_TTL_MS
): string {
  const fullPayload: PlaybackTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest();
  return `${encodedPayload}.${toBase64Url(sig)}`;
}

export function verifyPlaybackToken(token: string | null | undefined): PlaybackTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest();

  let providedSig: Buffer;
  try {
    providedSig = fromBase64Url(encodedSig);
  } catch {
    return null;
  }

  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as PlaybackTokenPayload;
    if (
      !parsed ||
      typeof parsed.viewerKey !== "string" ||
      typeof parsed.movieId !== "string" ||
      typeof parsed.dateIst !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
