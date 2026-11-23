import { NextRequest, NextResponse } from "next/server";
import { getMainstreamTracksByCategory } from "@/lib/api/mainstream-client";
import { getWorldwideTracksByLanguage } from "@/lib/api/worldwide-catalogue";
import { MUSIC_CATEGORIES } from "@/types/music";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || searchParams.get("slug") || "bollywood").toLowerCase().trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "24", 10), 1), 60);

    // 1. Check mainstream category discovery
    let tracks = getMainstreamTracksByCategory(category, limit);

    // 2. If empty or requested worldwide language, fetch from worldwide catalogue
    if (tracks.length === 0) {
      tracks = getWorldwideTracksByLanguage(category, limit);
    }

    return NextResponse.json({
      success: true,
      category,
      tracks,
      count: tracks.length,
      categories: MUSIC_CATEGORIES,
    });
  } catch (error) {
    console.error("GET /api/music/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load category music", tracks: [] },
      { status: 500 }
    );
  }
}

