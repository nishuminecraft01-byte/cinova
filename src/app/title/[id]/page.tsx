export const runtime = 'edge';

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Film,
  Tv,
  Share2,
  Sparkles,
  ArrowLeft,
  X,
  Volume2,
} from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import MovieRow from "@/components/MovieRow";
import CinovaImage from "@/components/CinovaImage";
import { formatDuration } from "@/lib/utils";

export default function TitleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = (params?.id as string) || "";
  const { getMovieById, toggleWatchlist, isInWatchlist, movies } = useWatchlist();

  const [activeSeason, setActiveSeason] = useState(1);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const movie = getMovieById(movieId);

  if (!movie) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-[#080506] text-[#F5F1F3]">
        <h1 className="text-3xl font-black text-[#F5F1F3] mb-2">Title Not Found</h1>
        <p className="text-sm text-[#AAA0A7] mb-6">
          The requested movie or series could not be found in the CINOVA vault.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-sm transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);

  // Related movies
  const relatedMovies = movies
    .filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g)))
    .slice(0, 8);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#080506] text-[#F5F1F3] pb-20">
      {/* 1. Backdrop Hero Section */}
      <div className="relative w-full h-[65vh] min-h-[480px] max-h-[720px] overflow-hidden bg-[#080506]">
        <CinovaImage
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          fallbackText={movie.title}
          aspect="custom"
          className="w-full h-full object-cover object-center opacity-70"
          containerClassName="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080506] via-[#080506]/78 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/40 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-20 left-4 sm:left-8 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10080C]/85 border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] backdrop-blur-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* 2. Main Content Info Area (overlapping hero) */}
      <div className="relative -mt-44 sm:-mt-60 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Column: Poster & Quick Action Card */}
          <div className="w-56 sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden border border-[rgba(155,25,57,0.3)] shadow-2xl relative bg-[#160B10] group">
              <CinovaImage
                src={movie.posterUrl}
                alt={movie.title}
                fallbackText={movie.title}
                aspect="poster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] block shadow-[0_0_8px_#E11D48]" />
              </div>
            </div>

            {/* Quick Watch & Trailer Buttons below poster */}
            <div className="mt-4 space-y-2.5">
              <Link
                href={`/watch/${movie.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] text-[#F5F1F3] font-semibold text-sm shadow-[0_8px_24px_rgba(163,13,50,0.4)] transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-[#F5F1F3]" />
                Watch Now
              </Link>

              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#160B10] hover:bg-[#1D0C13] text-[#F5F1F3] border border-[rgba(155,25,57,0.3)] font-semibold text-xs transition-colors"
                >
                  <Film className="w-4 h-4 text-[#FF385B]" />
                  Watch Preview Trailer
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Title, Metadata, Overview, Cast, Specs */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                <span className="text-xs uppercase font-semibold tracking-[0.22em] text-[#FF385B]">
                  {movie.type === "series" ? "CINOVA ORIGINAL SERIES" : "CINOVA SPOTLIGHT"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-[#F5F1F3] tracking-tight leading-tight">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-sm sm:text-base text-[#AAA0A7] font-medium italic mt-1">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Core Stats Row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-[#AAA0A7] pb-3 border-b border-[rgba(155,25,57,0.22)]">
              <span className="text-[#FF385B] font-semibold">{movie.matchPercentage || 98}% Match</span>
              <span className="text-[#746971]">•</span>
              <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.3)] bg-[#160B10] text-[11px] font-mono text-[#F5F1F3]">
                {movie.rating}
              </span>
              <span className="text-[#746971]">•</span>
              <span>{movie.releaseYear}</span>
              <span className="text-[#746971]">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#AAA0A7]" />
                {movie.type === "series" ? `${movie.seasons?.length || 1} Season(s)` : formatDuration(movie.duration)}
              </span>
              <span className="text-[#746971]">•</span>
              <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.3)] bg-[#160B10] text-[10px] text-[#FF385B] font-semibold">
                {movie.quality}
              </span>
              <span className="text-[#746971]">•</span>
              <span className="flex items-center gap-1 text-[#F5F1F3]">
                <Volume2 className="w-3.5 h-3.5 text-[#E11D48]" />
                {movie.audioSpecs}
              </span>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleWatchlist(movie.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  inWatchlist
                    ? "bg-[#650A20]/55 border-[#E11D48]/60 text-[#F5F1F3]"
                    : "bg-[#160B10] border-[rgba(155,25,57,0.32)] text-[#F5F1F3] hover:border-[#E11D48]"
                }`}
              >
                {inWatchlist ? (
                  <>
                    <Check className="w-4 h-4 text-[#FF385B]" />
                    In My List
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to List
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1D0C13] transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#AAA0A7]" />
                {copiedLink ? "Link Copied!" : "Share Title"}
              </button>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#746971]">
                Storyline
              </h3>
              <p className="text-sm sm:text-base text-[#AAA0A7] leading-relaxed max-w-3xl">
                {movie.description}
              </p>
            </div>

            {/* Universe Badge */}
            {movie.franchiseName && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.26)]">
                <Sparkles className="w-4 h-4 text-[#E11D48]" />
                <span className="text-xs text-[#AAA0A7]">
                  Part of the <strong className="text-[#F5F1F3]">{movie.franchiseName}</strong> universe.
                </span>
                <Link
                  href={`/categories?universe=${movie.franchiseId}`}
                  className="ml-auto text-xs text-[#FF385B] font-semibold hover:underline"
                >
                  Explore Saga &rarr;
                </Link>
              </div>
            )}

            {/* Director & Cast Section */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <span className="text-[#746971] block mb-1">
                  Director{movie.directors.length > 1 ? "s" : ""}
                </span>
                <p className="text-sm font-semibold text-[#F5F1F3]">
                  {movie.directors.join(", ") || "CINOVA Studios"}
                </p>
              </div>

              <div>
                <span className="text-[#746971] block mb-1">Starring</span>
                <p className="text-sm font-medium text-[#AAA0A7]">
                  {movie.cast.map((c) => c.name).join(", ")}
                </p>
              </div>

              <div>
                <span className="text-[#746971] block mb-1">Genres</span>
                <p className="text-sm text-[#AAA0A7]">{movie.genre.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[rgba(155,25,57,0.3)]">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/70 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={movie.trailerUrl || movie.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Related Titles */}
      <div className="mt-16">
        <MovieRow
          title="More Like This"
          movies={relatedMovies}
          exploreHref="/movies"
        />
      </div>
    </div>
  );
}
