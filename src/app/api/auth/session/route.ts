
import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthSessionCookies,
  getServerAuthSession,
  setAuthSessionCookies,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession(request);

  const response = NextResponse.json(
    {
      configured: session.configured,
      authenticated: session.authenticated,
      setupRequired: !session.configured,
      user: session.user,
      isAdmin: session.isAdmin,
      diagnostics: session.authenticated
        ? {
            role: session.user?.role,
            profileFound: session.diagnostics?.profileFound ?? false,
            idMatch: session.diagnostics?.idMatch ?? false,
            queryMethod: session.diagnostics?.queryMethod,
            errorReason: session.diagnostics?.errorReason,
          }
        : undefined,
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
  } else if (session.configured && !session.authenticated) {
    clearAuthSessionCookies(response);
  }

  return response;
}
