
import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_MOVIES } from "@/data/movies";
import { getPrimaryVideoSource } from "@/lib/video-sources";
import { verifyPlaybackToken } from "@/lib/playback-token";
import { getWatchTimeStatus, sanitizeViewerKey } from "@/lib/watch-time-store";
import { getIstDateKey } from "@/lib/membership";
import { getServerAuthSession, setAuthSessionCookies } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Strictly verify active authenticated session on every stream/range request (logout revokes immediately)
  const session = await getServerAuthSession(request);
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { id } = await context.params;
  const movieId = decodeURIComponent(id || "").trim();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const { viewerKey } = sanitizeViewerKey(session.user.id, undefined);
  const payload = verifyPlaybackToken(token);
  if (
    !payload ||
    payload.movieId !== movieId ||
    payload.viewerKey !== viewerKey ||
    payload.dateIst !== getIstDateKey()
  ) {
    return NextResponse.json(
      { error: "INVALID_OR_EXPIRED_PLAYBACK_TOKEN" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 2. Re-verify live server-side daily watch-time quota on every stream/range fetch
  const quota = await getWatchTimeStatus(viewerKey, session.user.role);
  if (quota.isLimitReached) {
    return NextResponse.json(
      {
        error: "DAILY_LIMIT_REACHED",
        resetsAtIst: quota.resetsAtIst,
      },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const movie = SAMPLE_MOVIES.find(
    (m) => m.id === movieId || (m.tmdbId && `tmdb-${m.tmdbId}` === movieId)
  );

  let targetStreamUrl = movie?.videoUrl?.trim() || "";
  if (!targetStreamUrl) {
    const primary = await getPrimaryVideoSource(movieId);
    if (primary?.streamUrl) {
      targetStreamUrl = primary.streamUrl.trim();
    }
  }

  if (!targetStreamUrl) {
    return NextResponse.json(
      { error: "STREAM_SOURCE_NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Forward Range header so HTML5 video scrubbing/seeking works cleanly
  const upstreamHeaders: HeadersInit = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  try {
    const upstreamRes = await fetch(targetStreamUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: "UPSTREAM_STREAM_UNAVAILABLE" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const responseHeaders = new Headers();
    const passthrough = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];
    for (const h of passthrough) {
      const val = upstreamRes.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }
    responseHeaders.set("Cache-Control", "private, no-store");
    responseHeaders.set("X-Cinova-Watch-Remaining", String(quota.remainingSeconds ?? "unlimited"));

    const res = new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
    if (session.refreshedTokens) {
      setAuthSessionCookies(
        res,
        session.refreshedTokens.accessToken,
        session.refreshedTokens.refreshToken,
        session.refreshedTokens.expiresIn
      );
    }
    return res;
  } catch {
    return NextResponse.json(
      { error: "STREAM_PROXY_FAILED" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
