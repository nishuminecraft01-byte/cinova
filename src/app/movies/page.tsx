"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Film, Sparkles, Flame, Globe2, ArrowRight, Play } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import WorldwideRail from "@/components/WorldwideRail";
import { useWatchlist } from "@/context/WatchlistContext";
import { GENRES, SORT_OPTIONS } from "@/data/genres";
import { WORLDWIDE_COLLECTIONS } from "@/lib/tmdb-worldwide";
import { getSyncAvailability } from "@/lib/video-sources";
import { Movie } from "@/types/movie";

const LANGUAGES_LIST = [
  "All",
  "English",
  "Hindi",
  "Telugu",
  "Kannada",
  "Tamil",
  "Japanese",
  "Korean",
  "Spanish",
  "French",
  "German",
];

function MoviesContent() {
  const { movies } = useWatchlist();
  const searchParams = useSearchParams();
  const initialIndustry = searchParams?.get("industry") || "all";

  const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedIndustry, selectedGenre, selectedLanguage, selectedSort]);

  // Filter feature films
  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => m.type !== "series")
      .filter((m) => {
        if (selectedIndustry === "all") return true;
        if (selectedIndustry === "playable") {
          return getSyncAvailability(m.id, m) === "Available";
        }
        if (selectedIndustry === "hollywood") {
          return m.industry === "hollywood" || (!m.industry && m.language === "English");
        }
        if (selectedIndustry === "bollywood") {
          return (
            m.industry === "bollywood" ||
            m.language === "Hindi" ||
            m.language === "Telugu" ||
            m.language === "Kannada" ||
            m.language === "Tamil"
          );
        }
        if (selectedIndustry === "anime") {
          return m.industry === "anime" || m.genre.includes("Animation") || m.language === "Japanese";
        }
        return true;
      })
      .filter((m) => (selectedGenre === "All" ? true : m.genre.includes(selectedGenre)))
      .filter((m) =>
        selectedLanguage === "All"
          ? true
          : m.language.toLowerCase() === selectedLanguage.toLowerCase()
      )
      .sort((a, b) => {
        if (selectedSort === "newest") return b.releaseYear - a.releaseYear;
        if (selectedSort === "rating") return b.imdbScore - a.imdbScore;
        if (selectedSort === "title") return a.title.localeCompare(b.title);
        return b.views - a.views;
      });
  }, [movies, selectedIndustry, selectedGenre, selectedLanguage, selectedSort]);

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-[3px] h-6 bg-[#E11D48] rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3] tracking-tight flex items-center gap-2">
            <span>Explore Feature Films</span>
          </h1>
        </div>
        <p className="text-sm text-[#AAA0A7] max-w-2xl">
          Stream Hollywood blockbusters, Bollywood superhits, and Japanese anime masterpieces in 4K UHD with Dolby Atmos and multi-server redundancy.
        </p>
      </div>

      {/* Worldwide TMDB Discovery Strip */}
      <div className="mb-5 p-3.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5F1F3]">
            <Globe2 className="w-4 h-4 text-[#FF385B]" />
            <span>Discover Worldwide Movies (TMDB)</span>
          </div>
          <Link
            href="/search?type=movie"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF385B] hover:text-[#F5F1F3] transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="cinova-carousel-track flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {WORLDWIDE_COLLECTIONS.filter((c) => c.id !== "all").map((col) => (
            <Link
              key={col.id}
              href={`/search?collection=${col.id}&type=movie`}
              className="px-3 py-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] hover:border-[#E11D48]/50 text-[11px] font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] whitespace-nowrap transition-colors"
            >
              {col.shortLabel}
            </Link>
          ))}
        </div>
      </div>

      {/* Industry Tabs (Hollywood, Bollywood, Anime, Playable, All) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {[
          { id: "all", label: "All Cinema", icon: Globe2 },
          { id: "playable", label: "Stream Ready on CINOVA", icon: Play, isEmerald: true },
          { id: "hollywood", label: "Hollywood Blockbusters", icon: Film },
          { id: "bollywood", label: "Bollywood & Desi", icon: Flame },
          { id: "anime", label: "Anime Masterpieces", icon: Sparkles },
        ].map(({ id, label, icon: Icon, isEmerald }) => (
          <button
            key={id}
            onClick={() => setSelectedIndustry(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${selectedIndustry === id
              ? isEmerald
                ? "bg-gradient-to-r from-emerald-800 to-emerald-600 border-emerald-500/50 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                : "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3] shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
              : isEmerald
                ? "bg-[#0A1A12] text-emerald-400 hover:text-white hover:bg-[#0E2A1D] border-emerald-500/30"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.22)]"
              }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isEmerald && selectedIndustry !== id ? "text-emerald-400" : ""}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Filter and Sorting Controls Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Genre Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedGenre("All")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${selectedGenre === "All"
              ? "bg-[#A30D32] border-[#E11D48]/50 text-[#F5F1F3]"
              : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
              }`}
          >
            All Genres
          </button>
          {GENRES.slice(0, 8).map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${selectedGenre === genre
                ? "bg-[#A30D32] border-[#E11D48]/50 text-[#F5F1F3]"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
                }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-1.5 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
          >
            {LANGUAGES_LIST.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "All Languages" : l}
              </option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-1.5 text-xs text-[#FF385B] font-semibold focus:outline-none focus:border-[#E11D48]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Count & Status */}
      <div className="flex items-center justify-between text-xs text-[#AAA0A7] mb-4">
        <span>
          Showing {Math.min(visibleCount, filteredMovies.length)} of {filteredMovies.length} movies
        </span>
        <span className="text-[#FF385B] font-semibold uppercase tracking-wider">
          {selectedIndustry !== "all" ? selectedIndustry : "All Genres"}
        </span>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {filteredMovies.slice(0, visibleCount).map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            aspect="landscape"
            fluid
            onOpenModal={(m) => setModalMovie(m)}
          />
        ))}
      </div>

      {visibleCount < filteredMovies.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredMovies.length))}
            className="px-6 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] hover:border-[#E11D48] text-[#F5F1F3] text-xs font-semibold transition-all shadow-md active:scale-95"
          >
            Load More Movies ({filteredMovies.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filteredMovies.length === 0 && (
        <div className="text-center py-20 text-[#AAA0A7]">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-35 text-[#E11D48]" />
          <p className="text-lg font-semibold text-[#F5F1F3]">No movies found</p>
          <p className="text-xs text-[#AAA0A7] mt-1">Try resetting your filters or selecting All Cinema.</p>
        </div>
      )}

      {/* Live Worldwide Movie Collections (TMDB) */}
      <div className="mt-12 pt-8 border-t border-[rgba(155,25,57,0.2)] -mx-4 sm:-mx-6 lg:-mx-8 space-y-4">
        <WorldwideRail feedId="blockbuster-movies" title="Worldwide Blockbuster Movies" badge="TMDB Live" exploreHref="/search?feed=blockbuster-movies" aspect="poster" />
        <WorldwideRail feedId="latest-releases" title="Latest Theatrical Releases" badge="Now Playing" exploreHref="/search?feed=latest-releases" aspect="landscape" />
        <WorldwideRail feedId="upcoming-movies" title="Upcoming Movies" badge="Coming Soon" exploreHref="/search?feed=upcoming-movies" aspect="poster" />
        <WorldwideRail feedId="bollywood-hits" title="Bollywood Hits" badge="Hindi" exploreHref="/search?collection=bollywood&type=movie" aspect="poster" />
        <WorldwideRail feedId="south-indian" title="South Indian Cinema" badge="Tamil · Telugu · Malayalam · Kannada" exploreHref="/search?collection=south-indian&type=movie" aspect="poster" />
        <WorldwideRail feedId="marathi-movies" title="Marathi Movies" badge="Marathi" exploreHref="/search?collection=marathi&type=movie" aspect="poster" />
        <WorldwideRail feedId="international-cinema" title="International Cinema" badge="World Film" exploreHref="/search?feed=international-cinema" aspect="poster" />
      </div>

      {/* Detail Modal */}
      <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080506] pt-28 text-center text-[#AAA0A7]">Loading catalog...</div>}>
      <MoviesContent />
    </Suspense>
  );
}
