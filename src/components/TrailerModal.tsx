"use client";

import React, { useEffect, useCallback } from "react";
import { X, Film, ExternalLink } from "lucide-react";

export interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string | null;
  title: string;
  trailerName?: string | null;
  mediaType?: "movie" | "tv";
}

/**
 * Extracts a YouTube 11-char video ID from a raw key or a YouTube URL.
 */
function resolveYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerKey,
  title,
  trailerName = "Official Trailer",
  mediaType,
}: TrailerModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !trailerKey) return null;

  const ytId = resolveYouTubeVideoId(trailerKey);
  const isDirectVideo = !ytId && (trailerKey.endsWith(".mp4") || trailerKey.endsWith(".m3u8") || trailerKey.startsWith("http"));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cinova-trailer-modal-title"
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl lg:max-w-5xl rounded-2xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.42)] shadow-[0_24px_70px_rgba(0,0,0,0.95)] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[rgba(155,25,57,0.24)] bg-[#0C0609]/95">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#650A20] to-[#1D0C13] border border-[rgba(225,29,72,0.4)] flex items-center justify-center shrink-0">
              <Film className="w-4 h-4 text-[#FF385B]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF385B]">
                  {trailerName || "Official Trailer"}
                </span>
                {mediaType && (
                  <span className="text-[10px] text-[#746971] uppercase">
                    • {mediaType === "tv" ? "TV Series" : "Movie"}
                  </span>
                )}
              </div>
              <h3
                id="cinova-trailer-modal-title"
                className="text-sm sm:text-base font-bold text-[#F5F1F3] truncate leading-tight"
              >
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ytId && (
              <a
                href={`https://www.youtube.com/watch?v=${ytId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
                title="Open trailer on YouTube"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3 text-[#FF385B]" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close trailer"
              className="w-9 h-9 rounded-full bg-[#160B10] hover:bg-[#E11D48] text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.3)] flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-black">
          {ytId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`${title} - ${trailerName || "Official Trailer"}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : isDirectVideo ? (
            <video
              src={trailerKey}
              autoPlay
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Film className="w-12 h-12 text-[#FF385B]/60" />
              <p className="text-sm font-semibold text-[#F5F1F3]">Trailer Unavailable</p>
              <p className="text-xs text-[#AAA0A7] max-w-sm">
                A valid YouTube video could not be loaded for this title.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Sub-bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-[#0C0609]/95 text-[11px] text-[#746971] border-t border-[rgba(155,25,57,0.18)]">
          <span>Official preview provided via TMDB & YouTube</span>
          <span className="hidden sm:inline">Press ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
}
