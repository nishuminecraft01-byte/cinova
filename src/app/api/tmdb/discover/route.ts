export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { TMDBConfigError, tmdb } from "@/lib/api/tmdb-client";
import { WorldwideMediaType, getCollectionPreset } from "@/lib/tmdb-worldwide";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const collection = (searchParams.get("collection") || "all").trim().toLowerCase();
  const rawMediaType = (searchParams.get("mediaType") || "").trim().toLowerCase();
  const genreParam = (searchParams.get("genre") || "").trim();
  const languageParam = (searchParams.get("language") || "").trim().toLowerCase();
  const yearParam = (searchParams.get("year") || "").trim();
  const countryParam = (searchParams.get("country") || "").trim().toUpperCase();
  const minRatingParam = (searchParams.get("minRating") || "").trim();
  const sortByParam = (searchParams.get("sortBy") || "popularity.desc").trim();
  const pageParam = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(pageParam) ? Math.max(1, Math.min(500, Math.floor(pageParam))) : 1;

  const preset = getCollectionPreset(collection);

  let mediaType: WorldwideMediaType | undefined;
  let effectiveGenre = genreParam;
  let effectiveLanguage = languageParam;

  if (rawMediaType === "movie" || rawMediaType === "tv") {
    mediaType = rawMediaType;
  } else if (rawMediaType === "anime") {
    mediaType = "tv";
    if (!effectiveGenre) effectiveGenre = "16";
    if (!effectiveLanguage) effectiveLanguage = "ja";
  }

  try {
    const result = await tmdb.discoverWorldwide({
      collection: preset.id,
      mediaType,
      genre: effectiveGenre,
      language: effectiveLanguage,
      year: yearParam,
      country: countryParam,
      minRating: minRatingParam,
      sortBy: sortByParam,
      page,
    });

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        collectionPreset: preset,
        mediaType: mediaType || preset.defaultMediaType,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    if (err instanceof TMDBConfigError) {
      return NextResponse.json(
        {
          configured: false,
          setupRequired: true,
          error:
            "TMDB API credentials are not configured or invalid. Add TMDB_API_READ_ACCESS_TOKEN (or TMDB_API_KEY) to .env.local and restart the dev server.",
          collectionPreset: preset,
          items: [],
          page: 1,
          totalPages: 1,
          totalResults: 0,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        error: "Unable to load worldwide titles from TMDB right now. Please try again shortly.",
        collectionPreset: preset,
        items: [],
        page,
        totalPages: 1,
        totalResults: 0,
      },
      { status: 502 }
    );
  }
}
