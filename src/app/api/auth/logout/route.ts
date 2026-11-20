import { NextRequest, NextResponse } from "next/server";
import {
  SB_ACCESS_COOKIE,
  clearAuthSessionCookies,
  getSupabasePublicConfig,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(SB_ACCESS_COOKIE)?.value;
  const { url, anonKey, configured } = getSupabasePublicConfig();

  if (accessToken && configured && url && anonKey) {
    try {
      // Explicitly revoke the active user JWT upstream with Supabase Auth (works with sb_publishable_ keys)
      await fetch(`${url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    } catch {
      // Always clear HttpOnly cookies even if upstream signOut fails
    }
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  clearAuthSessionCookies(response);
  return response;
}
