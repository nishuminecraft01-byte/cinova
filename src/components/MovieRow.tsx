"use client";

import React, { useRef, useState, useCallback, memo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Movie } from "@/types/movie";
import MovieCard from "./MovieCard";

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  exploreHref?: string;
  badge?: string;
  aspect?: "landscape" | "poster";
  maxItems?: number;
  defer?: boolean;
  headerAction?: React.ReactNode;
  onOpenModal?: (movie: Movie) => void;
}

function MovieRowComponent({
  title,
  movies,
  exploreHref,
  badge,
  aspect = "landscape",
  maxItems = 12,
  defer = false,
  headerAction,
  onOpenModal,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const el = rowRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const nextLeft = scrollLeft > 20;
      const nextRight = scrollLeft < scrollWidth - clientWidth - 20;
      setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
      setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));
    });
  }, []);

  const handleScroll = useCallback((direction: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  if (!movies || movies.length === 0) return null;

  const visibleMovies = maxItems > 0 ? movies.slice(0, maxItems) : movies;

  return (
    <section
      className={`relative my-5 sm:my-7 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto group/row ${
        defer ? "cinova-row-defer" : ""
      }`}
    >
      {/* Row Header with Thin Crimson Accent Line */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[3px] h-5 bg-[#E11D48] rounded-full shrink-0" />
          {exploreHref ? (
            <Link
              href={exploreHref}
              className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3] hover:text-[#FF385B] transition-colors flex items-center gap-2 truncate"
            >
              <span className="truncate">{title}</span>
            </Link>
          ) : (
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3] truncate">
              {title}
            </h2>
          )}
          {badge && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.28)] shrink-0">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          {headerAction}
          {exploreHref && (
            <Link
              href={exploreHref}
              className="text-xs font-medium text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors flex items-center gap-1 group/see"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/see:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Row Horizontal Slider */}
      <div className="relative">
        {/* Left Scroll Paddle (desktop/tablet only) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Carousel Container (edge-to-edge swipe with momentum on mobile) */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="cinova-carousel-track flex items-center gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {visibleMovies.map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
              aspect={aspect}
              onOpenModal={onOpenModal}
            />
          ))}
        </div>

        {/* Right Scroll Paddle (desktop/tablet only) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
}

const MovieRow = memo(MovieRowComponent);
export default MovieRow;
