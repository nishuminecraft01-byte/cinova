import { NextRequest, NextResponse } from "next/server";

const SB_ACCESS_COOKIE = "cinova_sb_access_token";
const SB_REFRESH_COOKIE = "cinova_sb_refresh_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedAdminApi =
    pathname.startsWith("/api/admin") || pathname === "/api/sync/manual";
  const isProtectedPlaybackApi =
    pathname === "/api/playback/authorize" || pathname.startsWith("/api/stream/");

  // Fast-path redirect unauthenticated visitors attempting to access the Admin dashboard
  if (isAdminPage) {
    const hasSessionCookie =
      Boolean(request.cookies.get(SB_ACCESS_COOKIE)?.value) ||
      Boolean(request.cookies.get(SB_REFRESH_COOKIE)?.value);

    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isProtectedAdminApi) {
    const hasSessionCookie =
      Boolean(request.cookies.get(SB_ACCESS_COOKIE)?.value) ||
      Boolean(request.cookies.get(SB_REFRESH_COOKIE)?.value);
    const hasAuthHeader =
      Boolean(request.headers.get("authorization")) ||
      Boolean(request.headers.get("x-admin-api-key"));

    if (!hasSessionCookie && !hasAuthHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED_ADMIN_ACCESS",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  }

  if (isProtectedPlaybackApi) {
    const hasSessionCookie =
      Boolean(request.cookies.get(SB_ACCESS_COOKIE)?.value) ||
      Boolean(request.cookies.get(SB_REFRESH_COOKIE)?.value);

    if (!hasSessionCookie) {
      return NextResponse.json(
        {
          authorized: false,
          reason: "AUTH_REQUIRED",
          error: "Authentication is required to play video content.",
          servers: [],
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/sync/manual",
    "/api/playback/authorize",
    "/api/stream/:path*",
  ],
};
