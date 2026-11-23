import { NextRequest, NextResponse } from "next/server";
import {
  searchWorldwideTracks,
  searchArtists,
  searchAlbums,
  normalizeSearchQuery,
} from "@/lib/search/smart-search-engine";
import { FULL_WORLDWIDE_CATALOGUE } from "@/lib/api/worldwide-catalogue";
import { MAINSTREAM_ARTISTS, MAINSTREAM_ALBUMS } from "@/lib/api/mainstream-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const query = rawQuery.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        queries: [],
        tracks: [],
        artists: [],
        albums: [],
      });
    }

    // 1. Fetch live YouTube suggestions from Google YouTube Suggest API
    let ytQueries: string[] = [];
    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(suggestUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          ytQueries = data[1].slice(0, 6);
        }
      }
    } catch (_) {
      ytQueries = [];
    }

    // 2. Local instant track matches (top 4)
    const { tracks } = searchWorldwideTracks(query, 4);

    // 3. Local instant artist matches (top 3)
    const artists = searchArtists(query, 3);

    // 4. Local instant album matches (top 2)
    const albums = searchAlbums(query, 2);

    return NextResponse.json({
      success: true,
      queries: ytQueries,
      tracks,
      artists,
      albums,
    });
  } catch (error) {
    console.error("GET /api/music/suggestions error:", error);
    return NextResponse.json({
      success: false,
      queries: [],
      tracks: [],
      artists: [],
      albums: [],
    });
  }
}
