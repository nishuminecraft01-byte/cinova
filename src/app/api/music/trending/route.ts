import { NextRequest, NextResponse } from "next/server";
import { detectUserCountry, getRegionalTrendingData } from "@/lib/api/regional-trending";

export const runtime = "nodejs";

// In-memory cache for regional trending data (5 minutes TTL)
const regionalCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "16", 10), 1), 50);

    // 1. Detect user's country or use query param manual override
    const country = detectUserCountry(request);
    const cacheKey = `${country.code}_${limit}`;

    const cached = regionalCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Cache": "HIT",
        },
      });
    }

    // 2. Fetch country-wise trending tracks & top charts
    const regionalData = await getRegionalTrendingData(country.code, limit);

    const responseBody = {
      success: true,
      countryCode: regionalData.countryCode,
      countryName: regionalData.countryName,
      flag: regionalData.flag,
      label: regionalData.label,
      heroTrack: regionalData.heroTrack,
      tracks: regionalData.trendingTracks,
      topCharts: regionalData.topCharts,
      isLive: regionalData.isLive,
      dataSource: regionalData.dataSource,
      fallbackReason: regionalData.fallbackReason,
      count: regionalData.trendingTracks.length,
      hasMore: false,
    };

    regionalCache.set(cacheKey, { data: responseBody, expiry: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(responseBody, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/music/trending error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load trending music", tracks: [], count: 0 },
      { status: 500 }
    );
  }
}
