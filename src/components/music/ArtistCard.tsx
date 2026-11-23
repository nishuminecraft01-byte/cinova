"use client";

import React from "react";
import Link from "next/link";
import { Artist } from "@/types/music";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/music/artist/${artist.id}`}
      className="group flex flex-col items-center text-center p-3 rounded-2xl bg-[#14080E]/40 hover:bg-[#1A0A12] border border-transparent hover:border-[rgba(155,25,57,0.35)] transition-all duration-300 select-none"
    >
      {/* Circular Avatar with Glowing Ring */}
      <div className="relative w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full p-1 mb-2 bg-gradient-to-tr from-[#650A20] via-transparent to-[#E11D48] group-hover:from-[#E11D48] group-hover:to-[#FF385B] transition-all duration-500 shadow-md group-hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]">
        <div className="w-full h-full rounded-full overflow-hidden bg-[#160B10]">
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-semibold text-[#F5F1F3] group-hover:text-[#FF385B] truncate max-w-[110px] transition-colors">
        {artist.name}
      </h4>
      <p className="text-[10px] sm:text-[11px] text-[#AAA0A7] truncate max-w-[110px] mt-0.5">
        {artist.monthlyListeners} Listeners
      </p>
      <span className="text-[9px] sm:text-[10px] text-[#746971] truncate max-w-[110px] mt-0.5">
        {artist.genres[0]}
      </span>
    </Link>
  );
}
