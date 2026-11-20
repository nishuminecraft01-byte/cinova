import React from "react";
import Link from "next/link";
import { Film, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[82vh] cinova-atmosphere flex items-center justify-center px-4 pt-20 pb-16 bg-[#080506] text-[#F5F1F3]">
      <div className="max-w-md w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.3)] p-7 sm:p-8 text-center space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#160B10] border border-[rgba(225,29,72,0.35)]">
          <Film className="w-8 h-8 text-[#FF385B]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#F5F1F3]">Lost Your Way?</h1>
          <p className="text-sm text-[#AAA0A7] leading-relaxed">
            Sorry, we can&apos;t find that title or page. You&apos;ll find lots to explore across CINOVA.
          </p>
          <span className="inline-block px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[11px] font-mono text-[#AAA0A7] mt-2">
            Error Code: CINOVA-404
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs transition-all"
          >
            <Home className="w-4 h-4" /> CINOVA Home
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] text-[#F5F1F3] font-semibold text-xs transition-colors"
          >
            <Search className="w-4 h-4 text-[#FF385B]" /> Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
