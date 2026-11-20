export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerAnonClient,
  isSupabaseAuthConfigured,
  setAuthSessionCookies,
} from "@/lib/supabase-server";
import { getPlanById } from "@/lib/membership";
import { UserProfile } from "@/types/movie";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      {
        success: false,
        setupRequired: true,
        error:
          "Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable account registration.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide your name, a valid email address, and a password of at least 6 characters.",
        },
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

    // Never accept role or tier from client payload — new accounts always start as Free viewer
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error || !data?.user) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Unable to create account.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // If session is immediately issued (email confirmation disabled), ensure profile row exists
    const freePlan = getPlanById("Free");
    const user: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      name,
      role: "user",
      avatar: "",
      tier: "Free",
      subscription: freePlan.name,
    };

    if (data.session) {
      const scopedClient = createSupabaseServerAnonClient(data.session.access_token);
      if (scopedClient) {
        // Best-effort upsert of own profile row (DB trigger also handles this when SQL schema is applied)
        await scopedClient
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              email: user.email,
              name: user.name,
              role: "user",
              tier: "Free",
            },
            { onConflict: "id", ignoreDuplicates: true }
          )
          .select("id")
          .maybeSingle();
      }

      const response = NextResponse.json(
        {
          success: true,
          emailConfirmationRequired: false,
          user,
        },
        { headers: { "Cache-Control": "no-store" } }
      );

      setAuthSessionCookies(
        response,
        data.session.access_token,
        data.session.refresh_token,
        data.session.expires_in
      );
      return response;
    }

    return NextResponse.json(
      {
        success: true,
        emailConfirmationRequired: true,
        message: "Account created. Please check your email to confirm your address before signing in.",
        user: null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to create your account right now." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
