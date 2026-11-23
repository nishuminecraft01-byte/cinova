"use client";

import React from "react";
import Link from "next/link";
import { Play, Pause, Heart, Disc3, Info } from "lucide-react";
import { Song } from "@/types/music";
import { useMusic } from "@/context/MusicContext";

interface SongCardProps {
  song: Song;
  queueContext?: Song[];
  aspectRatio?: "landscape" | "square";
}

export default function SongCard({ song, queueContext, aspectRatio = "square" }: SongCardProps) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    toggleFavorite,
    isFavorite,
  } = useMusic();

  const isCurrent = currentTrack?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isFav = isFavorite(song.id);
  const isPlayable = Boolean(
    (song.audioUrl && song.playbackType !== "discovery_only") ||
    (song.playbackType === "youtube_embed" && Boolean(song.youtubeId))
  );

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlayable && isCurrent) {
      togglePlay();
    } else {
      playTrack(song, queueContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(song.id, song);
  };

  return (
    <div
      onClick={() => playTrack(song, queueContext)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-[#14080E]/80 hover:bg-[#1A0A12] border transition-all duration-300 p-3 shadow-md hover:shadow-[0_12px_30px_rgba(225,29,72,0.25)] select-none cursor-pointer ${
        isCurrent
          ? "border-[#E11D48]/70 bg-[#1D0C13] shadow-[0_0_22px_rgba(225,29,72,0.3)]"
          : "border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/50"
      }`}
    >
      {/* Album Artwork (Landscape or Square) */}
      <div
        className={`relative w-full rounded-xl overflow-hidden mb-2.5 bg-[#0E0509] shadow-lg ${
          aspectRatio === "landscape" ? "aspect-[16/10]" : "aspect-square"
        }`}
      >
        <img
          src={song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (song.youtubeId && !target.src.includes("hqdefault")) {
              target.src = `https://i.ytimg.com/vi/${song.youtubeId}/hqdefault.jpg`;
            }
          }}
        />

        {/* Subtle Dark Vignette on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Equalizer overlay when playing */}
        {isThisPlaying && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <div className="flex items-end gap-1 h-5">
              <span className="w-1.5 bg-[#FF385B] animate-bounce h-4 rounded-full" />
              <span className="w-1.5 bg-[#E11D48] animate-bounce delay-100 h-5 rounded-full" />
              <span className="w-1.5 bg-[#FF385B] animate-bounce delay-200 h-3 rounded-full" />
            </div>
          </div>
        )}

        {/* Favorite Heart in Top-Right */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all ${
            isFav
              ? "text-[#E11D48] opacity-100"
              : "text-white/80 opacity-0 group-hover:opacity-100 hover:text-[#FF385B]"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 ${
              isFav ? "fill-[#E11D48] text-[#E11D48]" : ""
            }`}
          />
        </button>

        {/* Playback or Info Action Overlay in Bottom-Right */}
        {isPlayable ? (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={isThisPlaying ? "Pause" : `Play ${song.title}`}
            className={`absolute right-2 sm:right-2.5 bottom-2 sm:bottom-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 border border-white/40 backdrop-blur-md text-white flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 ${
              isThisPlaying
                ? "opacity-100 bg-[#E11D48] border-[#FF385B]"
                : "opacity-80 group-hover:opacity-100"
            }`}
          >
            {isThisPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`View song details and licensing for ${song.title}`}
            title="Song Details & Licensing"
            className="absolute right-2 sm:right-2.5 bottom-2 sm:bottom-2.5 px-2 py-1 rounded-full bg-black/75 hover:bg-black/90 border border-[rgba(155,25,57,0.4)] backdrop-blur-md text-[#AAA0A7] hover:text-white flex items-center gap-1 text-[10px] font-semibold tracking-wider transition-all duration-300 opacity-80 group-hover:opacity-100 shadow-md"
          >
            <Info className="w-3 h-3 text-[#FF385B]" />
            <span>Info</span>
          </button>
        )}

        {/* Source & Playback Type Badge & NEW Badge (Top Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {song.isNew && (
            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF385B] to-[#D90429] text-white shadow-[0_2px_8px_rgba(255,56,91,0.55)] border border-pink-400/40">
              NEW
            </span>
          )}
          {isPlayable && song.source === "jamendo" ? (
            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-black/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-md">
              <Disc3 className="w-2.5 h-2.5" />
              <span>Jamendo</span>
            </span>
          ) : isPlayable && song.playbackType === "youtube_embed" ? (
            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-black/85 backdrop-blur-md text-[#FF385B] border border-[#E11D48]/30 shadow-md flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Official Video</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-black/85 backdrop-blur-md text-[#AAA0A7] border border-white/20 shadow-md flex items-center gap-1">
              <Info className="w-2.5 h-2.5" />
              <span>Discovery</span>
            </span>
          )}
        </div>
      </div>

      {/* Song Details Below Artwork */}
      <div className="min-w-0 flex-1">
        <h4
          className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
            isCurrent ? "text-[#FF385B]" : "text-[#F5F1F3] group-hover:text-white"
          }`}
          title={song.title}
        >
          {song.title}
        </h4>

        <p className="text-[11px] sm:text-xs text-[#AAA0A7] hover:text-[#FF385B] truncate mt-0.5 transition-colors">
          {song.artist || song.channelTitle}
        </p>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-[#746971] uppercase tracking-wider truncate">
            {song.genre}
          </span>
          {song.duration > 0 && (
            <>
              <span className="text-[10px] text-[#554b52]">•</span>
              <span className="text-[10px] text-[#AAA0A7] font-mono">
                {song.durationText || `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
