import { NextRequest, NextResponse } from "next/server";
import { getTracksByArtist } from "@/lib/api/jamendo-client";
import { getArtistById } from "@/data/music";
import { getMainstreamArtistById } from "@/lib/api/mainstream-client";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing artist ID" }, { status: 400 });
    }

    // 1. Check mainstream catalog first
    const mainstreamResult = getMainstreamArtistById(id);
    if (mainstreamResult) {
      return NextResponse.json({
        success: true,
        artist: mainstreamResult.artist,
        tracks: mainstreamResult.tracks,
        count: mainstreamResult.tracks.length,
      });
    }

    // 2. Check static catalog
    const staticArtist = getArtistById(id);

    // 3. Fetch dynamic artist tracks from Jamendo
    const { tracks, artist } = await getTracksByArtist(id, 30);

    return NextResponse.json({
      success: true,
      artist: artist || staticArtist,
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error("GET /api/music/artists/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load artist tracks" },
      { status: 500 }
    );
  }
}
