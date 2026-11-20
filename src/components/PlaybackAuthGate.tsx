"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Lock, LogIn, UserPlus, Compass, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LoginRequiredCardProps {
  returnTo?: string;
  titleContext?: string;
  onContinueExploring: () => void;
  showCloseButton?: boolean;
}

export function LoginRequiredCard({
  returnTo,
  titleContext,
  onContinueExploring,
  showCloseButton = true,
}: LoginRequiredCardProps) {
  const safeNext =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "";
  const nextQuery = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cinova-login-gate-title"
      className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.38)] shadow-[0_28px_80px_rgba(0,0,0,0.9)]"
    >
      {/* Subtle Top Crimson Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#650A20] via-[#E11D48] to-[#FF385B]" />

      {showCloseButton && (
        <button
          type="button"
          onClick={onContinueExploring}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="p-6 sm:p-8 space-y-6">
        {/* Icon + Eyebrow */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#650A20]/60 to-[#160B10] border border-[rgba(225,29,72,0.4)] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#FF385B]" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF385B]">
              CINOVA Playback Access
            </span>
            <h2
              id="cinova-login-gate-title"
              className="text-2xl sm:text-[26px] font-black tracking-tight text-[#F5F1F3] leading-tight"
            >
              Your CINOVA journey starts here.
            </h2>
            <p className="text-sm text-[#AAA0A7] leading-relaxed">
              Create an account or sign in to start watching. Explore freely, but sign in to unlock playback.
            </p>
            {titleContext && (
              <p className="text-xs text-[#746971] pt-0.5">
                After signing in, we&apos;ll take you right back to{" "}
                <span className="text-[#F5F1F3] font-medium">{titleContext}</span>.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Link
            href={`/login${nextQuery}`}
            onClick={onContinueExploring}
            className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-sm font-bold text-[#F5F1F3] flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_rgba(225,29,72,0.34)]"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </Link>

          <Link
            href={`/signup${nextQuery}`}
            onClick={onContinueExploring}
            className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48]/70 text-sm font-semibold text-[#F5F1F3] flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-[#FF385B]" />
            <span>Create Account</span>
          </Link>

          <button
            type="button"
            onClick={onContinueExploring}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-transparent hover:bg-[#160B10] text-xs sm:text-sm font-medium text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-4 h-4 text-[#746971]" />
            <span>Continue Exploring</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Global capture-phase playback guard for logged-out visitors.
 * Public browsing, search, categories, detail pages, and trailers stay 100% open.
 * Clicking any Play / Watch / Episode / Resume link (`/watch/...`) while logged out
 * opens the CINOVA Login Required modal instead of starting playback.
 */
export default function PlaybackAuthGate() {
  const { user, isLoading } = useAuth();
  const [pendingWatchUrl, setPendingWatchUrl] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setPendingWatchUrl(null);
  }, []);

  useEffect(() => {
    // Close modal automatically if user logs in
    if (user && pendingWatchUrl) {
      setPendingWatchUrl(null);
    }
  }, [user, pendingWatchUrl]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Only intercept normal primary clicks when user is NOT authenticated
      if (user || isLoading) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref.startsWith("/watch/")) return;

      // Prevent navigation to protected video playback and show login modal
      e.preventDefault();
      e.stopPropagation();
      setPendingWatchUrl(rawHref);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [user, isLoading]);

  useEffect(() => {
    if (!pendingWatchUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pendingWatchUrl, closeModal]);

  if (!pendingWatchUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#080506]/82 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <LoginRequiredCard
        returnTo={pendingWatchUrl}
        onContinueExploring={closeModal}
      />
    </div>
  );
}
