import { NextRequest, NextResponse } from "next/server";
import { getTrendingTracks, getTracksByGenre } from "@/lib/api/jamendo-client";
import { Song } from "@/types/music";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CacheEntry {
  data: {
    tracks: Song[];
    hasMore: boolean;
    genre: string;
    count: number;
  };
  expiresAt: number;
}

const independentCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "16", 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const genre = (searchParams.get("genre") || "").toLowerCase().trim();

    const cacheKey = `${genre || "all"}:${limit}:${offset}`;
    const cached = independentCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return NextResponse.json(
        {
          success: true,
          ...cached.data,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
          },
        }
      );
    }

    // Dedicated Free Independent Music Section:
    // 100% authorized full-length licensed streams from Jamendo with verified commercial streaming rights (ccnc=false).
    let jamendoTracks: Song[] = [];
    let hasMore = false;
    const fetchLimit = Math.min(limit * 3, 50);

    if (genre && genre !== "all") {
      const res = await getTracksByGenre(genre, fetchLimit, offset);
      jamendoTracks = res.tracks;
      hasMore = res.hasMore;
    } else {
      const res = await getTrendingTracks(fetchLimit, offset);
      jamendoTracks = res.tracks;
      hasMore = res.hasMore;
    }

    // Strict validation: Only tracks with valid audioUrl, full length (>=60s), and isCommercialAllowed === true
    const finalTracks = jamendoTracks
      .filter((t) => t.audioUrl && t.duration >= 60 && t.license?.isCommercialAllowed === true)
      .slice(0, limit);

    const resultData = {
      tracks: finalTracks,
      count: finalTracks.length,
      hasMore,
      genre: genre || "all",
    };

    independentCache.set(cacheKey, {
      data: resultData,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json(
      {
        success: true,
        ...resultData,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/music/independent error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load independent music", tracks: [], count: 0 },
      { status: 500 }
    );
  }
}

