"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
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
  ListMusic,
  Maximize2,
  Heart,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    audioError,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
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
    openFullScreenPlayer,
    toggleQueue,
  } = useMusic();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  if (!currentTrack) {
    return null;
  }

  const effectiveTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (effectiveTime / duration) * 100 : 0;
  const isFav = isFavorite(currentTrack.id);

  return (
    <div
      aria-label="CINOVA Music Player"
      className="fixed bottom-[calc(3.5rem+max(var(--safe-bottom,0px),8px))] lg:bottom-0 left-0 lg:left-[76px] right-0 z-[45] bg-[#0B0508]/96 backdrop-blur-2xl border-t border-[rgba(155,25,57,0.32)] shadow-[0_-10px_35px_rgba(0,0,0,0.85)] transition-all select-none"
      style={{
        paddingBottom: "max(var(--safe-bottom, 0px), 6px)",
      }}
    >
      {/* Audio Error Alert Banner */}
      {audioError && (
        <div className="bg-[#2B0813] border-b border-red-500/35 px-4 py-1 text-[11px] text-red-300 flex items-center justify-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{audioError}</span>
        </div>
      )}

      {/* Mini Progress Bar on the very top edge */}
      <div
        className="w-full h-1 bg-[#1A0A12] cursor-pointer relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          seek(clickPos * duration);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-[#FF385B] via-[#E11D48] to-[#A30D32] transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <span className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#E11D48]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left: Song Artwork & Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-64 lg:w-72">
          <div
            onClick={openFullScreenPlayer}
            className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer group shadow-[0_4px_14px_rgba(225,29,72,0.22)] border border-[rgba(155,25,57,0.3)]"
          >
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ChevronUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={openFullScreenPlayer}
              className="text-xs sm:text-sm font-semibold text-[#F5F1F3] truncate hover:text-[#FF385B] cursor-pointer transition-colors"
            >
              {currentTrack.title}
            </h4>
            <Link
              href={`/music/artist/${currentTrack.artistId}`}
              className="text-[11px] text-[#AAA0A7] truncate hover:text-white block transition-colors"
            >
              {currentTrack.artist}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(currentTrack.id)}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            className="p-1.5 rounded-full hover:bg-[#1A0A12] text-[#AAA0A7] hover:text-[#FF385B] transition-colors shrink-0"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${isFav ? "fill-[#E11D48] text-[#E11D48]" : ""
                }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Timeline Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-xl px-2">
          {/* Main Control Buttons */}
          <div className="flex items-center gap-3 sm:gap-5 mb-1">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              className={`p-1.5 rounded-full transition-colors hidden sm:inline-flex ${isShuffle
                ? "text-[#FF385B] bg-[#650A20]/30 shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={prevTrack}
              aria-label="Previous track"
              className="p-1.5 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1A0A12] transition-colors active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Prominent Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#A30D32] via-[#E11D48] to-[#FF385B] text-white flex items-center justify-center shadow-[0_2px_14px_rgba(225,29,72,0.45)] hover:scale-105 active:scale-95 transition-all"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              aria-label="Next track"
              className="p-1.5 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1A0A12] transition-colors active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              aria-label="Toggle repeat mode"
              className={`p-1.5 rounded-full transition-colors hidden sm:inline-flex ${repeatMode !== "off"
                ? "text-[#FF385B] bg-[#650A20]/30 shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Scrubber & Time */}
          <div className="w-full hidden sm:flex items-center gap-2.5 text-[11px] font-mono text-[#746971]">
            <span className="w-9 text-right shrink-0">{formatTime(effectiveTime)}</span>
            <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
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
                className="w-full h-1 bg-[#1D0C13] rounded-lg appearance-none cursor-pointer accent-[#E11D48] focus:outline-none"
              />
            </div>
            <span className="w-9 text-left shrink-0">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Volume Slider (desktop) */}
          <div className="hidden lg:flex items-center gap-2 group">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-1 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#FF385B]" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-[#1D0C13] rounded-lg appearance-none cursor-pointer accent-[#E11D48] focus:outline-none"
            />
          </div>

          {/* Queue Drawer Toggle */}
          <button
            type="button"
            onClick={toggleQueue}
            aria-label="View Queue"
            title="Music Queue"
            className="p-1.5 rounded-full hover:bg-[#1A0A12] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Full-screen Player Expand */}
          <button
            type="button"
            onClick={openFullScreenPlayer}
            aria-label="Expand Fullscreen Player"
            title="Full Screen View"
            className="p-1.5 rounded-full hover:bg-[#1A0A12] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

