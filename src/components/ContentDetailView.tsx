"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Globe,
  Share2,
  Tv,
  Film,
  Sparkles,
  Calendar,
  Volume2,
  Layers,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { getStreamingServers } from "@/lib/streaming-servers";
import { getSyncAvailability } from "@/lib/video-sources";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import TrailerModal from "@/components/TrailerModal";
import WhereToWatch from "@/components/WhereToWatch";
import AdSlot from "@/components/monetization/AdSlot";
import CinovaImage from "@/components/CinovaImage";
import { CountryWatchProviders } from "@/lib/tmdb-worldwide";
import { Movie } from "@/types/movie";

interface ContentDetailViewProps {
  movie: Movie;
  typeLabel: "Movie" | "Series" | "Anime";
}

export default function ContentDetailView({ movie, typeLabel }: ContentDetailViewProps) {
  const router = useRouter();
  const { toggleWatchlist, isInWatchlist, movies } = useWatchlist();
  const inList = isInWatchlist(movie.id);

  const availability = getSyncAvailability(movie.id, movie);
  const isPlayable = availability === "Available";
  const [showTrailer, setShowTrailer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  const servers = getStreamingServers(movie, selectedSeason, 1);
  const [watchProviders, setWatchProviders] = useState<Record<string, CountryWatchProviders> | null>(null);

  useEffect(() => {
    if (!movie.tmdbId) return;
    const mediaType = movie.type === "series" ? "tv" : "movie";
    fetch(`/api/tmdb/details/${mediaType}/${movie.tmdbId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.watchProviders) {
          setWatchProviders(json.data.watchProviders);
        }
      })
      .catch(() => {});
  }, [movie.tmdbId, movie.type]);

  // Related & Similar titles based on genre or industry
  const relatedMovies = movies
    .filter((m) => m.id !== movie.id)
    .filter(
      (m) =>
        m.genre.some((g) => movie.genre.includes(g)) ||
        m.industry === movie.industry ||
        m.language === movie.language
    )
    .slice(0, 6);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isSeries = movie.type === "series" || !!movie.seasons;

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3]">
      {/* 1. Cinematic Hero Billboard Backdrop */}
      <div className="relative w-full min-h-[480px] sm:min-h-[560px] lg:h-[75vh] overflow-hidden bg-[#080506] flex flex-col justify-between pt-20 pb-10 sm:pt-24 sm:pb-12">
        <div className="absolute inset-0">
          <CinovaImage
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fallbackText={movie.title}
            aspect="custom"
            tmdbSize="w1280"
            loading="eager"
            className="w-full h-full object-cover opacity-75 scale-105 animate-fade-in"
            containerClassName="w-full h-full"
          />

          {/* Multi-stop Cinematic Vignette - Dark Maroon */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080506] via-[#080506]/78 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/60 sm:via-[#080506]/35 to-[#080506]/45" />
        </div>

        {/* Accessible Back Button */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-full bg-[#10080C]/85 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] text-xs font-semibold text-[#F5F1F3] transition-colors backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF385B]" />
            <span>Back</span>
          </button>
        </div>

        {/* Hero Meta Overlay */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
          <div className="max-w-2xl space-y-3.5 sm:space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] text-[11px] font-bold tracking-wider uppercase shadow-[0_4px_14px_rgba(163,13,50,0.4)]">
                {typeLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  isPlayable
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    : "bg-[#160B10] text-[#AAA0A7] border-[rgba(155,25,57,0.3)]"
                }`}
              >
                {isPlayable ? "Stream Ready" : "Explore Mode"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.3)] text-[11px] font-semibold">
                {movie.quality}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#160B10] text-[#AAA0A7] border border-[rgba(155,25,57,0.25)] text-[11px] font-semibold">
                {movie.audioSpecs}
              </span>
              <span className="text-[#FF385B] font-semibold text-xs sm:text-sm">
                {movie.matchPercentage || 98}% Match
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[28px] sm:text-5xl lg:text-6xl font-black text-[#F5F1F3] tracking-tight leading-[1.06] text-shadow-cinova">
              {movie.title}
            </h1>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs sm:text-sm text-[#AAA0A7] font-medium">
                Original Title: <span className="text-[#F5F1F3] font-semibold">{movie.originalTitle}</span>
              </p>
            )}

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-sm sm:text-base text-[#AAA0A7] italic font-medium">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3 pt-2 flex-wrap">
              {isPlayable ? (
                <Link
                  href={`/watch/${movie.id}`}
                  className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] text-[#F5F1F3] font-semibold text-sm transition-all shadow-[0_8px_24px_rgba(163,13,50,0.42)] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-[#F5F1F3]" />
                  <span>{movie.type === "series" ? "Play Series" : "Watch Now"}</span>
                </Link>
              ) : movie.trailerUrl ? (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-sm transition-all shadow-[0_8px_24px_rgba(163,13,50,0.42)] active:scale-95"
                >
                  <Film className="w-4 h-4 text-[#F5F1F3]" />
                  <span>Watch Trailer</span>
                </button>
              ) : (
                <div className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.35)] text-[#AAA0A7] text-xs font-semibold">
                  <Info className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span>Catalog Explore Mode</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleWatchlist(movie.id)}
                className={`flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all border ${inList
                  ? "bg-[#650A20]/55 border-[#E11D48]/60 text-[#F5F1F3]"
                  : "bg-[#160B10]/85 hover:bg-[#1D0C13] border-[rgba(155,25,57,0.36)] text-[#F5F1F3]"
                  }`}
              >
                {inList ? <Check className="w-4 h-4 text-[#FF385B]" /> : <Plus className="w-4 h-4" />}
                <span>{inList ? "In My List" : "Add to List"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-11 h-11 rounded-full bg-[#160B10]/85 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.32)] text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center transition-all shrink-0"
                title="Share link"
                aria-label="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {copiedLink && (
                <span className="text-xs text-[#FF385B] font-semibold animate-fade-in">
                  Link copied to clipboard!
                </span>
              )}
            </div>

            {!isPlayable && (
              <div className="max-w-xl flex items-start gap-3 p-3.5 rounded-xl bg-[#10080C]/90 border border-[rgba(155,25,57,0.32)] backdrop-blur-md mt-3">
                <Info className="w-4 h-4 text-[#FF385B] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-[#F5F1F3] flex items-center gap-2">
                    <span>Worldwide Entertainment Discovery</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-[10px] uppercase font-bold text-[#FF385B]">
                      Discovery Mode
                    </span>
                  </p>
                  <p className="text-[#AAA0A7] leading-relaxed">
                    This title is available to explore. Watch the official high-definition trailer or check legal streaming platforms for verified regional availability.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Detailed Metadata & Grid Section */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Overview & Episodes */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-4 text-xs sm:text-sm text-[#AAA0A7] border-b border-[rgba(155,25,57,0.22)] pb-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#F5F1F3] font-semibold">
                <Star className="w-4 h-4 fill-[#FF385B] text-[#FF385B]" />
                {movie.imdbScore || 8.5} Rating
              </span>
              <span className="text-[#746971]">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {movie.duration} mins
              </span>
              <span className="text-[#746971]">•</span>
              <span>{movie.releaseYear}</span>
              <span className="text-[#746971]">•</span>
              <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.28)] bg-[#160B10] text-[11px] font-mono text-[#F5F1F3]">
                {movie.rating}
              </span>
              <span className="text-[#746971]">•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {movie.language}
              </span>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4 bg-[#E11D48] rounded-full" />
                <h2 className="text-lg font-bold text-[#F5F1F3]">Storyline &amp; Synopsis</h2>
              </div>
              <p className="text-sm sm:text-base text-[#AAA0A7] leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Streaming Servers Cluster */}
            {servers.length > 0 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAA0A7] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>Connected Playback Source</span>
                  </h3>
                  <span className="text-[11px] text-[#FF385B] font-semibold">
                    {servers.length} {servers.length === 1 ? "Source Ready" : "Sources Active"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {servers.map((s) => (
                    <Link
                      key={s.id}
                      href={`/watch/${movie.id}?server=${s.id}`}
                      className="min-h-[44px] p-3 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/60 transition-all flex items-center justify-between text-xs gap-2"
                    >
                      <span className="font-semibold text-[#F5F1F3] truncate">{s.name}</span>
                      <span className="text-[10px] text-[#FF385B] font-semibold px-1.5 py-0.5 bg-[#650A20]/45 rounded border border-[rgba(155,25,57,0.3)] shrink-0">
                        {s.badge}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* TV Series / Anime Seasons & Episode Selector */}
            {isSeries && movie.seasons && movie.seasons.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[rgba(155,25,57,0.22)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3] flex items-center gap-2">
                    <Tv className="w-5 h-5 text-[#E11D48]" />
                    <span>Episodes &amp; Seasons</span>
                  </h3>

                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))}
                    className="bg-[#160B10] border border-[rgba(155,25,57,0.28)] rounded-lg px-3 py-1.5 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
                  >
                    {movie.seasons.map((s) => (
                      <option key={s.seasonNumber} value={s.seasonNumber}>
                        {s.title} ({s.episodes.length} Episodes)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {movie.seasons
                    .find((s) => s.seasonNumber === selectedSeason)
                    ?.episodes.map((ep) => (
                      <Link
                        key={ep.episodeNumber}
                        href={`/watch/${movie.id}?season=${selectedSeason}&ep=${ep.episodeNumber}`}
                        className="group flex items-center gap-4 p-3 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/60 transition-all"
                      >
                        <span className="text-base font-black text-[#AAA0A7] w-6 text-center">
                          {ep.episodeNumber}
                        </span>
                        <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-[#080506] flex-shrink-0 border border-[rgba(155,25,57,0.22)]">
                          <CinovaImage
                            src={ep.thumbnailUrl || movie.backdropUrl}
                            alt={ep.title}
                            fallbackText={ep.title}
                            aspect="backdrop"
                            tmdbSize="w500"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 fill-[#F5F1F3] text-[#F5F1F3]" />
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#F5F1F3] group-hover:text-[#FF385B] transition-colors truncate">
                            {ep.title}
                          </h4>
                          <p className="text-[11px] text-[#AAA0A7] line-clamp-1 mt-0.5">
                            {ep.description}
                          </p>
                        </div>
                        <span className="text-xs text-[#AAA0A7] flex-shrink-0 font-mono">
                          {ep.duration}m
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Cast, Directors & Details Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] space-y-4 text-xs">
              <div>
                <span className="text-[#746971] uppercase tracking-wider font-semibold text-[10px] block mb-1.5">
                  Genres
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {movie.genre.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.28)] font-medium text-[11px]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {movie.directors && movie.directors.length > 0 && (
                <div>
                  <span className="text-[#746971] uppercase tracking-wider font-semibold text-[10px] block mb-1">
                    Director
                  </span>
                  <p className="text-[#F5F1F3] font-semibold">{movie.directors.join(", ")}</p>
                </div>
              )}

              <div>
                <span className="text-[#746971] uppercase tracking-wider font-semibold text-[10px] block mb-1">
                  Audio &amp; Subtitles
                </span>
                <p className="text-[#AAA0A7]">
                  <span className="text-[#F5F1F3] font-semibold">Audio:</span> {movie.availableLanguages.join(", ")}
                </p>
                <p className="text-[#AAA0A7] mt-1">
                  <span className="text-[#F5F1F3] font-semibold">Subtitles:</span> {movie.subtitles.join(", ")}
                </p>
              </div>

              <div>
                <span className="text-[#746971] uppercase tracking-wider font-semibold text-[10px] block mb-2">
                  Featured Cast
                </span>
                <div className="space-y-2.5">
                  {movie.cast.slice(0, 5).map((actor, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] flex items-center justify-center font-bold text-xs text-[#FF385B] overflow-hidden flex-shrink-0">
                        {actor.avatarUrl ? (
                          <CinovaImage src={actor.avatarUrl} alt={actor.name} fallbackText={actor.name.charAt(0)} aspect="square" className="w-full h-full object-cover" />
                        ) : (
                          actor.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#F5F1F3] font-bold truncate text-[11px]">{actor.name}</p>
                        <p className="text-[#AAA0A7] text-[10px] truncate">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Where to Watch — Streaming Availability & Direct Provider Links */}
        {movie.tmdbId && (
          <div className="pt-6 border-t border-[rgba(155,25,57,0.22)]">
            <WhereToWatch
              watchProviders={watchProviders}
              title={movie.title}
              mediaType={movie.type === "series" ? "tv" : "movie"}
              tmdbId={movie.tmdbId}
            />
          </div>
        )}

        {/* Sponsored Slot */}
        <AdSlot slot="detail-sidebar" className="my-6" />

        {/* 3. More Like This / Recommended Content Grid */}
        {relatedMovies.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-[rgba(155,25,57,0.22)]">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
              <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
                More Like This
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {relatedMovies.map((rel) => (
                <MovieCard
                  key={rel.id}
                  movie={rel}
                  aspect="landscape"
                  fluid
                  onOpenModal={(m) => setModalMovie(m)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        trailerKey={movie.trailerUrl || null}
        title={movie.title}
        trailerName="Official Trailer"
        mediaType={movie.type === "series" ? "tv" : "movie"}
      />

      {modalMovie && <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />}
    </div>
  );
}
