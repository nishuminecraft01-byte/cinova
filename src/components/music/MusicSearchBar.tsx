"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  X,
  Mic,
  MicOff,
  Clock,
  Trash2,
  TrendingUp,
  Sparkles,
  Music,
  User,
  Disc3,
  Video,
  CornerDownLeft,
} from "lucide-react";
import { Song, Artist, Album } from "@/types/music";
import { WORLDWIDE_DISCOVERY_LANGUAGES } from "@/lib/api/worldwide-catalogue";

const RECENT_SEARCHES_KEY = "cinova_music_recent_searches";
const MAX_RECENT_SEARCHES = 8;

const TRENDING_SEARCH_SUGGESTIONS = [
  "Tauba Tauba",
  "APT.",
  "Despacito",
  "Chaleya",
  "Zingaat",
  "Shape of You",
  "Naatu Naatu",
  "Idol YOASOBI",
];

const SEARCH_TABS = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "songs", label: "Songs", icon: Music },
  { id: "videos", label: "Videos", icon: Video },
  { id: "artists", label: "Artists", icon: User },
  { id: "albums", label: "Albums", icon: Disc3 },
];

export interface MusicSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeLanguage: string;
  onLanguageChange: (lang: string) => void;
  didYouMean: string | null;
  onAcceptDidYouMean: (corrected: string) => void;
  isSearching?: boolean;
}

export default function MusicSearchBar({
  query,
  onQueryChange,
  onSearchSubmit,
  activeTab,
  onTabChange,
  activeLanguage,
  onLanguageChange,
  didYouMean,
  onAcceptDidYouMean,
  isSearching = false,
}: MusicSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{
    queries: string[];
    tracks: Song[];
    artists: Artist[];
    albums: Album[];
  }>({ queries: [], tracks: [], artists: [], albums: [] });
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
      }
    } catch (_) {}
  }, []);

  // 2. Setup speech recognition if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Save query to recent searches
  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearAllRecent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (_) {}
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Fast autocomplete suggestions while typing (debounced 150ms)
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setSuggestions({ queries: [], tracks: [], artists: [], albums: [] });
      return;
    }

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/music/suggestions?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data?.success) {
          setSuggestions({
            queries: Array.isArray(data.queries) ? data.queries : [],
            tracks: Array.isArray(data.tracks) ? data.tracks.slice(0, 4) : [],
            artists: Array.isArray(data.artists) ? data.artists.slice(0, 3) : [],
            albums: Array.isArray(data.albums) ? data.albums.slice(0, 2) : [],
          });
        }
      } catch (_) {}
    }, 150);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [query]);

  // Voice search toggle
  const toggleVoiceSearch = () => {
    if (!speechSupported || typeof window === "undefined") {
      alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening) {
      if (recognitionRef.current) {
        (recognitionRef.current as any).stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onQueryChange(transcript);
          saveRecentSearch(transcript);
          onSearchSubmit(transcript);
          setIsFocused(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  const handleSelectSuggestion = (text: string) => {
    onQueryChange(text);
    saveRecentSearch(text);
    onSearchSubmit(text);
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearchSubmit(query.trim());
      setIsFocused(false);
    }
  };

  const showDropdown = isFocused;

  return (
    <div ref={containerRef} className="w-full relative z-30 mb-6">
      {/* Search Input Bar (Large rounded YouTube-style search input) */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <Search className="w-5 h-5 text-[#AAA0A7] absolute left-4 pointer-events-none transition-colors" />

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search worldwide songs, artists, albums, lyrics, or language..."
            className="w-full h-12 sm:h-14 pl-12 pr-24 sm:pr-28 rounded-full text-sm sm:text-base bg-[#180913]/95 text-white placeholder-[#8A7D85] border border-[rgba(225,29,72,0.35)] focus:outline-none focus:border-[#FF385B] focus:ring-2 focus:ring-[#FF385B]/30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all"
          />

          {/* Right Action Icons (Clear + Voice + Submit Pill) */}
          <div className="absolute right-3 flex items-center gap-1 sm:gap-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  onQueryChange("");
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full text-[#AAA0A7] hover:text-white hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Voice Search Button */}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-2 rounded-full transition-all ${
                isListening
                  ? "bg-[#FF385B] text-white animate-pulse"
                  : "text-[#AAA0A7] hover:text-white hover:bg-white/10"
              }`}
              title={isListening ? "Listening... Speak now" : "Search with voice"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF385B] to-[#D90429] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_2px_10px_rgba(255,56,91,0.35)]"
            >
              <span>Search</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Autocomplete / Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#14060F]/98 backdrop-blur-2xl border border-[rgba(225,29,72,0.3)] shadow-[0_16px_40px_rgba(0,0,0,0.85)] p-3 sm:p-4 space-y-4 max-h-[460px] overflow-y-auto no-scrollbar animate-fade-in z-50">
          {/* A. Live Matching Search Suggestions & Songs (when query >= 2) */}
          {query.trim().length >= 2 && (
            <div className="space-y-3">
              {suggestions.queries.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF385B] mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Search Suggestions</span>
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.queries.map((sQuery) => (
                      <button
                        key={sQuery}
                        type="button"
                        onClick={() => handleSelectSuggestion(sQuery)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#220B19] text-left text-xs text-[#E0D7DC] hover:text-white transition-colors group"
                      >
                        <Search className="w-3.5 h-3.5 text-[#746971] group-hover:text-[#FF385B] transition-colors shrink-0" />
                        <span className="truncate group-hover:font-medium">{sQuery}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.tracks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF385B] mb-1.5 flex items-center gap-1.5">
                    <Music className="w-3 h-3" />
                    <span>Matching Songs</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.tracks.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(track.title)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#220B19] transition-colors text-left group"
                      >
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black/40 shrink-0">
                          <Image
                            src={track.coverUrl}
                            alt={track.title}
                            fill
                            sizes="36px"
                            className="object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#FF385B] transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-[#8A7D85] truncate">
                            {track.artist} {track.language ? `• ${track.language}` : ""}
                          </p>
                        </div>
                        {track.durationText && (
                          <span className="text-[10px] text-[#746971] shrink-0 font-mono">
                            {track.durationText}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.artists.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF385B] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>Artists</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.artists.map((artist) => (
                      <button
                        key={artist.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(artist.name)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C0916] hover:bg-[#2B0E23] border border-[rgba(225,29,72,0.25)] text-xs text-white transition-all group"
                      >
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-black/40">
                          <Image
                            src={artist.avatarUrl}
                            alt={artist.name}
                            fill
                            sizes="20px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="group-hover:text-[#FF385B] transition-colors">
                          {artist.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#FF385B]" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-[10px] text-[#8A7D85] hover:text-[#FF385B] transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => handleSelectSuggestion(term)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#220B19] cursor-pointer text-xs text-[#E0D7DC] hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-[#746971] group-hover:text-[#FF385B] transition-colors" />
                      <span className="truncate">{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(term, e)}
                      className="p-1 rounded text-[#746971] hover:text-[#FF385B] transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. Quick Trending Search Suggestions */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#FF385B]" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCH_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectSuggestion(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1F0A18] hover:bg-[#330F28] text-[#AAA0A7] hover:text-white border border-[rgba(225,29,72,0.25)] transition-all flex items-center gap-1.5"
                >
                  <Search className="w-2.5 h-2.5 text-[#FF385B]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Did You Mean Banner */}
      {didYouMean && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#220B19] via-[#1D0916] to-[#220B19] border border-[#FF385B]/40 flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 text-[#AAA0A7] min-w-0">
            <Sparkles className="w-4 h-4 text-[#FF385B] shrink-0" />
            <span className="shrink-0">Did you mean:</span>
            <button
              type="button"
              onClick={() => onAcceptDidYouMean(didYouMean)}
              className="font-bold text-[#FF385B] hover:text-white underline decoration-[#FF385B] hover:decoration-white transition-colors truncate text-left"
            >
              &quot;{didYouMean}&quot;
            </button>
          </div>
          <button
            type="button"
            onClick={() => onAcceptDidYouMean(didYouMean)}
            className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF385B] hover:bg-[#E11D48] text-white shrink-0 active:scale-95 transition-all shadow-md"
          >
            Search this instead
          </button>
        </div>
      )}

      {/* Search Result Tabs & Language Quick-Filters (Visible when query is active) */}
      {query.trim() && (
        <div className="mt-4 space-y-3">
          {/* Search Tabs: All, Songs, Videos, Artists, Albums */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[rgba(155,25,57,0.25)] pb-2.5">
            {SEARCH_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#FF385B] text-white shadow-[0_2px_12px_rgba(255,56,91,0.4)]"
                      : "bg-[#180A12] text-[#AAA0A7] hover:text-white hover:bg-[#250E1D] border border-[rgba(155,25,57,0.3)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Language Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-[#8A7D85] uppercase tracking-wider shrink-0 mr-1">
              Language:
            </span>
            {WORLDWIDE_DISCOVERY_LANGUAGES.slice(0, 14).map((lang) => {
              const isActive = activeLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onLanguageChange(lang.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? "bg-white text-black font-bold shadow-md"
                      : "bg-[#1A0A14] text-[#AAA0A7] hover:text-white hover:bg-[#2A0E21] border border-[rgba(155,25,57,0.25)]"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
