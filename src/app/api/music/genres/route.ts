import { NextRequest, NextResponse } from "next/server";
import { getTracksByGenre } from "@/lib/api/jamendo-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre") || "all";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);

    const result = await getTracksByGenre(genre, limit);
    return NextResponse.json({
      success: true,
      tracks: result.tracks,
      hasMore: result.hasMore,
      genre,
      count: result.tracks.length,
    });
  } catch (error) {
    console.error("GET /api/music/genres error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load genre music" },
      { status: 500 }
    );
  }
}
