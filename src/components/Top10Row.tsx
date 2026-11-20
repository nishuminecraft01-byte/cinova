"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info } from "lucide-react";
import { Movie } from "@/types/movie";
import { useWatchlist } from "@/context/WatchlistContext";
import CinovaImage from "@/components/CinovaImage";

interface Top10RowProps {
  title?: string;
  movies: Movie[];
  onOpenModal?: (movie: Movie) => void;
}

export default function Top10Row({
  title = "Top 10 Today",
  movies,
  onOpenModal,
}: Top10RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const top10 = movies.slice(0, 10);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (top10.length === 0) return null;

  return (
    <section className="relative my-6 sm:my-8 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto group/row">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
        <h2 className="text-base sm:text-lg font-bold text-[#F5F1F3] tracking-tight flex items-center gap-2">
          <span className="text-[#E11D48] font-black text-base sm:text-lg">TOP 10</span>
          <span>{title}</span>
        </h2>
      </div>

      {/* Slider Carousel Wrapper */}
      <div className="relative">
        {/* Left Paddle (desktop/tablet only) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/92 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 shadow-xl backdrop-blur-md"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Top 10 Horizontal Cards Container */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="cinova-carousel-track flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-1"
        >
          {top10.map((movie, index) => {
            const rank = index + 1;
            const inList = isInWatchlist(movie.id);

            return (
              <div
                key={movie.id}
                onClick={() => onOpenModal && onOpenModal(movie)}
                className="group/item relative flex-shrink-0 snap-start flex items-center h-44 sm:h-56 select-none cursor-pointer"
              >
                {/* Giant 3D Outline Number */}
                <span className="netflix-top10-number -mr-5 sm:-mr-7 z-10 pointer-events-none transform -translate-y-2 text-[96px] sm:text-[124px]">
                  {rank}
                </span>

                {/* Vertical Poster Card */}
                <div className="relative w-32 sm:w-40 h-44 sm:h-56 rounded-xl overflow-hidden bg-[#160B10] shadow-[0_8px_24px_rgba(0,0,0,0.65)] border border-[rgba(155,25,57,0.22)] transition-all duration-300 group-hover/item:border-[#E11D48]/55 z-20">
                  <CinovaImage
                    src={movie.posterUrl}
                    alt={movie.title}
                    fallbackText={movie.title}
                    aspect="poster"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-[1.04]"
                  />

                  {/* Subtle Mobile Bottom Title Scrim (hidden on sm+ where full hover overlay takes over) */}
                  <div className="sm:hidden absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[#080506]/95 via-[#080506]/65 to-transparent pointer-events-none">
                    <h4 className="text-[11px] font-bold text-[#F5F1F3] truncate leading-tight">{movie.title}</h4>
                  </div>

                  {/* Desktop Hover Overlay with Action Controls */}
                  <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/78 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 p-3 flex-col justify-end">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Link
                        href={`/watch/${movie.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-[#E11D48] hover:bg-[#FF385B] text-[#F5F1F3] flex items-center justify-center transition-colors shadow-md"
                        title="Play"
                      >
                        <Play className="w-3.5 h-3.5 fill-[#F5F1F3] ml-0.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWatchlist(movie.id);
                        }}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                          inList
                            ? "border-[#E11D48] bg-[#650A20]/70 text-[#FF385B]"
                            : "border-[rgba(155,25,57,0.38)] bg-[#160B10]/90 hover:border-[#E11D48] text-[#F5F1F3]"
                        }`}
                        title={inList ? "In My List" : "Add to My List"}
                      >
                        {inList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>

                      {onOpenModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenModal(movie);
                          }}
                          className="w-8 h-8 rounded-full border border-[rgba(155,25,57,0.38)] bg-[#160B10]/90 hover:border-[#E11D48] text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center ml-auto"
                          title="More Info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[#F5F1F3] line-clamp-1">{movie.title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#AAA0A7]">
                      <span>{movie.releaseYear}</span>
                      <span>•</span>
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Paddle (desktop/tablet only) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/92 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 shadow-xl backdrop-blur-md"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
}
