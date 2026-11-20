"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Play, Clock, ChevronRight, Shuffle } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import MovieRow from "@/components/MovieRow";
import Top10Row from "@/components/Top10Row";
import MovieCard from "@/components/MovieCard";
import CinovaImage from "@/components/CinovaImage";
import WorldwideDiscoveryHub from "@/components/WorldwideDiscoveryHub";
import { useWatchlist } from "@/context/WatchlistContext";
import { GENRES } from "@/data/genres";
import { FRANCHISE_COLLECTIONS } from "@/data/movies";
import { Movie } from "@/types/movie";

const MovieModal = dynamic(() => import("@/components/MovieModal"), {
  ssr: false,
});

const SPOTLIGHT_IDS = [
  "tmdb-635302", // Demon Slayer: Mugen Train
  "dune",
  "tmdb-127532", // Solo Leveling
  "tmdb-569094", // Spider-Man: Across the Spider-Verse
  "interstellar",
  "tmdb-84092", // Ramayana: The Legend of Prince Rama
];

const TRENDING_MOVIE_IDS = [
  "tmdb-569094",
  "oppenheimer",
  "interstellar",
  "dune",
  "the-batman",
  "tmdb-84092",
  "inception",
  "avatar",
  "tmdb-1726",
];

const POPULAR_SERIES_IDS = [
  "breaking-bad",
  "stranger-things",
  "the-last-of-us",
  "tmdb-93405",
  "tmdb-71446",
  "tmdb-76479",
  "tmdb-84105",
  "tmdb-60574",
];

const ANIME_ORDER_IDS = [
  "tmdb-635302",
  "tmdb-127532",
  "tmdb-85937",
  "tmdb-84092",
  "tmdb-1429",
  "tmdb-95479",
  "tmdb-37854",
];

interface BrowseByGenreSectionProps {
  movies: Movie[];
  onOpenModal: (movie: Movie) => void;
}

const BrowseByGenreSection = memo(function BrowseByGenreSection({
  movies,
  onOpenModal,
}: BrowseByGenreSectionProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");

  const genreMovies = useMemo(
    () =>
      selectedGenre === "All"
        ? movies.slice(0, 10)
        : movies.filter((m) => m.genre.includes(selectedGenre)).slice(0, 10),
    [movies, selectedGenre]
  );

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto pt-2 cinova-row-defer">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3]">
            Browse by Genre
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-xs font-medium text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
        >
          All Categories &rarr;
        </Link>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setSelectedGenre(genre)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedGenre === genre
                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3] font-semibold shadow-[0_4px_14px_rgba(163,13,50,0.35)]"
                : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.22)]"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 mt-4">
        {genreMovies.map((movie) => (
          <div key={movie.id} className="w-full min-w-0">
            <MovieCard
              movie={movie}
              aspect="landscape"
              fluid
              onOpenModal={onOpenModal}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

function shuffleList<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export default function HomePage() {
  const { movies, continueWatching, getMovieById } = useWatchlist();
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [randomizedHero, setRandomizedHero] = useState<Movie[] | null>(null);
  const [randomizedRecommended, setRandomizedRecommended] = useState<Movie[] | null>(null);

  const handleOpenModal = useCallback((m: Movie) => {
    setModalMovie(m);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalMovie(null);
  }, []);

  const reshuffleSuggestions = useCallback(() => {
    if (movies.length === 0) return;
    setRandomizedRecommended(shuffleList(movies).slice(0, 12));
  }, [movies]);

  useEffect(() => {
    if (movies.length === 0) return;
    const heroPool = movies.filter(
      (m) => SPOTLIGHT_IDS.includes(m.id) || m.isFeatured || m.imdbScore >= 8.3
    );
    setRandomizedHero(shuffleList(heroPool.length >= 6 ? heroPool : movies).slice(0, 6));
    setRandomizedRecommended(shuffleList(movies).slice(0, 12));
  }, [movies]);

  // Memoize all catalog groupings so genre selection or modal state never recomputes 15 filters
  const sections = useMemo(() => {
    const byId = new Map(movies.map((m) => [m.id, m]));

    const featuredMovies = [
      ...SPOTLIGHT_IDS.map((id) => byId.get(id)).filter(Boolean),
      ...movies.filter((m) => !SPOTLIGHT_IDS.includes(m.id) && (m.isFeatured || m.imdbScore >= 8.8)),
    ].slice(0, 6) as Movie[];

    const trendingMovies = [
      ...TRENDING_MOVIE_IDS.map((id) => byId.get(id)).filter(Boolean),
      ...movies.filter((m) => m.isTrending && m.type === "movie" && !TRENDING_MOVIE_IDS.includes(m.id)),
    ].slice(0, 12) as Movie[];

    const trendingSeries = [
      ...POPULAR_SERIES_IDS.map((id) => byId.get(id)).filter(Boolean),
      ...movies.filter((m) => m.type === "series" && !POPULAR_SERIES_IDS.includes(m.id)),
    ].slice(0, 12) as Movie[];

    const rawAnime = movies.filter(
      (m) =>
        m.industry === "anime" ||
        m.genre.some((g) => g.toLowerCase().includes("anime") || g.toLowerCase().includes("animation")) ||
        (m.language === "Japanese" && (m.type === "series" || m.genre.includes("Action")))
    );
    const animeById = new Map(rawAnime.map((m) => [m.id, m]));
    const popularAnime = [
      ...ANIME_ORDER_IDS.map((id) => animeById.get(id)).filter(Boolean),
      ...rawAnime.filter((m) => !ANIME_ORDER_IDS.includes(m.id)),
    ].slice(0, 12) as Movie[];

    const latestMovies = movies
      .filter((m) => m.type === "movie" && (m.releaseYear >= 2024 || m.isRecentlyAdded))
      .slice(0, 12);
    const topRatedMovies = movies
      .filter((m) => m.type === "movie" && m.imdbScore >= 8.6)
      .slice(0, 12);
    const topRatedSeries = movies
      .filter((m) => m.type === "series" && m.imdbScore >= 8.5)
      .slice(0, 12);
    const recommendedContent = movies
      .filter((m) => (m.matchPercentage || 90) >= 96 || m.imdbScore >= 8.8)
      .slice(0, 12);
    const hollywoodMovies = movies
      .filter((m) => (m.industry === "hollywood" || (!m.industry && m.language === "English")) && m.type === "movie")
      .slice(0, 12);
    const bollywoodMovies = movies
      .filter(
        (m) =>
          m.industry === "bollywood" ||
          m.language === "Hindi" ||
          m.language === "Telugu" ||
          m.language === "Tamil" ||
          m.language === "Kannada"
      )
      .slice(0, 12);
    const actionMovies = movies.filter((m) => m.genre.includes("Action")).slice(0, 12);
    const sciFiMovies = movies
      .filter((m) => m.genre.includes("Sci-Fi") || m.genre.includes("Cyberpunk"))
      .slice(0, 12);

    return {
      featuredMovies,
      trendingMovies,
      trendingSeries,
      popularAnime,
      latestMovies,
      topRatedMovies,
      topRatedSeries,
      recommendedContent,
      hollywoodMovies,
      bollywoodMovies,
      actionMovies,
      sciFiMovies,
    };
  }, [movies]);

  // Continue watching resolved movies
  const continueItems = useMemo(
    () =>
      continueWatching
        .map((cw) => {
          const movie = getMovieById(cw.movieId);
          return movie ? { ...cw, movie } : null;
        })
        .filter(Boolean) as Array<{
        movieId: string;
        progressSeconds: number;
        durationSeconds: number;
        completed: boolean;
        movie: NonNullable<ReturnType<typeof getMovieById>>;
      }>,
    [continueWatching, getMovieById]
  );

  return (
    <div className="relative min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] overflow-x-hidden">
      {/* 1. Cinematic Spotlight Hero Section */}
      <HeroBanner
        featuredMovies={
          randomizedHero && randomizedHero.length > 0
            ? randomizedHero
            : sections.featuredMovies.length > 0
            ? sections.featuredMovies
            : movies.slice(0, 6)
        }
        onOpenModal={handleOpenModal}
      />

      {/* Content Rows Container (Tucked neatly below hero fold) */}
      <div className="relative z-30 -mt-8 sm:-mt-12 space-y-6 sm:space-y-8 pb-14">
        {/* Continue Watching (shown when user has in-progress titles) */}
        {continueItems.length > 0 && (
          <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3]">
                Continue Watching
              </h2>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1.5">
              {continueItems.map(({ movie, progressSeconds, durationSeconds }) => {
                const progressPct = Math.min(
                  100,
                  Math.round((progressSeconds / (durationSeconds || 1)) * 100)
                );
                return (
                  <div
                    key={movie.id}
                    className="group relative flex-shrink-0 w-[244px] sm:w-[272px] bg-[#160B10] rounded-xl overflow-hidden border border-[rgba(155,25,57,0.22)] transition-colors duration-200 hover:border-[#E11D48]/55 shadow-[0_8px_22px_rgba(0,0,0,0.55)]"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-[#10080C]">
                      <CinovaImage
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={movie.title}
                        fallbackText={movie.title}
                        aspect="backdrop"
                        tmdbSize="w500"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-[#080506]/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/watch/${movie.id}`}
                          className="w-10 h-10 rounded-full bg-[#E11D48] hover:bg-[#FF385B] text-[#F5F1F3] flex items-center justify-center shadow-lg transition-transform active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-[#F5F1F3] ml-0.5" />
                        </Link>
                      </div>

                      {/* Crimson Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#080506]/90">
                        <div
                          className="h-full bg-[#E11D48]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between text-[11px] text-[#AAA0A7] mb-1">
                        <span className="text-[#FF385B] font-semibold">{movie.quality}</span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          {Math.floor(progressSeconds / 60)}m watched
                        </span>
                      </div>
                      <Link href={`/watch/${movie.id}`}>
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#F5F1F3] hover:text-[#FF385B] transition-colors truncate">
                          {movie.title}
                        </h4>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 1. Popular Anime (primary row directly below hero) */}
        <MovieRow
          title="Popular Anime"
          movies={sections.popularAnime}
          aspect="landscape"
          maxItems={10}
          exploreHref="/search?type=anime"
          onOpenModal={handleOpenModal}
        />

        {/* 2. Trending Now */}
        <MovieRow
          title="Trending Now"
          movies={sections.trendingMovies}
          aspect="landscape"
          maxItems={10}
          exploreHref="/movies"
          onOpenModal={handleOpenModal}
        />

        {/* 3. Latest Movies */}
        <MovieRow
          title="Latest Movies"
          badge="2024–2026"
          movies={sections.latestMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies?sort=newest"
          onOpenModal={handleOpenModal}
        />

        {/* 4. Popular Series */}
        <MovieRow
          title="Popular Series"
          movies={sections.trendingSeries}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/series"
          onOpenModal={handleOpenModal}
        />

        {/* 5. Top 10 Today */}
        <div className="cinova-row-defer">
          <Top10Row
            title="Top 10 Today"
            movies={sections.trendingMovies.length >= 5 ? sections.trendingMovies : movies}
            onOpenModal={handleOpenModal}
          />
        </div>

        {/* 5B. Massive Worldwide TMDB Discovery Hub (24 Auto-Refreshed Global Rails + Country & Language Explorer) */}
        <WorldwideDiscoveryHub />

        {/* 6. Top Rated Movies */}
        <MovieRow
          title="Top Rated"
          badge="Critically Acclaimed"
          movies={sections.topRatedMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies?sort=rating"
          onOpenModal={handleOpenModal}
        />

        {/* 7. Bollywood & Indian Superhits */}
        <MovieRow
          title="Indian &amp; Bollywood Cinema"
          badge="4K Master"
          movies={sections.bollywoodMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies?industry=bollywood"
          onOpenModal={handleOpenModal}
        />

        {/* 8. Explore Universes & Franchises */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto my-6 sm:my-8 cinova-row-defer">
          <div className="flex items-end justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3]">
                  Explore Universes &amp; Franchises
                </h2>
                <p className="text-xs text-[#AAA0A7]">
                  Interconnected cinematic sagas with curated marathon watch orders.
                </p>
              </div>
            </div>
            <Link
              href="/categories"
              className="text-xs font-medium text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors hidden sm:block"
            >
              See All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FRANCHISE_COLLECTIONS.map((franchise) => (
              <Link
                key={franchise.id}
                href={`/categories?universe=${franchise.id}`}
                className="group relative rounded-xl overflow-hidden border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/55 transition-colors duration-200 p-4 sm:p-5 flex flex-col justify-between h-40 bg-[#160B10] shadow-[0_8px_22px_rgba(0,0,0,0.55)]"
              >
                <CinovaImage
                  src={franchise.backdropUrl}
                  alt={franchise.name}
                  fallbackText={franchise.name}
                  aspect="custom"
                  tmdbSize="w500"
                  className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-[1.04] transition-transform duration-500"
                  containerClassName="absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/70 to-transparent" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[#10080C]/90 text-[#FF385B] text-[10px] font-semibold uppercase tracking-wider border border-[rgba(155,25,57,0.3)]">
                    {franchise.category}
                  </span>
                  <span className="text-[11px] text-[#AAA0A7] font-medium">
                    {franchise.films.length} Titles
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-[#F5F1F3] group-hover:text-white transition-colors">
                    {franchise.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-[#FF385B] font-semibold group-hover:translate-x-0.5 transition-transform">
                    Start Marathon <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 9. Recommended Content (Randomized on every visit + instant Shuffle) */}
        <MovieRow
          title="Recommended For You"
          badge="Random Picks"
          movies={randomizedRecommended || sections.recommendedContent}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies"
          headerAction={
            <button
              type="button"
              onClick={reshuffleSuggestions}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] hover:border-[#E11D48] text-[11px] font-semibold text-[#F5F1F3] transition-colors"
            >
              <Shuffle className="w-3 h-3 text-[#FF385B]" />
              <span>Shuffle</span>
            </button>
          }
          onOpenModal={handleOpenModal}
        />

        {/* 10. Hollywood Blockbusters */}
        <MovieRow
          title="Hollywood Blockbusters"
          movies={sections.hollywoodMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies?industry=hollywood"
          onOpenModal={handleOpenModal}
        />

        {/* 11. Top Rated Series */}
        <MovieRow
          title="Top Rated Series"
          movies={sections.topRatedSeries}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/series?sort=rating"
          onOpenModal={handleOpenModal}
        />

        {/* 12. Action & Sci-Fi */}
        <MovieRow
          title="Action &amp; Thrillers"
          movies={sections.actionMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies"
          onOpenModal={handleOpenModal}
        />

        <MovieRow
          title="Sci-Fi &amp; Cyberpunk"
          movies={sections.sciFiMovies}
          aspect="landscape"
          maxItems={10}
          defer
          exploreHref="/movies"
          onOpenModal={handleOpenModal}
        />

        {/* 13. Browse by Genre (Isolated Memoized Section) */}
        <BrowseByGenreSection movies={movies} onOpenModal={handleOpenModal} />
      </div>

      {/* Detail Modal (loaded lazily only when opened) */}
      {modalMovie && <MovieModal movie={modalMovie} onClose={handleCloseModal} />}
    </div>
  );
}
