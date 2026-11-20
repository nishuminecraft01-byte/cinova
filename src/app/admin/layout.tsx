import React from "react";
import Link from "next/link";
import { ShieldAlert, Lock, Database, ArrowLeft, LogIn } from "lucide-react";
import { getServerAuthSession } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session.configured) {
    return (
      <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.3)] p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#650A20]/60 border border-[#E11D48]/40 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-[#E11D48]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF385B]">
                Server Security Gate
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#F5F1F3]">
                Supabase Auth Setup Required
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
            Admin access is enforced strictly on the server via Supabase Auth. Because Supabase credentials are not configured in this environment yet, admin routes remain locked.
          </p>

          <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] p-4 sm:p-5 space-y-3 text-xs">
            <p className="font-bold text-[#F5F1F3] uppercase tracking-wider text-[11px]">
              Required Setup Steps
            </p>
            <ol className="list-decimal list-inside space-y-2 text-[#AAA0A7] leading-relaxed">
              <li>
                Create <code className="text-[#F5F1F3]">.env.local</code> with{" "}
                <code className="text-[#FF385B]">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="text-[#FF385B]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and server-only{" "}
                <code className="text-[#FF385B]">SUPABASE_SERVICE_ROLE_KEY</code>.
              </li>
              <li>
                Run <code className="text-[#F5F1F3]">src/lib/supabase-schema.sql</code> in your Supabase SQL Editor to apply the hardened <code className="text-[#F5F1F3]">profiles</code> RLS policies and signup trigger.
              </li>
              <li>
                Register your owner account, then promote your user in Supabase SQL Editor:{" "}
                <code className="text-[#F5F1F3]">UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;you@example.com&apos;;</code>
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to CINOVA
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session.authenticated || !session.user) {
    return (
      <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.3)] p-7 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#650A20]/60 border border-[#E11D48]/40 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-[#E11D48]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#F5F1F3]">Admin Authentication Required</h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
              Sign in with an authorized administrator account to access platform operations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider transition-all"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session.isAdmin) {
    const userEmail = session.user?.email || "Unknown user";
    const resolvedRole = session.user?.role || "user";
    const profileFound = session.diagnostics?.profileFound ?? false;
    const idMatch = session.diagnostics?.idMatch ?? false;
    const isPermissionDenied =
      Boolean(
        session.diagnostics?.errorReason?.includes("42501") ||
        session.diagnostics?.errorReason?.includes("permission denied")
      );

    return (
      <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.3)] p-7 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#650A20]/60 border border-[#E11D48]/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-5 h-5 text-[#E11D48]" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF385B]">
              403 • Access Denied
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F1F3]">Administrator Role Required</h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
              Your account is signed in, but the server has verified that it does not currently hold administrator privileges in the database.
            </p>
          </div>

          {/* Diagnostic Authorization Panel */}
          <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(155,25,57,0.18)]">
              <span className="font-bold text-[#F5F1F3] uppercase tracking-wider text-[11px]">
                Server Authorization Diagnostics
              </span>
              <span className="px-2 py-0.5 rounded bg-[#650A20]/60 text-[#FF385B] font-mono text-[10px] font-bold">
                ROLE: {resolvedRole.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#AAA0A7]">
              <div>
                <span className="text-[#746971]">Account:</span>{" "}
                <span className="text-[#F5F1F3] font-mono">{userEmail}</span>
              </div>
              <div>
                <span className="text-[#746971]">Database Role:</span>{" "}
                <span className="text-[#FF385B] font-bold font-mono">
                  {isPermissionDenied ? "Blocked by Postgres" : resolvedRole}
                </span>
              </div>
              <div>
                <span className="text-[#746971]">Supabase Profile:</span>{" "}
                <span className={profileFound ? "text-emerald-400 font-semibold" : isPermissionDenied ? "text-amber-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {profileFound ? "Row Located" : isPermissionDenied ? "Permission Denied (42501)" : "Missing Row"}
                </span>
              </div>
              <div>
                <span className="text-[#746971]">User ID Match:</span>{" "}
                <span className={idMatch ? "text-emerald-400 font-semibold" : isPermissionDenied ? "text-amber-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {idMatch ? "Verified" : isPermissionDenied ? "Pending Table Grant" : "Mismatch"}
                </span>
              </div>
            </div>

            {isPermissionDenied ? (
              <div className="p-3 rounded-xl bg-[#1D0C13] border border-[#E11D48]/50 space-y-2 mt-2">
                <p className="text-xs font-bold text-[#FF385B] flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Postgres Missing Table Grant Detected
                </p>
                <p className="text-[11px] text-[#AAA0A7] leading-relaxed">
                  Postgres error 42501 was returned: table-level SELECT on <code className="text-[#F5F1F3]">public.profiles</code> is not granted to role <code className="text-[#F5F1F3]">authenticated</code>. Execute this in your Supabase SQL Editor:
                </p>
                <pre className="p-2.5 rounded-lg bg-[#080506] text-[11px] font-mono text-[#F5F1F3] overflow-x-auto border border-[rgba(155,25,57,0.3)]">
                  GRANT USAGE ON SCHEMA public TO anon, authenticated;{"\n"}
                  GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;{"\n"}
                  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
                </pre>
              </div>
            ) : (
              <p className="text-[11px] text-[#746971] pt-1 leading-relaxed border-t border-[rgba(155,25,57,0.14)]">
                💡 <strong className="text-[#AAA0A7]">Tip:</strong> If you recently promoted this account in Supabase SQL Editor via <code className="text-[#F5F1F3]">UPDATE public.profiles SET role = &apos;admin&apos;</code>, sign out and sign back in to refresh your active session token.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/login?next=/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider transition-all"
            >
              Sign In Again
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
