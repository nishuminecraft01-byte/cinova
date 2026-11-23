"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  Disc3,
  AlignLeft,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function FullScreenPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isFullScreenPlayerOpen,
    closeFullScreenPlayer,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    isFavorite,
    toggleQueue,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<"cover" | "lyrics">("cover");
  const [scrubValue, setScrubValue] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  if (!isFullScreenPlayerOpen || !currentTrack) {
    return null;
  }

  const effectiveTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (effectiveTime / duration) * 100 : 0;
  const isFav = isFavorite(currentTrack.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CINOVA Fullscreen Music Player"
      className="fixed inset-0 z-50 bg-[#080506]/98 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden select-none"
      style={{
        paddingTop: "max(var(--safe-top, 0px), 1.25rem)",
        paddingBottom: "max(var(--safe-bottom, 0px), 1.25rem)",
      }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 blur-[120px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 35%, #E11D48 0%, #650A20 40%, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={closeFullScreenPlayer}
          aria-label="Minimize player"
          className="w-10 h-10 rounded-full bg-[#160B10]/80 border border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#E11D48]">
            Now Playing
          </p>
          <p className="text-xs sm:text-sm font-medium text-[#AAA0A7] truncate max-w-[200px] sm:max-w-xs">
            {currentTrack.album}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Lyrics / Artwork Toggle */}
          <button
            type="button"
            onClick={() => setActiveTab((prev) => (prev === "cover" ? "lyrics" : "cover"))}
            aria-label="Toggle Lyrics View"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
              activeTab === "lyrics"
                ? "bg-[#650A20] border-[#E11D48] text-white"
                : "bg-[#160B10]/80 border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-white"
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          {/* Queue Button */}
          <button
            type="button"
            onClick={toggleQueue}
            aria-label="Toggle queue"
            className="w-10 h-10 rounded-full bg-[#160B10]/80 border border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-white flex items-center justify-center transition-colors shadow-lg"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Main Stage (Artwork or Lyrics) */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center my-4 min-h-0">
        {activeTab === "cover" ? (
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            {/* Vinyl Glow Aura */}
            <div
              className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-700 ${
                isPlaying ? "opacity-50" : "opacity-20"
              }`}
              style={{
                background: "radial-gradient(circle, #FF385B 0%, #A30D32 60%, transparent 80%)",
              }}
            />

            {/* Vinyl Outer Disc */}
            <div
              className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-[rgba(155,25,57,0.38)] group`}
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        ) : (
          /* Synced Lyrics Display */
          <div className="w-full h-80 sm:h-96 overflow-y-auto px-4 py-6 rounded-2xl bg-[#160B10]/60 border border-[rgba(155,25,57,0.2)] space-y-4 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E11D48] mb-2">Lyrics</h3>
            {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
              currentTrack.lyrics.map((line, idx) => (
                <p
                  key={idx}
                  className="text-base sm:text-lg font-medium text-[#F5F1F3] hover:text-[#FF385B] transition-colors leading-relaxed"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#AAA0A7] py-12">Lyrics not available for this track.</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-4">
        {/* Track Metadata & Favorite Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1F3] truncate">
              {currentTrack.title}
            </h2>
            <Link
              href={`/music/artist/${currentTrack.artistId}`}
              onClick={closeFullScreenPlayer}
              className="text-sm sm:text-base text-[#AAA0A7] hover:text-[#FF385B] truncate inline-block transition-colors"
            >
              {currentTrack.artist}
            </Link>

            {currentTrack.license && (
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  title={currentTrack.license.licenseUrl}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    currentTrack.license.isCommercialAllowed
                      ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-400"
                      : "bg-amber-950/70 border border-amber-500/40 text-amber-400"
                  }`}
                >
                  {currentTrack.license.licenseName}
                </span>
                <span className="text-[10px] text-[#746971]">
                  {currentTrack.license.isCommercialAllowed
                    ? "• Commercial Streaming Permitted"
                    : "• Non-Commercial Use Only"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(currentTrack.id)}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            className="p-3 rounded-full bg-[#160B10]/80 border border-[rgba(155,25,57,0.25)] text-[#AAA0A7] hover:text-[#FF385B] transition-all shrink-0 active:scale-125"
          >
            <Heart
              className={`w-6 h-6 ${
                isFav ? "fill-[#E11D48] text-[#E11D48]" : ""
              }`}
            />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-1">
          <div className="relative flex items-center h-5 group cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={effectiveTime}
              onMouseDown={() => setIsScrubbing(true)}
              onTouchStart={() => setIsScrubbing(true)}
              onChange={(e) => setScrubValue(parseFloat(e.target.value))}
              onMouseUp={(e) => {
                setIsScrubbing(false);
                seek(parseFloat(e.currentTarget.value));
              }}
              onTouchEnd={(e) => {
                setIsScrubbing(false);
                seek(parseFloat(e.currentTarget.value));
              }}
              className="w-full h-1.5 bg-[#1D0C13] rounded-lg appearance-none cursor-pointer accent-[#E11D48] focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-[#AAA0A7]">
            <span>{formatTime(effectiveTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Button Stack */}
        <div className="flex items-center justify-between sm:justify-around py-1">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? "text-[#FF385B]" : "text-[#AAA0A7] hover:text-white"
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={prevTrack}
            aria-label="Previous song"
            className="p-2 rounded-full text-white hover:text-[#FF385B] transition-colors active:scale-95"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Large Center Play/Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#A30D32] via-[#E11D48] to-[#FF385B] text-white flex items-center justify-center shadow-[0_4px_25px_rgba(225,29,72,0.5)] hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            aria-label="Next song"
            className="p-2 rounded-full text-white hover:text-[#FF385B] transition-colors active:scale-95"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={toggleRepeat}
            aria-label="Toggle repeat"
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== "off" ? "text-[#FF385B]" : "text-[#AAA0A7] hover:text-white"
            }`}
          >
            {repeatMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume Slider in Fullscreen */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="text-[#AAA0A7] hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-[#FF385B]" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-48 sm:w-64 h-1.5 bg-[#1D0C13] rounded-lg appearance-none cursor-pointer accent-[#E11D48] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
