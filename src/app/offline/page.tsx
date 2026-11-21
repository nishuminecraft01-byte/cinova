"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, RotateCw, History, Bookmark, Film } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    }
  };

  return (
    <main className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.3)] p-8 text-center space-y-6 shadow-2xl shadow-black/80">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center mx-auto text-[#F5F1F3] shadow-lg shadow-[#650A20]/40">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-[#160B10] border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            Connection Lost
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">You&apos;re Offline</h1>
          <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
            Your internet connection is currently unavailable. Check your network or Wi-Fi to resume
            streaming on CINOVA.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Checking Connection..." : "Try Reconnecting"}</span>
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-[#F5F1F3] text-xs font-semibold transition-colors"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Back to CINOVA Home</span>
          </Link>
        </div>

        {/* Local offline cache navigation */}
        <div className="pt-4 border-t border-[rgba(155,25,57,0.2)] text-left space-y-2">
          <p className="text-[11px] text-[#AAA0A7] text-center font-medium">
            Saved on this device:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/history"
              className="p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] text-center text-xs text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors flex flex-col items-center gap-1"
            >
              <History className="w-4 h-4 text-[#FF385B]" />
              <span>Watch History</span>
            </Link>
            <Link
              href="/profile?tab=watchlist"
              className="p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] text-center text-xs text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors flex flex-col items-center gap-1"
            >
              <Bookmark className="w-4 h-4 text-[#FF385B]" />
              <span>My List</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
