"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  Info,
  Check,
  Film,
  Server,
  RefreshCw,
  Share2,
  Bookmark,
  BookmarkCheck,
  Tv,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  Crown,
  Lock,
  Subtitles,
  Languages,
  Sliders,
  Settings,
  AlertTriangle,
} from "lucide-react";
import Hls from "hls.js";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { StreamingServer, Movie } from "@/types/movie";
import { VideoTrack } from "@/lib/video-sources";
import MovieCard from "@/components/MovieCard";
import { LoginRequiredCard } from "@/components/PlaybackAuthGate";
import { PlaybackUnavailableCard } from "@/components/PlaybackUnavailableCard";
import {
  FREE_DAILY_WATCH_LIMIT_MINUTES,
  formatTimeUntilReset,
  formatWatchTimeRemaining,
} from "@/lib/membership";

interface WatchQuotaState {
  dateIst: string;
  tier: "Free" | "Standard" | "Ultra";
  isUnlimited: boolean;
  limitSeconds: number | null;
  usedSeconds: number;
  remainingSeconds: number | null;
  isLimitReached: boolean;
  sessionState: string;
  activeSessionId: string | null;
  resetsAtIst: string;
  serverNowMs: number;
}

function WatchPlayerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const movieId = (params?.id as string) || "";

  const { user, isLoading: authSessionLoading } = useAuth();
  const { getMovieById, updateProgress, continueWatching, toggleWatchlist, isInWatchlist, movies } = useWatchlist();
  const movie = getMovieById(movieId);

  const [tmdbDetail, setTmdbDetail] = useState<{
    title?: string;
    name?: string;
    posterUrl?: string;
    backdropUrl?: string;
    overview?: string;
    mediaType?: "movie" | "tv";
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
    seasons?: Array<{
      seasonNumber: number;
      title?: string;
      episodeCount: number;
      episodes: Array<{
        episodeNumber: number;
        title: string;
        duration?: number;
        description?: string;
      }>;
    }>;
  } | null>(null);

  useEffect(() => {
    if (movie) return;
    const clean = String(movieId || "").trim();
    const isTv = clean.includes("-tv-") || clean.includes("-series-");
    const tmdbIdMatch = clean.replace(/^tmdb-(?:movie-|tv-|series-)?/i, "").match(/^\d+/);
    if (tmdbIdMatch) {
      const mediaType = isTv ? "tv" : "movie";
      fetch(`/api/tmdb/details/${mediaType}/${tmdbIdMatch[0]}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            setTmdbDetail(json.data);
          }
        })
        .catch(() => {});
    }
  }, [movieId, movie]);

  const fallbackTitle =
    movieId
      .replace(/^(?:tmdb-)?(?:movie-)?(?:tv-)?/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "CINOVA Title";

  const isTvType =
    tmdbDetail?.mediaType === "tv" ||
    movieId.includes("-tv-") ||
    movieId.includes("-series-") ||
    movie?.type === "series";

  // Resolved movie object ensures TMDB, local curated, and custom titles display cleanly with rich metadata
  const resolvedMovie: Movie = {
    ...(movie || {
      id: movieId,
      title: tmdbDetail?.title || tmdbDetail?.name || fallbackTitle,
      tagline: "Streaming on CINOVA",
      description: tmdbDetail?.overview || "High quality cinematic streaming playback.",
      posterUrl: tmdbDetail?.posterUrl || "",
      backdropUrl: tmdbDetail?.backdropUrl || "",
      videoUrl: "",
      duration: 120,
      releaseYear: 2024,
      rating: "PG-13",
      imdbScore: 8.5,
      matchPercentage: 96,
      genre: ["Cinema"],
      type: isTvType ? "series" : "movie",
      industry: "hollywood",
      language: "English",
      availableLanguages: ["English"],
      subtitles: ["English [CC]"],
      quality: "1080p FHD",
      audioSpecs: "Dolby Atmos 5.1",
      directors: ["CINOVA Studios"],
      cast: [],
      views: 100000,
    }),
    ...(tmdbDetail
      ? {
          title: tmdbDetail.title || tmdbDetail.name || movie?.title || fallbackTitle,
          posterUrl: tmdbDetail.posterUrl || movie?.posterUrl || "",
          backdropUrl: tmdbDetail.backdropUrl || movie?.backdropUrl || "",
          description: tmdbDetail.overview || movie?.description,
          type: isTvType ? ("series" as const) : (movie?.type || "movie"),
          seasons:
            tmdbDetail.seasons && tmdbDetail.seasons.length > 0
              ? tmdbDetail.seasons.map((s) => {
                  const sAny = s as {
                    seasonNumber: number;
                    title?: string;
                    name?: string;
                    episodeCount?: number;
                    episodes?: Array<{
                      episodeNumber: number;
                      title: string;
                      duration?: number;
                      description?: string;
                    }>;
                  };
                  const epCount = Math.max(
                    1,
                    sAny.episodeCount || (Array.isArray(sAny.episodes) ? sAny.episodes.length : 0) || 10
                  );
                  const epList =
                    Array.isArray(sAny.episodes) && sAny.episodes.length > 0
                      ? sAny.episodes.map((ep) => ({
                          episodeNumber: ep.episodeNumber,
                          title: ep.title || `Episode ${ep.episodeNumber}`,
                          description:
                            ep.description ||
                            `Season ${sAny.seasonNumber}, Episode ${ep.episodeNumber}`,
                          duration: ep.duration || 45,
                          thumbnailUrl: tmdbDetail.backdropUrl || tmdbDetail.posterUrl || "",
                          videoUrl: "",
                        }))
                      : Array.from({ length: epCount }, (_, epIdx) => ({
                          episodeNumber: epIdx + 1,
                          title: `Episode ${epIdx + 1}`,
                          description: `Season ${sAny.seasonNumber}, Episode ${epIdx + 1}`,
                          duration: 45,
                          thumbnailUrl: tmdbDetail.backdropUrl || tmdbDetail.posterUrl || "",
                          videoUrl: "",
                        }));

                  return {
                    seasonNumber: sAny.seasonNumber,
                    title: sAny.title || sAny.name || `Season ${sAny.seasonNumber}`,
                    episodes: epList,
                  };
                })
              : tmdbDetail.numberOfSeasons
              ? Array.from({ length: tmdbDetail.numberOfSeasons }, (_, sIdx) => {
                  const epCount = Math.min(
                    24,
                    tmdbDetail.numberOfEpisodes
                      ? Math.ceil(tmdbDetail.numberOfEpisodes / (tmdbDetail.numberOfSeasons || 1))
                      : 10
                  );
                  return {
                    seasonNumber: sIdx + 1,
                    title: `Season ${sIdx + 1}`,
                    episodes: Array.from({ length: epCount }, (_, epIdx) => ({
                      episodeNumber: epIdx + 1,
                      title: `Episode ${epIdx + 1}`,
                      duration: 45,
                      description: `Season ${sIdx + 1}, Episode ${epIdx + 1}`,
                      thumbnailUrl: tmdbDetail.backdropUrl || tmdbDetail.posterUrl || "",
                      videoUrl: "",
                    })),
                  };
                })
              : movie?.seasons ||
                (movie?.totalSeasons
                  ? Array.from({ length: movie.totalSeasons }, (_, sIdx) => {
                      const epCount = Math.min(
                        24,
                        movie.totalEpisodes
                          ? Math.ceil(movie.totalEpisodes / (movie.totalSeasons || 1))
                          : 10
                      );
                      return {
                        seasonNumber: sIdx + 1,
                        title: `Season ${sIdx + 1}`,
                        episodes: Array.from({ length: epCount }, (_, epIdx) => ({
                          episodeNumber: epIdx + 1,
                          title: `Episode ${epIdx + 1}`,
                          duration: 45,
                          description: `Season ${sIdx + 1}, Episode ${epIdx + 1}`,
                          thumbnailUrl: movie.backdropUrl || movie.posterUrl || "",
                          videoUrl: "",
                        })),
                      };
                    })
                  : undefined),
        }
      : {}),
  };

  // Season & Episode tracking
  const seasonParam = parseInt(searchParams?.get("season") || "1", 10);
  const epParam = parseInt(searchParams?.get("ep") || "1", 10);

  const [currentSeason, setCurrentSeason] = useState(seasonParam || 1);
  const [currentEpisode, setCurrentEpisode] = useState(epParam || 1);

  // Server-authorized streaming servers & daily watch-time quota
  const [availableServers, setAvailableServers] = useState<StreamingServer[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [playbackUnavailable, setPlaybackUnavailable] = useState<boolean>(false);
  const [quota, setQuota] = useState<WatchQuotaState | null>(null);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);
  const [embedPaused, setEmbedPaused] = useState<boolean>(false);

  const [selectedServerId, setSelectedServerId] = useState<string>("vidlink");
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSkipIntro, setShowSkipIntro] = useState<boolean>(true);

  // Direct Player State & Adaptive Streaming (HLS.js)
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hasResumedRef = useRef<boolean>(false);

  // Adaptive Quality Selector
  const [qualityLevels, setQualityLevels] = useState<{ index: number; label: string; height?: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  // Subtitles & Audio Tracks
  const [subtitleTracks, setSubtitleTracks] = useState<VideoTrack[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("off");
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; lang: string }[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<number>(0);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);

  // Resume Watching Toast & Stream Error Recovery
  const [resumeToast, setResumeToast] = useState<{ show: boolean; time: number } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Watch-time session refs (never rely solely on client timer; synced with backend)
  const sessionIdRef = useRef<string | null>(null);
  const pendingActiveSecondsRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [buffering, setBuffering] = useState(false);

  // Sync state if URL search parameters change
  useEffect(() => {
    if (seasonParam && seasonParam !== currentSeason) setCurrentSeason(seasonParam);
    if (epParam && epParam !== currentEpisode) setCurrentEpisode(epParam);
  }, [seasonParam, epParam, currentSeason, currentEpisode]);

  const applyQuotaUpdate = useCallback((nextQuota: WatchQuotaState | null | undefined) => {
    if (!nextQuota) return;
    setQuota(nextQuota);
    if (nextQuota.activeSessionId) {
      sessionIdRef.current = nextQuota.activeSessionId;
    }
    if (!nextQuota.isUnlimited) {
      setDisplayRemainingSeconds(nextQuota.remainingSeconds ?? 0);
      if (nextQuota.isLimitReached || (nextQuota.remainingSeconds ?? 0) <= 0) {
        setIsLimitReached(true);
        setAvailableServers([]);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        setIsPlaying(false);
      }
    } else {
      setDisplayRemainingSeconds(null);
      setIsLimitReached(false);
    }
  }, []);

  const sendWatchTimeEvent = useCallback(
    async (
      action: "start" | "heartbeat" | "pause" | "buffering" | "resume" | "end",
      options?: { keepalive?: boolean }
    ) => {
      if (!resolvedMovie) return null;
      const elapsedToReport = pendingActiveSecondsRef.current;
      if (action !== "start" && action !== "resume") {
        pendingActiveSecondsRef.current = 0;
      }

      try {
        const res = await fetch("/api/watch-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          keepalive: Boolean(options?.keepalive),
          cache: "no-store",
          body: JSON.stringify({
            action,
            movieId: resolvedMovie.id,
            sessionId: sessionIdRef.current,
            clientActiveSeconds: elapsedToReport,
          }),
        });
        const data = await res.json().catch(() => null);
        if (data?.quota) {
          applyQuotaUpdate(data.quota);
        }
        if (res.status === 401) {
          setAuthRequired(true);
          setAvailableServers([]);
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
          return data;
        }
        if (res.status === 403) {
          setIsLimitReached(true);
          setAvailableServers([]);
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
        }
        return data;
      } catch {
        return null;
      }
    },
    [resolvedMovie.id, user?.id, user?.role, applyQuotaUpdate]
  );

  // Server-side playback authorization (requires active authenticated session + enforces 60m daily IST limit)
  useEffect(() => {
    if (!movieId) return;
    if (authSessionLoading) return;

    if (!user) {
      setAuthRequired(true);
      setAvailableServers([]);
      setAuthLoading(false);
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    let cancelled = false;
    setAuthRequired(false);
    setPlaybackUnavailable(false);
    setAuthLoading(true);
    setEmbedPaused(false);
    pendingActiveSecondsRef.current = 0;

    fetch("/api/playback/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({
        movieId: movie?.id || movieId,
        season: currentSeason,
        episode: currentEpisode,
        isTv: isTvType,
        mediaType: isTvType ? "tv" : "movie",
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 401 || data?.reason === "AUTH_REQUIRED") {
          setAuthRequired(true);
          setAvailableServers([]);
          return;
        }
        if (data?.quota) {
          applyQuotaUpdate(data.quota);
        }
        if (data?.tracks && Array.isArray(data.tracks)) {
          setSubtitleTracks(data.tracks);
        }
        if (res.ok && data?.authorized && Array.isArray(data.servers) && data.servers.length > 0) {
          setAuthRequired(false);
          setPlaybackUnavailable(false);
          setAvailableServers(data.servers);
          setIsLimitReached(false);
          setSelectedServerId((prev) =>
            data.servers.some((s: StreamingServer) => s.id === prev)
              ? prev
              : data.servers[0]?.id || "cinova-native"
          );
        } else {
          setAvailableServers([]);
          if (res.status === 403 || data?.reason === "DAILY_LIMIT_REACHED") {
            setIsLimitReached(true);
          } else if (res.status === 404 || data?.reason === "PLAYBACK_UNAVAILABLE") {
            setPlaybackUnavailable(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableServers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieId, movie, currentSeason, currentEpisode, isTvType, user, authSessionLoading, applyQuotaUpdate]);

  // Active server object (only ever uses server-authorized stream URLs)
  const activeServer: StreamingServer | null =
    availableServers.find((s) => s.id === selectedServerId) || availableServers[0] || null;

  const isDirectServer = activeServer?.type === "direct";
  const isUnlimited = Boolean(quota?.isUnlimited);

  // Determine whether video is actively consuming watch time right now:
  // - Direct player: strictly when playing AND NOT buffering
  // - Embed iframe: strictly when mounted, authorized, visible, and not paused by user
  const isActivelyConsumingTime =
    !authLoading &&
    !isLimitReached &&
    !isUnlimited &&
    Boolean(activeServer) &&
    (isDirectServer ? isPlaying && !buffering : !embedPaused);

  // Keep server session state synced on active/paused/buffering transitions
  useEffect(() => {
    if (!movie || authLoading || isLimitReached || isUnlimited || !activeServer) {
      isTrackingRef.current = false;
      return;
    }

    if (isActivelyConsumingTime) {
      if (!isTrackingRef.current) {
        isTrackingRef.current = true;
        void sendWatchTimeEvent(sessionIdRef.current ? "resume" : "start");
      }
    } else if (isTrackingRef.current) {
      isTrackingRef.current = false;
      void sendWatchTimeEvent(buffering ? "buffering" : "pause");
    }
  }, [
    movie,
    authLoading,
    isLimitReached,
    isUnlimited,
    activeServer,
    isActivelyConsumingTime,
    buffering,
    sendWatchTimeEvent,
  ]);

  // 1-second local countdown display + 10-second authoritative backend heartbeat while actively playing
  useEffect(() => {
    if (!isActivelyConsumingTime) return;

    const tickInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      pendingActiveSecondsRef.current += 1;
      setDisplayRemainingSeconds((prev) => {
        if (prev === null) return null;
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
          void sendWatchTimeEvent("heartbeat");
        }
        return next;
      });
    }, 1000);

    const heartbeatInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void sendWatchTimeEvent("heartbeat");
    }, 10000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(heartbeatInterval);
    };
  }, [isActivelyConsumingTime, sendWatchTimeEvent]);

  // Pause counting when tab is hidden & persist used seconds on page refresh/close
  useEffect(() => {
    if (!movie || isUnlimited) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isTrackingRef.current) {
        isTrackingRef.current = false;
        void sendWatchTimeEvent("pause", { keepalive: true });
      } else if (
        document.visibilityState === "visible" &&
        isActivelyConsumingTime &&
        !isTrackingRef.current
      ) {
        isTrackingRef.current = true;
        void sendWatchTimeEvent("resume");
      }
    };

    const handleBeforeUnload = () => {
      if (isTrackingRef.current || pendingActiveSecondsRef.current > 0) {
        const payload = JSON.stringify({
          action: "end",
          movieId: movie.id,
          sessionId: sessionIdRef.current,
          clientActiveSeconds: pendingActiveSecondsRef.current,
        });
        pendingActiveSecondsRef.current = 0;
        isTrackingRef.current = false;
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/watch-time",
            new Blob([payload], { type: "application/json" })
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isTrackingRef.current || pendingActiveSecondsRef.current > 0) {
        isTrackingRef.current = false;
        void sendWatchTimeEvent("end", { keepalive: true });
      }
      recordCurrentWatchProgress(true);
    };
  }, [resolvedMovie, user?.id, user?.role, isUnlimited, isActivelyConsumingTime, sendWatchTimeEvent]);

  // Adaptive HLS Streaming Engine & Format Detection
  useEffect(() => {
    if (!isDirectServer || !activeServer?.url || !videoRef.current) return;
    const video = videoRef.current;
    const streamUrl = activeServer.url;
    const isHls =
      streamUrl.includes(".m3u8") ||
      activeServer.provider === "cinova_hls" ||
      (activeServer as unknown as { protocol?: string }).protocol === "hls";

    setStreamError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const levels = data.levels.map((lvl, idx) => ({
            index: idx,
            label: lvl.height ? `${lvl.height}p` : `Stream ${idx + 1}`,
            height: lvl.height,
          }));
          setQualityLevels([{ index: -1, label: "Auto" }, ...levels]);
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
          if (data.audioTracks && data.audioTracks.length > 0) {
            setAudioTracks(
              data.audioTracks.map((t, idx) => ({
                id: idx,
                label: t.name || t.lang || `Audio Track ${idx + 1}`,
                lang: t.lang || "",
              }))
            );
          }
        });

        hls.on(Hls.Events.ERROR, (_, errData) => {
          if (errData.fatal) {
            switch (errData.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setStreamError("Stream error encountered. Switching servers...");
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      }
    } else {
      video.src = streamUrl;
      setQualityLevels([{ index: -1, label: activeServer.badge || "1080p FHD" }]);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isDirectServer, activeServer?.url, activeServer?.provider, activeServer?.badge]);

  const handleSelectQuality = (idx: number) => {
    setSelectedQuality(idx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
    }
    setShowQualityMenu(false);
  };

  const handleSelectAudio = (idx: number) => {
    setSelectedAudio(idx);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = idx;
    }
    setShowAudioMenu(false);
  };

  const handleSelectSubtitle = (trackCode: string) => {
    setSelectedSubtitle(trackCode);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (trackCode === "off") {
          t.mode = "disabled";
        } else if (t.language === trackCode || t.label === trackCode) {
          t.mode = "showing";
        } else {
          t.mode = "disabled";
        }
      }
    }
    setShowSubtitleMenu(false);
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur)) setDuration(dur);

    // Multi-Device Resumable Playback Check (synced from Cloud & local store)
    if (!hasResumedRef.current) {
      hasResumedRef.current = true;
      try {
        const sNum = isTvType ? (Number(currentSeason) || 1) : undefined;
        const eNum = isTvType ? (Number(currentEpisode) || 1) : undefined;

        // Check active in-memory continueWatching first
        const prev = continueWatching.find((item) => {
          const matchesContent =
            item.movieId === movieId ||
            item.movieId === resolvedMovie.id ||
            item.contentId === movieId ||
            item.contentId === resolvedMovie.id;
          if (!matchesContent) return false;
          if (isTvType) {
            return (item.seasonNumber ?? item.season ?? 1) === sNum && (item.episodeNumber ?? item.episode ?? 1) === eNum;
          }
          return true;
        });

        const targetSeconds = prev?.progressSeconds;
        if (typeof targetSeconds === "number" && targetSeconds > 10 && dur > 0 && targetSeconds < dur - 30) {
          videoRef.current.currentTime = targetSeconds;
          setCurrentTime(targetSeconds);
          setResumeToast({ show: true, time: targetSeconds });
          setTimeout(() => setResumeToast(null), 7000);
        } else {
          // Fallback to localStorage check if offline
          const saved = localStorage.getItem("cinova_continue_watching");
          if (saved) {
            const list = JSON.parse(saved);
            const localPrev = Array.isArray(list)
              ? list.find(
                  (item: any) =>
                    (item.movieId === movieId || item.movieId === resolvedMovie.id || item.contentId === movieId) &&
                    (!isTvType || ((item.seasonNumber ?? item.season ?? 1) === sNum && (item.episodeNumber ?? item.episode ?? 1) === eNum))
                )
              : null;
            if (localPrev && localPrev.progressSeconds > 10 && dur > 0 && localPrev.progressSeconds < dur - 30) {
              videoRef.current.currentTime = localPrev.progressSeconds;
              setCurrentTime(localPrev.progressSeconds);
              setResumeToast({ show: true, time: localPrev.progressSeconds });
              setTimeout(() => setResumeToast(null), 7000);
            }
          }
        }
      } catch {
        // ignore parse error
      }
    }
  };

  // Switch server helper
  const handleSelectServer = (serverId: string) => {
    if (isLimitReached) return;
    setSelectedServerId(serverId);
    setEmbedPaused(false);
    setIsPlaying(false);
    setBuffering(false);
    setIframeKey((prev) => prev + 1);
  };

  const refreshServer = () => {
    if (isLimitReached) return;
    setIframeKey((prev) => prev + 1);
  };

  const handleNextServer = () => {
    if (isLimitReached || availableServers.length === 0) return;
    const currentIndex = availableServers.findIndex((s) => s.id === selectedServerId);
    const nextIndex = (currentIndex + 1) % availableServers.length;
    setSelectedServerId(availableServers[nextIndex].id);
    setEmbedPaused(false);
    setIsPlaying(false);
    setBuffering(false);
    setIframeKey((prev) => prev + 1);
  };

  // Change episode with complete player and state cleanup
  const handleSelectEpisode = (seasonNum: number, episodeNum: number) => {
    // Save current episode's progress immediately before transitioning
    recordCurrentWatchProgress(true);
    hasResumedRef.current = false;
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setIsPlaying(false);
    setBuffering(false);
    setCurrentTime(0);
    setStreamError(null);
    setEmbedPaused(false);
    router.push(`/watch/${movieId}?season=${seasonNum}&ep=${episodeNum}`);
    setIframeKey((prev) => prev + 1);
  };

  // Copy share link
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Direct player controls
  const togglePlay = () => {
    if (isLimitReached || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  };

  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    const videoEl = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;

    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current
          .requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => {
            // iOS Safari fallback for native video fullscreen
            videoEl?.webkitEnterFullscreen?.();
          });
      } else if (videoEl?.webkitEnterFullscreen) {
        videoEl.webkitEnterFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 85);
      setShowSkipIntro(false);
    }
  };

  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  };

  const recordCurrentWatchProgress = useCallback(
    (immediateSync = false, isCompleted = false) => {
      if (!videoRef.current || !resolvedMovie) return;
      const cur = videoRef.current.currentTime;
      const totalDur = videoRef.current.duration || duration || 1;

      const sNum = isTvType ? Number(currentSeason) || 1 : undefined;
      const eNum = isTvType ? Number(currentEpisode) || 1 : undefined;
      const episodeObj =
        isTvType && resolvedMovie.seasons
          ? resolvedMovie.seasons
              .find((s) => s.seasonNumber === sNum)
              ?.episodes?.find((e) => e.episodeNumber === eNum)
          : undefined;

      updateProgress(resolvedMovie.id, Math.floor(cur), Math.floor(totalDur), {
        title: resolvedMovie.title,
        contentType: resolvedMovie.type,
        posterUrl: episodeObj?.thumbnailUrl || resolvedMovie.posterUrl || resolvedMovie.backdropUrl,
        backdropUrl: resolvedMovie.backdropUrl || resolvedMovie.posterUrl,
        seasonNumber: sNum,
        episodeNumber: eNum,
        episodeTitle: episodeObj?.title || (isTvType ? `Episode ${eNum}` : undefined),
        completed: isCompleted,
        immediateSync,
      });
    },
    [resolvedMovie, isTvType, currentSeason, currentEpisode, duration, updateProgress]
  );

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    recordCurrentWatchProgress(false);
    if (cur > 120 && showSkipIntro) setShowSkipIntro(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isSeries = resolvedMovie.type === "series";
  const hasEpisodes = Boolean(isSeries && resolvedMovie?.seasons && resolvedMovie.seasons.length > 0);
  const detailBackUrl = isSeries
    ? `/series/${resolvedMovie.id}`
    : `/movie/${resolvedMovie.id}`;
  const currentWatchReturnUrl = hasEpisodes
    ? `/watch/${resolvedMovie.id}?season=${currentSeason}&ep=${currentEpisode}`
    : `/watch/${resolvedMovie.id}`;

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(detailBackUrl);
    }
  };

  if (authRequired || (!authSessionLoading && !user)) {
    return (
      <div className="relative min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center p-4 pt-24 pb-20 overflow-hidden">
        {resolvedMovie.backdropUrl && (
          <>
            <img
              src={resolvedMovie.backdropUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-25 scale-105 blur-sm pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/82 to-[#080506]/70 pointer-events-none" />
          </>
        )}
        <div className="relative z-10 w-full max-w-md">
          <LoginRequiredCard
            returnTo={currentWatchReturnUrl}
            titleContext={
              hasEpisodes
                ? `${resolvedMovie.title} (S${currentSeason} • E${currentEpisode})`
                : resolvedMovie.title
            }
            showCloseButton={false}
            onContinueExploring={handleGoBack}
          />
        </div>
      </div>
    );
  }

  if (playbackUnavailable) {
    return (
      <div className="relative min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center p-4 pt-24 pb-20 overflow-hidden">
        {resolvedMovie.backdropUrl && (
          <>
            <img
              src={resolvedMovie.backdropUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 blur-sm pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/85 to-[#080506]/70 pointer-events-none" />
          </>
        )}
        <div className="relative z-10 w-full max-w-lg">
          <PlaybackUnavailableCard
            title={resolvedMovie.title}
            onGoBack={handleGoBack}
            exploreHref="/movies"
            trailerKey={resolvedMovie.trailerUrl ? "available" : undefined}
            onWatchTrailer={
              resolvedMovie.trailerUrl
                ? () => {
                    const trailer = resolvedMovie.trailerUrl || "";
                    const match = trailer.match(
                      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
                    );
                    if (match && match[1]) {
                      window.open(`https://www.youtube.com/watch?v=${match[1]}`, "_blank");
                    } else if (trailer) {
                      window.open(trailer, "_blank");
                    }
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(resolvedMovie.id);
  const activeSeasonData =
    resolvedMovie?.seasons?.find((s) => s.seasonNumber === currentSeason) ||
    resolvedMovie?.seasons?.[0];

  const upNextMovies = movies.filter((m) => m.id !== resolvedMovie.id).slice(0, 6);

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3]">
      {/* Top Floating Player Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0508]/95 backdrop-blur-xl border-b border-[rgba(155,25,57,0.24)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors border border-[rgba(155,25,57,0.25)]"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-black tracking-wider text-[#F5F1F3]">
              CINOVA
            </span>
          </Link>

          <span className="text-[rgba(155,25,57,0.4)] hidden sm:inline">|</span>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-[#F5F1F3] truncate max-w-xs sm:max-w-md">
              {resolvedMovie.title}
            </h1>
            {hasEpisodes && (
              <span className="text-[10px] text-[#FF385B] font-mono">
                Season {currentSeason} • Episode {currentEpisode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Free Daily Watch-Time Indicator */}
          {quota && !quota.isUnlimited && (
            <Link
              href="/pricing"
              title="CINOVA Free daily watch-time limit resets at 12:00 AM IST"
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isLimitReached
                  ? "bg-[#650A20]/65 border-[#E11D48] text-[#F5F1F3]"
                  : (displayRemainingSeconds ?? 3600) <= 300
                  ? "bg-[#650A20]/40 border-[#E11D48]/60 text-[#FF385B]"
                  : "bg-[#160B10] border-[rgba(155,25,57,0.28)] text-[#F5F1F3] hover:border-[#E11D48]/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>
                {isLimitReached
                  ? "0m left today"
                  : `${formatWatchTimeRemaining(displayRemainingSeconds ?? 0)} left`}
              </span>
              {!isLimitReached && (
                <span className="text-[10px] text-[#AAA0A7] font-normal">
                  {buffering
                    ? "• Buffering (paused)"
                    : !isActivelyConsumingTime
                    ? "• Paused"
                    : "• Free"}
                </span>
              )}
            </Link>
          )}

          {/* Embed Session Pause Toggle (prevents watch time from accruing while away) */}
          {!isDirectServer && activeServer && !isLimitReached && !isUnlimited && (
            <button
              onClick={() => setEmbedPaused((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] text-[#F5F1F3] border border-[rgba(155,25,57,0.28)] text-xs font-semibold transition-colors flex items-center gap-1.5"
              title={embedPaused ? "Resume stream & timer" : "Pause stream & timer"}
            >
              {embedPaused ? <Play className="w-3.5 h-3.5 text-[#E11D48]" /> : <Pause className="w-3.5 h-3.5 text-[#E11D48]" />}
              <span className="hidden sm:inline">{embedPaused ? "Resume" : "Pause Timer"}</span>
            </button>
          )}

          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className="hidden md:flex px-3 py-1.5 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.25)] text-xs font-semibold transition-colors items-center gap-1.5"
            title="Toggle Theater Mode"
          >
            <span>{theaterMode ? "Exit Theater" : "Theater Mode"}</span>
          </button>

          <button
            onClick={refreshServer}
            disabled={isLimitReached}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#160B10] hover:bg-[#1D0C13] disabled:opacity-40 text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.25)] transition-colors"
            title="Reload Server Stream"
            aria-label="Reload Server Stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.25)] transition-colors"
            title="Share Video Link"
            aria-label="Share Video Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#FF385B]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Streaming Area */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Mobile Free Watch-Time Bar */}
        {quota && !quota.isUnlimited && (
          <div className="md:hidden flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
              <span className="font-semibold text-[#F5F1F3]">
                {isLimitReached
                  ? "Daily 60m limit reached"
                  : `${formatWatchTimeRemaining(displayRemainingSeconds ?? 0)} / ${FREE_DAILY_WATCH_LIMIT_MINUTES}m left today`}
              </span>
            </div>
            <Link href="/pricing" className="text-[#FF385B] font-bold shrink-0">
              View Plans
            </Link>
          </div>
        )}

        {/* Video Player Viewport Container */}
        <div
          ref={containerRef}
          className={`relative w-full rounded-2xl overflow-hidden bg-black border border-[rgba(155,25,57,0.28)] shadow-2xl transition-all ${
            theaterMode ? "aspect-[21/9] max-h-[85vh]" : "aspect-video max-h-[78vh]"
          }`}
        >
          {authLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#080506] gap-3 p-6 text-center">
              <div className="w-11 h-11 border-4 border-[#E11D48]/30 border-t-[#E11D48] rounded-full animate-spin" />
              <p className="text-xs text-[#AAA0A7] font-medium">
                Verifying playback access &amp; daily allowance...
              </p>
            </div>
          ) : isLimitReached ? (
            /* Free Plan Daily 60-Minute Limit Reached Overlay */
            <div className="relative w-full h-full flex items-center justify-center bg-[#080506] p-6 sm:p-10 text-center overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20 bg-cover bg-center blur-sm scale-105"
                style={{ backgroundImage: `url(${resolvedMovie.backdropUrl || resolvedMovie.posterUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/90 to-[#10080C]/85" />

              <div className="relative z-10 max-w-lg mx-auto space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#650A20]/65 border border-[#E11D48]/50 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-[#E11D48]" />
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.3)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF385B]">
                    CINOVA FREE • Daily Viewing Limit Reached
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-[#F5F1F3] tracking-tight">
                    You&apos;ve reached today&apos;s {FREE_DAILY_WATCH_LIMIT_MINUTES}-minute limit
                  </h2>
                  <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
                    Your CINOVA Free playback timer resets automatically at{" "}
                    <strong className="text-[#F5F1F3]">12:00 AM IST</strong>
                    {quota?.resetsAtIst ? ` (in ${formatTimeUntilReset(quota.resetsAtIst)})` : ""}. You can continue browsing the entire library, searching titles, and managing My List right now.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <Link
                    href="/pricing"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider shadow-[0_8px_24px_rgba(163,13,50,0.4)] transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    Explore Memberships
                  </Link>
                  <Link
                    href="/movies"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] font-semibold text-xs uppercase tracking-wider transition-colors"
                  >
                    Continue Browsing
                  </Link>
                </div>
              </div>
            </div>
          ) : !activeServer ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#080506] p-6 text-center gap-3">
              <Film className="w-10 h-10 text-[#746971]" />
              <p className="text-sm font-semibold text-[#F5F1F3]">Stream currently unavailable</p>
              <p className="text-xs text-[#AAA0A7]">Try reloading or selecting another title.</p>
            </div>
          ) : isDirectServer ? (
            /* HTML5 Direct Player routed through server-verified /api/stream/[id]?token=... */
            <div
              onMouseMove={showControlsTemporarily}
              onClick={() => {
                if (isPlaying && !controlsVisible) {
                  showControlsTemporarily();
                  return;
                }
                togglePlay();
                showControlsTemporarily();
              }}
              className="relative w-full h-full flex items-center justify-center cursor-pointer select-none"
            >
              <video
                ref={videoRef}
                poster={resolvedMovie.backdropUrl || resolvedMovie.posterUrl}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                  setIsPlaying(false);
                  setBuffering(false);
                  recordCurrentWatchProgress(true);
                }}
                onWaiting={() => setBuffering(true)}
                onStalled={() => setBuffering(true)}
                onPlaying={() => {
                  setIsPlaying(true);
                  setBuffering(false);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setBuffering(false);
                  recordCurrentWatchProgress(true, true);
                }}
                onError={() => {
                  setStreamError("Stream connection error. Try switching servers.");
                }}
                className="w-full h-full object-contain"
                playsInline
              >
                {subtitleTracks.map((tr) => (
                  <track
                    key={tr.id}
                    kind={tr.trackType}
                    src={tr.trackUrl}
                    srcLang={tr.languageCode}
                    label={tr.label}
                    default={tr.isDefault}
                  />
                ))}
              </video>

              {/* Resume Playback Notification */}
              {resumeToast?.show && (
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#080506]/95 border border-[#E11D48]/60 shadow-2xl backdrop-blur-md animate-fade-in text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span className="text-[#F5F1F3]">
                    Resumed from <strong className="text-white">{formatTime(resumeToast.time)}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }
                      setResumeToast(null);
                    }}
                    className="ml-1 text-[11px] underline text-[#AAA0A7] hover:text-[#FF385B]"
                  >
                    Start over
                  </button>
                </div>
              )}

              {/* Stream Error Recovery Banner */}
              {streamError && (
                <div className="absolute top-4 right-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#650A20]/95 border border-[#E11D48] shadow-2xl backdrop-blur-md animate-fade-in text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span className="text-[#F5F1F3]">{streamError}</span>
                  <button
                    onClick={handleNextServer}
                    className="px-2.5 py-1 rounded-lg bg-[#E11D48] text-white font-bold text-[11px] hover:bg-[#FF385B] transition-colors"
                  >
                    Switch Server
                  </button>
                </div>
              )}

              {buffering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 z-20 pointer-events-none gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-[#E11D48]/30 border-t-[#E11D48] rounded-full animate-spin" />
                  <span className="text-[11px] font-medium text-[#AAA0A7] bg-[#080506]/80 px-3 py-1 rounded-full">
                    Buffering • Watch timer paused
                  </span>
                </div>
              )}

              {/* Skip Intro Button */}
              {showSkipIntro && isPlaying && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkipIntro();
                  }}
                  className="absolute bottom-24 sm:bottom-20 right-3 sm:right-6 z-40 px-4 sm:px-5 py-2 rounded-full border border-[#E11D48]/60 bg-[#0B0508]/90 hover:bg-[#E11D48] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all shadow-lg"
                >
                  Skip Intro &gt;&gt;
                </button>
              )}

              {!isPlaying && !buffering && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#A30D32] to-[#E11D48] flex items-center justify-center shadow-lg shadow-[#E11D48]/45">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Player Overlay Controls */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute bottom-0 left-0 right-0 px-3 sm:px-8 pb-3 sm:pb-5 pt-10 sm:pt-12 bg-gradient-to-t from-[#080506] via-[#080506]/85 to-transparent z-30 transition-opacity duration-300 ${
                  controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {/* Crimson Scrub Bar (taller touch target on mobile) */}
                <div className="relative mb-2.5 sm:mb-3 py-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    aria-label="Seek video timeline"
                    className="w-full h-2 sm:h-1.5 bg-[rgba(155,25,57,0.35)] rounded-lg appearance-none cursor-pointer accent-[#E11D48] hover:h-2 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    <button
                      onClick={togglePlay}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                    </button>
                    <button
                      onClick={() => seekRelative(-10)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                      title="Back 10s"
                      aria-label="Rewind 10 seconds"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => seekRelative(10)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                      title="Forward 10s"
                      aria-label="Forward 10 seconds"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleMute}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      className="hidden sm:block w-24 h-1 bg-[rgba(155,25,57,0.35)] rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
                    />
                    <span className="text-[11px] text-[#AAA0A7] font-mono tabular-nums whitespace-nowrap">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Quality Selector */}
                    {qualityLevels.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQualityMenu(!showQualityMenu);
                            setShowSubtitleMenu(false);
                            setShowAudioMenu(false);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Video Quality"
                        >
                          <Sliders className="w-3 h-3 text-[#FF385B]" />
                          <span>
                            {selectedQuality === -1
                              ? qualityLevels[0]?.label || "Auto"
                              : qualityLevels.find((q) => q.index === selectedQuality)?.label || "HD"}
                          </span>
                        </button>

                        {showQualityMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full right-0 mb-2 w-36 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.4)] shadow-2xl p-1.5 space-y-1 z-50 text-xs animate-fade-in"
                          >
                            <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#746971]">
                              Streaming Quality
                            </div>
                            {qualityLevels.map((lvl) => (
                              <button
                                key={lvl.index}
                                type="button"
                                onClick={() => handleSelectQuality(lvl.index)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                  selectedQuality === lvl.index
                                    ? "bg-[#650A20]/80 text-[#FF385B] font-bold"
                                    : "hover:bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3]"
                                }`}
                              >
                                <span>{lvl.label}</span>
                                {selectedQuality === lvl.index && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtitle Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubtitleMenu(!showSubtitleMenu);
                          setShowQualityMenu(false);
                          setShowAudioMenu(false);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          selectedSubtitle !== "off"
                            ? "bg-[#650A20]/60 border-[#E11D48] text-[#FF385B]"
                            : "bg-[#160B10] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-[#F5F1F3]"
                        }`}
                        title="Subtitles & Captions"
                      >
                        <Subtitles className="w-4 h-4" />
                      </button>

                      {showSubtitleMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.4)] shadow-2xl p-1.5 space-y-1 z-50 text-xs animate-fade-in"
                        >
                          <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#746971]">
                            Subtitles &amp; Captions
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectSubtitle("off")}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                              selectedSubtitle === "off"
                                ? "bg-[#650A20]/80 text-[#FF385B] font-bold"
                                : "hover:bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3]"
                            }`}
                          >
                            <span>Off</span>
                            {selectedSubtitle === "off" && <Check className="w-3.5 h-3.5" />}
                          </button>
                          {(subtitleTracks.length > 0
                            ? subtitleTracks
                            : (movie?.subtitles || ["English [CC]"]).map((s, idx) => ({
                                id: `sub-${idx}`,
                                sourceId: "default",
                                trackType: "subtitle" as const,
                                languageCode: "en",
                                label: s,
                                trackUrl: "",
                              }))
                          ).map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => handleSelectSubtitle(track.languageCode || track.label)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                selectedSubtitle === (track.languageCode || track.label)
                                  ? "bg-[#650A20]/80 text-[#FF385B] font-bold"
                                  : "hover:bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3]"
                              }`}
                            >
                              <span>{track.label}</span>
                              {selectedSubtitle === (track.languageCode || track.label) && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Audio Track Selector */}
                    {audioTracks.length > 1 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAudioMenu(!showAudioMenu);
                            setShowQualityMenu(false);
                            setShowSubtitleMenu(false);
                          }}
                          className="p-1.5 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
                          title="Audio Track"
                        >
                          <Languages className="w-4 h-4" />
                        </button>

                        {showAudioMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full right-0 mb-2 w-40 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.4)] shadow-2xl p-1.5 space-y-1 z-50 text-xs animate-fade-in"
                          >
                            <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#746971]">
                              Audio Track
                            </div>
                            {audioTracks.map((trk) => (
                              <button
                                key={trk.id}
                                type="button"
                                onClick={() => handleSelectAudio(trk.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                  selectedAudio === trk.id
                                    ? "bg-[#650A20]/80 text-[#FF385B] font-bold"
                                    : "hover:bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3]"
                                }`}
                              >
                                <span>{trk.label}</span>
                                {selectedAudio === trk.id && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#650A20]/50 text-[#FF385B] text-[10px] font-bold border border-[#E11D48]/40">
                      {isUnlimited ? "HD / MASTER" : "720p HD FREE"}
                    </span>
                    <button
                      onClick={toggleFullscreen}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : embedPaused ? (
            /* Embed Session Paused View (unmounts iframe so timer & playback stop cleanly) */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#080506] p-6 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.34)] flex items-center justify-center">
                <Pause className="w-6 h-6 text-[#E11D48]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F5F1F3]">Playback Session Paused</h3>
                <p className="text-xs text-[#AAA0A7] max-w-sm">
                  Your daily Free watch timer is paused ({formatWatchTimeRemaining(displayRemainingSeconds ?? 0)} remaining today).
                </p>
              </div>
              <button
                onClick={() => setEmbedPaused(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Resume Watching
              </button>
            </div>
          ) : (
            /* Multi-Server Responsive Embed Iframe (unmounted immediately if quota expires) */
            <div className="relative w-full h-full bg-black">
              <iframe
                key={iframeKey}
                src={activeServer.url}
                title={`${resolvedMovie.title} - ${activeServer.name}`}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
              />
            </div>
          )}
        </div>

        {/* Streaming Servers Selector */}
        <section className="bg-[#160B10] rounded-2xl p-4 sm:p-5 border border-[rgba(155,25,57,0.24)] space-y-3 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#E11D48]" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                Streaming Servers (Redundancy Cluster)
              </h2>
              <span className="text-[11px] text-[#AAA0A7]">
                (Switch server instantly if playback buffers)
              </span>
            </div>

            <button
              onClick={handleNextServer}
              disabled={isLimitReached || availableServers.length === 0}
              className="inline-flex items-center gap-1.5 text-xs text-[#FF385B] hover:text-[#F5F1F3] disabled:opacity-40 font-bold self-start sm:self-auto transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Switch to Next Server
            </button>
          </div>

          {/* Server Pill Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 pt-1">
            {availableServers.map((srv) => {
              const isCurrent = srv.id === selectedServerId;
              return (
                <button
                  key={srv.id}
                  onClick={() => handleSelectServer(srv.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? "bg-[#1D0C13] border-[#E11D48] shadow-lg shadow-[#650A20]/30 text-[#F5F1F3]"
                      : "bg-[#10080C] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.22)] text-[#AAA0A7] hover:text-[#F5F1F3]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate text-[#F5F1F3]">{srv.name.split("•")[0]}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isCurrent
                          ? "bg-[#E11D48] text-[#F5F1F3]"
                          : "bg-[#160B10] text-[#AAA0A7] border border-[rgba(155,25,57,0.22)]"
                      }`}
                    >
                      {srv.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#AAA0A7]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCurrent ? "bg-[#FF385B]" : "bg-[rgba(155,25,57,0.35)]"
                      }`}
                    />
                    <span className="truncate">{srv.name.split("•")[1] || srv.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#AAA0A7] gap-2 border-t border-[rgba(155,25,57,0.2)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isLimitReached
                  ? "Playback locked until 12:00 AM IST reset."
                  : "Multi-CDN redundancy cluster active."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Active Route:</span>
              <span className="font-mono text-[#FF385B] bg-[#10080C] border border-[rgba(155,25,57,0.24)] px-2 py-0.5 rounded text-[11px]">
                {activeServer
                  ? `${activeServer.quality} • ${activeServer.provider.toUpperCase()}`
                  : isLimitReached
                  ? "LIMIT REACHED"
                  : "INITIALIZING"}
              </span>
            </div>
          </div>
        </section>

        {/* TV Series Episode & Season Selector */}
        {hasEpisodes && (
          <section className="bg-[#160B10] rounded-2xl p-4 sm:p-5 border border-[rgba(155,25,57,0.24)] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#E11D48]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                  Episodes
                </h2>
              </div>
              {/* Season Selector Tabs */}
              {resolvedMovie?.seasons && resolvedMovie.seasons.length > 1 && (
                <div className="flex items-center gap-1 bg-[#10080C] p-1 rounded-lg border border-[rgba(155,25,57,0.24)]">
                  {(resolvedMovie.seasons || []).map((s) => (
                    <button
                      key={s.seasonNumber}
                      onClick={() => handleSelectEpisode(s.seasonNumber, 1)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        currentSeason === s.seasonNumber
                          ? "bg-[#E11D48] text-[#F5F1F3] shadow-sm"
                          : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                      }`}
                    >
                      Season {s.seasonNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(activeSeasonData?.episodes || []).map((ep) => {
                const isEpActive = currentEpisode === ep.episodeNumber;
                return (
                  <button
                    key={ep.episodeNumber}
                    onClick={() => handleSelectEpisode(currentSeason, ep.episodeNumber)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isEpActive
                        ? "bg-[#1D0C13] border-[#E11D48] shadow-sm text-[#F5F1F3]"
                        : "bg-[#10080C] hover:bg-[#1D0C13] border-[rgba(155,25,57,0.22)]"
                    }`}
                  >
                    <div className="relative w-16 h-12 rounded-lg bg-[#080506] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[rgba(155,25,57,0.24)]">
                      <Play
                        className={`w-4 h-4 ${
                          isEpActive ? "text-[#FF385B] fill-[#FF385B]" : "text-[#AAA0A7]"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#FF385B]">EP {ep.episodeNumber}</span>
                        <span className="text-[10px] text-[#AAA0A7] font-mono">{ep.duration}m</span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#F5F1F3] truncate">{ep.title}</h4>
                      <p className="text-[11px] text-[#AAA0A7] line-clamp-1">{ep.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Title Meta, Franchise Info & Action Row */}
        <section className="bg-[#160B10] rounded-2xl p-5 sm:p-6 border border-[rgba(155,25,57,0.24)] space-y-4 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#F5F1F3]">{resolvedMovie.title}</h2>
                <span className="px-1.5 py-0.5 rounded border border-[rgba(155,25,57,0.26)] text-xs font-mono bg-[#10080C] text-[#F5F1F3]">
                  {resolvedMovie.rating}
                </span>
                <span className="text-xs text-[#AAA0A7]">{resolvedMovie.releaseYear}</span>
                <span className="text-xs text-[#AAA0A7]">{resolvedMovie.duration}m</span>
                <span className="text-xs font-bold text-[#FF385B]">
                  {resolvedMovie.matchPercentage || 98}% Match
                </span>
              </div>
              <p className="text-sm text-[#AAA0A7] leading-relaxed">{resolvedMovie.description}</p>

              {/* Franchise Universe Badge */}
              {movie?.franchiseName && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-[#AAA0A7]">Franchise Universe:</span>
                  <Link
                    href={`/categories?universe=${movie.franchiseId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10080C] text-[#FF385B] border border-[rgba(155,25,57,0.26)] text-xs font-bold hover:border-[#E11D48] transition-colors"
                  >
                    <span>{movie.franchiseName}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Cast & Director */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#AAA0A7] font-semibold block mb-1">Starring</span>
                  <p className="text-[#F5F1F3]">
                    {resolvedMovie.cast?.map((c) => c.name).join(", ") || "Ensemble Cast"}
                  </p>
                </div>
                <div>
                  <span className="text-[#AAA0A7] font-semibold block mb-1">Directing &amp; Production</span>
                  <p className="text-[#F5F1F3]">{resolvedMovie.directors?.join(", ") || "CINOVA Studios"}</p>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex sm:flex-col gap-2.5 flex-shrink-0">
              <button
                onClick={() => toggleWatchlist(resolvedMovie.id)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  inWatchlist
                    ? "bg-[#1D0C13] text-[#FF385B] border-[#E11D48]"
                    : "bg-[#10080C] hover:bg-[#1D0C13] text-[#F5F1F3] border-[rgba(155,25,57,0.26)]"
                }`}
              >
                {inWatchlist ? <BookmarkCheck className="w-4 h-4 text-[#E11D48]" /> : <Bookmark className="w-4 h-4" />}
                <span>{inWatchlist ? "In My List" : "Add to My List"}</span>
              </button>

              <Link
                href={`/title/${resolvedMovie.id}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#10080C] hover:bg-[#1D0C13] text-[#F5F1F3] border border-[rgba(155,25,57,0.26)] text-xs font-bold transition-colors"
              >
                <Info className="w-4 h-4" /> Full Details
              </Link>
            </div>
          </div>
        </section>

        {/* Up Next / Recommended Titles */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#E11D48] rounded-full shadow-[0_0_8px_#E11D48]" />
              <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3] flex items-center gap-2">
                <span>More Like This</span>
              </h3>
            </div>
            <Link href="/movies" className="text-xs text-[#FF385B] hover:underline font-bold">
              Explore All Titles &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upNextMovies.map((m) => (
              <MovieCard key={m.id} movie={m} aspect="landscape" fluid />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080506] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#E11D48]/30 border-t-[#E11D48] rounded-full animate-spin" />
        </div>
      }
    >
      <WatchPlayerContent />
    </Suspense>
  );
}
