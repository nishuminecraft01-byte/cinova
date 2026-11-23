"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Movie, WatchProgress, CreatorSubmission, ContentType } from "@/types/movie";
import { SAMPLE_MOVIES } from "@/data/movies";
import { POPULAR_TMDB_CATALOG, convertCatalogItemToMovie } from "@/lib/tmdb";
import { useAuth } from "@/context/AuthContext";

export interface ProgressUpdateDetails {
  title?: string;
  contentType?: ContentType;
  posterUrl?: string;
  backdropUrl?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  completed?: boolean;
  immediateSync?: boolean;
}

interface WatchlistContextType {
  watchlist: string[];
  continueWatching: WatchProgress[];
  movies: Movie[];
  submissions: CreatorSubmission[];
  addToWatchlist: (movieId: string) => void;
  removeFromWatchlist: (movieId: string) => void;
  toggleWatchlist: (movieId: string) => void;
  isInWatchlist: (movieId: string) => boolean;
  updateProgress: (
    movieId: string,
    progressSeconds: number,
    durationSeconds: number,
    details?: ProgressUpdateDetails
  ) => void;
  removeFromHistory: (movieId: string, seasonNumber?: number, episodeNumber?: number) => void;
  clearHistory: () => void;
  syncCloudHistory: () => Promise<void>;
  getMovieById: (id: string) => Movie | undefined;
  addMovie: (movie: Movie) => void;
  updateMovie: (movieId: string, updates: Partial<Movie>) => void;
  deleteMovie: (movieId: string) => void;
  addSubmission: (submission: Omit<CreatorSubmission, "id" | "submittedAt" | "status">) => void;
  updateSubmissionStatus: (submissionId: string, status: CreatorSubmission["status"], notes?: string) => void;
  autoIngestTmdb: (tmdbIdOrTitle: string) => Movie;
  ingestAllCatalog: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>([]);
  const [movies, setMovies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);

  // Throttling and debounce refs to prevent React state thrashing during high-frequency HTML5 playback
  const lastStateUpdateRef = useRef<Map<string, number>>(new Map());
  const pendingSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPayloadsRef = useRef<Map<string, any>>(new Map());

  // Load from localStorage on mount and merge with verified catalog
  useEffect(() => {
    try {
      const canonicalById = new Map(SAMPLE_MOVIES.map((m) => [m.id, m]));
      const canonicalTmdbIds = new Set(SAMPLE_MOVIES.map((m) => m.tmdbId).filter(Boolean));
      const mergedMap = new Map<string, Movie>();

      // Start with verified canonical catalog first
      SAMPLE_MOVIES.forEach((m) => mergedMap.set(m.id, m));

      const savedMovies = localStorage.getItem("cinova_custom_movies");
      if (savedMovies) {
        const parsed: Movie[] = JSON.parse(savedMovies);
        let hasCustom = false;
        if (Array.isArray(parsed)) {
          // Preserve user-added custom titles while replacing stale Unsplash artwork and skipping duplicates
          parsed.forEach((stored) => {
            if (!stored?.id || canonicalById.has(stored.id)) return;
            if (stored.tmdbId && canonicalTmdbIds.has(stored.tmdbId)) return;
            hasCustom = true;
            const sanitized: Movie = {
              ...stored,
              posterUrl: stored.posterUrl?.includes("unsplash.com") ? "" : stored.posterUrl,
              backdropUrl: stored.backdropUrl?.includes("unsplash.com") ? "" : stored.backdropUrl,
            };
            mergedMap.set(sanitized.id, sanitized);
          });
        }

        if (hasCustom) {
          setMovies(Array.from(mergedMap.values()));
        }
      }

      // Build lookup map for validating saved watchlist & progress IDs (prevents ghost badge counts)
      const validLookup = new Map<string, string>();
      mergedMap.forEach((m) => {
        validLookup.set(m.id, m.id);
        if (m.tmdbId) {
          validLookup.set(m.tmdbId, m.id);
          validLookup.set(`tmdb-${m.tmdbId}`, m.id);
        }
      });

      const savedWatchlist = localStorage.getItem("cinova_watchlist");
      if (savedWatchlist) {
        const parsedList: unknown = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedList)) {
          const isLegacyFakeSeed =
            parsedList.length === 3 &&
            parsedList[0] === "dune" &&
            parsedList[1] === "tmdb-635302" &&
            parsedList[2] === "tmdb-127532";

          if (isLegacyFakeSeed) {
            setWatchlist([]);
            localStorage.setItem("cinova_watchlist", JSON.stringify([]));
          } else {
            const validUniqueIds = Array.from(
              new Set(
                parsedList
                  .filter((id): id is string => typeof id === "string")
                  .map((id) => validLookup.get(id))
                  .filter((resolved): resolved is string => Boolean(resolved))
              )
            );
            setWatchlist(validUniqueIds);
            localStorage.setItem("cinova_watchlist", JSON.stringify(validUniqueIds));
          }
        }
      }

      const savedProgress = localStorage.getItem("cinova_continue_watching");
      if (savedProgress) {
        const parsedProgress: unknown = JSON.parse(savedProgress);
        if (Array.isArray(parsedProgress)) {
          const validProgress = (parsedProgress as WatchProgress[]).filter(
            (item) => item?.movieId && validLookup.has(item.movieId)
          );
          setContinueWatching(validProgress);
        }
      }

      const savedSubmissions = localStorage.getItem("cinova_submissions");
      if (savedSubmissions) {
        const parsedSubs: unknown = JSON.parse(savedSubmissions);
        if (Array.isArray(parsedSubs)) {
          setSubmissions(parsedSubs as CreatorSubmission[]);
        }
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // O(1) lookup structures to avoid scanning arrays across 200+ cards
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  const movieLookup = useMemo(() => {
    const map = new Map<string, Movie>();
    for (const m of movies) {
      map.set(m.id, m);
      map.set(m.id.toLowerCase(), m);
      const titleSlug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      map.set(titleSlug, m);
      if (m.tmdbId) {
        map.set(m.tmdbId, m);
        map.set(`tmdb-${m.tmdbId}`, m);
        map.set(`tmdb-movie-${m.tmdbId}`, m);
        map.set(`tmdb-tv-${m.tmdbId}`, m);
        map.set(`movie-${m.tmdbId}`, m);
        map.set(`tv-${m.tmdbId}`, m);
      }
    }
    return map;
  }, [movies]);

  const addToWatchlist = useCallback((movieId: string) => {
    setWatchlist((prev) => {
      if (prev.includes(movieId)) return prev;
      const updated = [...prev, movieId];
      localStorage.setItem("cinova_watchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((id) => id !== movieId);
      localStorage.setItem("cinova_watchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleWatchlist = useCallback((movieId: string) => {
    setWatchlist((prev) => {
      const updated = prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId];
      localStorage.setItem("cinova_watchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((movieId: string) => watchlistSet.has(movieId), [watchlistSet]);

  // Synchronize authenticated user history from cloud database (/api/history)
  const syncCloudHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data?.authenticated) {
        const cloudItems: WatchProgress[] = Array.isArray(data.continueWatching)
          ? data.continueWatching
          : [];

        setContinueWatching((prev) => {
          const map = new Map<string, WatchProgress>();
          // Cloud items take precedence
          cloudItems.forEach((item) => {
            const key = `${item.movieId}:${item.seasonNumber ?? 0}:${item.episodeNumber ?? 0}`;
            map.set(key, item);
          });
          // Merge local items not in cloud yet
          prev.forEach((item) => {
            const key = `${item.movieId}:${item.seasonNumber ?? 0}:${item.episodeNumber ?? 0}`;
            if (!map.has(key)) {
              map.set(key, item);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
          );
          try {
            localStorage.setItem("cinova_continue_watching", JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (e) {
      console.warn("[CINOVA Watchlist] History cloud sync error:", e);
    }
  }, [user?.id]);

  // Automatically sync when user logs in / auth changes
  useEffect(() => {
    if (user?.id) {
      syncCloudHistory();
    } else {
      // For logged out viewers, keep history local only
      try {
        const savedProgress = localStorage.getItem("cinova_continue_watching");
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          if (Array.isArray(parsed)) setContinueWatching(parsed);
        }
      } catch {}
    }
  }, [user?.id, syncCloudHistory]);

  // Flush pending watch progress payloads to the server
  const flushPendingSync = useCallback(async () => {
    if (pendingSyncTimerRef.current) {
      clearTimeout(pendingSyncTimerRef.current);
      pendingSyncTimerRef.current = null;
    }

    const payloads = Array.from(pendingPayloadsRef.current.values());
    if (payloads.length === 0 || !user?.id) return;
    pendingPayloadsRef.current.clear();

    for (const payload of payloads) {
      try {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
  }, [user?.id]);

  // Cleanly flush on unload/pagehide
  useEffect(() => {
    const handleUnload = () => {
      flushPendingSync();
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      flushPendingSync();
    };
  }, [flushPendingSync]);

  const updateProgress = useCallback(
    (
      movieId: string,
      progressSeconds: number,
      durationSeconds: number,
      details?: ProgressUpdateDetails
    ) => {
      if (!movieId) return;
      const cleanId = movieId.trim();
      const season = details?.seasonNumber;
      const episode = details?.episodeNumber;
      const itemKey = `${cleanId}:${season ?? 0}:${episode ?? 0}`;

      const progressSec = Math.max(0, Math.floor(progressSeconds));
      const durationSec = Math.max(0, Math.floor(durationSeconds));
      const isDone = details?.completed ?? (durationSec > 0 && progressSec / durationSec >= 0.92);
      const percentage = durationSec > 0 ? Math.min(100, Math.round((progressSec / durationSec) * 100)) : 0;

      // Throttle React state updates to avoid re-rendering 4 times/sec
      const lastSavedSec = lastStateUpdateRef.current.get(itemKey) ?? -999;
      const hasSignificantChange = Math.abs(progressSec - lastSavedSec) >= 3 || isDone || details?.immediateSync;

      const record: WatchProgress = {
        movieId: cleanId,
        contentId: cleanId,
        title: details?.title,
        contentType: details?.contentType || (season || episode ? "series" : "movie"),
        posterUrl: details?.posterUrl,
        backdropUrl: details?.backdropUrl,
        seasonNumber: season,
        episodeNumber: episode,
        season,
        episode,
        episodeTitle: details?.episodeTitle,
        progressSeconds: progressSec,
        durationSeconds: durationSec,
        progressPercentage: percentage,
        lastWatched: new Date().toISOString(),
        completed: isDone,
      };

      if (hasSignificantChange) {
        lastStateUpdateRef.current.set(itemKey, progressSec);
        setContinueWatching((prev) => {
          const existingIndex = prev.findIndex(
            (item) =>
              (item.movieId === cleanId || item.contentId === cleanId) &&
              (item.seasonNumber ?? 0) === (season ?? 0) &&
              (item.episodeNumber ?? 0) === (episode ?? 0)
          );
          let updated: WatchProgress[];
          if (existingIndex > -1) {
            updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...record };
          } else {
            updated = [record, ...prev];
          }
          try {
            localStorage.setItem("cinova_continue_watching", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      // Queue network payload for logged-in user
      if (user?.id) {
        const payload = {
          contentId: cleanId,
          title: details?.title || "CINOVA Content",
          contentType: details?.contentType || (season || episode ? "series" : "movie"),
          posterUrl: details?.posterUrl,
          backdropUrl: details?.backdropUrl,
          seasonNumber: season,
          episodeNumber: episode,
          episodeTitle: details?.episodeTitle,
          progressSeconds: progressSec,
          durationSeconds: durationSec,
          completed: isDone,
        };

        pendingPayloadsRef.current.set(itemKey, payload);

        if (details?.immediateSync || isDone) {
          flushPendingSync();
        } else if (!pendingSyncTimerRef.current) {
          pendingSyncTimerRef.current = setTimeout(() => {
            flushPendingSync();
          }, 15000); // Batched update approximately every 15-20 seconds
        }
      }
    },
    [user?.id, flushPendingSync]
  );

  const removeFromHistory = useCallback(
    (movieId: string, seasonNumber?: number, episodeNumber?: number) => {
      const cleanId = movieId.trim();
      setContinueWatching((prev) => {
        const updated = prev.filter((item) => {
          if (item.movieId !== cleanId && item.contentId !== cleanId) return true;
          if (typeof seasonNumber === "number" && item.seasonNumber !== seasonNumber) return true;
          if (typeof episodeNumber === "number" && item.episodeNumber !== episodeNumber) return true;
          return false;
        });
        try {
          localStorage.setItem("cinova_continue_watching", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (user?.id) {
        const seasonParam = typeof seasonNumber === "number" ? `&season=${seasonNumber}` : "";
        const epParam = typeof episodeNumber === "number" ? `&episode=${episodeNumber}` : "";
        fetch(`/api/history?contentId=${encodeURIComponent(cleanId)}${seasonParam}${epParam}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    },
    [user?.id]
  );

  const clearHistory = useCallback(() => {
    setContinueWatching([]);
    try {
      localStorage.removeItem("cinova_continue_watching");
    } catch {}

    if (user?.id) {
      fetch("/api/history?clearAll=true", { method: "DELETE" }).catch(() => {});
    }
  }, [user?.id]);

  // Strict O(1) movie resolver: matches active state or verified TMDB catalog by exact id / tmdbId
  const getMovieById = useCallback(
    (id: string): Movie | undefined => {
      if (!id) return undefined;
      const clean = id.trim();
      const normalizedTmdb = clean.replace(/^tmdb-/, "");

      const found = movieLookup.get(clean) || movieLookup.get(normalizedTmdb);
      if (found) return found;

      // Fallback lookup in verified POPULAR_TMDB_CATALOG
      const catalogItem = POPULAR_TMDB_CATALOG.find(
        (item) =>
          item.id === clean ||
          (item.tmdbId !== undefined &&
            (item.tmdbId === clean || item.tmdbId === normalizedTmdb || `tmdb-${item.tmdbId}` === clean))
      );
      if (catalogItem) {
        return convertCatalogItemToMovie(catalogItem);
      }

      return undefined;
    },
    [movieLookup]
  );

  const addMovie = useCallback((movie: Movie) => {
    setMovies((prev) => {
      const updated = [movie, ...prev.filter((m) => m.id !== movie.id)];
      localStorage.setItem("cinova_custom_movies", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateMovie = useCallback((movieId: string, updates: Partial<Movie>) => {
    setMovies((prev) => {
      const updated = prev.map((m) => (m.id === movieId ? { ...m, ...updates } : m));
      localStorage.setItem("cinova_custom_movies", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteMovie = useCallback((movieId: string) => {
    setMovies((prev) => {
      const updated = prev.filter((m) => m.id !== movieId);
      localStorage.setItem("cinova_custom_movies", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addSubmission = useCallback((submission: Omit<CreatorSubmission, "id" | "submittedAt" | "status">) => {
    const newSubmission: CreatorSubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "Pending",
    };
    setSubmissions((prev) => {
      const updated = [newSubmission, ...prev];
      localStorage.setItem("cinova_submissions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSubmissionStatus = useCallback(
    (
      submissionId: string,
      status: CreatorSubmission["status"],
      notes?: string
    ) => {
      setSubmissions((prev) => {
        const updated = prev.map((sub) => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              status,
              reviewNotes: notes || sub.reviewNotes,
            };
          }
          return sub;
        });
        localStorage.setItem("cinova_submissions", JSON.stringify(updated));

        if (status === "Approved") {
          const sub = prev.find((s) => s.id === submissionId);
          if (sub) {
            const approvedMovie: Movie = {
              id: `creator-${sub.id}`,
              title: sub.title,
              tagline: `A CINOVA Independent Film by ${sub.creatorName}`,
              description: sub.synopsis,
              posterUrl: sub.posterUrl,
              backdropUrl: sub.backdropUrl || sub.posterUrl,
              videoUrl: sub.videoUrl,
              duration: sub.duration,
              releaseYear: sub.releaseYear,
              rating: "PG-13",
              imdbScore: 8.5,
              matchPercentage: 95,
              genre: sub.genre,
              type: sub.type,
              language: sub.language,
              availableLanguages: [sub.language],
              subtitles: ["English"],
              quality: "4K UHD",
              audioSpecs: "Stereo / 5.1",
              directors: [sub.creatorName],
              cast: [{ name: sub.creatorName, character: "Creator & Director" }],
              isRecentlyAdded: true,
              isTrending: true,
              views: 12500,
            };
            addMovie(approvedMovie);
          }
        }
        return updated;
      });
    },
    [addMovie]
  );

  // Auto-ingest single movie by exact verified TMDB ID or exact title match.
  // Never assigns another movie's TMDB ID (such as Iron Man "1726") or random Unsplash photos.
  const autoIngestTmdb = useCallback(
    (tmdbIdOrTitle: string): Movie => {
      const clean = tmdbIdOrTitle.trim();
      const cleanNormalized = clean.toLowerCase();
      const cleanTmdbId = clean.replace(/^tmdb-/, "");
      const isNum = /^\d+$/.test(cleanTmdbId);

      // 1. First check canonical SAMPLE_MOVIES by exact ID, exact TMDB ID, or exact title
      const existingCanonical = SAMPLE_MOVIES.find(
        (m) =>
          m.id.toLowerCase() === cleanNormalized ||
          (isNum && m.tmdbId === cleanTmdbId) ||
          m.title.toLowerCase() === cleanNormalized
      );
      if (existingCanonical) {
        addMovie(existingCanonical);
        return existingCanonical;
      }

      // 2. Check POPULAR_TMDB_CATALOG by exact TMDB ID or exact title (no loose substring collisions)
      const catalogItem = POPULAR_TMDB_CATALOG.find(
        (m) =>
          (isNum && m.tmdbId === cleanTmdbId) ||
          m.title.toLowerCase() === cleanNormalized ||
          (m.originalTitle && m.originalTitle.toLowerCase() === cleanNormalized)
      );

      let movieToAdd: Movie;
      if (catalogItem) {
        movieToAdd = convertCatalogItemToMovie(catalogItem);
      } else {
        const slug = cleanNormalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        movieToAdd = {
          id: isNum ? `tmdb-${cleanTmdbId}` : `custom-${slug || Date.now()}`,
          tmdbId: isNum ? cleanTmdbId : undefined,
          title: clean,
          tagline: "Metadata verification pending",
          description: `${clean} was added to your local catalog. Verify its official TMDB or AniList external ID to load authentic metadata and artwork.`,
          posterUrl: "",
          backdropUrl: "",
          videoUrl: "",
          duration: 0,
          releaseYear: new Date().getFullYear(),
          rating: "PG-13",
          imdbScore: 0,
          matchPercentage: 0,
          genre: ["Uncategorized"],
          type: "movie",
          language: "English",
          availableLanguages: [],
          subtitles: [],
          quality: "1080p FHD",
          audioSpecs: "Stereo",
          directors: [],
          cast: [],
          isTrending: false,
          isPopular: false,
          isRecentlyAdded: true,
          views: 0,
        };
      }

      addMovie(movieToAdd);
      return movieToAdd;
    },
    [addMovie]
  );

  // Ingest all blockbuster titles in one click (strictly deduplicated by id and tmdbId)
  const ingestAllCatalog = useCallback(() => {
    const all = POPULAR_TMDB_CATALOG.map(convertCatalogItemToMovie);
    setMovies((prev) => {
      const byId = new Map<string, Movie>();
      const seenTmdbIds = new Set<string>();

      SAMPLE_MOVIES.forEach((m) => {
        byId.set(m.id, m);
        if (m.tmdbId) seenTmdbIds.add(m.tmdbId);
      });

      prev.forEach((m) => {
        if (byId.has(m.id)) return;
        if (m.tmdbId && seenTmdbIds.has(m.tmdbId)) return;
        byId.set(m.id, m);
        if (m.tmdbId) seenTmdbIds.add(m.tmdbId);
      });

      all.forEach((m) => {
        if (byId.has(m.id)) return;
        if (m.tmdbId && seenTmdbIds.has(m.tmdbId)) return;
        byId.set(m.id, m);
        if (m.tmdbId) seenTmdbIds.add(m.tmdbId);
      });

      const merged = Array.from(byId.values());
      localStorage.setItem("cinova_custom_movies", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const contextValue = useMemo<WatchlistContextType>(
    () => ({
      watchlist,
      continueWatching,
      movies,
      submissions,
      addToWatchlist,
      removeFromWatchlist,
      toggleWatchlist,
      isInWatchlist,
      updateProgress,
      removeFromHistory,
      clearHistory,
      syncCloudHistory,
      getMovieById,
      addMovie,
      updateMovie,
      deleteMovie,
      addSubmission,
      updateSubmissionStatus,
      autoIngestTmdb,
      ingestAllCatalog,
    }),
    [
      watchlist,
      continueWatching,
      movies,
      submissions,
      addToWatchlist,
      removeFromWatchlist,
      toggleWatchlist,
      isInWatchlist,
      updateProgress,
      removeFromHistory,
      clearHistory,
      syncCloudHistory,
      getMovieById,
      addMovie,
      updateMovie,
      deleteMovie,
      addSubmission,
      updateSubmissionStatus,
      autoIngestTmdb,
      ingestAllCatalog,
    ]
  );

  return (
    <WatchlistContext.Provider value={contextValue}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
