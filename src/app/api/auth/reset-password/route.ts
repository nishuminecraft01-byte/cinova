import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerAnonClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-server";
import { parseAuthError } from "@/lib/auth-errors";

export const dynamic = "force-dynamic";

const lastResetTimestamps = new Map<string, number>();
const RESET_COOLDOWN_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      {
        success: false,
        setupRequired: true,
        error: "Supabase Auth is not configured.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
    };

    const email = (body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid account email address." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = Date.now();
    const lastSent = lastResetTimestamps.get(email);
    if (lastSent && now - lastSent < RESET_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESET_COOLDOWN_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMIT_EXCEEDED",
          error: `Please wait ${remainingSeconds} seconds before requesting another password reset link.`,
          retryAfterSeconds: remainingSeconds,
        },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = createSupabaseServerAnonClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, setupRequired: true, error: "Supabase Auth is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      const parsed = parseAuthError(error);
      return NextResponse.json(
        {
          success: false,
          code: parsed.code,
          error: parsed.message,
          retryAfterSeconds: parsed.retryAfterSeconds,
        },
        { status: parsed.isRateLimit ? 429 : 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    lastResetTimestamps.set(email, now);

    return NextResponse.json(
      {
        success: true,
        message: "Password reset link sent! Please check your email inbox to reset your password.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process password reset right now. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
