"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles, Heart } from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { Song } from "@/types/music";
import { MAINSTREAM_TRACKS } from "@/lib/api/mainstream-client";

interface MusicHeroBannerProps {
  tracks?: Song[];
}

export default function MusicHeroBanner({ tracks }: MusicHeroBannerProps) {
  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite, togglePlay } = useMusic();
  const [activeSlide, setActiveSlide] = useState(0);
  const heroTracks = (tracks && tracks.length > 0) ? tracks : MAINSTREAM_TRACKS;
  const [isPaused, setIsPaused] = useState(false);

  // Automatic carousel rotation
  useEffect(() => {
    if (heroTracks.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroTracks.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [heroTracks.length, isPaused]);

  const currentHeroTrack = heroTracks[activeSlide] || heroTracks[0];

  if (!currentHeroTrack) {
    return null;
  }

  const isCurrent = currentTrack?.id === currentHeroTrack.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isFav = isFavorite(currentHeroTrack.id);

  const handlePlayHero = () => {
    if (isCurrent && currentHeroTrack.audioUrl) {
      togglePlay();
    } else {
      playTrack(currentHeroTrack, heroTracks);
    }
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? heroTracks.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroTracks.length);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0307] border border-[rgba(155,25,57,0.34)] shadow-[0_20px_60px_rgba(0,0,0,0.85)] min-h-[260px] sm:min-h-[320px] md:min-h-[360px] flex items-end sm:items-center select-none"
    >
      {/* 1. Real 1080p Official Music Video Background Artwork */}
      <div className="absolute inset-0 z-0">
        <Image
          src={currentHeroTrack.coverUrl}
          alt={currentHeroTrack.title}
          fill
          priority
          className="object-cover object-center sm:object-right scale-100 transition-all duration-700"
          sizes="(max-width: 768px) 100vw, 70vw"
        />

        {/* Cinematic Vignette Overlays matching reference image */}
        {/* Left Dark Gradient for Typography Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0307] via-[#0A0307]/85 to-transparent sm:via-55% to-95%" />

        {/* Bottom & Top Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0307] via-transparent to-[#0A0307]/40" />

        {/* Subtle Brand Maroon Radial Accent */}
        <div
          className="absolute -left-12 -top-12 w-96 h-96 rounded-full bg-[#E11D48]/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 2. Hero Content (Text, Badge, Play Action) */}
      <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 flex flex-col justify-end sm:justify-center items-start space-y-3 max-w-xl">
        {/* Trending Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#650A20]/60 border border-[#E11D48]/50 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF385B] animate-ping" />
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-white drop-shadow-sm">
            Trending Now
          </span>
        </div>

        {/* Large Cinematic Title */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {currentHeroTrack.title}
        </h2>

        {/* Artist Name & Movie / Album */}
        <p className="text-xs sm:text-sm md:text-base font-medium text-white/80 drop-shadow-md">
          {currentHeroTrack.artist}
          {currentHeroTrack.album && (
            <span className="text-[#AAA0A7] text-xs font-normal ml-2 hidden sm:inline">
              • {currentHeroTrack.album}
            </span>
          )}
        </p>

        {/* Play Now Button & Favorite */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePlayHero}
            className="flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#FF385B] to-[#E11D48] hover:from-[#FF4D6D] hover:to-[#F43F5E] text-white font-extrabold text-xs sm:text-sm shadow-[0_6px_25px_rgba(225,29,72,0.5)] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isCurrentPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white text-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                <span>Play Now</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(currentHeroTrack.id, currentHeroTrack)}
            className="p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 backdrop-blur-md text-white transition-all hover:scale-105"
            title={isFav ? "In My List" : "Add to My List"}
            aria-label="Add to My List"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-[#E11D48] text-[#E11D48]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. Carousel Navigation & Pagination Dots (Bottom-Right, exactly like reference) */}
      <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-20 flex items-center gap-3">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
          {heroTracks.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all rounded-full ${
                activeSlide === idx
                  ? "w-4 h-1.5 bg-[#FF385B]"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous trending track"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-[#E11D48] border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next trending track"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-[#E11D48] border border-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
