export const runtime = 'edge';

"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tv, Sparkles, Flame, Globe2, Film, ArrowRight, Play } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import WorldwideRail from "@/components/WorldwideRail";
import { useWatchlist } from "@/context/WatchlistContext";
import { GENRES, SORT_OPTIONS } from "@/data/genres";
import { WORLDWIDE_COLLECTIONS } from "@/lib/tmdb-worldwide";
import { getSyncAvailability } from "@/lib/video-sources";
import { Movie } from "@/types/movie";

function SeriesContent() {
  const { movies } = useWatchlist();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  const seriesList = useMemo(() => {
    return movies
      .filter((m) => m.type === "series")
      .filter((s) => {
        if (selectedCategory === "all") return true;
        if (selectedCategory === "playable") {
          return getSyncAvailability(s.id, s) === "Available";
        }
        if (selectedCategory === "hollywood") {
          return s.industry === "hollywood" || (!s.industry && s.language === "English");
        }
        if (selectedCategory === "anime") {
          return s.industry === "anime" || s.genre.includes("Animation") || s.language === "Japanese";
        }
        if (selectedCategory === "desi") {
          return s.industry === "bollywood" || s.language === "Hindi";
        }
        if (selectedCategory === "kdrama") {
          return s.industry === "k-drama" || s.language === "Korean";
        }
        if (selectedCategory === "global") {
          return s.industry === "global" || (s.language !== "English" && s.language !== "Hindi");
        }
        return true;
      })
      .filter((s) => (selectedGenre === "All" ? true : s.genre.includes(selectedGenre)))
      .sort((a, b) => {
        if (selectedSort === "newest") return b.releaseYear - a.releaseYear;
        if (selectedSort === "rating") return b.imdbScore - a.imdbScore;
        if (selectedSort === "title") return a.title.localeCompare(b.title);
        return b.views - a.views;
      });
  }, [movies, selectedCategory, selectedGenre, selectedSort]);

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-[3px] h-6 bg-[#E11D48] rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3] tracking-tight flex items-center gap-2">
            <span>TV Shows &amp; Web Series</span>
          </h1>
        </div>
        <p className="text-sm text-[#AAA0A7] max-w-2xl">
          Binge award-winning drama sagas, anime seasons, mystery thrillers, and exclusive global television series.
        </p>
      </div>

      {/* Worldwide TMDB Series Discovery Strip */}
      <div className="mb-5 p-3.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5F1F3]">
            <Globe2 className="w-4 h-4 text-[#FF385B]" />
            <span>Discover Worldwide TV Series &amp; Dramas (TMDB)</span>
          </div>
          <Link
            href="/search?type=tv"
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
              href={`/search?collection=${col.id}&type=tv`}
              className="px-3 py-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] hover:border-[#E11D48]/50 text-[11px] font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] whitespace-nowrap transition-colors"
            >
              {col.shortLabel}
            </Link>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {[
          { id: "all", label: "All Series", icon: Globe2 },
          { id: "playable", label: "Stream Ready on CINOVA", icon: Play, isEmerald: true },
          { id: "hollywood", label: "Western Prestige TV", icon: Tv },
          { id: "anime", label: "Anime Series", icon: Sparkles },
          { id: "desi", label: "Indian Web Series", icon: Flame },
          { id: "kdrama", label: "K-Dramas", icon: Film },
        ].map(({ id, label, icon: Icon, isEmerald }) => (
          <button
            key={id}
            onClick={() => setSelectedCategory(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
              selectedCategory === id
                ? isEmerald
                  ? "bg-gradient-to-r from-emerald-800 to-emerald-600 border-emerald-500/50 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3] shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
                : isEmerald
                ? "bg-[#0A1A12] text-emerald-400 hover:text-white hover:bg-[#0E2A1D] border-emerald-500/30"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.22)]"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isEmerald && selectedCategory !== id ? "text-emerald-400" : ""}`} />
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
          {GENRES.slice(1, 9).map((genre) => (
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

        {/* Sort Selector */}
        <div className="flex items-center gap-3">
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
        <span>Showing {seriesList.length} shows</span>
        <span className="text-[#FF385B] font-semibold uppercase tracking-wider">
          {selectedCategory !== "all" ? selectedCategory : "All Series"}
        </span>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {seriesList.map((series) => (
          <MovieCard
            key={series.id}
            movie={series}
            aspect="landscape"
            fluid
            onOpenModal={(m) => setModalMovie(m)}
          />
        ))}
      </div>

      {seriesList.length === 0 && (
        <div className="text-center py-20 text-[#AAA0A7]">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-35 text-[#E11D48]" />
          <p className="text-lg font-semibold text-[#F5F1F3]">No series found</p>
          <p className="text-xs text-[#AAA0A7] mt-1">Try resetting your filters or selecting All Series.</p>
        </div>
      )}

      {/* Live Worldwide TV Series Collections (TMDB) */}
      <div className="mt-12 pt-8 border-t border-[rgba(155,25,57,0.2)] -mx-4 sm:-mx-6 lg:-mx-8 space-y-4">
        <WorldwideRail feedId="popular-tv" title="Popular TV Shows Worldwide" badge="TMDB Live" exploreHref="/search?feed=popular-tv" aspect="landscape" />
        <WorldwideRail feedId="trending-tv" title="Trending TV Shows" badge="This Week" exploreHref="/search?feed=trending-tv" aspect="poster" />
        <WorldwideRail feedId="top-rated-tv" title="Top Rated Series" badge="Prestige TV" exploreHref="/search?feed=top-rated-tv" aspect="poster" />
        <WorldwideRail feedId="korean-dramas" title="Korean Dramas" badge="K-Drama" exploreHref="/search?collection=korean&type=tv" aspect="poster" />
        <WorldwideRail feedId="anime-collection" title="Anime Collection" badge="Japan" exploreHref="/search?type=anime" aspect="landscape" />
      </div>

      {/* Detail Modal */}
      {modalMovie && <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />}
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080506] pt-28 text-center text-[#AAA0A7]">Loading series catalog...</div>}>
      <SeriesContent />
    </Suspense>
  );
}
