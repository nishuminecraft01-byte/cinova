"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Film,
  Tv,
  Globe,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Play,
  Plus,
  Loader2,
} from "lucide-react";
import CinovaImage from "@/components/CinovaImage";
import { useWatchlist } from "@/context/WatchlistContext";
import {
  WORLDWIDE_COLLECTIONS,
  WORLDWIDE_COUNTRIES,
  WORLDWIDE_GENRE_OPTIONS,
  WORLDWIDE_LANGUAGES,
  WORLDWIDE_SORT_OPTIONS,
  WorldwideCatalogItem,
  getCatalogFeedDefinition,
  getCollectionPreset,
} from "@/lib/tmdb-worldwide";

interface SearchApiResponse {
  configured: boolean;
  setupRequired?: boolean;
  error?: string;
  items: WorldwideCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

const RATING_FILTERS = [
  { value: "", label: "Any Rating" },
  { value: "6", label: "6.0+ Rated" },
  { value: "7", label: "7.0+ Rated" },
  { value: "7.5", label: "7.5+ Rated" },
  { value: "8", label: "8.0+ Acclaimed" },
  { value: "8.5", label: "8.5+ Masterpiece" },
];

const MEDIA_TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Series" },
  { value: "anime", label: "Anime" },
];

function buildYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1970; y--) {
    years.push(String(y));
  }
  return years;
}

function SkeletonCardGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
      {Array.from({ length: 12 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.18)] animate-pulse"
        >
          <div className="aspect-[2/3] w-full bg-[#160B10]" />
          <div className="p-2.5 space-y-2">
            <div className="h-3.5 w-4/5 rounded bg-[#1D0C13]" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/3 rounded bg-[#160B10]" />
              <div className="h-3 w-1/4 rounded bg-[#160B10]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorldwideResultCard({ item }: { item: WorldwideCatalogItem }) {
  return (
    <Link
      href={item.detailHref}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(225,29,72,0.55)] transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#160B10]">
        <CinovaImage
          src={item.posterUrl || item.backdropUrl}
          alt={item.title}
          fallbackText={item.title}
          aspect="custom"
          tmdbSize="w500"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          containerClassName="w-full h-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080506] via-[#080506]/60 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#080506]/85 border border-[rgba(155,25,57,0.3)] text-[10px] font-bold uppercase tracking-wider text-[#F5F1F3]">
            {item.mediaType === "tv" ? (
              <>
                <Tv className="w-2.5 h-2.5 text-[#FF385B]" />
                TV
              </>
            ) : (
              <>
                <Film className="w-2.5 h-2.5 text-[#FF385B]" />
                Movie
              </>
            )}
          </span>

          {item.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#080506]/85 border border-[rgba(155,25,57,0.3)] text-[10px] font-bold text-[#F5F1F3]">
              <Star className="w-2.5 h-2.5 text-[#FF385B] fill-[#FF385B]" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Playable vs Discovery Indicator Badge */}
        {item.hasLicensedStream ? (
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0D2418]/90 border border-[#10B981]/50 text-[#10B981] text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Stream Ready
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#160B10]/90 border border-[rgba(155,25,57,0.35)] text-[#FF385B] text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-xs">
            Discovery
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#F5F1F3] line-clamp-1 group-hover:text-[#FF385B] transition-colors">
            {item.title}
          </h3>
          {item.genres.length > 0 && (
            <p className="text-[11px] text-[#746971] line-clamp-1 mt-0.5">
              {item.genres.slice(0, 2).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#AAA0A7] pt-0.5">
          <span>{item.releaseYear || "TBA"}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#160B10] border border-[rgba(155,25,57,0.2)] text-[10px] font-medium text-[#AAA0A7]">
            {item.originalLanguageLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  const rawTypeParam = (searchParams?.get("type") || searchParams?.get("mediaType") || "all").toLowerCase();
  const normalizedInitialType =
    rawTypeParam === "series"
      ? "tv"
      : rawTypeParam === "movie" || rawTypeParam === "tv" || rawTypeParam === "anime"
        ? rawTypeParam
        : "all";
  const initialCollection = (searchParams?.get("collection") || "all").toLowerCase();
  const initialFeed = (searchParams?.get("feed") || "").toLowerCase();
  const initialGenre = searchParams?.get("genre") || "";
  const initialLanguage = searchParams?.get("language") || "";
  const initialYear = searchParams?.get("year") || "";
  const initialCountry = searchParams?.get("country") || "";

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [selectedFeed, setSelectedFeed] = useState(initialFeed);
  const [selectedType, setSelectedType] = useState(normalizedInitialType);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedRating, setSelectedRating] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Results state
  const [items, setItems] = useState<WorldwideCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const appendNextPageRef = useRef(false);

  // Suggestions dropdown state
  const [suggestions, setSuggestions] = useState<WorldwideCatalogItem[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const { movies: localVaultMovies } = useWatchlist();
  const yearOptions = useMemo(() => buildYearOptions(), []);
  const activePreset = useMemo(
    () => getCollectionPreset(selectedCollection),
    [selectedCollection]
  );
  const activeFeedMeta = useMemo(
    () => getCatalogFeedDefinition(selectedFeed),
    [selectedFeed]
  );

  // Sync URL query params when navigating via navbar links (e.g. /search?type=anime or /search?feed=...)
  useEffect(() => {
    setQueryInput(initialQuery);
    setDebouncedQuery(initialQuery);
    setSelectedType(normalizedInitialType);
    setSelectedCollection(initialCollection);
    setSelectedFeed(initialFeed);
    setSelectedGenre(initialGenre);
    setSelectedLanguage(initialLanguage);
    setSelectedYear(initialYear);
    setSelectedCountry(initialCountry);
    appendNextPageRef.current = false;
    setPage(1);
  }, [
    initialQuery,
    normalizedInitialType,
    initialCollection,
    initialFeed,
    initialGenre,
    initialLanguage,
    initialYear,
    initialCountry,
  ]);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [queryInput]);

  // Close suggestions dropdown on outside click or Escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Fetch fast live suggestions while typing
  useEffect(() => {
    const trimmed = queryInput.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          mediaType: selectedType,
          suggest: "1",
        });
        const res = await fetch(`/api/tmdb/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as SearchApiResponse;
        setSuggestions(Array.isArray(json.items) ? json.items : []);
      } catch {
        // Ignore abort errors
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [queryInput, selectedType]);

  // Fetch main paginated discovery, feed, or search results
  useEffect(() => {
    const controller = new AbortController();
    const shouldAppend = appendNextPageRef.current && page > 1;
    appendNextPageRef.current = false;

    async function loadResults() {
      if (shouldAppend) setLoadingMore(true);
      else setLoading(true);
      setErrorMsg(null);

      try {
        const isSearchMode = debouncedQuery.length > 0;
        const hasManualFilters = Boolean(
          selectedGenre ||
          selectedLanguage ||
          selectedYear ||
          selectedCountry ||
          selectedRating ||
          selectedType !== "all" ||
          sortBy !== "popularity.desc"
        );
        const params = new URLSearchParams();
        params.set("page", String(page));

        let url = "";
        if (isSearchMode) {
          params.set("q", debouncedQuery);
          params.set("mediaType", selectedType);
          if (selectedGenre) params.set("genre", selectedGenre);
          if (selectedLanguage) params.set("language", selectedLanguage);
          if (selectedYear) params.set("year", selectedYear);
          if (selectedCountry) params.set("country", selectedCountry);
          if (selectedRating) params.set("minRating", selectedRating);
          if (sortBy) params.set("sortBy", sortBy);
          url = `/api/tmdb/search?${params.toString()}`;
        } else if (selectedFeed && !hasManualFilters) {
          params.set("feed", selectedFeed);
          url = `/api/tmdb/catalog?${params.toString()}`;
        } else {
          params.set("collection", selectedCollection);
          if (selectedType !== "all") {
            params.set("mediaType", selectedType);
          }
          if (selectedGenre) params.set("genre", selectedGenre);
          if (selectedLanguage) params.set("language", selectedLanguage);
          if (selectedYear) params.set("year", selectedYear);
          if (selectedCountry) params.set("country", selectedCountry);
          if (selectedRating) params.set("minRating", selectedRating);
          if (sortBy) params.set("sortBy", sortBy);
          url = `/api/tmdb/discover?${params.toString()}`;
        }

        const res = await fetch(url, { signal: controller.signal });
        const json = (await res.json()) as SearchApiResponse;

        setSetupRequired(Boolean(json.setupRequired));

        if (!res.ok && !json.setupRequired) {
          setErrorMsg(json.error || "Unable to load titles right now.");
          if (!shouldAppend) {
            setItems(Array.isArray(json.items) ? json.items : []);
            setTotalPages(1);
            setTotalResults(Array.isArray(json.items) ? json.items.length : 0);
          }
          return;
        }

        if (json.setupRequired) {
          setErrorMsg(
            json.error ||
            "TMDB credentials are not configured. Add TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local and restart the dev server."
          );
          if (!shouldAppend) {
            setItems(Array.isArray(json.items) ? json.items : []);
            setTotalPages(1);
            setTotalResults(Array.isArray(json.items) ? json.items.length : 0);
          }
          return;
        }

        const incoming = Array.isArray(json.items) ? json.items : [];
        setItems((prev) => {
          if (!shouldAppend) return incoming;
          const seen = new Set(prev.map((i) => `${i.mediaType}:${i.tmdbId || i.id}`));
          const merged = [...prev];
          for (const item of incoming) {
            const key = `${item.mediaType}:${item.tmdbId || item.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          return merged;
        });
        setTotalPages(Math.max(1, json.totalPages || 1));
        setTotalResults(json.totalResults || 0);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setErrorMsg("Network error while connecting to CINOVA worldwide catalog.");
        if (!shouldAppend) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    loadResults();
    return () => controller.abort();
  }, [
    debouncedQuery,
    selectedCollection,
    selectedFeed,
    selectedType,
    selectedGenre,
    selectedLanguage,
    selectedYear,
    selectedCountry,
    selectedRating,
    sortBy,
    page,
    reloadNonce,
  ]);

  // Local CINOVA Vault fallback items when TMDB setup is missing in discovery mode
  const fallbackVaultItems = useMemo<WorldwideCatalogItem[]>(() => {
    if (!setupRequired || items.length > 0) return [];
    return localVaultMovies.slice(0, 18).map((m) => ({
      id: m.id,
      tmdbId: Number(m.tmdbId) || 0,
      mediaType: m.type === "series" ? "tv" : "movie",
      title: m.title,
      originalTitle: m.originalTitle || m.title,
      overview: m.description,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      releaseDate: `${m.releaseYear}-01-01`,
      releaseYear: m.releaseYear,
      rating: m.imdbScore,
      voteCount: 0,
      popularity: m.views,
      originalLanguage: "en",
      originalLanguageLabel: m.language || "English",
      genreIds: [],
      genres: m.genre,
      originCountries: [],
      hasLicensedStream: true,
      localId: m.id,
      detailHref: m.type === "series" ? `/series/${m.id}` : `/movie/${m.id}`,
    }));
  }, [setupRequired, items.length, localVaultMovies]);

  const displayedItems = items.length > 0 ? items : fallbackVaultItems;

  const activeFilterCount = [
    selectedGenre,
    selectedLanguage,
    selectedYear,
    selectedCountry,
    selectedRating,
    selectedType !== "all" ? selectedType : "",
    sortBy !== "popularity.desc" ? sortBy : "",
  ].filter(Boolean).length;

  const handleSelectCollection = useCallback((collectionId: string) => {
    setSelectedCollection(collectionId);
    setSelectedFeed("");
    setQueryInput("");
    setDebouncedQuery("");
    setSelectedLanguage("");
    setSelectedCountry("");
    setSelectedGenre("");
    setSelectedType("all");
    appendNextPageRef.current = false;
    setPage(1);
    setSuggestionsOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQueryInput("");
    setDebouncedQuery("");
    setSelectedCollection("all");
    setSelectedFeed("");
    setSelectedType("all");
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedYear("");
    setSelectedCountry("");
    setSelectedRating("");
    setSortBy("popularity.desc");
    appendNextPageRef.current = false;
    setPage(1);
    setSuggestionsOpen(false);
  }, []);

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    appendNextPageRef.current = false;
    setPage(clamped);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    appendNextPageRef.current = true;
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
      {/* Header & Live Search Input */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-[3px] h-6 bg-[#E11D48] rounded-full" />
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3] tracking-tight">
                {debouncedQuery
                  ? `Search Results`
                  : activeFeedMeta
                    ? activeFeedMeta.title
                    : selectedType === "anime"
                      ? "Anime & Japanese Discovery"
                      : activePreset.label}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#AAA0A7]">
              {debouncedQuery
                ? `Searching worldwide movies & TV series across TMDB and CINOVA Vault.`
                : activeFeedMeta
                  ? activeFeedMeta.description
                  : activePreset.description}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[11px] font-semibold text-[#AAA0A7]">
            <Globe className="w-3.5 h-3.5 text-[#FF385B]" />
            Worldwide TMDB Catalog
          </span>
        </div>

        {/* Search Box with Live Suggestions */}
        <div ref={searchBoxRef} className="relative max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDebouncedQuery(queryInput.trim());
              setPage(1);
              setSuggestionsOpen(false);
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#746971] pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onFocus={() => setSuggestionsOpen(true)}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setSuggestionsOpen(true);
              }}
              placeholder="Search worldwide movies, series, Bollywood, K-Dramas, Anime..."
              aria-label="Search worldwide movies and TV series"
              className="w-full bg-[#160B10] border border-[rgba(155,25,57,0.3)] focus:border-[#E11D48] rounded-xl pl-12 pr-12 py-3.5 text-sm sm:text-base text-[#F5F1F3] placeholder-[#746971] focus:outline-none transition-all shadow-xl"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setDebouncedQuery("");
                  setSuggestions([]);
                  setSuggestionsOpen(false);
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#AAA0A7] hover:text-[#F5F1F3]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>

          {/* Instant Suggestions Dropdown */}
          {suggestionsOpen && queryInput.trim().length >= 2 && (
            <div className="absolute z-40 left-0 right-0 mt-2 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.36)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
              {loadingSuggestions ? (
                <div className="p-4 text-xs text-[#AAA0A7]">Finding matching titles...</div>
              ) : suggestions.length === 0 ? (
                <div className="p-4 text-xs text-[#746971]">
                  No quick suggestions for &ldquo;{queryInput.trim()}&rdquo;. Press Enter to search full catalog.
                </div>
              ) : (
                <ul className="divide-y divide-[rgba(155,25,57,0.14)]">
                  {suggestions.map((s) => (
                    <li key={`suggest-${s.mediaType}-${s.tmdbId || s.id}`}>
                      <Link
                        href={s.detailHref}
                        onClick={() => setSuggestionsOpen(false)}
                        className="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-[#1D0C13] transition-colors"
                      >
                        <div className="w-9 h-12 rounded-md overflow-hidden bg-[#160B10] flex-shrink-0 border border-[rgba(155,25,57,0.2)]">
                          <CinovaImage
                            src={s.posterUrl || s.backdropUrl}
                            alt={s.title}
                            fallbackText={s.title}
                            aspect="custom"
                            tmdbSize="w342"
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#F5F1F3] line-clamp-1">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#746971] mt-0.5">
                            <span className="uppercase text-[#FF385B] font-semibold">
                              {s.mediaType === "tv" ? "TV Series" : "Movie"}
                            </span>
                            {s.releaseYear && <span>· {s.releaseYear}</span>}
                            <span>· {s.originalLanguageLabel}</span>
                            {s.rating > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[#AAA0A7]">
                                · <Star className="w-2.5 h-2.5 text-[#FF385B] fill-[#FF385B]" />{" "}
                                {s.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        {s.hasLicensedStream && (
                          <span className="px-2 py-0.5 rounded-full bg-[#A30D32]/30 border border-[#E11D48]/40 text-[10px] font-bold text-[#FF385B] flex-shrink-0">
                            Vault
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 14 Worldwide Regional Discovery Collections */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#746971]">
            Worldwide Cinema &amp; Regional Collections
          </span>
        </div>
        <div className="cinova-carousel-track flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {WORLDWIDE_COLLECTIONS.map((col) => {
            const isActive = !debouncedQuery && selectedCollection === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => handleSelectCollection(col.id)}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${isActive
                  ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/60 text-[#F5F1F3] shadow-[0_4px_14px_rgba(225,29,72,0.35)]"
                  : "bg-[#10080C] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.24)]"
                  }`}
              >
                {col.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#10080C] border border-[rgba(155,25,57,0.22)] rounded-xl p-3 sm:p-4 mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {MEDIA_TYPE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setSelectedType(t.value);
                  setPage(1);
                }}
                className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${selectedType === t.value
                  ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3]"
                  : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.22)]"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile Filters Toggle + Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="sm:hidden inline-flex items-center gap-1.5 min-h-[38px] px-3 py-2 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-xs font-semibold text-[#F5F1F3]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF385B]" />
              <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-2 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.26)] text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Functional Filter Dropdowns */}
        <div
          className={`${showMobileFilters ? "grid" : "hidden sm:grid"
            } grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[rgba(155,25,57,0.15)]`}
        >
          {/* Genre */}
          <select
            aria-label="Filter by genre"
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
          >
            {WORLDWIDE_GENRE_OPTIONS.map((g) => (
              <option key={g.id || "all"} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>

          {/* Original Language */}
          <select
            aria-label="Filter by language"
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
          >
            {WORLDWIDE_LANGUAGES.map((l) => (
              <option key={l.code || "all"} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Country / Region */}
          <select
            aria-label="Filter by country or region"
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
          >
            {WORLDWIDE_COUNTRIES.map((c) => (
              <option key={c.code || "all"} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Release Year */}
          <select
            aria-label="Filter by release year"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
          >
            <option value="">All Years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Minimum Rating */}
          <select
            aria-label="Filter by minimum rating"
            value={selectedRating}
            onChange={(e) => {
              setSelectedRating(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#FF385B] font-semibold focus:outline-none focus:border-[#E11D48]"
          >
            {RATING_FILTERS.map((r) => (
              <option key={r.value || "any"} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            aria-label="Sort results"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-[#160B10] border border-[rgba(155,25,57,0.26)] rounded-lg px-3 py-2 text-xs text-[#FF385B] font-semibold focus:outline-none focus:border-[#E11D48]"
          >
            {WORLDWIDE_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Setup Required or API Error Banner */}
      {errorMsg && (
        <div className="mb-6 rounded-xl bg-[#10080C] border border-[rgba(225,29,72,0.45)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF385B] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs sm:text-sm">
              <p className="font-bold text-[#F5F1F3]">
                {setupRequired
                  ? "TMDB Worldwide Discovery Setup Required"
                  : "Unable to Reach TMDB Worldwide API"}
              </p>
              <p className="text-[#AAA0A7] leading-relaxed">{errorMsg}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-semibold text-[#F5F1F3] flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF385B]" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Results Count Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 text-xs sm:text-sm text-[#AAA0A7]">
        <p>
          {loading ? (
            <span>Loading worldwide catalog...</span>
          ) : (
            <>
              Showing{" "}
              <span className="text-[#F5F1F3] font-bold">
                {displayedItems.length}
              </span>
              {totalResults > displayedItems.length ? (
                <>
                  {" "}
                  of{" "}
                  <span className="text-[#F5F1F3] font-bold">
                    {totalResults.toLocaleString()}
                  </span>
                </>
              ) : null}{" "}
              titles
              {debouncedQuery ? ` for "${debouncedQuery}"` : ""}
              {setupRequired && fallbackVaultItems.length > 0
                ? " (CINOVA Vault fallback)"
                : ""}
            </>
          )}
        </p>

        {!loading && totalPages > 1 && (
          <span className="text-xs text-[#746971]">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Results Area: Skeleton / Empty / Grid + Pagination */}
      {loading ? (
        <SkeletonCardGrid />
      ) : displayedItems.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] space-y-5">
          <Film className="w-12 h-12 text-[#E11D48]/45 mx-auto" />
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[#F5F1F3]">
              {debouncedQuery
                ? `No matches found for "${debouncedQuery}"`
                : "No titles match your current filters"}
            </h2>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-md mx-auto">
              Try adjusting your language, release year, minimum rating, or genre filters to discover more movies and TV series worldwide.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-xs font-bold text-[#F5F1F3]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Search &amp; Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {displayedItems.map((item) => (
              <WorldwideResultCard
                key={`${item.mediaType}-${item.tmdbId || item.id}`}
                item={item}
              />
            ))}
          </div>

          {/* Load More + Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 pt-4">
              {page < totalPages && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 min-h-[44px] px-7 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] disabled:opacity-60 text-xs font-bold text-[#F5F1F3] transition-all shadow-[0_6px_20px_rgba(225,29,72,0.32)]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading Page {page + 1}...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Load More Titles</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || loadingMore}
                  onClick={() => handlePageChange(page - 1)}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-full bg-[#10080C] hover:bg-[#1D0C13] disabled:opacity-40 disabled:cursor-not-allowed border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#F5F1F3] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#FF385B]" />
                  <span>Previous</span>
                </button>

                <span className="px-4 py-2 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-xs font-semibold text-[#F5F1F3]">
                  Page {page} <span className="text-[#746971]">/ {totalPages}</span>
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loadingMore}
                  onClick={() => handlePageChange(page + 1)}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-full bg-[#10080C] hover:bg-[#1D0C13] disabled:opacity-40 disabled:cursor-not-allowed border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#F5F1F3] transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 text-[#FF385B]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080506] pt-32 text-center text-[#AAA0A7] text-xs">
          Loading Worldwide Catalog...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
