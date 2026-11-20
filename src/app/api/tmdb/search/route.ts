import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_MOVIES } from "@/data/movies";
import { TMDBConfigError, isTmdbConfigured, tmdb } from "@/lib/api/tmdb-client";
import {
  TMDB_GENRE_MAP,
  WORLDWIDE_LANGUAGES,
  WorldwideCatalogItem,
  WorldwideMediaType,
  getLanguageDisplayName,
} from "@/lib/tmdb-worldwide";
import { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";

function resolveIsoLanguage(languageLabel?: string): string {
  if (!languageLabel) return "en";
  const lower = languageLabel.trim().toLowerCase();
  const match = WORLDWIDE_LANGUAGES.find(
    (l) => l.code === lower || l.label.toLowerCase() === lower
  );
  return match?.code || "en";
}

function mapLocalMovieToWorldwide(m: Movie): WorldwideCatalogItem {
  const mediaType: WorldwideMediaType = m.type === "series" ? "tv" : "movie";
  const tmdbNumeric = m.tmdbId && /^\d+$/.test(m.tmdbId.trim()) ? Number(m.tmdbId.trim()) : 0;
  const isoLang = resolveIsoLanguage(m.language);

  return {
    id: m.id,
    tmdbId: tmdbNumeric,
    mediaType,
    title: m.title,
    originalTitle: m.originalTitle || m.title,
    overview: m.description || m.tagline || "",
    posterUrl: m.posterUrl || "",
    backdropUrl: m.backdropUrl || "",
    releaseDate: m.releaseYear ? `${m.releaseYear}-01-01` : "",
    releaseYear: m.releaseYear || null,
    rating: typeof m.imdbScore === "number" ? Number(m.imdbScore.toFixed(1)) : 0,
    voteCount: m.views ? Math.floor(m.views / 100) : 0,
    popularity: m.views || 0,
    originalLanguage: isoLang,
    originalLanguageLabel: m.language || getLanguageDisplayName(isoLang),
    genreIds: [],
    genres: m.genre || [],
    originCountries: m.industry === "bollywood" ? ["IN"] : m.industry === "k-drama" ? ["KR"] : m.industry === "anime" ? ["JP"] : [],
    hasLicensedStream: true,
    localId: m.id,
    detailHref: mediaType === "tv" ? `/series/${m.id}` : `/movie/${m.id}`,
  };
}

function searchCuratedLocal(params: {
  query: string;
  mediaType: "all" | "movie" | "tv" | "anime";
  year: string;
  language: string;
  genre: string;
  minRating: number;
}): WorldwideCatalogItem[] {
  const q = params.query.toLowerCase();
  const targetGenreName = params.genre ? (TMDB_GENRE_MAP[Number(params.genre)] || "").toLowerCase() : "";

  return SAMPLE_MOVIES.filter((m) => {
    const matchesText =
      m.title.toLowerCase().includes(q) ||
      (m.originalTitle || "").toLowerCase().includes(q) ||
      m.genre.some((g) => g.toLowerCase().includes(q)) ||
      (m.language || "").toLowerCase().includes(q) ||
      (m.directors || []).some((d) => d.toLowerCase().includes(q)) ||
      (m.cast || []).some((c) => c.name.toLowerCase().includes(q));

    if (!matchesText) return false;

    if (params.mediaType === "movie" && m.type !== "movie") return false;
    if (params.mediaType === "tv" && m.type !== "series") return false;
    if (params.mediaType === "anime" && m.industry !== "anime" && !m.genre.some((g) => g.toLowerCase().includes("anime"))) {
      return false;
    }
    if (params.year && /^\d{4}$/.test(params.year) && String(m.releaseYear) !== params.year) {
      return false;
    }
    if (params.language) {
      const iso = resolveIsoLanguage(m.language);
      if (iso !== params.language.toLowerCase()) return false;
    }
    if (targetGenreName) {
      const hasGenre = m.genre.some(
        (g) =>
          g.toLowerCase().includes(targetGenreName) ||
          (targetGenreName === "animation" && g.toLowerCase().includes("anime"))
      );
      if (!hasGenre) return false;
    }
    if (params.minRating > 0 && (m.imdbScore || 0) < params.minRating) {
      return false;
    }
    return true;
  }).map(mapLocalMovieToWorldwide);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = (searchParams.get("q") || "").trim();
  const rawMediaType = (searchParams.get("mediaType") || "all").trim().toLowerCase();
  const year = (searchParams.get("year") || "").trim();
  const language = (searchParams.get("language") || "").trim().toLowerCase();
  const genre = (searchParams.get("genre") || "").trim();
  const country = (searchParams.get("country") || "").trim().toUpperCase();
  const minRatingStr = (searchParams.get("minRating") || "").trim();
  const sortBy = (searchParams.get("sortBy") || "popularity.desc").trim();
  const suggest = searchParams.get("suggest") === "1";
  const pageParam = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(pageParam) ? Math.max(1, Math.min(500, Math.floor(pageParam))) : 1;

  if (!query) {
    return NextResponse.json({
      configured: isTmdbConfigured(),
      setupRequired: !isTmdbConfigured(),
      items: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
    });
  }

  const normalizedFilterType: "all" | "movie" | "tv" | "anime" =
    rawMediaType === "movie" || rawMediaType === "tv" || rawMediaType === "anime"
      ? rawMediaType
      : "all";

  const tmdbMediaType: "all" | WorldwideMediaType =
    normalizedFilterType === "anime"
      ? "tv"
      : normalizedFilterType === "movie" || normalizedFilterType === "tv"
      ? normalizedFilterType
      : "all";

  const effectiveGenre = normalizedFilterType === "anime" && !genre ? "16" : genre;
  const effectiveLanguage = normalizedFilterType === "anime" && !language ? "ja" : language;
  const minRating = Number(minRatingStr) || 0;

  const localMatches =
    page === 1
      ? searchCuratedLocal({
          query,
          mediaType: normalizedFilterType,
          year,
          language: effectiveLanguage,
          genre: effectiveGenre,
          minRating,
        })
      : [];

  try {
    const tmdbResult = await tmdb.searchWorldwide({
      query,
      mediaType: tmdbMediaType,
      page,
      year,
      language: effectiveLanguage,
      genre: effectiveGenre,
      country,
      minRating: minRatingStr,
      sortBy,
      filterAdultSuggestions: suggest,
    });

    // Deduplicate local curated matches against TMDB live items
    const seenTmdb = new Set<string>();
    const seenTitleYear = new Set<string>();
    const merged: WorldwideCatalogItem[] = [];

    for (const item of localMatches) {
      if (item.tmdbId > 0) seenTmdb.add(`${item.mediaType}:${item.tmdbId}`);
      seenTitleYear.add(`${item.mediaType}:${item.title.toLowerCase()}:${item.releaseYear || ""}`);
      merged.push(item);
    }

    for (const item of tmdbResult.items) {
      const tmdbKey = `${item.mediaType}:${item.tmdbId}`;
      const titleKey = `${item.mediaType}:${item.title.toLowerCase()}:${item.releaseYear || ""}`;
      if (seenTmdb.has(tmdbKey) || seenTitleYear.has(titleKey)) continue;
      seenTmdb.add(tmdbKey);
      seenTitleYear.add(titleKey);
      merged.push(item);
    }

    const finalItems = suggest ? merged.slice(0, 6) : merged;

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        items: finalItems,
        page: tmdbResult.page,
        totalPages: suggest ? 1 : tmdbResult.totalPages,
        totalResults: Math.max(tmdbResult.totalResults, merged.length),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    if (err instanceof TMDBConfigError) {
      // Preserve curated CINOVA search even if TMDB credentials are not configured yet
      return NextResponse.json(
        {
          configured: false,
          setupRequired: true,
          error:
            "TMDB credentials are not configured. Showing local CINOVA vault matches only. Add TMDB_API_READ_ACCESS_TOKEN (or TMDB_API_KEY) to .env.local for worldwide results.",
          items: suggest ? localMatches.slice(0, 6) : localMatches,
          page: 1,
          totalPages: 1,
          totalResults: localMatches.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        error: "Unable to complete worldwide search right now. Showing available local titles.",
        items: suggest ? localMatches.slice(0, 6) : localMatches,
        page: 1,
        totalPages: 1,
        totalResults: localMatches.length,
      },
      { status: 502 }
    );
  }
}
