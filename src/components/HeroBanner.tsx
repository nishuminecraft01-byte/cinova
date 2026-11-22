"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { Play, Plus, Check, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/types/movie";
import CinovaImage from "@/components/CinovaImage";
import { useWatchlist } from "@/context/WatchlistContext";

interface HeroBannerProps {
  featuredMovies: Movie[];
  onOpenModal?: (movie: Movie) => void;
}

function HeroBannerComponent({ featuredMovies, onOpenModal }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const isVisibleRef = useRef(true);
  const touchStartXRef = useRef<number | null>(null);
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const moviesList = featuredMovies.length > 0 ? featuredMovies : [];
  const currentMovie = moviesList[currentIndex] || moviesList[0];

  const inWatchlist = currentMovie ? isInWatchlist(currentMovie.id) : false;

  // Pause auto-rotation whenever the hero is scrolled out of view
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto rotate spotlight every 10 seconds only while visible and tab is active
  useEffect(() => {
    if (moviesList.length <= 1) return;
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!isVisibleRef.current) return;
      setCurrentIndex((prev) => (prev + 1) % Math.min(moviesList.length, 6));
    }, 10000);
    return () => clearInterval(timer);
  }, [moviesList.length]);

  if (!currentMovie) return null;

  const slideCount = Math.min(moviesList.length, 6);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || slideCount <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 48) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
  };

  const hasRating = typeof currentMovie.imdbScore === "number" && currentMovie.imdbScore > 0;

  return (
    <section
      ref={heroRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[72dvh] sm:h-[76vh] min-h-[510px] sm:min-h-[540px] max-h-[780px] overflow-hidden bg-[#080506] select-none group/hero"
    >
      {/* Background Cinematic Backdrop positioned toward the right (w1280 saves ~80% vs /original/) */}
      <div className="absolute inset-0">
        <CinovaImage
          src={currentMovie.backdropUrl || currentMovie.posterUrl}
          alt={currentMovie.title}
          fallbackText={currentMovie.title}
          aspect="custom"
          tmdbSize="w1280"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover object-top sm:object-center lg:object-[72%_20%] opacity-95 sm:opacity-95 lg:opacity-100 transition-transform duration-700 ease-out scale-[1.01] group-hover/hero:scale-[1.03]"
          containerClassName="w-full h-full"
        />

        {/* Soft crimson ambient backlight behind hero artwork */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(620px circle at 68% 36%, rgba(163, 13, 50, 0.25), transparent 65%)",
          }}
        />

        {/* Cinematic Vignettes:
            - Desktop horizontal vignette: protects text contrast without hiding artwork on the right
            - Vertical bottom scrim: ensures title & buttons contrast while leaving artwork vivid on mobile
            - Subtle top vignette: ensures header and status bar clarity */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#080506] via-[#080506]/75 to-transparent w-[80%] lg:w-[65%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/60 via-40% sm:via-[#080506]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080506]/70 via-transparent to-transparent h-24 pointer-events-none" />
      </div>

      {/* Hero Foreground Content */}
      <div
        className="relative h-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-7 sm:pb-20 z-20"
        style={{
          paddingTop: "calc(4.5rem + var(--safe-top, 0px))",
        }}
      >
        <div className="flex items-end justify-between gap-6">
          <div className="w-full max-w-xl lg:max-w-2xl space-y-3 sm:space-y-4 animate-hero-fade" key={currentMovie.id}>
            {/* Small TRENDING NOW Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#160B10]/85 border border-[rgba(155,25,57,0.34)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5F1F3]/90 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
              <span>Trending Now</span>
            </div>

            {/* Featured Title */}
            <h1 className="text-[28px] sm:text-5xl lg:text-[56px] font-black tracking-[-0.025em] text-[#F5F1F3] leading-[1.06] text-shadow-cinova line-clamp-2">
              {currentMovie.title}
            </h1>

            {/* Clean Responsive Synopsis */}
            <p className="text-[13px] sm:text-[15px] text-[#C4BCC1] sm:text-[#AAA0A7] line-clamp-3 leading-relaxed max-w-lg break-words hyphens-none">
              {currentMovie.description || currentMovie.tagline}
            </p>

            {/* Real Metadata Row */}
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs sm:text-[13px] font-medium text-[#AAA0A7]">
              {currentMovie.releaseYear && (
                <span className="tabular-nums text-[#F5F1F3]/90">{currentMovie.releaseYear}</span>
              )}

              {currentMovie.genre?.length > 0 && (
                <>
                  <span className="text-[#746971]">•</span>
                  <span className="text-[#F5F1F3]/90">{currentMovie.genre.slice(0, 3).join(" · ")}</span>
                </>
              )}

              {hasRating && (
                <>
                  <span className="text-[#746971]">•</span>
                  <span className="inline-flex items-center gap-1 text-[#F5F1F3] font-semibold tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#FF385B] text-[#FF385B]" />
                    {currentMovie.imdbScore.toFixed(1)}
                  </span>
                </>
              )}

              {currentMovie.quality && (
                <>
                  <span className="text-[#746971]">•</span>
                  <span className="px-2 py-0.5 rounded bg-[#160B10]/90 border border-[rgba(155,25,57,0.3)] text-[10px] font-semibold tracking-wide text-[#F5F1F3]">
                    {currentMovie.quality}
                  </span>
                </>
              )}
            </div>

            {/* Primary & Secondary Action Buttons (44px+ comfortable touch targets on mobile) */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 pt-1.5">
              <Link
                href={`/watch/${currentMovie.id}`}
                className="flex-1 sm:flex-none min-w-[130px] min-h-[44px] inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] text-[#F5F1F3] font-semibold text-sm transition-all duration-200 shadow-[0_8px_24px_rgba(163,13,50,0.42)] hover:shadow-[0_10px_28px_rgba(225,29,72,0.48)] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-[#F5F1F3] text-[#F5F1F3] ml-0.5" />
                <span>Watch Now</span>
              </Link>

              <button
                type="button"
                onClick={() => toggleWatchlist(currentMovie.id)}
                className={`flex-1 sm:flex-none min-w-[130px] min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm transition-all duration-200 border backdrop-blur-md active:scale-[0.98] ${
                  inWatchlist
                    ? "bg-[#650A20]/55 border-[#E11D48]/55 text-[#F5F1F3]"
                    : "bg-[#160B10]/70 hover:bg-[#1D0C13] border-[rgba(155,25,57,0.42)] hover:border-[#E11D48]/55 text-[#F5F1F3]"
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4 text-[#FF385B]" /> : <Plus className="w-4 h-4" />}
                <span>{inWatchlist ? "In My List" : "Add to List"}</span>
              </button>

              {onOpenModal && (
                <button
                  type="button"
                  onClick={() => onOpenModal(currentMovie)}
                  className="w-11 h-11 rounded-full bg-[#160B10]/70 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.36)] hover:border-[#E11D48]/55 text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center transition-all backdrop-blur-md shrink-0"
                  title="More Details"
                  aria-label={`Details for ${currentMovie.title}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom-Right Carousel Navigation Arrows (matching reference layout) */}
          {moviesList.length > 1 && (
            <div className="hidden sm:flex items-center gap-2.5 pb-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-[#10080C]/80 hover:bg-[#650A20]/85 border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48]/60 text-[#F5F1F3] flex items-center justify-center transition-all duration-200 backdrop-blur-md"
                aria-label="Previous Featured Title"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-[#10080C]/80 hover:bg-[#650A20]/85 border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48]/60 text-[#F5F1F3] flex items-center justify-center transition-all duration-200 backdrop-blur-md"
                aria-label="Next Featured Title"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Subtle Slide Indicators */}
        {moviesList.length > 1 && (
          <div className="flex items-center gap-2 mt-6">
            {moviesList.slice(0, 6).map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex
                  ? "w-8 bg-[#E11D48]"
                  : "w-2.5 bg-[#746971]/45 hover:bg-[#AAA0A7]"
                  }`}
                aria-label={`Go to slide ${idx + 1}: ${item.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const HeroBanner = memo(HeroBannerComponent);
export default HeroBanner;
