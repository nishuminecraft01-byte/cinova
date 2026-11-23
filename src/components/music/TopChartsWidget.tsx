"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Pause, ChevronRight, Sparkles, Disc3 } from "lucide-react";
import { Song } from "@/types/music";
import { useMusic } from "@/context/MusicContext";
import { MAINSTREAM_TRACKS } from "@/lib/api/mainstream-client";

interface TopChartsWidgetProps {
  tracks: Song[];
  onExploreClick?: () => void;
}

export default function TopChartsWidget({ tracks, onExploreClick }: TopChartsWidgetProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();

  const sourceTracks = tracks && tracks.length > 0 ? tracks : MAINSTREAM_TRACKS;
  const chartTracks = sourceTracks.slice(0, 5);

  const handlePlaySong = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      playTrack(song, tracks);
    }
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* 1. Top Charts Ranked List Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#0E0409] border border-[rgba(155,25,57,0.3)] p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[rgba(155,25,57,0.2)]">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Top Charts</span>
          </h3>
          <button
            type="button"
            onClick={onExploreClick}
            className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Ranked Items */}
        <div className="flex flex-col divide-y divide-[rgba(155,25,57,0.12)]">
          {chartTracks.map((song, idx) => {
            const isCurrent = currentTrack?.id === song.id;
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                onClick={(e) => handlePlaySong(song, e)}
                className={`group flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#E11D48]/15 border border-[#E11D48]/30"
                    : "hover:bg-[#180812] text-[#AAA0A7] hover:text-white"
                }`}
              >
                {/* Rank Number */}
                <span
                  className={`w-4 text-center font-bold text-xs ${
                    idx === 0
                      ? "text-[#FF385B] font-black"
                      : idx === 1
                      ? "text-rose-400"
                      : idx === 2
                      ? "text-rose-300"
                      : "text-[#746971]"
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Square Thumbnail with Play Overlay */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#160710] shrink-0 border border-white/5 shadow-md">
                  <Image
                    src={song.coverUrl}
                    alt={song.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="44px"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isThisPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-white text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Song Title & Artist */}
                <div className="min-w-0 flex-grow">
                  <p
                    className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                      isCurrent ? "text-white" : "text-[#F5F1F3] group-hover:text-white"
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="text-[11px] text-[#AAA0A7] truncate">
                    {song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Feel the Beat Promo Card (Exact visual from reference image) */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#1C0812] via-[#2A0B1B] to-[#12040B] border border-[rgba(225,29,72,0.35)] p-5 shadow-[0_15px_45px_rgba(0,0,0,0.8)] flex items-center justify-between">
        {/* Ambient Red Glow */}
        <div
          className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-[#E11D48]/30 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Text & Action */}
        <div className="relative z-10 space-y-2 max-w-[60%]">
          {/* Animated sound wave bars */}
          <div className="flex items-end gap-1 h-4">
            <span className="w-1 bg-[#FF385B] animate-pulse h-2 rounded-full" />
            <span className="w-1 bg-[#E11D48] animate-pulse delay-75 h-4 rounded-full" />
            <span className="w-1 bg-[#FF385B] animate-pulse delay-150 h-3 rounded-full" />
            <span className="w-1 bg-[#E11D48] animate-pulse delay-100 h-4 rounded-full" />
            <span className="w-1 bg-[#FF385B] animate-pulse delay-200 h-2 rounded-full" />
          </div>

          <h4 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
            Feel the Beat
          </h4>
          <p className="text-[11px] text-[#AAA0A7] leading-tight">
            Your Music. Your Way.
          </p>

          <button
            type="button"
            onClick={onExploreClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-[#0E0409] font-bold text-xs shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span>Explore Music</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headphones Visual */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 pointer-events-none flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full filter drop-shadow-[0_8px_20px_rgba(225,29,72,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hpHeadband" x1="20" y1="20" x2="180" y2="180">
                <stop offset="0%" stopColor="#4A0C22" />
                <stop offset="50%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#250512" />
              </linearGradient>
              <radialGradient id="hpEarPad" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#8A0D32" />
                <stop offset="100%" stopColor="#300514" />
              </radialGradient>
            </defs>

            {/* Headband arch */}
            <path
              d="M 35 110 C 35 45, 165 45, 165 110"
              stroke="url(#hpHeadband)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Top cushion */}
            <path
              d="M 55 85 C 75 55, 125 55, 145 85"
              stroke="#1C0610"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Left ear cup */}
            <rect x="20" y="95" width="28" height="55" rx="14" fill="url(#hpEarPad)" stroke="#FF385B" strokeWidth="2.5" />
            <rect x="34" y="105" width="12" height="35" rx="6" fill="#1C0610" />

            {/* Right ear cup */}
            <rect x="152" y="95" width="28" height="55" rx="14" fill="url(#hpEarPad)" stroke="#FF385B" strokeWidth="2.5" />
            <rect x="154" y="105" width="12" height="35" rx="6" fill="#1C0610" />

            {/* Crimson metallic highlight ring */}
            <circle cx="34" cy="122" r="5" fill="#FF385B" opacity="0.9" />
            <circle cx="166" cy="122" r="5" fill="#FF385B" opacity="0.9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
