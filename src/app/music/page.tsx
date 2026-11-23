"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Music2,
  Loader2,
  Disc3,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Flame,
  Globe2,
  Check,
  CheckCircle2,
  Heart,
  Play,
  Zap,
  PartyPopper,
  CloudRain,
  Radio,
  Sun,
  Compass,
  Languages,
  Moon,
  RefreshCw,
  Youtube,
} from "lucide-react";
import MusicHeroBanner from "@/components/music/MusicHeroBanner";
import TopChartsWidget from "@/components/music/TopChartsWidget";
import SongCard from "@/components/music/SongCard";
import SpotifyTrackRow from "@/components/music/SpotifyTrackRow";
import AlbumCard from "@/components/music/AlbumCard";
import ArtistCard from "@/components/music/ArtistCard";
import MusicSearchBar from "@/components/music/MusicSearchBar";
import { Song, Album, Artist, MUSIC_CATEGORIES, MusicCategoryItem } from "@/types/music";
import { useMusic } from "@/context/MusicContext";
import { useAuth } from "@/context/AuthContext";
import { SUPPORTED_COUNTRIES, CountryInfo } from "@/lib/api/regional-trending";
import { MAINSTREAM_TRACKS, getMainstreamTracksByCategory } from "@/lib/api/mainstream-client";
import {
  getWorldwideTracksByLanguage,
  getGlobalTopSongs,
  WORLDWIDE_DISCOVERY_LANGUAGES,
} from "@/lib/api/worldwide-catalogue";
import {
  MARATHI_CATEGORIES,
  getMarathiTracksByCategory,
  getAllMarathiTracks,
} from "@/lib/api/marathi-catalogue";

const INDEPENDENT_GENRES = [
  { id: "all", name: "All Genres" },
  { id: "pop", name: "Pop" },
  { id: "rock", name: "Rock" },
  { id: "electronic", name: "Electronic" },
  { id: "hip-hop", name: "Hip-Hop" },
  { id: "acoustic", name: "Acoustic" },
  { id: "ambient", name: "Ambient" },
  { id: "classical", name: "Classical" },
];

export default function MusicHomePage() {
  const { recentlyPlayed, playTrack } = useMusic();
  const { user } = useAuth();

  // Country-wise regional trending states
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [countryInfo, setCountryInfo] = useState<CountryInfo>(SUPPORTED_COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);

  // Search states (Smart Typo Search & Worldwide Discovery)
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState<string>("all");
  const [activeSearchLang, setActiveSearchLang] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchArtists, setSearchArtists] = useState<Artist[]>([]);
  const [searchAlbums, setSearchAlbums] = useState<Album[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Category navigation pills matching reference image
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("trending");
  const [categoryTracks, setCategoryTracks] = useState<Song[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  // Mainstream trending & Top Charts states (initialized with verified catalogue to eliminate CLS)
  const [trendingSongs, setTrendingSongs] = useState<Song[]>(MAINSTREAM_TRACKS);
  const [topChartsSongs, setTopChartsSongs] = useState<Song[]>(MAINSTREAM_TRACKS.slice(0, 5));
  const [isLiveTrending, setIsLiveTrending] = useState(false);
  const [trendingDataSource, setTrendingDataSource] = useState<"live_youtube_api" | "curated_fallback">("curated_fallback");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);

  // Free Independent Music states
  const [selectedIndependentGenre, setSelectedIndependentGenre] = useState("all");
  const [independentTracks, setIndependentTracks] = useState<Song[]>([]);
  const [isIndependentLoading, setIsIndependentLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Automatic Daily Music Discovery states
  const [addedTodaySongs, setAddedTodaySongs] = useState<Song[]>([]);
  const [recentlyDiscoveredSongs, setRecentlyDiscoveredSongs] = useState<Song[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [isRefreshingDiscovery, setIsRefreshingDiscovery] = useState(false);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Curated Worldwide Discovery catalogues (25+ Languages)
  const globalTopSongs = useMemo(() => getGlobalTopSongs(10), []);
  const koreanHits = useMemo(() => getWorldwideTracksByLanguage("korean", 10), []);
  const latinHits = useMemo(() => getWorldwideTracksByLanguage("spanish", 10), []);
  const japaneseHits = useMemo(() => getWorldwideTracksByLanguage("japanese", 10), []);
  const arabicHits = useMemo(() => getWorldwideTracksByLanguage("arabic", 10), []);
  const europeanHits = useMemo(() => {
    return [
      ...getWorldwideTracksByLanguage("french", 3),
      ...getWorldwideTracksByLanguage("german", 2),
      ...getWorldwideTracksByLanguage("portuguese", 2),
      ...getWorldwideTracksByLanguage("turkish", 2),
      ...getWorldwideTracksByLanguage("russian", 2),
    ].slice(0, 10);
  }, []);
  const indianRegionalHits = useMemo(() => {
    return [
      ...getWorldwideTracksByLanguage("tamil", 2),
      ...getWorldwideTracksByLanguage("telugu", 2),
      ...getWorldwideTracksByLanguage("malayalam", 2),
      ...getWorldwideTracksByLanguage("kannada", 2),
      ...getWorldwideTracksByLanguage("gujarati", 2),
      ...getWorldwideTracksByLanguage("bengali", 1),
      ...getWorldwideTracksByLanguage("urdu", 1),
    ].slice(0, 10);
  }, []);

  // Curated music type catalogues (Authentic 1080p verified mainstream commercial hits)
  const romanticTracks = useMemo(() => getMainstreamTracksByCategory("romantic", 10), []);
  const punjabiTracks = useMemo(() => getMainstreamTracksByCategory("punjabi", 10), []);
  const partyTracks = useMemo(() => getMainstreamTracksByCategory("party", 10), []);
  const marathiTracks = useMemo(() => getMainstreamTracksByCategory("marathi", 10), []);
  const [activeMarathiCategory, setActiveMarathiCategory] = useState<string>("all");
  const marathiShowcaseTracks = useMemo(
    () => getMarathiTracksByCategory(activeMarathiCategory, 12),
    [activeMarathiCategory]
  );
  const sadTracks = useMemo(() => getMainstreamTracksByCategory("sad-songs", 10), []);
  const devotionalTracks = useMemo(() => getMainstreamTracksByCategory("devotional", 10), []);
  const retroTracks = useMemo(() => getMainstreamTracksByCategory("old-classics", 10), []);
  const globalPopTracks = useMemo(() => getMainstreamTracksByCategory("english", 10), []);

  // 1. Initial Load: Load saved country or detect country, and fetch initial data
  useEffect(() => {
    let isMounted = true;

    async function initializeMusicDashboard() {
      setIsInitialLoading(true);

      // Check for saved country in localStorage
      let initialCountry = "IN";
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("cinova_selected_country");
          if (saved) initialCountry = saved;
        } catch (_) {}
      }

      setSelectedCountry(initialCountry);

      try {
        const [
          trendingRes,
          albumsRes,
          artistsRes,
          independentRes,
          addedTodayRes,
          recentRes,
          statusRes,
        ] = await Promise.all([
          fetch(`/api/music/trending?country=${initialCountry}&limit=20`).then((r) => r.json()).catch(() => null),
          fetch("/api/music/albums?limit=8").then((r) => r.json()).catch(() => null),
          fetch("/api/music/artists?limit=8").then((r) => r.json()).catch(() => null),
          fetch("/api/music/independent?limit=16").then((r) => r.json()).catch(() => null),
          fetch("/api/music/discovered?section=added_today&limit=10").then((r) => r.json()).catch(() => null),
          fetch("/api/music/discovered?section=recently_discovered&limit=15").then((r) => r.json()).catch(() => null),
          fetch("/api/music/discovered?section=status").then((r) => r.json()).catch(() => null),
        ]);

        if (!isMounted) return;

        if (trendingRes?.success) {
          if (Array.isArray(trendingRes.tracks)) setTrendingSongs(trendingRes.tracks);
          if (Array.isArray(trendingRes.topCharts)) setTopChartsSongs(trendingRes.topCharts);
          if (typeof trendingRes.isLive === "boolean") setIsLiveTrending(trendingRes.isLive);
          if (trendingRes.dataSource) setTrendingDataSource(trendingRes.dataSource);
          if (trendingRes.fallbackReason) setFallbackReason(trendingRes.fallbackReason);
          if (trendingRes.countryCode) {
            setSelectedCountry(trendingRes.countryCode);
            const match = SUPPORTED_COUNTRIES.find((c) => c.code === trendingRes.countryCode);
            if (match) setCountryInfo(match);
          }
        }

        if (albumsRes?.success && Array.isArray(albumsRes.albums)) {
          setPopularAlbums(albumsRes.albums);
        }

        if (artistsRes?.success && Array.isArray(artistsRes.artists)) {
          setPopularArtists(artistsRes.artists);
        }

        if (independentRes?.success && Array.isArray(independentRes.tracks)) {
          setIndependentTracks(independentRes.tracks);
        }

        if (addedTodayRes?.success && Array.isArray(addedTodayRes.tracks)) {
          setAddedTodaySongs(addedTodayRes.tracks);
        }

        if (recentRes?.success && Array.isArray(recentRes.tracks)) {
          setRecentlyDiscoveredSongs(recentRes.tracks);
        }

        if (statusRes?.lastSync?.finishedAt) {
          setLastSyncTimestamp(statusRes.lastSync.finishedAt);
        }
      } catch (err) {
        console.error("Failed to load initial music data:", err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    }

    initializeMusicDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual trigger for daily discovery refresh
  const handleTriggerDiscoveryRefresh = useCallback(async () => {
    setIsRefreshingDiscovery(true);
    try {
      const res = await fetch("/api/cron/music-daily-discovery", { method: "POST" });
      const data = await res.json();
      if (data?.summary) {
        const [todayRes, recentRes, statusRes] = await Promise.all([
          fetch("/api/music/discovered?section=added_today&limit=10").then((r) => r.json()).catch(() => null),
          fetch("/api/music/discovered?section=recently_discovered&limit=15").then((r) => r.json()).catch(() => null),
          fetch("/api/music/discovered?section=status").then((r) => r.json()).catch(() => null),
        ]);
        if (todayRes?.tracks) setAddedTodaySongs(todayRes.tracks);
        if (recentRes?.tracks) setRecentlyDiscoveredSongs(recentRes.tracks);
        if (statusRes?.lastSync?.finishedAt) setLastSyncTimestamp(statusRes.lastSync.finishedAt);
      }
    } catch (err) {
      console.error("Discovery refresh failed:", err);
    } finally {
      setIsRefreshingDiscovery(false);
    }
  }, []);

  // 2. Country Change handler: Re-fetch trending data for chosen country
  const handleCountrySelect = useCallback(async (code: string) => {
    setSelectedCountry(code);
    setShowCountryModal(false);
    const match = SUPPORTED_COUNTRIES.find((c) => c.code === code) || SUPPORTED_COUNTRIES[0];
    setCountryInfo(match);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cinova_selected_country", code);
      } catch (_) {}
    }

    try {
      const res = await fetch(`/api/music/trending?country=${code}&limit=20`);
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.tracks)) setTrendingSongs(data.tracks);
        if (Array.isArray(data.topCharts)) setTopChartsSongs(data.topCharts);
        if (typeof data.isLive === "boolean") setIsLiveTrending(data.isLive);
        if (data.dataSource) setTrendingDataSource(data.dataSource);
        if (data.fallbackReason) setFallbackReason(data.fallbackReason);
      }
    } catch (e) {
      console.error("Failed to fetch regional music:", e);
    }
  }, []);

  // 3. Category Filter handler
  const handleCategorySelect = useCallback(async (slug: string) => {
    setActiveCategorySlug(slug);
    if (slug === "trending") {
      setCategoryTracks([]);
      return;
    }

    setIsCategoryLoading(true);
    try {
      const res = await fetch(`/api/music/categories?category=${slug}&limit=20`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.tracks)) {
        setCategoryTracks(data.tracks);
      } else {
        setCategoryTracks([]);
      }
    } catch (err) {
      console.error(`Failed to load category ${slug}:`, err);
      setCategoryTracks([]);
    } finally {
      setIsCategoryLoading(false);
    }
  }, []);

  // 4. Independent Music Genre Filter handler
  const handleIndependentGenreSelect = useCallback(async (genreId: string) => {
    setSelectedIndependentGenre(genreId);
    setIsIndependentLoading(true);
    try {
      const res = await fetch(`/api/music/independent?genre=${genreId}&limit=16`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.tracks)) {
        setIndependentTracks(data.tracks);
      } else {
        setIndependentTracks([]);
      }
    } catch (err) {
      console.error(`Failed to load independent music for ${genreId}:`, err);
      setIndependentTracks([]);
    } finally {
      setIsIndependentLoading(false);
    }
  }, []);

  // 5. Smart Search handler with typo-tolerance, tabs, and language filter
  const performSearch = useCallback(async (q: string, tab: string, lang: string) => {
    // Abort prior in-flight search request to prevent race conditions
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchArtists([]);
      setSearchAlbums([]);
      setDidYouMean(null);
      setNextPageToken(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setNextPageToken(null);

    try {
      const langParam = lang && lang !== "all" ? `&language=${encodeURIComponent(lang)}` : "";
      const tabParam = tab ? `&tab=${encodeURIComponent(tab)}` : "";
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(trimmed)}${langParam}${tabParam}&limit=24`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (data?.success) {
        setSearchResults(Array.isArray(data.tracks) ? data.tracks : []);
        setSearchArtists(Array.isArray(data.artists) ? data.artists : []);
        setSearchAlbums(Array.isArray(data.albums) ? data.albums : []);
        setDidYouMean(data.didYouMean || null);
        setNextPageToken(data.nextPageToken || null);
      } else {
        setSearchResults([]);
        setSearchArtists([]);
        setSearchAlbums([]);
        setDidYouMean(null);
        setNextPageToken(null);
        if (data?.error) setSearchError(data.error);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setSearchError("Unable to reach search servers. Please check your internet connection.");
      setSearchResults([]);
      setSearchArtists([]);
      setSearchAlbums([]);
      setNextPageToken(null);
    } finally {
      if (searchAbortRef.current === controller) {
        setIsSearching(false);
      }
    }
  }, []);

  // Handle Load More Songs from YouTube
  const handleLoadMore = useCallback(async () => {
    if (!nextPageToken || isLoadingMore || !searchQuery.trim()) return;
    setIsLoadingMore(true);

    try {
      const langParam = activeSearchLang && activeSearchLang !== "all" ? `&language=${encodeURIComponent(activeSearchLang)}` : "";
      const tabParam = activeSearchTab ? `&tab=${encodeURIComponent(activeSearchTab)}` : "";
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(searchQuery.trim())}&pageToken=${encodeURIComponent(
          nextPageToken
        )}${langParam}${tabParam}&limit=18`
      );
      const data = await res.json();
      if (data?.success && Array.isArray(data.tracks)) {
        setSearchResults((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const newUnique = data.tracks.filter((t: Song) => !seen.has(t.id));
          return [...prev, ...newUnique];
        });
        setNextPageToken(data.nextPageToken || null);
      } else {
        setNextPageToken(null);
      }
    } catch (e) {
      console.warn("Failed to load more results:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, isLoadingMore, searchQuery, activeSearchLang, activeSearchTab]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchArtists([]);
      setSearchAlbums([]);
      setDidYouMean(null);
      setIsSearching(false);
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      performSearch(searchQuery, activeSearchTab, activeSearchLang);
    }, 250);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, activeSearchTab, activeSearchLang, performSearch]);

  const handleAcceptDidYouMean = useCallback((corrected: string) => {
    setSearchQuery(corrected);
    performSearch(corrected, activeSearchTab, activeSearchLang);
  }, [activeSearchTab, activeSearchLang, performSearch]);

  const handleScrollToExplore = () => {
    const el = document.getElementById("trending-country-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pb-36 pt-24 sm:pt-28 px-3 sm:px-6 lg:px-10 max-w-[1600px] mx-auto select-none bg-gradient-to-b from-[#080205] via-[#0D0408] to-[#080205] text-[#F5F1F3]">
      {/* 1. TOP BAR: YouTube-Style Smart Search Bar (Zero overlap with fixed CINOVA Navbar) */}
      <MusicSearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSearchSubmit={(q) => performSearch(q, activeSearchTab, activeSearchLang)}
        activeTab={activeSearchTab}
        onTabChange={setActiveSearchTab}
        activeLanguage={activeSearchLang}
        onLanguageChange={setActiveSearchLang}
        didYouMean={didYouMean}
        onAcceptDidYouMean={handleAcceptDidYouMean}
        isSearching={isSearching}
      />

      {/* 2. MUSIC TITLE & TAGLINE */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Music2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          <span>Music</span>
        </h1>
        <p className="text-xs text-[#AAA0A7] mt-0.5">
          Discover. Play. Feel the Music — 25+ Worldwide Languages &amp; Regional Hits.
        </p>
      </div>

      {/* 2.1 AUTOMATIC DAILY 24-HOUR DISCOVERY STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2.5 sm:p-3 rounded-2xl bg-[#13070E]/85 border border-[rgba(225,29,72,0.22)] text-xs text-[#AAA0A7]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white">Daily 24-Hour Discovery Active</span>
          <span className="text-[#554b52] hidden sm:inline">•</span>
          <span className="text-[11px] text-[#8A7D85]">
            Last updated:{" "}
            <strong className="text-[#F5F1F3]">
              {lastSyncTimestamp
                ? new Date(lastSyncTimestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Today at 03:00 UTC"}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleTriggerDiscoveryRefresh}
          disabled={isRefreshingDiscovery}
          className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1E0915] hover:bg-[#2C0E20] border border-[rgba(225,29,72,0.35)] text-[#FF385B] hover:text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          title="Manually trigger 24-hr daily discovery refresh"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshingDiscovery ? "animate-spin" : ""}`} />
          <span>{isRefreshingDiscovery ? "Discovering..." : "Scan Daily Releases"}</span>
        </button>
      </div>

      {/* 3. CATEGORY FILTER PILLS (Matching Reference: Trending, Hindi, Punjabi, Marathi, English, Devotional, More) */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "trending", label: "Trending" },
            { id: "hindi", label: "Hindi" },
            { id: "punjabi", label: "Punjabi" },
            { id: "marathi", label: "Marathi" },
            { id: "romantic", label: "Romantic" },
            { id: "party", label: "Party" },
            { id: "devotional", label: "Devotional" },
            { id: "english", label: "English" },
          ].map((cat) => {
            const isActive = activeCategorySlug === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-[#FF385B] text-white shadow-[0_4px_18px_rgba(255,56,91,0.45)]"
                    : "bg-[#180A12] hover:bg-[#250E1D] text-[#AAA0A7] hover:text-white border border-[rgba(155,25,57,0.3)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          {/* More Categories Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreCategories((prev) => !prev)}
              className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-[#180A12] hover:bg-[#250E1D] text-[#AAA0A7] hover:text-white border border-[rgba(155,25,57,0.3)] flex items-center gap-1.5 transition-all"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showMoreCategories && (
              <div className="absolute left-0 mt-2 z-40 w-44 rounded-2xl bg-[#14060E] border border-[rgba(225,29,72,0.35)] shadow-2xl p-2 space-y-1 animate-fade-in">
                {[
                  { id: "romantic", label: "Romantic Hits" },
                  { id: "party", label: "Party Bangers" },
                  { id: "old-classics", label: "Old Classics" },
                  { id: "sad-songs", label: "Sad Melodies" },
                  { id: "latest-releases", label: "Latest Releases" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleCategorySelect(item.id);
                      setShowMoreCategories(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activeCategorySlug === item.id
                        ? "bg-[#FF385B] text-white font-bold"
                        : "text-[#AAA0A7] hover:text-white hover:bg-[#200A15]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH ACTIVE VIEW: Displays full-width search results when typing */}
      {searchQuery.trim() ? (
        <div className="space-y-6 mb-12 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[rgba(155,25,57,0.25)] pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white">
              Search Results for <span className="text-[#FF385B]">&quot;{searchQuery}&quot;</span>
              {activeSearchLang !== "all" && (
                <span className="ml-2 text-xs font-normal text-[#AAA0A7] capitalize">
                  in {activeSearchLang}
                </span>
              )}
            </h2>
            <span className="text-xs font-mono text-[#AAA0A7]">
              {searchResults.length} tracks found
            </span>
          </div>

          {isSearching && (
            <div className="flex items-center justify-center py-12 text-[#FF385B] gap-2 text-sm font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching worldwide music catalogue...</span>
            </div>
          )}

          {searchError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs text-center">
              {searchError}
            </div>
          )}

          {/* Tab: Artists */}
          {activeSearchTab === "artists" && (
            <div>
              {searchArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#AAA0A7] text-xs">
                  No matching artists found for &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}

          {/* Tab: Albums */}
          {activeSearchTab === "albums" && (
            <div>
              {searchAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#AAA0A7] text-xs">
                  No matching albums found for &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}

          {/* Tab: All / Songs / Videos */}
          {(activeSearchTab === "all" || activeSearchTab === "songs" || activeSearchTab === "videos") && (
            <div className="space-y-6">
              {activeSearchTab === "all" && searchArtists.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF385B] mb-3">
                    Matching Artists
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {searchArtists.slice(0, 6).map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div>
                  {activeSearchTab === "all" && searchArtists.length > 0 && (
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF385B] mb-3">
                      Songs &amp; Videos
                    </h3>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {searchResults.map((song) => (
                      <SongCard key={song.id} song={song} queueContext={searchResults} aspectRatio="landscape" />
                    ))}
                  </div>

                  {/* Load More Button for Live YouTube Search Results */}
                  {nextPageToken && (
                    <div className="flex justify-center pt-8 pb-4">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold bg-[#1B0814] hover:bg-[#2C0E21] border border-[rgba(225,29,72,0.4)] hover:border-[#FF385B] text-white transition-all shadow-[0_4px_18px_rgba(0,0,0,0.5)] flex items-center gap-2 active:scale-95 disabled:opacity-60"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#FF385B]" />
                            <span>Loading more songs from YouTube...</span>
                          </>
                        ) : (
                          <>
                            <Youtube className="w-4 h-4 text-[#FF385B]" />
                            <span>Load More Songs from YouTube</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isSearching && searchResults.length === 0 && !searchError && (
                <div className="text-center py-16 text-[#AAA0A7] text-xs">
                  No matching tracks found for &quot;{searchQuery}&quot;. Try searching for an artist like Arijit Singh, Karan Aujla, ROSÉ, or The Weeknd.
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeCategorySlug !== "trending" ? (
        /* CATEGORY FILTERED VIEW: When user clicks Hindi, Punjabi, Marathi, etc. */
        <div className="space-y-6 mb-12 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[rgba(155,25,57,0.25)] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-white capitalize">
              {activeCategorySlug} Catalogue
            </h2>
            <button
              type="button"
              onClick={() => handleCategorySelect("trending")}
              className="text-xs text-[#FF385B] hover:underline"
            >
              ← Back to Trending Dashboard
            </button>
          </div>

          {isCategoryLoading ? (
            <div className="flex items-center justify-center py-16 text-[#FF385B] gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading {activeCategorySlug} music...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {categoryTracks.map((song) => (
                <SongCard key={song.id} song={song} queueContext={categoryTracks} aspectRatio="landscape" />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MAIN DASHBOARD: EXACT LAYOUT OF THE REFERENCE IMAGE + WORLDWIDE DISCOVERY */
        <>
          {/* 4. SPLIT HERO & TOP CHARTS LAYOUT (Desktop 2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mb-10">
            {/* Left Column (Hero Banner ~70%) */}
            <div className="lg:col-span-8 flex flex-col justify-start">
              <MusicHeroBanner tracks={trendingSongs} />
            </div>

            {/* Right Column (Top Charts & Feel the Beat Card ~30%) */}
            <div className="lg:col-span-4 flex flex-col justify-start">
              <TopChartsWidget
                tracks={topChartsSongs.length > 0 ? topChartsSongs : trendingSongs}
                onExploreClick={handleScrollToExplore}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. FIRST POSITION DIRECTLY BELOW HERO BANNER: TRENDING IN INDIA          */}
          {/* ========================================================================= */}
          <section id="trending-country-section" className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-[#FF385B]" />
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Trending in {countryInfo.name}</span>
                  <span className="text-base">{countryInfo.flag}</span>
                </h2>
                {/* Fallback vs Live Badge (Explicitly labeled) */}
                {trendingDataSource === "curated_fallback" ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"
                    title={fallbackReason || "Verified regional catalogue active"}
                  >
                    Curated Fallback
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0"
                    title="Live YouTube Data API feed active"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Charts
                  </span>
                )}
                <button
                  type="button"
                  data-testid="change-country-btn"
                  onClick={() => setShowCountryModal(true)}
                  className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1C0914] hover:bg-[#2A0C1E] border border-[rgba(225,29,72,0.35)] text-[#FF385B] hover:text-white transition-all flex items-center gap-1 shrink-0"
                  title="Change Country"
                >
                  <Globe2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleScrollToExplore}
                className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Horizontal Scrollable Row with Real 1080p Video Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {trendingSongs.slice(0, 10).map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  queueContext={trendingSongs}
                  aspectRatio="landscape"
                />
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. INDIAN NEW RELEASES & DAILY DISCOVERY (IMMEDIATELY AFTER)              */}
          {/* ========================================================================= */}
          {/* DAILY DISCOVERY SECTION 1: ADDED TODAY */}
          {addedTodaySongs.length > 0 && (
            <section className="mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF385B] to-[#D90429] flex items-center justify-center shadow-[0_2px_12px_rgba(255,56,91,0.45)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Added Today</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FF385B] text-white">
                        DAILY 24H
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Fresh commercial releases discovered in the past 24 hours across global regions
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {addedTodaySongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={{ ...song, isNew: true }}
                    queueContext={addedTodaySongs}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* DAILY DISCOVERY SECTION 2: RECENTLY DISCOVERED (PAST 7 DAYS) */}
          {recentlyDiscoveredSongs.length > 0 && (
            <section className="mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/35 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#FF385B]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Recently Discovered &amp; New Releases</span>
                      <span className="text-sm">🚀</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Rising chartbusters and new commercial releases marked with a 7-day NEW badge
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {recentlyDiscoveredSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={{ ...song, isNew: true }}
                    queueContext={recentlyDiscoveredSongs}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* 3. EXPANDED MARATHI MUSIC POWERHOUSE (14 CATEGORIES & 33+ GENUINE TRACKS) */}
          {/* ========================================================================= */}
          <section className="mb-10 p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1B0512]/95 via-[#13030D]/90 to-[#0A0107]/95 border border-[rgba(225,29,72,0.32)] shadow-[0_14px_45px_rgba(0,0,0,0.65)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF385B] to-[#A30D32] flex items-center justify-center text-white shadow-[0_2px_12px_rgba(255,56,91,0.4)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Marathi Music Collection</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FF385B] text-white">
                      33+ TRACKS
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#AAA0A7]">
                    Trending hits, Ajay-Atul symphonies, Natarang Lavani, classic Bhavgeet &amp; Vitthal Bhakti
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCategorySelect("marathi")}
                className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group self-start sm:self-center"
              >
                <span>Full Marathi Catalogue</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Subcategory Pills for 14 Marathi categories */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 mb-5">
              {MARATHI_CATEGORIES.map((mcat) => {
                const isActive = activeMarathiCategory === mcat.id;
                return (
                  <button
                    key={mcat.id}
                    type="button"
                    onClick={() => setActiveMarathiCategory(mcat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-[#FF385B] text-white shadow-[0_2px_10px_rgba(255,56,91,0.4)] font-bold"
                        : "bg-[#10030A] hover:bg-[#200716] text-[#AAA0A7] hover:text-white border border-[rgba(225,29,72,0.2)]"
                    }`}
                  >
                    {mcat.label}
                  </button>
                );
              })}
            </div>

            {/* Responsive Track Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {marathiShowcaseTracks.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  queueContext={marathiShowcaseTracks}
                  aspectRatio="landscape"
                />
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. INDIAN MUSIC GENRE COLLECTIONS                                         */}
          {/* ========================================================================= */}
          {/* ROMANTIC MELODIES & LOVE ANTHEMS */}
          {romanticTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[#FF385B] fill-[#FF385B]/30" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Romantic Melodies &amp; Love Anthems
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Soulful Bollywood love ballads &amp; heartfelt duets
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("romantic")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {romanticTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={romanticTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* HIGH-ENERGY PUNJABI BANGERS */}
          {punjabiTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      High-Energy Punjabi Bangers
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Chart-topping Desi hip-hop, Bhangra &amp; Urban hits
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("punjabi")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {punjabiTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={punjabiTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* PARTY ANTHEMS & CLUB DANCEFLOOR */}
          {partyTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
                    <PartyPopper className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Party Anthems &amp; Club Dancefloor
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Electrifying dance tracks for your ultimate party vibes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("party")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {partyTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={partyTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* LATE NIGHT & HEARTBREAK BALLADS */}
          {sadTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <CloudRain className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Late Night &amp; Heartbreak Ballads
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Emotional acoustics &amp; heartfelt late-night solace
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("sad-songs")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {sadTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={sadTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* SUFI & DEVOTIONAL SERENITY */}
          {devotionalTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Sufi &amp; Devotional Serenity
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Spiritual peace, divine chants &amp; soulful Sufi melodies
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("devotional")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {devotionalTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={devotionalTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* RETRO GOLDEN ERA & VINTAGE CLASSICS */}
          {retroTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Retro Golden Era &amp; Vintage Classics
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Evergreen nostalgic gems that define the golden age
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("old-classics")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {retroTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={retroTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* FOR YOU (Recommended Songs) */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  For You
                </h3>
              </div>

              <Link
                href="#top-charts"
                className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {trendingSongs.slice(5, 15).map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  queueContext={trendingSongs}
                  aspectRatio="landscape"
                />
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. WORLDWIDE MUSIC DISCOVERY (KEPT BELOW INDIAN MUSIC SECTIONS)           */}
          {/* ========================================================================= */}
          {/* WORLDWIDE DISCOVERY 1: GLOBAL TOP SONGS & WORLDWIDE TRENDING */}
          {globalTopSongs.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/35 flex items-center justify-center">
                    <Globe2 className="w-4 h-4 text-[#FF385B]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Global Top Songs &amp; Worldwide Trending</span>
                      <span className="text-sm">🌐</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      The most viral, billion-stream record breakers across the globe
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {globalTopSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={globalTopSongs}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 2: POPULAR KOREAN MUSIC (K-POP HITS) */}
          {koreanHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/35 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Popular Korean Music (K-Pop Hits)</span>
                      <span className="text-sm">🇰🇷</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Global sensation hits from ROSÉ, BTS, Jung Kook, PSY &amp; BLACKPINK
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("korean")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {koreanHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={koreanHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 3: LATIN & REGGAETON CHARTBUSTERS */}
          {latinHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/35 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Latin &amp; Reggaeton Chartbusters</span>
                      <span className="text-sm">💃</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      High-tempo Latin rhythms from Luis Fonsi, Daddy Yankee, Don Omar &amp; Enrique Iglesias
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("spanish")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {latinHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={latinHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 4: POPULAR JAPANESE MUSIC (J-POP & ANIME) */}
          {japaneseHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/35 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Popular Japanese Music (J-Pop &amp; Anime)</span>
                      <span className="text-sm">🇯🇵</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Record-shattering J-Pop anthems from YOASOBI, Kenshi Yonezu &amp; Anime OSTs
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("japanese")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {japaneseHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={japaneseHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 5: ARABIC & MIDDLE EASTERN SOUL */}
          {arabicHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Arabic &amp; Middle Eastern Soul</span>
                      <span className="text-sm">🌙</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Timeless classics &amp; modern viral hits from Amr Diab, Balti &amp; Hamouda
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("arabic")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {arabicHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={arabicHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 6: EUROPEAN & GLOBAL BEATS */}
          {europeanHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/35 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>European &amp; Global Beats</span>
                      <span className="text-sm">🌍</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Iconic French, German, Portuguese, Russian &amp; Turkish cross-cultural hits
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {europeanHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={europeanHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 7: INDIAN REGIONAL MASTERPIECES */}
          {indianRegionalHits.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/35 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Indian Regional Masterpieces</span>
                      <span className="text-sm">🇮🇳</span>
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Blockbuster Tamil, Telugu, Malayalam, Kannada, Gujarati, Bengali &amp; Urdu gems
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {indianRegionalHits.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={indianRegionalHits}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 8: GLOBAL POP & INTERNATIONAL CHARTBUSTERS */}
          {globalPopTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <Globe2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Global Pop &amp; International Chartbusters
                    </h3>
                    <p className="text-[11px] text-[#AAA0A7] hidden sm:block">
                      Record-breaking global smash hits dominating worldwide charts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("english")}
                  className="text-xs font-bold text-[#FF385B] hover:text-[#E11D48] transition-colors flex items-center gap-1 group"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {globalPopTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={globalPopTracks}
                    aspectRatio="landscape"
                  />
                ))}
              </div>
            </section>
          )}

          {/* WORLDWIDE DISCOVERY 9: DISCOVER BY LANGUAGE (25+ Languages Matrix) */}
          <section className="mb-12 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#170811] via-[#1F0A17] to-[#170811] border border-[rgba(225,29,72,0.25)] shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <Languages className="w-5 h-5 text-[#FF385B]" />
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Discover Music in 25+ Languages
                </h3>
                <p className="text-xs text-[#AAA0A7]">
                  Click any language to explore authentic regional and international tracks instantly
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {WORLDWIDE_DISCOVERY_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleCategorySelect(lang.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                    activeCategorySlug === lang.id
                      ? "bg-[#FF385B] text-white shadow-[0_2px_12px_rgba(255,56,91,0.5)] font-bold"
                      : "bg-[#10040B] text-[#D4CAD0] hover:text-white hover:bg-[#250B1B] border border-[rgba(225,29,72,0.2)]"
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 15. TRENDING SOUNDTRACKS & ALBUMS */}
          {popularAlbums.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Trending Soundtracks &amp; Albums
                </h3>
                <span className="text-xs text-[#AAA0A7]">Blockbuster Releases</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {popularAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          {/* 8. POPULAR ARTISTS */}
          {popularArtists.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Popular Artists
                </h3>
                <span className="text-xs text-[#AAA0A7]">Chart-Toppers</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {popularArtists.slice(0, 6).map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {/* 9. FREE INDEPENDENT MUSIC SECTION (Honest Native Audio Playback) */}
          <section id="free-independent-music" className="mb-12 pt-4 border-t border-[rgba(155,25,57,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Free Independent Music
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    CC Commercial Licensed
                  </span>
                </div>
                <p className="text-xs text-[#AAA0A7] mt-0.5">
                  100% Free full-length native HTML5 audio stream for Supabase authenticated members.
                </p>
              </div>

              {/* Genre Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {INDEPENDENT_GENRES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleIndependentGenreSelect(g.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedIndependentGenre === g.id
                        ? "bg-[#E11D48] text-white"
                        : "bg-[#180A12] text-[#AAA0A7] hover:text-white"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {isIndependentLoading ? (
              <div className="flex items-center justify-center py-12 text-[#FF385B] gap-2 text-sm font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading licensed independent tracks...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {independentTracks.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={independentTracks}
                    aspectRatio="square"
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* COUNTRY SELECTOR MODAL */}
      {showCountryModal && (
        <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#12050E] border border-[rgba(225,29,72,0.4)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(155,25,57,0.25)]">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#FF385B]" />
                <h3 className="text-base font-bold text-white">Select Your Country / Region</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="p-1 rounded-full text-[#AAA0A7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#AAA0A7]">
              Trending music and charts will immediately adapt to show what is genuinely popular in your selected region.
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
              {SUPPORTED_COUNTRIES.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    data-testid={`country-option-${c.code}`}
                    onClick={() => handleCountrySelect(c.code)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#E11D48]/25 border border-[#FF385B] text-white shadow-md"
                        : "bg-[#1A0A14] hover:bg-[#250E1D] text-[#F5F1F3] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#FF385B]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCountryModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1E0914] hover:bg-[#2A0C1C] text-xs font-bold text-white border border-[rgba(155,25,57,0.3)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
