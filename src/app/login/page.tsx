"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/AuthShell";

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/";
  }
  return trimmed;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams?.get("next") || null);
  const { login, authConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.ok) {
        setError(result.error || "Unable to sign in right now. Please try again.");
        return;
      }
      if (result.user?.role === "admin" && (nextPath === "/" || !nextPath)) {
        router.push("/admin");
      } else {
        router.push(nextPath);
      }
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      editorialHeading="Stories that stay with you."
      editorialSubcopy="Sign in to pick up where you left off across movies, acclaimed series, and anime."
    >
      {/* Form Heading */}
      <div className="mb-7">
        <h2 className="text-2xl sm:text-[26px] font-semibold tracking-[-0.02em] text-white">
          Sign In
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
          Enter your credentials to access your library and watchlist.
        </p>
      </div>

      {/* Honest Setup-Required Banner when Supabase Auth env vars are not configured */}
      {!authConfigured && (
        <div
          role="status"
          className="mb-5 px-3.5 py-3 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.34)] text-xs text-[#AAA0A7] flex items-start gap-2.5"
        >
          <Info className="w-4 h-4 text-[#FF385B] shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <p className="font-semibold text-[#F5F1F3]">Supabase Auth Setup Required</p>
            <p>
              Real authentication is not active yet. Add{" "}
              <code className="text-[#F5F1F3]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-[#F5F1F3]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="text-[#F5F1F3]">.env.local</code> to enable sign-in.
            </p>
          </div>
        </div>
      )}

      {/* Validation / Auth Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 px-3.5 py-3 rounded-xl bg-red-500/[0.09] border border-red-500/25 text-red-300 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email or Username */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-[#CBD5E1]"
          >
            Email or username
          </label>
          <input
            id="login-email"
            name="email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="you@example.com"
            disabled={loading}
            className="w-full h-12 sm:h-11 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.28)] hover:border-[rgba(225,29,72,0.42)] focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 px-3.5 text-base sm:text-sm text-[#F5F1F3] placeholder-[#746971] focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {/* Password with Visibility Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-[#AAA0A7]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotHelp((prev) => !prev)}
              className="text-xs font-medium text-[#FF385B] hover:text-[#F5F1F3] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className="w-full h-12 sm:h-11 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.28)] hover:border-[rgba(225,29,72,0.42)] focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 pl-3.5 pr-11 text-base sm:text-sm text-[#F5F1F3] placeholder-[#746971] focus:outline-none transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-white/[0.06] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Inline Forgot Password Guidance */}
        {showForgotHelp && (
          <div className="px-3.5 py-3 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-xs text-[#AAA0A7] leading-relaxed animate-fade-in">
            Need help signing in? Enter your account email above to continue, or contact{" "}
            <span className="text-[#F5F1F3] font-medium">support@cinova.stream</span> for account recovery assistance.
          </div>
        )}

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-0.5">
          <label
            htmlFor="login-remember"
            className="inline-flex items-center gap-2.5 text-xs text-[#AAA0A7] hover:text-[#F5F1F3] cursor-pointer select-none transition-colors"
          >
            <input
              id="login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border border-[rgba(155,25,57,0.4)] bg-[#160B10] accent-[#E11D48] cursor-pointer"
            />
            <span>Remember me on this device</span>
          </label>
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] disabled:opacity-60 disabled:cursor-not-allowed text-[#F5F1F3] font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_8px_24px_rgba(163,13,50,0.4)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Sign Up Prompt */}
      <div className="mt-7 pt-6 border-t border-[rgba(155,25,57,0.2)] text-center text-xs text-[#AAA0A7]">
        New to CINOVA?{" "}
        <Link
          href={nextPath !== "/" ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
          className="font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded"
        >
          <span className="text-[#FF385B] hover:text-[#F5F1F3] transition-colors">
            Create an account
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080506]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
