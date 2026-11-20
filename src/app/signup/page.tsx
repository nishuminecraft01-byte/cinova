"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
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

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams?.get("next") || null);
  const { signup, authConfigured } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email address.");
      return;
    }
    if (password.length < 6) {
      setError("Please create a password with at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      if (!result.ok) {
        setError(result.error || "Unable to create your account right now. Please try again.");
        return;
      }
      if (result.emailConfirmationRequired) {
        setSuccessMsg(
          result.message ||
            "Account created. Please check your email to verify your address before signing in."
        );
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      editorialHeading="Stories that stay with you."
      editorialSubcopy="Create your CINOVA membership to browse global cinema, original series, and anime."
    >
      {/* Form Heading */}
      <div className="mb-7">
        <h2 className="text-2xl sm:text-[26px] font-semibold tracking-[-0.02em] text-white">
          Create Account
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
          Start on CINOVA Free with personalized recommendations and My List.
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
              Account registration requires Supabase credentials in{" "}
              <code className="text-[#F5F1F3]">.env.local</code> (
              <code className="text-[#F5F1F3]">NEXT_PUBLIC_SUPABASE_URL</code> &amp;{" "}
              <code className="text-[#F5F1F3]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
            </p>
          </div>
        </div>
      )}

      {/* Email Verification Success */}
      {successMsg && (
        <div
          role="status"
          className="mb-5 px-3.5 py-3 rounded-xl bg-emerald-500/[0.09] border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
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
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="signup-name"
            className="block text-xs font-medium text-[#CBD5E1]"
          >
            Your name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Alex Parker"
            disabled={loading}
            className="w-full h-12 sm:h-11 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.28)] hover:border-[rgba(225,29,72,0.42)] focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 px-3.5 text-base sm:text-sm text-[#F5F1F3] placeholder-[#746971] focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="signup-email"
            className="block text-xs font-medium text-[#AAA0A7]"
          >
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
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
          <label
            htmlFor="signup-password"
            className="block text-xs font-medium text-[#AAA0A7]"
          >
            Create password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] disabled:opacity-60 disabled:cursor-not-allowed text-[#F5F1F3] font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_8px_24px_rgba(163,13,50,0.4)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Start Membership</span>
          )}
        </button>
      </form>

      {/* Sign In Prompt */}
      <div className="mt-7 pt-6 border-t border-[rgba(155,25,57,0.2)] text-center text-xs text-[#AAA0A7]">
        Already have an account?{" "}
        <Link
          href={nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded"
        >
          <span className="text-[#FF385B] hover:text-[#F5F1F3] transition-colors">
            Sign in
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080506]" />}>
      <SignUpPageContent />
    </Suspense>
  );
}
