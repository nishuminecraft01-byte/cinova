import { NextRequest, NextResponse } from "next/server";
import { POPULAR_TMDB_CATALOG } from "@/lib/tmdb";
import { getStreamingServers } from "@/lib/streaming-servers";
import { tmdb } from "@/lib/api/tmdb-client";
import { requireAdminSession } from "@/lib/supabase-server";
import { Movie } from "@/types/movie";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (query) {
    const q = query.toLowerCase();
    const filtered = POPULAR_TMDB_CATALOG.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.genre?.some((g) => g.toLowerCase().includes(q))
    );
    return NextResponse.json({
      success: true,
      query,
      count: filtered.length,
      movies: filtered,
    });
  }

  return NextResponse.json({
    success: true,
    engine: "CINOVA Multi-Server Auto Ingestion Engine",
    status: "active",
    supportedServers: [
      "VidLink (4K Fast)",
      "VidRift (Multi-Audio)",
      "VidFast (Low Latency CDN)",
      "RiveStream (Backup HD)",
      "VidBolt (Ultra Fast)",
      "CINOVA Direct Master",
    ],
    catalogSize: POPULAR_TMDB_CATALOG.length,
    catalog: POPULAR_TMDB_CATALOG.map((m) => ({
      tmdbId: m.tmdbId,
      title: m.title,
      type: m.type,
      industry: m.industry,
      language: m.language,
      releaseYear: m.releaseYear,
      genres: m.genre,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request);
  if (!guard.ok) {
    return NextResponse.json(
      { success: false, error: guard.error || "Unauthorized" },
      { status: guard.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = await request.json();
    const { title, tmdbId, type = "movie" } = body;

    const cleanTmdbId = tmdbId ? String(tmdbId).replace(/^tmdb-/, "").trim() : "";
    const isNumericTmdbId = /^\d+$/.test(cleanTmdbId);
    const normalizedTitle = typeof title === "string" ? title.trim().toLowerCase() : "";

    let match = POPULAR_TMDB_CATALOG.find(
      (m) =>
        (isNumericTmdbId && m.tmdbId === cleanTmdbId) ||
        (normalizedTitle &&
          (m.title?.toLowerCase() === normalizedTitle ||
            m.originalTitle?.toLowerCase() === normalizedTitle))
    );

    if (match) {
      const fullMovie: Movie = {
        id: match.tmdbId ? `tmdb-${match.tmdbId}` : `movie-${Date.now()}`,
        tmdbId: match.tmdbId,
        title: match.title || "Untitled",
        originalTitle: match.originalTitle,
        tagline: match.tagline || "Streaming now on CINOVA",
        description: match.description || "Stream in 4K UHD with multi-server backup.",
        posterUrl: match.posterUrl && !match.posterUrl.includes("unsplash.com") ? match.posterUrl : "",
        backdropUrl: match.backdropUrl && !match.backdropUrl.includes("unsplash.com") ? match.backdropUrl : "",
        videoUrl: match.videoUrl || "",
        releaseYear: match.releaseYear || new Date().getFullYear(),
        duration: match.duration || 120,
        rating: match.rating || "PG-13",
        imdbScore: match.imdbScore || 8.0,
        matchPercentage: match.matchPercentage || 92,
        genre: match.genre || ["Action"],
        type: (match.type || type) as any,
        language: match.language || "English",
        availableLanguages: match.availableLanguages || ["English"],
        subtitles: match.subtitles || ["English [CC]"],
        quality: match.quality || "4K UHD",
        audioSpecs: match.audioSpecs || "Dolby Atmos",
        directors: match.directors || [],
        cast: match.cast || [],
        isFeatured: !!match.isFeatured,
        isTrending: !!match.isTrending,
        isPopular: !!match.isPopular,
        views: match.views || 500000,
        seasons: match.seasons,
      };

      const servers = getStreamingServers(fullMovie);

      return NextResponse.json({
        success: true,
        verified: true,
        source: "catalog",
        message: `Movie "${fullMovie.title}" ingested from verified catalog with ${servers.length} playback servers.`,
        movie: fullMovie,
        streamingServers: servers,
      });
    }

    // Attempt live verified TMDB lookup instead of fabricating random IDs or stock photos
    let resolvedMovie: Movie | null = null;
    try {
      const isTv = type === "series" || type === "tv";
      if (isNumericTmdbId) {
        if (isTv) {
          const details = await tmdb.getSeriesDetails(cleanTmdbId);
          resolvedMovie = {
            id: `tmdb-${details.id}`,
            tmdbId: String(details.id),
            title: details.name,
            originalTitle: details.original_name,
            tagline: details.tagline || "",
            description: details.overview || "",
            posterUrl: tmdb.getImageUrl(details.poster_path, "w780"),
            backdropUrl: tmdb.getImageUrl(details.backdrop_path, "original"),
            videoUrl: "",
            releaseYear: details.first_air_date ? parseInt(details.first_air_date.slice(0, 4), 10) : new Date().getFullYear(),
            duration: details.episode_run_time?.[0] || 45,
            rating: "TV-14",
            imdbScore: details.vote_average ? Number(details.vote_average.toFixed(1)) : 0,
            matchPercentage: Math.min(99, Math.round((details.vote_average || 7.5) * 10 + 12)),
            genre: details.genres?.map((g) => g.name) || [],
            type: "series",
            language: details.original_language?.toUpperCase() || "EN",
            availableLanguages: [details.original_language?.toUpperCase() || "EN"],
            subtitles: ["English [CC]"],
            quality: "4K UHD",
            audioSpecs: "Dolby Atmos",
            directors: details.credits?.crew?.filter((c) => c.job === "Director").slice(0, 2).map((c) => c.name) || [],
            cast: details.credits?.cast?.slice(0, 6).map((c) => ({ name: c.name, character: c.character })) || [],
            isFeatured: false,
            isTrending: false,
            isPopular: false,
            views: (details.vote_count || 100) * 100,
          };
        } else {
          const details = await tmdb.getMovieDetails(cleanTmdbId);
          resolvedMovie = {
            id: `tmdb-${details.id}`,
            tmdbId: String(details.id),
            title: details.title,
            originalTitle: details.original_title,
            tagline: details.tagline || "",
            description: details.overview || "",
            posterUrl: tmdb.getImageUrl(details.poster_path, "w780"),
            backdropUrl: tmdb.getImageUrl(details.backdrop_path, "original"),
            videoUrl: "",
            releaseYear: details.release_date ? parseInt(details.release_date.slice(0, 4), 10) : new Date().getFullYear(),
            duration: details.runtime || 120,
            rating: "PG-13",
            imdbScore: details.vote_average ? Number(details.vote_average.toFixed(1)) : 0,
            matchPercentage: Math.min(99, Math.round((details.vote_average || 7.5) * 10 + 12)),
            genre: details.genres?.map((g) => g.name) || [],
            type: (type === "anime" ? "anime" : "movie") as any,
            language: details.original_language?.toUpperCase() || "EN",
            availableLanguages: [details.original_language?.toUpperCase() || "EN"],
            subtitles: ["English [CC]"],
            quality: "4K UHD",
            audioSpecs: "Dolby Atmos",
            directors: details.credits?.crew?.filter((c) => c.job === "Director").slice(0, 2).map((c) => c.name) || [],
            cast: details.credits?.cast?.slice(0, 6).map((c) => ({ name: c.name, character: c.character })) || [],
            isFeatured: false,
            isTrending: false,
            isPopular: false,
            views: (details.vote_count || 100) * 100,
          };
        }
      } else if (normalizedTitle) {
        const results = await tmdb.search(title.trim());
        const candidates = results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
        const exactCandidate =
          candidates.find(
            (r) =>
              (r.title && r.title.toLowerCase() === normalizedTitle) ||
              (r.name && r.name.toLowerCase() === normalizedTitle) ||
              (r.original_title && r.original_title.toLowerCase() === normalizedTitle) ||
              (r.original_name && r.original_name.toLowerCase() === normalizedTitle)
          ) || candidates[0];

        if (exactCandidate?.id) {
          const mediaIsTv = exactCandidate.media_type === "tv";
          const releaseRaw = mediaIsTv ? exactCandidate.first_air_date : exactCandidate.release_date;
          resolvedMovie = {
            id: `tmdb-${exactCandidate.id}`,
            tmdbId: String(exactCandidate.id),
            title: mediaIsTv ? exactCandidate.name : exactCandidate.title,
            originalTitle: mediaIsTv ? exactCandidate.original_name : exactCandidate.original_title,
            tagline: "",
            description: exactCandidate.overview || "",
            posterUrl: tmdb.getImageUrl(exactCandidate.poster_path, "w780"),
            backdropUrl: tmdb.getImageUrl(exactCandidate.backdrop_path, "original"),
            videoUrl: "",
            releaseYear: releaseRaw ? parseInt(releaseRaw.slice(0, 4), 10) : new Date().getFullYear(),
            duration: mediaIsTv ? 45 : 120,
            rating: mediaIsTv ? "TV-14" : "PG-13",
            imdbScore: exactCandidate.vote_average ? Number(exactCandidate.vote_average.toFixed(1)) : 0,
            matchPercentage: Math.min(99, Math.round((exactCandidate.vote_average || 7.5) * 10 + 12)),
            genre: [],
            type: (mediaIsTv ? "series" : type === "anime" ? "anime" : "movie") as any,
            language: exactCandidate.original_language?.toUpperCase() || "EN",
            availableLanguages: [exactCandidate.original_language?.toUpperCase() || "EN"],
            subtitles: ["English [CC]"],
            quality: "4K UHD",
            audioSpecs: "Dolby Atmos",
            directors: [],
            cast: [],
            isFeatured: false,
            isTrending: false,
            isPopular: false,
            views: (exactCandidate.vote_count || 100) * 100,
          };
        }
      }
    } catch {
      resolvedMovie = null;
    }

    if (resolvedMovie) {
      const servers = getStreamingServers(resolvedMovie);
      return NextResponse.json({
        success: true,
        verified: true,
        source: "tmdb_live",
        message: `Title "${resolvedMovie.title}" resolved via verified TMDB ID ${resolvedMovie.tmdbId}.`,
        movie: resolvedMovie,
        streamingServers: servers,
      });
    }

    if (!normalizedTitle && !isNumericTmdbId) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid title or numeric tmdbId" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: `No verified TMDB metadata match found for "${title || cleanTmdbId}". Refusing to fabricate TMDB ID or fallback artwork.`,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to ingest movie" },
      { status: 500 }
    );
  }
}
