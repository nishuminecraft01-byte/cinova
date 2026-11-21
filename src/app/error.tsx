"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CINOVA Runtime Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#080506] text-[#F5F1F3]">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.35)] shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#650A20]/30 border border-[#E11D48]/40">
          <AlertTriangle className="w-8 h-8 text-[#FF385B]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-[#F5F1F3]">Streaming Playback Interrupted</h2>
          <p className="text-xs text-[#AAA0A7] leading-relaxed">
            An unexpected error occurred while loading this view. You can reload the playback view or return to the main dashboard.
          </p>
          {error?.digest && (
            <p className="text-[10px] text-[#746971] font-mono">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] font-semibold text-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
