import { NextRequest, NextResponse } from "next/server";
import { getMainstreamAlbums } from "@/lib/api/mainstream-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "4", 10), 1), 24);

    const albums = getMainstreamAlbums(limit);
    return NextResponse.json(
      {
        success: true,
        albums,
        hasMore: false,
        count: albums.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/music/albums error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load albums", albums: [] },
      { status: 500 }
    );
  }
}
