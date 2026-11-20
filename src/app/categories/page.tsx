"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Compass, Sparkles, ChevronRight, Layers, Trophy, Globe } from "lucide-react";
import { CATEGORIES_SHOWCASE } from "@/data/genres";
import { FRANCHISE_COLLECTIONS } from "@/data/movies";
import { useWatchlist } from "@/context/WatchlistContext";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import CinovaImage from "@/components/CinovaImage";
import CountryLanguageExplorer from "@/components/CountryLanguageExplorer";
import { Movie } from "@/types/movie";

function CategoriesContent() {
  const searchParams = useSearchParams();
  const universeParam = searchParams?.get("universe");
  const catParam = searchParams?.get("id");
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"universes" | "categories" | "worldwide">(
    tabParam === "worldwide" ? "worldwide" : "universes"
  );
  const [selectedCatId, setSelectedCatId] = useState<string>(catParam || "sci-fi");
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(
    universeParam || "mcu"
  );
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  const { movies } = useWatchlist();

  useEffect(() => {
    if (universeParam) {
      setActiveTab("universes");
      setSelectedUniverseId(universeParam);
    }
  }, [universeParam]);

  // Categories mapping
  const activeCategory =
    CATEGORIES_SHOWCASE.find((c) => c.id === selectedCatId) || CATEGORIES_SHOWCASE[0];

  const categoryGenreMap: Record<string, string[]> = {
    hollywood: ["Action", "Sci-Fi", "Adventure", "Drama"],
    bollywood: ["Action", "Drama", "History", "Comedy", "Thriller"],
    anime: ["Animation", "Action", "Fantasy", "Supernatural"],
    series: ["Action", "Drama", "Crime", "Mystery", "Sci-Fi"],
    "sci-fi": ["Sci-Fi", "Cyberpunk"],
    action: ["Action", "Adventure"],
    thriller: ["Thriller", "Mystery"],
    cyberpunk: ["Cyberpunk"],
    animation: ["Animation"],
    drama: ["Drama", "Documentary"],
  };

  const targetGenres = categoryGenreMap[selectedCatId] || ["Sci-Fi"];
  const matchingCatMovies = movies.filter((m) => {
    if (selectedCatId === "hollywood") {
      return (m.industry === "hollywood" || (!m.industry && m.language === "English")) && m.type === "movie";
    }
    if (selectedCatId === "bollywood") {
      return (
        m.industry === "bollywood" ||
        m.language === "Hindi" ||
        m.language === "Telugu" ||
        m.language === "Kannada" ||
        m.language === "Tamil"
      );
    }
    if (selectedCatId === "anime") {
      return m.industry === "anime" || m.genre.includes("Animation") || m.language === "Japanese";
    }
    if (selectedCatId === "series") {
      return m.type === "series";
    }
    return m.genre.some((g) => targetGenres.includes(g));
  });

  // Franchise Universe mapping
  const activeFranchise =
    FRANCHISE_COLLECTIONS.find((f) => f.id === selectedUniverseId) || FRANCHISE_COLLECTIONS[0];

  const matchingUniverseMovies = movies.filter(
    (m) =>
      m.franchiseId === activeFranchise.id ||
      activeFranchise.films.some((f) => f.tmdbId === m.tmdbId || f.id === m.id)
  );

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-[3px] h-6 bg-[#E11D48] rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3] tracking-tight">
            Universes &amp; Collections
          </h1>
        </div>
        <p className="text-sm text-[#AAA0A7] max-w-2xl">
          Browse films and series curated into interconnected cinematic sagas and thematic movements.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center flex-wrap gap-2 mt-6">
          <button
            onClick={() => setActiveTab("universes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
              activeTab === "universes"
                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] border-[#E11D48]/50 shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore Universes (MCU, Nolan, Dune, Anime)</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
              activeTab === "categories"
                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] border-[#E11D48]/50 shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Thematic Genre Vaults</span>
          </button>
          <button
            onClick={() => setActiveTab("worldwide")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
              activeTab === "worldwide"
                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] border-[#E11D48]/50 shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Country &amp; Language Discovery</span>
          </button>
        </div>
      </div>

      {activeTab === "worldwide" ? (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 animate-fade-in">
          <CountryLanguageExplorer />
        </div>
      ) : activeTab === "universes" ? (
        /* Universes Tab */
        <div className="space-y-8 animate-fade-in">
          {/* Universe Selector Cards with Official Saga Thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FRANCHISE_COLLECTIONS.map((franchise) => {
              const isSelected = selectedUniverseId === franchise.id;
              const thumbUrl = franchise.backdropUrl.replace("/t/p/original/", "/t/p/w780/");
              return (
                <button
                  key={franchise.id}
                  onClick={() => setSelectedUniverseId(franchise.id)}
                  className={`group relative h-32 sm:h-36 rounded-xl overflow-hidden border text-left transition-all duration-300 flex flex-col justify-between p-4 bg-[#160B10] ${
                    isSelected
                      ? "border-[#E11D48] shadow-[0_10px_28px_rgba(163,13,50,0.4)] text-[#F5F1F3]"
                      : "border-[rgba(155,25,57,0.24)] text-[#AAA0A7] hover:text-[#F5F1F3] hover:border-[#E11D48]/60"
                  }`}
                >
                  {/* Official Franchise Movie Backdrop Thumbnail */}
                  <CinovaImage
                    src={thumbUrl}
                    alt={franchise.name}
                    fallbackText={franchise.name}
                    aspect="custom"
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05] ${
                      isSelected ? "opacity-65" : "opacity-50 group-hover:opacity-65"
                    }`}
                    containerClassName="absolute inset-0 w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080506]/95 via-[#080506]/55 to-[#080506]/25 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-2 w-full">
                    <span className="px-2 py-0.5 rounded-md bg-[#080506]/80 border border-[rgba(155,25,57,0.32)] text-[10px] uppercase font-semibold text-[#FF385B] tracking-wider truncate">
                      {franchise.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#080506]/75 text-[10px] text-[#F5F1F3]/90 font-mono shrink-0">
                      {franchise.films.length} Titles
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between gap-2 w-full">
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F1F3] text-shadow-cinova truncate">
                      {franchise.name}
                    </h3>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#E11D48] shrink-0 mb-1.5 shadow-[0_0_8px_#E11D48]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Universe Spotlight Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(155,25,57,0.26)] bg-[#160B10] p-6 sm:p-8 shadow-2xl">
            <CinovaImage
              src={activeFranchise.backdropUrl.replace("/t/p/original/", "/t/p/w1280/")}
              alt={activeFranchise.name}
              fallbackText={activeFranchise.name}
              aspect="custom"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              containerClassName="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080506] via-[#080506]/80 to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-semibold tracking-widest text-[#FF385B] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#E11D48]" />
                  Universe Marathon
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-[#F5F1F3] mt-1">
                  {activeFranchise.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#AAA0A7] mt-2 max-w-xl leading-relaxed">
                  {activeFranchise.description}
                </p>
              </div>
              <div className="px-4 py-2 rounded-full bg-[#10080C]/85 border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] font-mono text-xs font-semibold self-start sm:self-auto">
                {matchingUniverseMovies.length} Titles in Saga
              </div>
            </div>
          </div>

          {/* Universe Movies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {matchingUniverseMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                aspect="landscape"
                fluid
                onOpenModal={(m) => setModalMovie(m)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Thematic Vaults Tab */
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
            {CATEGORIES_SHOWCASE.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`group relative h-28 sm:h-32 rounded-xl overflow-hidden border p-3.5 text-left transition-all duration-300 bg-[#160B10] ${
                    isSelected
                      ? "border-[#E11D48] shadow-[0_10px_24px_rgba(163,13,50,0.4)]"
                      : "border-[rgba(155,25,57,0.24)] hover:border-[#E11D48]/60"
                  }`}
                >
                  <CinovaImage
                    src={cat.image}
                    alt={cat.name}
                    fallbackText={cat.name}
                    aspect="custom"
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05] ${
                      isSelected ? "opacity-75" : "opacity-55 group-hover:opacity-75"
                    }`}
                    containerClassName="absolute inset-0 w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080506]/95 via-[#080506]/50 to-transparent pointer-events-none" />
                  <div className="relative z-10 h-full flex flex-col justify-end">
                    <span className="text-xs sm:text-sm font-bold text-[#F5F1F3] text-shadow-cinova line-clamp-1">
                      {cat.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Titles in this Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {matchingCatMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                aspect="landscape"
                fluid
                onOpenModal={(m) => setModalMovie(m)}
              />
            ))}
          </div>
        </div>
      )}

      <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080506] pt-32 text-center text-[#AAA0A7] text-xs">
          Loading Universes...
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
