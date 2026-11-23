import { NextRequest, NextResponse } from "next/server";
import {
  getDiscoveredTracks,
  getRecentlyDiscovered,
  getAddedToday,
  getLastSyncLog,
  getDiscoveredCount,
} from "@/lib/discovery/discovered-music-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "all";
    const language = searchParams.get("language") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "15", 10), 1), 50);

    const lastSync = await getLastSyncLog();

    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    };

    if (section === "added_today") {
      const tracks = await getAddedToday(limit);
      return NextResponse.json(
        {
          success: true,
          section,
          tracks,
          count: tracks.length,
          lastSync: lastSync?.finishedAt || null,
        },
        { headers: cacheHeaders }
      );
    }

    if (section === "recently_discovered") {
      const tracks = await getRecentlyDiscovered(limit);
      return NextResponse.json(
        {
          success: true,
          section,
          tracks,
          count: tracks.length,
          lastSync: lastSync?.finishedAt || null,
        },
        { headers: cacheHeaders }
      );
    }

    if (section === "status") {
      return NextResponse.json({
        success: true,
        totalDiscovered: getDiscoveredCount(),
        lastSync,
      });
    }

    const tracks = await getDiscoveredTracks({ language, limit });
    return NextResponse.json(
      {
        success: true,
        section,
        tracks,
        count: tracks.length,
        lastSync: lastSync?.finishedAt || null,
      },
      { headers: cacheHeaders }
    );
  } catch (error: any) {
    console.error("GET /api/music/discovered error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load discovered tracks", tracks: [] },
      { status: 500 }
    );
  }
}
