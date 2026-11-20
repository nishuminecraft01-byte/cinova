
import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerAnonClient,
  fetchVerifiedUserProfile,
  isSupabaseAuthConfigured,
  setAuthSessionCookies,
} from "@/lib/supabase-server";
import { getPlanById, resolveEffectiveTier } from "@/lib/membership";
import { UserProfile } from "@/types/movie";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      {
        success: false,
        setupRequired: true,
        error:
          "Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable sign-in.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both your email and password." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = createSupabaseServerAnonClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, setupRequired: true, error: "Supabase Auth is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session || !data?.user) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Invalid email or password.",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Load authoritative profile fresh from Supabase profiles table using verified JWT
    const user = await fetchVerifiedUserProfile(data.user, data.session.access_token);

    const response = NextResponse.json(
      { success: true, user },
      { headers: { "Cache-Control": "no-store" } }
    );

    setAuthSessionCookies(
      response,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in
    );

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to complete sign-in right now." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
