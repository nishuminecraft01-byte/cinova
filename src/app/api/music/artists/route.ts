import { NextRequest, NextResponse } from "next/server";
import { getMainstreamArtists } from "@/lib/api/mainstream-client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "11", 10), 1), 30);

    // Mainstream popular artists requested by user: Arijit, Karan Aujla, Diljit, Shreya, Honey Singh, Badshah, A.R. Rahman, Ajay-Atul, Bruno Mars, The Weeknd, Taylor Swift
    const artists = getMainstreamArtists(limit);
    return NextResponse.json(
      {
        success: true,
        artists,
        hasMore: false,
        count: artists.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/music/artists error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load popular artists", artists: [] },
      { status: 500 }
    );
  }
}
