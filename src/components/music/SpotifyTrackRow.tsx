"use client";

import React from "react";
import Link from "next/link";
import { Play, Pause, Heart, Disc3, Info } from "lucide-react";
import { Song } from "@/types/music";
import { useMusic } from "@/context/MusicContext";

interface SpotifyTrackRowProps {
  index: number;
  song: Song;
  queueContext?: Song[];
  showAlbum?: boolean;
  showCover?: boolean;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function SpotifyTrackRow({
  index,
  song,
  queueContext,
  showAlbum = true,
  showCover = true,
}: SpotifyTrackRowProps) {
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

  const handleRowClick = () => {
    if (isPlayable && isCurrent) {
      togglePlay();
    } else {
      playTrack(song, queueContext);
    }
  };

  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayable && isCurrent) {
      togglePlay();
    } else {
      playTrack(song, queueContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(song.id, song);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-xl hover:bg-[#1C0B14]/80 transition-all duration-200 cursor-pointer border select-none ${
        isCurrent
          ? "bg-[#220B17]/90 border-[#E11D48]/40 shadow-[0_0_15px_rgba(225,29,72,0.15)]"
          : "border-transparent hover:border-[rgba(155,25,57,0.2)]"
      }`}
    >
      {/* 1. Track Index / Play Button / Info Button / Equalizer */}
      <div className="flex items-center justify-center w-7 sm:w-8 shrink-0">
        {isThisPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5 group-hover:hidden">
            <span className="w-0.5 bg-[#FF385B] animate-bounce h-3 rounded-full" />
            <span className="w-0.5 bg-[#E11D48] animate-bounce delay-100 h-3.5 rounded-full" />
            <span className="w-0.5 bg-[#FF385B] animate-bounce delay-200 h-2 rounded-full" />
          </div>
        ) : (
          <span
            className={`font-mono text-xs font-semibold group-hover:hidden ${
              isCurrent ? "text-[#FF385B]" : "text-[#746971]"
            }`}
          >
            {index}
          </span>
        )}

        {isPlayable ? (
          <button
            type="button"
            onClick={handlePlayButtonClick}
            aria-label={isThisPlaying ? "Pause song" : "Play song"}
            className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-[#E11D48] text-white hover:scale-110 active:scale-95 transition-transform shadow-[0_2px_8px_rgba(225,29,72,0.5)]"
          >
            {isThisPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlayButtonClick}
            aria-label="View track licensing information"
            title="Song Details & Licensing"
            className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-[#1A0A12] border border-[#E11D48]/40 text-[#FF385B] hover:text-white hover:bg-[#650A20] hover:scale-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(225,29,72,0.3)]"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Track Title & Artist Info + Artwork */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {showCover && (
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 shadow-md bg-[#160B10]">
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                isCurrent ? "text-[#FF385B]" : "text-[#F5F1F3] group-hover:text-white"
              }`}
            >
              {song.title}
            </h4>

            {isPlayable && song.source === "jamendo" && (
              <span
                title="Authorized Full-Length Audio Stream via Jamendo"
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shrink-0"
              >
                <Disc3 className="w-2.5 h-2.5" />
                <span>Jamendo Free Audio</span>
              </span>
            )}
            {isPlayable && song.playbackType === "youtube_embed" && (
              <span
                title="Official Music Video via YouTube Embedded Player"
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#2A0915] border border-[#E11D48]/40 text-[#FF385B] shrink-0"
              >
                <Play className="w-2 h-2 fill-current" />
                <span>Official Video</span>
              </span>
            )}
            {!isPlayable && (
              <span
                title="Commercial Recording - Metadata & Discovery"
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#2A0915] border border-[#E11D48]/30 text-[#FF385B] shrink-0"
              >
                <Info className="w-2.5 h-2.5" />
                <span>Discovery</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <Link
              href={`/music/artist/${song.artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] sm:text-xs text-[#AAA0A7] hover:text-[#FF385B] hover:underline truncate transition-colors"
            >
              {song.artist || song.channelTitle}
            </Link>

            {song.genre && (
              <>
                <span className="text-[#554b52] text-[10px] hidden sm:inline">•</span>
                <span className="text-[10px] text-[#746971] hidden sm:inline truncate max-w-[100px]">
                  {song.genre}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Album Name (Hidden on Mobile) */}
      {showAlbum && (
        <div className="hidden md:flex items-center min-w-0 pr-2">
          {song.album ? (
            <Link
              href={`/music/album/${song.albumId || "jamendo"}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[#746971] hover:text-[#AAA0A7] hover:underline truncate transition-colors"
            >
              {song.album}
            </Link>
          ) : (
            <span className="text-xs text-[#554b52] italic truncate">Single Release</span>
          )}
        </div>
      )}

      {/* 4. Controls: Heart + Duration */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
        {/* Favorite Heart Toggle */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          className={`p-1.5 rounded-full transition-all ${
            isFav
              ? "text-[#E11D48] opacity-100"
              : "text-[#746971] hover:text-[#FF385B] opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
              isFav ? "fill-[#E11D48] text-[#E11D48]" : ""
            }`}
          />
        </button>

        {/* Track Duration */}
        <span className="font-mono text-xs text-[#AAA0A7] w-10 text-right">
          {song.durationText || formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
}
