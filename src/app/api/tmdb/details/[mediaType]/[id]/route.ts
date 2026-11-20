
import { NextRequest, NextResponse } from "next/server";
import { TMDBConfigError, tmdb } from "@/lib/api/tmdb-client";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    mediaType: string;
    id: string;
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const mediaType = (context.params.mediaType || "").trim().toLowerCase();
  const rawId = (context.params.id || "").trim().replace(/^tmdb-(?:movie-|tv-)?/i, "");

  if (mediaType !== "movie" && mediaType !== "tv") {
    return NextResponse.json(
      { error: "Invalid mediaType. Expected 'movie' or 'tv'." },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(rawId)) {
    return NextResponse.json(
      { error: "Invalid TMDB numeric ID." },
      { status: 400 }
    );
  }

  try {
    const data =
      mediaType === "tv"
        ? await tmdb.getWorldwideSeriesDetails(rawId)
        : await tmdb.getWorldwideMovieDetails(rawId);

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
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
            "TMDB credentials are not configured. Add TMDB_API_READ_ACCESS_TOKEN (or TMDB_API_KEY) to .env.local.",
        },
        { status: 503 }
      );
    }

    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("404")) {
      return NextResponse.json({ error: "Title not found on TMDB." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Unable to load title details from TMDB right now." },
      { status: 502 }
    );
  }
}
