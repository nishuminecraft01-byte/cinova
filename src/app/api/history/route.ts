import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/supabase-server";
import {
  getUserWatchHistory,
  recordWatchProgress,
  removeWatchHistoryItem,
  clearUserWatchHistory,
  WatchProgressInput,
} from "@/lib/watch-history";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession(request);

    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          continueWatching: [],
          movies: [],
          series: [],
          music: [],
          totalWatchedSeconds: 0,
        },
        {
          headers: { "Cache-Control": "private, no-cache, no-store" },
        }
      );
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const history = await getUserWatchHistory(session.user.id, accessToken);

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        ...history,
      },
      {
        headers: { "Cache-Control": "private, no-cache, no-store" },
      }
    );
  } catch (error) {
    console.error("[CINOVA History API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve watch history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession(request);

    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { success: false, error: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const body = (await request.json().catch(() => ({}))) as Partial<WatchProgressInput>;

    if (!body.contentId) {
      return NextResponse.json(
        { success: false, error: "contentId is required" },
        { status: 400 }
      );
    }

    const input: WatchProgressInput = {
      contentId: String(body.contentId),
      title: body.title ? String(body.title) : "CINOVA Content",
      contentType: body.contentType || "movie",
      posterUrl: body.posterUrl ? String(body.posterUrl) : "",
      backdropUrl: body.backdropUrl ? String(body.backdropUrl) : "",
      seasonNumber: typeof body.seasonNumber === "number" ? body.seasonNumber : undefined,
      episodeNumber: typeof body.episodeNumber === "number" ? body.episodeNumber : undefined,
      episodeTitle: body.episodeTitle ? String(body.episodeTitle) : undefined,
      progressSeconds: Number(body.progressSeconds || 0),
      durationSeconds: Number(body.durationSeconds || 0),
      completed: typeof body.completed === "boolean" ? body.completed : undefined,
    };

    const saved = await recordWatchProgress(session.user.id, input, accessToken);

    return NextResponse.json({
      success: true,
      item: saved,
    });
  } catch (error) {
    console.error("[CINOVA History API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save watch progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession(request);

    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { success: false, error: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const contentId = searchParams.get("contentId");
    const season = searchParams.get("season") ? parseInt(searchParams.get("season")!, 10) : undefined;
    const episode = searchParams.get("episode") ? parseInt(searchParams.get("episode")!, 10) : undefined;

    if (clearAll) {
      await clearUserWatchHistory(session.user.id, accessToken);
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "contentId or clearAll=true is required" },
        { status: 400 }
      );
    }

    await removeWatchHistoryItem(session.user.id, contentId, season, episode, accessToken);
    return NextResponse.json({ success: true, removed: true, contentId });
  } catch (error) {
    console.error("[CINOVA History API] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove history item" },
      { status: 500 }
    );
  }
}
