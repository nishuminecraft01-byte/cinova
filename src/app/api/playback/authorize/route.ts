
import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_MOVIES } from "@/data/movies";
import { resolveStreamingServers } from "@/lib/streaming-servers";
import { getPrimaryVideoSource, isTvSeries } from "@/lib/video-sources";
import { getWatchTimeStatus, sanitizeViewerKey } from "@/lib/watch-time-store";
import { signPlaybackToken } from "@/lib/playback-token";
import { getServerAuthSession, setAuthSessionCookies } from "@/lib/supabase-server";
import { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";

function findAuthorizedCatalogMovie(movieId: string): Movie | null {
  const clean = (movieId || "").trim();
  const normalized = clean.replace(/^tmdb-(?:movie-|tv-|series-)?/i, "");
  return (
    SAMPLE_MOVIES.find(
      (m) =>
        m.id.toLowerCase() === clean.toLowerCase() ||
        (m.tmdbId && `tmdb-${m.tmdbId}`.toLowerCase() === clean.toLowerCase()) ||
        (m.tmdbId && `tmdb-movie-${m.tmdbId}`.toLowerCase() === clean.toLowerCase()) ||
        (m.tmdbId && `tmdb-tv-${m.tmdbId}`.toLowerCase() === clean.toLowerCase()) ||
        (m.tmdbId && m.tmdbId === normalized)
    ) || null
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Strict server-side authentication verification — never trust client-supplied identity, roles, or localStorage
    const session = await getServerAuthSession(request);
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        {
          authorized: false,
          reason: "AUTH_REQUIRED",
          error: "Authentication is required to play video content.",
          servers: [],
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      movieId?: string;
      season?: number;
      episode?: number;
      isTv?: boolean;
      mediaType?: string;
    };

    const movieId = (body.movieId || "").trim();
    if (!movieId) {
      return NextResponse.json(
        { authorized: false, reason: "MISSING_MOVIE_ID", servers: [] },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const verifiedRole: "user" | "creator" | "admin" = session.user.role;
    const { viewerKey } = sanitizeViewerKey(session.user.id, undefined);
    const quota = await getWatchTimeStatus(viewerKey, verifiedRole);

    const attachRefreshedCookies = (res: NextResponse) => {
      if (session.refreshedTokens) {
        setAuthSessionCookies(
          res,
          session.refreshedTokens.accessToken,
          session.refreshedTokens.refreshToken,
          session.refreshedTokens.expiresIn
        );
      }
      return res;
    };

    // 2. Enforce Free tier 60-minute daily cap server-side before returning any stream URLs
    if (quota.isLimitReached) {
      return attachRefreshedCookies(
        NextResponse.json(
          {
            authorized: false,
            reason: "DAILY_LIMIT_REACHED",
            quota,
            servers: [],
          },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        )
      );
    }

    const movie = findAuthorizedCatalogMovie(movieId);
    const season = Number(body.season) > 0 ? Number(body.season) : 1;
    const episode = Number(body.episode) > 0 ? Number(body.episode) : 1;
    const isTv =
      typeof body.isTv === "boolean"
        ? body.isTv
        : body.mediaType === "tv" || isTvSeries(movieId, movie);

    // 3. Resolve stream servers from Centralized Video Source Store and catalog
    const rawServers = await resolveStreamingServers(movieId, movie, season, episode, isTv);
    const primarySource = await getPrimaryVideoSource(movieId);

    if (rawServers.length === 0) {
      return attachRefreshedCookies(
        NextResponse.json(
          {
            authorized: false,
            reason: "PLAYBACK_UNAVAILABLE",
            error:
              "This title is available to explore, but a video source has not been connected yet.",
            quota,
            servers: [],
          },
          { status: 404, headers: { "Cache-Control": "no-store" } }
        )
      );
    }

    const playbackToken = signPlaybackToken({
      viewerKey,
      movieId: movie?.id || movieId,
      dateIst: quota.dateIst,
      role: verifiedRole,
    });

    const canonicalId = movie?.id || movieId;
    const isHlsOrDash = (url: string) => url.includes(".m3u8") || url.includes(".mpd");

    const authorizedServers = rawServers.map((srv) => {
      // Direct progressive MP4 streams pass through the proxy stream route for range scrubbing
      if (srv.type === "direct" && !isHlsOrDash(srv.url)) {
        return {
          ...srv,
          url: `/api/stream/${encodeURIComponent(canonicalId)}?token=${encodeURIComponent(playbackToken)}`,
        };
      }
      return srv;
    });

    return attachRefreshedCookies(
      NextResponse.json(
        {
          authorized: true,
          quota,
          playbackToken,
          protocol: primarySource?.protocol || (rawServers[0]?.url.includes(".m3u8") ? "hls" : "mp4"),
          servers: authorizedServers,
          tracks: primarySource?.tracks || [],
        },
        { headers: { "Cache-Control": "no-store" } }
      )
    );
  } catch {
    return NextResponse.json(
      { authorized: false, reason: "AUTHORIZATION_ERROR", servers: [] },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
