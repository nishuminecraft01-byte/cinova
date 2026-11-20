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
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#141414] text-white">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-netflix-red/10 border border-netflix-red/30">
          <AlertTriangle className="w-8 h-8 text-netflix-red" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">Streaming Playback Interrupted</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An unexpected error occurred while loading this view. You can reload the component or return to the main dashboard.
          </p>
          {error?.digest && (
            <p className="text-[10px] text-zinc-500 font-mono">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-netflix-red hover:bg-netflix-redDark text-white font-bold text-xs shadow-md transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#242424] hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
