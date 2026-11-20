
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase-server";
import {
  deleteVideoSource,
  getAllVideoSources,
  upsertVideoSource,
  VideoProtocol,
  VideoProvider,
  PlaybackAvailabilityStatus,
} from "@/lib/video-sources";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sources
 * Authoritative admin listing of connected video sources.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId")?.trim();
  const query = searchParams.get("query")?.trim().toLowerCase();

  const allSources = await getAllVideoSources();
  let filtered = allSources;

  if (movieId) {
    filtered = filtered.filter((s) => s.movieId === movieId || s.movieId.includes(movieId));
  } else if (query) {
    filtered = filtered.filter(
      (s) =>
        s.movieId.toLowerCase().includes(query) ||
        (s.title && s.title.toLowerCase().includes(query)) ||
        s.streamUrl.toLowerCase().includes(query)
    );
  }

  const counts = {
    total: allSources.length,
    available: allSources.filter((s) => s.status === "Available").length,
    processing: allSources.filter((s) => s.status === "Processing").length,
    unavailable: allSources.filter((s) => s.status === "Temporarily Unavailable").length,
  };

  return NextResponse.json(
    {
      success: true,
      counts,
      sources: filtered,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/admin/sources
 * Connects or updates an authorized video source.
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
    const {
      id,
      movieId,
      title,
      mediaType = "movie",
      season,
      episode,
      protocol = "hls",
      provider = "cinova",
      streamUrl,
      quality = "1080p FHD",
      badge,
      status = "Available",
      isPrimary = true,
      drmProtected = false,
      tracks = [],
    } = body;

    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required field: movieId" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (
      !streamUrl ||
      typeof streamUrl !== "string" ||
      (!streamUrl.trim().startsWith("http") && !streamUrl.trim().startsWith("/"))
    ) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid video stream URL (http://, https://, or local /videos/... path)." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const parsedSeason = season !== undefined && season !== null && season !== "" ? Number(season) : undefined;
    const parsedEpisode = episode !== undefined && episode !== null && episode !== "" ? Number(episode) : undefined;

    const saved = await upsertVideoSource({
      id: id || undefined,
      movieId: movieId.trim(),
      title: title ? String(title).trim() : undefined,
      mediaType: mediaType === "tv" ? "tv" : "movie",
      season: Number.isFinite(parsedSeason) ? parsedSeason : undefined,
      episode: Number.isFinite(parsedEpisode) ? parsedEpisode : undefined,
      protocol: protocol as VideoProtocol,
      provider: provider as VideoProvider,
      streamUrl: streamUrl.trim(),
      quality,
      badge: badge || (protocol === "hls" ? "HLS" : protocol === "dash" ? "DASH" : "HD"),
      status: status as PlaybackAvailabilityStatus,
      isPrimary: Boolean(isPrimary),
      drmProtected: Boolean(drmProtected),
      tracks: Array.isArray(tracks) ? tracks : [],
    });

    return NextResponse.json(
      {
        success: true,
        message: `Video source for '${movieId}' connected successfully.`,
        source: saved,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save video source." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/**
 * DELETE /api/admin/sources
 * Disconnects / removes a video source.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("id")?.trim();

  if (!sourceId) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: id" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  await deleteVideoSource(sourceId);

  return NextResponse.json(
    {
      success: true,
      message: "Video source removed successfully.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
