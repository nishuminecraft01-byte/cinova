"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Album } from "@/types/music";
import { useMusic } from "@/context/MusicContext";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const { playTrack, currentTrack, isPlaying } = useMusic();

  const isAlbumPlaying =
    isPlaying && album.songs.some((s) => s.id === currentTrack?.id);

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (album.songs.length > 0) {
      playTrack(album.songs[0], album.songs);
    }
  };

  return (
    <Link
      href={`/music/album/${album.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#14080E]/80 hover:bg-[#1A0A12] border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/50 p-3 transition-all duration-300 shadow-md hover:shadow-[0_10px_25px_rgba(225,29,72,0.2)] select-none"
    >
      {/* Album Cover with Vinyl Record Peek */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-lg bg-[#0E0509]">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Vinyl Rim Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Quick Play Hover Button */}
        <button
          type="button"
          onClick={handleQuickPlay}
          aria-label={`Play album ${album.title}`}
          className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-gradient-to-tr from-[#A30D32] to-[#E11D48] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(225,29,72,0.6)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 active:scale-95 hover:scale-105"
        >
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </button>

        {isAlbumPlaying && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            PLAYING
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-semibold text-[#F5F1F3] group-hover:text-[#FF385B] truncate transition-colors">
          {album.title}
        </h4>
        <p className="text-[11px] text-[#AAA0A7] truncate mt-0.5">{album.artist}</p>
        <span className="text-[10px] text-[#746971] block mt-1">{album.releaseYear}</span>
      </div>
    </Link>
  );
}
