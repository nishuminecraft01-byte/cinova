"use client";

import React from "react";
import { MUSIC_GENRES } from "@/data/music";

interface GenrePillsProps {
  selectedGenre: string;
  onSelectGenre: (genreId: string) => void;
}

export default function GenrePills({ selectedGenre, onSelectGenre }: GenrePillsProps) {
  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-2 select-none">
      {MUSIC_GENRES.map((g) => {
        const isSelected = selectedGenre.toLowerCase() === g.id.toLowerCase();
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelectGenre(g.id)}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
              isSelected
                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white shadow-[0_2px_12px_rgba(225,29,72,0.45)] border border-[#FF385B]/40 scale-105"
                : "bg-[#14080E]/90 text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1A0A12] border border-[rgba(155,25,57,0.24)]"
            }`}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}
