import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerAnonClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-server";
import { parseAuthError } from "@/lib/auth-errors";

export const dynamic = "force-dynamic";

// In-memory timestamp cache to debounce repeated resend calls per email on server
const lastResendTimestamps = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

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
        { success: false, error: "Please provide a valid email address." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = Date.now();

    // 1. Persistent cookie-based cooldown check
    const cookieVal = request.cookies.get("cinova_cooldown_resend")?.value;
    if (cookieVal) {
      const expiry = parseInt(cookieVal, 10);
      const remainingSeconds = !isNaN(expiry)
        ? Math.max(1, Math.ceil((expiry - now) / 1000))
        : 60;
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMIT_EXCEEDED",
          error: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
          retryAfterSeconds: remainingSeconds,
        },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. In-memory email-based cooldown check
    const lastSent = lastResendTimestamps.get(email);
    if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMIT_EXCEEDED",
          error: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
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

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

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

    // Record timestamp on success
    lastResendTimestamps.set(email, now);

    const response = NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please check your inbox and spam folder.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Set HttpOnly persistent cooldown cookie (60s)
    response.cookies.set("cinova_cooldown_resend", String(now + RESEND_COOLDOWN_MS), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to send verification email right now. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
