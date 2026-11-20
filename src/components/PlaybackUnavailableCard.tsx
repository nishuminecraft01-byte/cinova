"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Film, Tv, Play, X } from "lucide-react";

interface PlaybackUnavailableCardProps {
  title?: string;
  onGoBack: () => void;
  exploreHref?: string;
  showCloseButton?: boolean;
  trailerKey?: string | null;
  onWatchTrailer?: () => void;
  detailHref?: string;
}

export function PlaybackUnavailableCard({
  title,
  onGoBack,
  exploreHref = "/search",
  showCloseButton = false,
  trailerKey,
  onWatchTrailer,
  detailHref,
}: PlaybackUnavailableCardProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cinova-playback-unavailable-title"
      className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.36)] shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#650A20] via-[#E11D48] to-[#FF385B]" />

      {showCloseButton && (
        <button
          type="button"
          onClick={onGoBack}
          aria-label="Close notice"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#650A20]/60 to-[#160B10] border border-[rgba(225,29,72,0.38)] flex items-center justify-center">
            <Film className="w-5 h-5 text-[#FF385B]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF385B]">
                CINOVA Global Catalog
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-[10px] uppercase font-bold text-[#FF385B]">
                Discovery Mode
              </span>
            </div>
            <h2
              id="cinova-playback-unavailable-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F1F3] leading-tight"
            >
              Stream Source In Preparation
            </h2>
            <p className="text-sm text-[#AAA0A7] leading-relaxed">
              This title is part of CINOVA&apos;s global entertainment catalog. While our licensed streaming vault connects verified sources, you can watch official trailers in high definition or explore legal streaming platforms in your region.
            </p>
            {title && (
              <p className="text-xs text-[#746971] pt-0.5">
                Title: <span className="text-[#F5F1F3] font-medium">{title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2.5">
          {onWatchTrailer && (
            <button
              type="button"
              onClick={onWatchTrailer}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-sm font-bold text-[#F5F1F3] flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_rgba(225,29,72,0.3)]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Official Trailer</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {detailHref ? (
              <a
                href={detailHref}
                onClick={onGoBack}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.36)] hover:border-[#E11D48]/70 text-xs sm:text-sm font-semibold text-[#F5F1F3] flex items-center justify-center gap-2 transition-colors"
              >
                <Tv className="w-4 h-4 text-[#FF385B]" />
                <span>Where to Watch</span>
              </a>
            ) : null}

            <Link
              href={exploreHref}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.36)] hover:border-[#E11D48]/70 text-xs sm:text-sm font-semibold text-[#F5F1F3] flex items-center justify-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#FF385B]" />
              <span>Explore Playable Vault</span>
            </Link>

            <button
              type="button"
              onClick={onGoBack}
              className="px-4 py-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.36)] text-xs sm:text-sm font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
