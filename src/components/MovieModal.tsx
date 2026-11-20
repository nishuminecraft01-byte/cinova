"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ChevronDown,
  Film,
  Star,
  Info,
  AlertCircle,
  Compass,
  ExternalLink,
} from "lucide-react";
import { Movie } from "@/types/movie";
import { useWatchlist } from "@/context/WatchlistContext";
import { formatDuration } from "@/lib/utils";
import { getSyncAvailability } from "@/lib/video-sources";
import CinovaImage from "@/components/CinovaImage";
import TrailerModal from "@/components/TrailerModal";

function extractYouTubeKey(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieModal({ movie, onClose }: MovieModalProps) {
  const { toggleWatchlist, isInWatchlist, movies } = useWatchlist();
  const [isMuted, setIsMuted] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [liked, setLiked] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    if (!movie) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id);
  const availability = getSyncAvailability(movie.id, movie);
  const isPlayable = availability === "Available";
  const trailerKey = extractYouTubeKey(movie.trailerUrl);

  // Recommendations for "More Like This"
  const moreLikeThis = movies
    .filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g)))
    .slice(0, 6);

  const isSeries = movie.type === "series" && movie.seasons && movie.seasons.length > 0;
  const currentSeasonData =
    movie.seasons?.find((s) => s.seasonNumber === selectedSeason) || movie.seasons?.[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={movie.title}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/82 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl min-h-[100dvh] sm:min-h-0 bg-[#10080C] rounded-none sm:rounded-2xl overflow-hidden shadow-2xl my-0 sm:my-8 border-0 sm:border sm:border-[rgba(155,25,57,0.28)] animate-modal-in pb-safe"
      >
        {/* Close Button (fixed on mobile so always reachable while scrolling) */}
        <button
          type="button"
          onClick={onClose}
          className="fixed sm:absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-[#0B0508]/92 hover:bg-[#E11D48] text-[#F5F1F3] flex items-center justify-center transition-colors border border-[rgba(155,25,57,0.38)] shadow-lg"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero Banner */}
        <div className="relative aspect-[16/10] sm:aspect-video min-h-[260px] sm:min-h-0 max-h-[460px] w-full bg-[#080506] overflow-hidden">
          <CinovaImage
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fallbackText={movie.title}
            aspect="custom"
            tmdbSize="w1280"
            className="w-full h-full object-cover object-center"
            containerClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10080C] via-[#10080C]/65 sm:via-[#10080C]/45 to-[#10080C]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10080C]/85 via-transparent to-transparent" />

          {/* Floating Actions on Hero Bottom */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-end justify-between gap-3 z-20">
            <div className="space-y-2.5 sm:space-y-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF385B]">
                  {movie.type === "series" ? "CINOVA ORIGINAL SERIES" : "CINOVA SPOTLIGHT"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isPlayable
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                      : "bg-[#160B10] text-[#AAA0A7] border-[rgba(155,25,57,0.3)]"
                  }`}
                >
                  {isPlayable ? "Stream Ready" : "Explore Mode"}
                </span>
              </div>

              <h2 className="text-xl sm:text-4xl font-black text-[#F5F1F3] drop-shadow-lg tracking-tight leading-tight line-clamp-2 pr-8 sm:pr-0">
                {movie.title}
              </h2>

              <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 pt-0.5">
                {isPlayable ? (
                  <Link
                    href={`/watch/${movie.id}`}
                    onClick={onClose}
                    className="min-h-[42px] flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] text-[#F5F1F3] font-semibold text-sm sm:text-base transition-all shadow-[0_8px_24px_rgba(163,13,50,0.42)] active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-[#F5F1F3] text-[#F5F1F3] ml-0.5" />
                    <span>{isSeries ? "Play Series" : "Watch Now"}</span>
                  </Link>
                ) : (
                  <>
                    {trailerKey && (
                      <button
                        type="button"
                        onClick={() => setShowTrailerModal(true)}
                        className="min-h-[42px] flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-sm sm:text-base transition-all shadow-[0_8px_24px_rgba(163,13,50,0.42)] active:scale-95"
                      >
                        <Film className="w-4 h-4 text-[#F5F1F3]" />
                        <span>Watch Trailer</span>
                      </button>
                    )}
                    <Link
                      href={movie.type === "series" ? `/series/${movie.id}` : `/movie/${movie.id}`}
                      onClick={onClose}
                      className="min-h-[42px] flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#160B10]/95 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48] text-[#F5F1F3] text-xs sm:text-sm font-semibold transition-all"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#FF385B]" />
                      <span>Where to Watch</span>
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => toggleWatchlist(movie.id)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${inWatchlist
                    ? "border-[#E11D48] bg-[#650A20]/60 text-[#FF385B]"
                    : "border-[rgba(155,25,57,0.38)] bg-[#160B10]/85 hover:border-[#E11D48] text-[#F5F1F3]"
                    }`}
                  title={inWatchlist ? "Remove from My List" : "Add to My List"}
                  aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
                >
                  {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLiked(!liked)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${liked
                    ? "border-[#E11D48] bg-[#650A20]/60 text-[#FF385B]"
                    : "border-[rgba(155,25,57,0.38)] bg-[#160B10]/85 hover:border-[#E11D48] text-[#AAA0A7]"
                    }`}
                  title="I like this"
                  aria-label="Like title"
                >
                  <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="hidden sm:flex w-9 h-9 rounded-full border border-[rgba(155,25,57,0.35)] bg-[#0B0508]/80 hover:bg-[#160B10] text-[#F5F1F3] items-center justify-center transition-colors shrink-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {!isPlayable && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#160B10] via-[#12070C] to-[#0D0407] border border-[rgba(155,25,57,0.3)] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#650A20] to-[#160B10] border border-[#E11D48]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-4 h-4 text-[#FF385B]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#F5F1F3] text-sm">Worldwide Entertainment Discovery</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-[10px] uppercase font-bold text-[#FF385B]">
                      Discovery Mode
                    </span>
                  </div>
                  <p className="text-xs text-[#AAA0A7] leading-relaxed">
                    Watch the official high-definition trailer or explore verified legal streaming platforms (Netflix, Prime Video, Disney+ Hotstar, Apple TV) where this title is available in your region.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {trailerKey && (
                  <button
                    type="button"
                    onClick={() => setShowTrailerModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-xs font-bold text-[#F5F1F3] transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(225,29,72,0.35)]"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Watch Trailer</span>
                  </button>
                )}
                <Link
                  href={movie.type === "series" ? `/series/${movie.id}#where-to-watch` : `/movie/${movie.id}#where-to-watch`}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-semibold text-[#F5F1F3] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Where to Watch</span>
                  <ExternalLink className="w-3 h-3 text-[#FF385B]" />
                </Link>
              </div>
            </div>
          )}

          {/* 2-Column Meta & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Left 2 Cols: Stats & Story */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <span className="text-[#FF385B] font-bold">{movie.matchPercentage || 98}% Match</span>
                <span className="text-[#AAA0A7]">{movie.releaseYear}</span>
                <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.28)] text-[11px] text-[#AAA0A7] uppercase font-mono bg-[#160B10]">
                  {movie.rating}
                </span>
                <span className="text-[#AAA0A7]">
                  {movie.type === "series"
                    ? `${movie.seasons?.length || 1} Season${(movie.seasons?.length || 1) > 1 ? "s" : ""}`
                    : formatDuration(movie.duration)}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.28)] text-[10px] text-[#FF385B] font-bold bg-[#160B10]">
                  {movie.quality}
                </span>
                <span className="flex items-center gap-1 text-[#F5F1F3] font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-[#FF385B] text-[#FF385B]" />
                  {movie.imdbScore || 8.5}
                </span>
              </div>

              {movie.tagline && (
                <p className="text-xs sm:text-sm text-[#AAA0A7] italic">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              <p className="text-sm sm:text-base text-[#F5F1F3]/90 leading-relaxed">
                {movie.description}
              </p>

              {movie.franchiseName && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-[#AAA0A7]">Part of Universe:</span>
                  <Link
                    href={`/categories?universe=${movie.franchiseId}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] text-[#FF385B] text-xs font-semibold border border-[rgba(155,25,57,0.28)] hover:border-[#E11D48] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {movie.franchiseName}
                  </Link>
                </div>
              )}
            </div>

            {/* Right 1 Col: Cast & Attributes */}
            <div className="space-y-3 text-xs border-t md:border-t-0 md:border-l border-[rgba(155,25,57,0.22)] pt-4 md:pt-0 md:pl-6 text-[#AAA0A7]">
              <div>
                <span className="text-[#746971] block mb-1">Cast:</span>
                <p className="text-[#F5F1F3]/90 font-medium">
                  {movie.cast.map((c) => c.name).join(", ") || "Ensemble Cast"}
                </p>
              </div>

              <div>
                <span className="text-[#746971] block mb-1">Genres:</span>
                <p className="text-[#F5F1F3]/90 font-medium">{movie.genre.join(", ")}</p>
              </div>

              <div>
                <span className="text-[#746971] block mb-1">Audio &amp; Subtitles:</span>
                <p className="text-[#F5F1F3]/90 font-medium">
                  {movie.availableLanguages?.join(", ") || "English, Hindi, Japanese"}
                </p>
              </div>

              <div>
                <span className="text-[#746971] block mb-1">Maturity Rating:</span>
                <p className="text-[#F5F1F3]/90 font-medium">
                  {movie.rating} — Recommended for general streaming audiences.
                </p>
              </div>
            </div>
          </div>

          {/* Series Episodes List */}
          {isSeries && currentSeasonData && (
            <div className="space-y-4 pt-4 border-t border-[rgba(155,25,57,0.22)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F5F1F3]">Episodes</h3>
                {movie.seasons && movie.seasons.length > 1 && (
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-[#160B10] border border-[rgba(155,25,57,0.28)] rounded-lg px-3 py-1.5 text-xs text-[#F5F1F3] font-semibold focus:outline-none focus:border-[#E11D48]"
                  >
                    {movie.seasons.map((s) => (
                      <option key={s.seasonNumber} value={s.seasonNumber}>
                        Season {s.seasonNumber} ({s.episodes.length} Episodes)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="divide-y divide-[rgba(155,25,57,0.18)]">
                {currentSeasonData.episodes.map((ep) => (
                  <Link
                    key={ep.episodeNumber}
                    href={`/watch/${movie.id}?season=${selectedSeason}&ep=${ep.episodeNumber}`}
                    className="group py-4 flex items-center gap-4 hover:bg-[#160B10] px-3 rounded-xl transition-colors"
                  >
                    <span className="text-xl font-bold text-[#AAA0A7] w-6 text-center">
                      {ep.episodeNumber}
                    </span>
                    <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden bg-[#080506] shrink-0 border border-[rgba(155,25,57,0.22)]">
                      <CinovaImage
                        src={ep.thumbnailUrl || movie.backdropUrl}
                        alt={ep.title}
                        fallbackText={ep.title}
                        aspect="backdrop"
                        tmdbSize="w500"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 fill-[#F5F1F3] text-[#F5F1F3]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#F5F1F3] group-hover:text-[#FF385B] transition-colors truncate">
                          {ep.title}
                        </h4>
                        <span className="text-xs text-[#AAA0A7] shrink-0 font-mono">
                          {ep.duration}m
                        </span>
                      </div>
                      <p className="text-xs text-[#AAA0A7] line-clamp-2 mt-1 leading-relaxed">
                        {ep.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* More Like This (3x3 Card Grid) */}
          {moreLikeThis.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[rgba(155,25,57,0.22)]">
              <h3 className="text-lg font-bold text-[#F5F1F3]">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {moreLikeThis.map((m) => {
                  const mInList = isInWatchlist(m.id);
                  return (
                    <div
                      key={m.id}
                      className="bg-[#160B10] rounded-xl overflow-hidden border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/60 transition-all flex flex-col justify-between"
                    >
                      <Link
                        href={`/watch/${m.id}`}
                        onClick={onClose}
                        className="relative aspect-video w-full bg-[#080506] overflow-hidden group block"
                      >
                        <CinovaImage
                          src={m.backdropUrl || m.posterUrl}
                          alt={m.title}
                          fallbackText={m.title}
                          aspect="backdrop"
                          tmdbSize="w500"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute top-2 right-2 text-[10px] font-mono text-[#F5F1F3] bg-[#0B0508]/85 px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.28)]">
                          {m.duration}m
                        </span>
                      </Link>

                      <div className="p-3 sm:p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] sm:text-xs font-semibold text-[#FF385B]">
                            {m.matchPercentage || 95}% Match
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleWatchlist(m.id)}
                            aria-label={mInList ? `Remove ${m.title} from My List` : `Add ${m.title} to My List`}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-full border border-[rgba(155,25,57,0.3)] hover:border-[#E11D48] flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3] shrink-0"
                          >
                            {mInList ? <Check className="w-3.5 h-3.5 text-[#E11D48]" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <Link
                          href={`/watch/${m.id}`}
                          onClick={onClose}
                          className="block text-xs font-bold text-[#F5F1F3] hover:text-[#FF385B] truncate"
                        >
                          {m.title}
                        </Link>
                        <p className="text-[11px] text-[#AAA0A7] line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="pt-4 border-t border-[rgba(155,25,57,0.22)] space-y-2 text-xs text-[#AAA0A7]">
            <h4 className="text-sm font-bold text-[#F5F1F3]">
              About <span className="text-[#F5F1F3]/90">{movie.title}</span>
            </h4>
            <p>
              <strong className="text-[#F5F1F3]/85">Director:</strong>{" "}
              {movie.directors.join(", ") || "CINOVA Studios"}
            </p>
            <p>
              <strong className="text-[#F5F1F3]/85">Cast:</strong> {movie.cast.map((c) => c.name).join(", ")}
            </p>
            <p>
              <strong className="text-[#F5F1F3]/85">Maturity Rating:</strong> {movie.rating}
            </p>
          </div>
        </div>
      </div>

      {/* Official YouTube Trailer Modal */}
      {trailerKey && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          trailerKey={trailerKey}
          title={movie.title}
          trailerName={`${movie.title} — Official Trailer`}
          mediaType={movie.type === "series" ? "tv" : "movie"}
        />
      )}
    </div>
  );
}
