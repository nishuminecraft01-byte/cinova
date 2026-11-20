export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import {
  WatchTimeEventAction,
  applyWatchTimeEvent,
  getWatchTimeStatus,
  sanitizeViewerKey,
} from "@/lib/watch-time-store";
import { signPlaybackToken } from "@/lib/playback-token";
import { getServerAuthSession, setAuthSessionCookies } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GUEST_COOKIE_NAME = "cinova_viewer_id";
const VALID_ACTIONS = new Set<WatchTimeEventAction>([
  "start",
  "heartbeat",
  "pause",
  "buffering",
  "resume",
  "end",
]);

function attachGuestCookieIfNeeded(
  res: NextResponse,
  newGuestCookieId?: string
): NextResponse {
  if (newGuestCookieId) {
    res.cookies.set(GUEST_COOKIE_NAME, newGuestCookieId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export async function GET(request: NextRequest) {
  // Never trust client-supplied role or userId query parameters.
  // Identity and role are derived strictly from the server-verified Supabase Auth session or HttpOnly guest cookie.
  const session = await getServerAuthSession(request);
  const verifiedRole: "user" | "creator" | "admin" =
    session.authenticated && session.user ? session.user.role : "user";
  const verifiedUserId = session.authenticated && session.user ? session.user.id : null;
  const cookieGuest = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  const { viewerKey, newGuestCookieId } = sanitizeViewerKey(verifiedUserId, cookieGuest);
  const snapshot = await getWatchTimeStatus(viewerKey, verifiedRole);

  const response = NextResponse.json(
    {
      success: true,
      quota: snapshot,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );

  if (session.refreshedTokens) {
    setAuthSessionCookies(
      response,
      session.refreshedTokens.accessToken,
      session.refreshedTokens.refreshToken,
      session.refreshedTokens.expiresIn
    );
  }

  return attachGuestCookieIfNeeded(response, newGuestCookieId);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      movieId?: string | null;
      sessionId?: string | null;
      clientActiveSeconds?: number;
    };

    const action = body.action as WatchTimeEventAction;
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: "INVALID_ACTION" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Authoritative server-side session verification — playback watch-time tracking & token refresh strictly require login
    const session = await getServerAuthSession(request);
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { success: false, error: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const verifiedRole: "user" | "creator" | "admin" = session.user.role;
    const { viewerKey } = sanitizeViewerKey(session.user.id, undefined);

    const snapshot = await applyWatchTimeEvent({
      viewerKey,
      role: verifiedRole,
      action,
      sessionId: body.sessionId || null,
      clientActiveSeconds:
        typeof body.clientActiveSeconds === "number" ? body.clientActiveSeconds : undefined,
    });

    const isBlockedAction =
      snapshot.isLimitReached && (action === "start" || action === "resume");

    let playbackToken: string | null = null;
    if (!snapshot.isLimitReached && body.movieId) {
      playbackToken = signPlaybackToken({
        viewerKey,
        movieId: body.movieId,
        dateIst: snapshot.dateIst,
        role: verifiedRole,
      });
    }

    const response = NextResponse.json(
      {
        success: !isBlockedAction,
        error: snapshot.isLimitReached ? "DAILY_LIMIT_REACHED" : undefined,
        quota: snapshot,
        playbackToken,
      },
      {
        status: isBlockedAction ? 403 : 200,
        headers: { "Cache-Control": "no-store" },
      }
    );

    if (session.refreshedTokens) {
      setAuthSessionCookies(
        response,
        session.refreshedTokens.accessToken,
        session.refreshedTokens.refreshToken,
        session.refreshedTokens.expiresIn
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "WATCH_TIME_SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
