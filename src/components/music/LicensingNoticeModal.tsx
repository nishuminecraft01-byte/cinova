"use client";

import React, { useEffect } from "react";
import { X, ShieldAlert, Disc3, ExternalLink, Music2 } from "lucide-react";
import { Song } from "@/types/music";

interface LicensingNoticeModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onExploreIndependent?: () => void;
}

export default function LicensingNoticeModal({
  song,
  isOpen,
  onClose,
  onExploreIndependent,
}: LicensingNoticeModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !song) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Licensing Information"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in select-none"
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#0F060B] border border-[rgba(155,25,57,0.45)] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(155,25,57,0.25)] bg-[#160B12]/90">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E11D48]/20 text-[#FF385B] border border-[#E11D48]/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Licensing &amp; Audio Stream Rights
              </h3>
              <p className="text-[11px] text-[#AAA0A7]">Discovery &amp; Metadata Engine</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Snapshot */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#14080E] border border-[rgba(155,25,57,0.25)]">
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-16 h-16 rounded-xl object-cover shadow-lg border border-[rgba(155,25,57,0.3)] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-bold text-white truncate">{song.title}</h4>
              <p className="text-xs text-[#FF385B] font-medium truncate mt-0.5">{song.artist}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#746971]">
                <span>{song.genre}</span>
                {song.album && (
                  <>
                    <span>•</span>
                    <span className="truncate">{song.album}</span>
                  </>
                )}
                {song.durationText && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{song.durationText}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Compliance & Licensing Notice */}
          <div className="space-y-2.5 text-xs text-[#C5BCC2] leading-relaxed">
            <p>
              This commercial sound recording is catalogued for{" "}
              <strong className="text-white">Mainstream Music Discovery &amp; Search</strong>.
            </p>
            <div className="p-3.5 rounded-xl bg-[#240A14]/70 border border-[#E11D48]/30 space-y-2">
              <p className="text-[11px] font-semibold text-[#FF385B] uppercase tracking-wider">
                CINOVA Strict Zero-Cost &amp; Copyright Policy:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#AAA0A7]">
                <li>Zero-cost model: We do not integrate paid subscriptions or unauthorized audio rips.</li>
                <li>Commercial Bollywood &amp; Western hits are catalogued for metadata, artwork, and song discovery.</li>
                <li>Full-length streaming requires direct B2B statutory licensing (T-Series, Sony, Zee Music, UMG).</li>
              </ul>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              💡 Looking for full-length music to play right now? Stream verified tracks in our Free Independent Music section!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            {onExploreIndependent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreIndependent();
                }}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-98 transition-all"
              >
                <Disc3 className="w-4 h-4" />
                <span>Stream Free Independent Music</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#14080E] border border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
