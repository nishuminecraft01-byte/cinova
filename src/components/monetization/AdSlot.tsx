"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

export type AdSlotPosition =
  | "homepage-banner"
  | "catalog-inline"
  | "detail-sidebar"
  | "search-sponsored";

interface AdSlotProps {
  slot: AdSlotPosition;
  className?: string;
  label?: string;
}

export default function AdSlot({
  slot,
  className = "",
  label = "Sponsored Spotlight",
}: AdSlotProps) {
  // Check if an official ad provider (e.g. AdSense / AdManager) is configured via env
  const adsensePublisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  if (adsensePublisher) {
    return (
      <div className={`w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 my-6 ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-[#746971] uppercase tracking-wider mb-1.5 px-1">
          <span>Advertisement</span>
          <span className="text-[#FF385B] font-mono">Slot: {slot}</span>
        </div>
        <div className="rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.2)] p-4 flex items-center justify-center min-h-[90px]">
          {/* Ad container for publisher script */}
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={adsensePublisher}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // Extensible placeholder & CINOVA Premium Discovery Spotlight
  return (
    <div className={`w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 my-6 ${className}`}>
      <div className="rounded-2xl bg-gradient-to-r from-[#160B10] via-[#10080C] to-[#1D0C13] border border-[rgba(155,25,57,0.28)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#650A20] to-[#A30D32] border border-[rgba(225,29,72,0.4)] flex items-center justify-center shrink-0 text-[#F5F1F3]">
            <Sparkles className="w-5 h-5 text-[#FF385B]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF385B]">
                {label}
              </span>
              <span className="text-[10px] text-[#746971]">• Verified Official Content</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#F5F1F3] truncate">
              Discover Licensed Global Releases on CINOVA
            </h4>
            <p className="text-xs text-[#AAA0A7] truncate">
              Explore official worldwide entertainment catalogs across Bollywood, Hollywood, K-Drama, and Anime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link
            href="/search?collection=all"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] hover:border-[#E11D48] text-xs font-bold text-[#F5F1F3] transition-colors"
          >
            <span>Explore Catalog</span>
            <ExternalLink className="w-3 h-3 text-[#FF385B]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
