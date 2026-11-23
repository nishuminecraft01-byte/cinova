import { NextRequest, NextResponse } from "next/server";
import { getYouTubeTrendingMusic } from "@/lib/api/youtube-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10), 1), 24);

    const videoTracks = await getYouTubeTrendingMusic(limit);

    return NextResponse.json({
      success: true,
      videos: videoTracks,
      count: videoTracks.length,
    });
  } catch (error) {
    console.error("GET /api/music/videos error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load music videos", videos: [], count: 0 },
      { status: 500 }
    );
  }
}
