import { NextRequest, NextResponse } from "next/server";
import { getTracksByAlbum } from "@/lib/api/jamendo-client";
import { getAlbumById } from "@/data/music";
import { getMainstreamAlbumById } from "@/lib/api/mainstream-client";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing album ID" }, { status: 400 });
    }

    // 1. Check mainstream catalog first
    const mainstreamResult = getMainstreamAlbumById(id);
    if (mainstreamResult) {
      return NextResponse.json({
        success: true,
        album: mainstreamResult.album,
        tracks: mainstreamResult.tracks,
        count: mainstreamResult.tracks.length,
      });
    }

    // 2. Check static catalog
    const staticAlbum = getAlbumById(id);
    if (staticAlbum && staticAlbum.songs.length > 0) {
      return NextResponse.json({
        success: true,
        album: staticAlbum,
        tracks: staticAlbum.songs,
      });
    }

    // 3. Fetch dynamic album tracks from Jamendo
    const { tracks, album } = await getTracksByAlbum(id, 30);

    return NextResponse.json({
      success: true,
      album: album || staticAlbum,
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error("GET /api/music/albums/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load album tracks" },
      { status: 500 }
    );
  }
}
