"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Song, Playlist, RepeatMode } from "@/types/music";
import { useAuth } from "@/context/AuthContext";
import { MAINSTREAM_TRACKS } from "@/lib/api/mainstream-client";
import {
  fetchUserMusicData,
  syncUserFavorite,
  syncUserPlaylist,
  recordRecentlyPlayedTrack,
  syncUserPreferences,
} from "@/lib/music-supabase";

interface MusicContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  audioError: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  recentlyPlayed: Song[];
  favoriteSongIds: string[];
  userPlaylists: Playlist[];
  isFullScreenPlayerOpen: boolean;
  isQueueOpen: boolean;

  // Honest Licensing Notice Modal state for commercial tracks
  licensingNoticeTrack: Song | null;
  isLicensingModalOpen: boolean;
  closeLicensingModal: () => void;

  // Video player modal state for mainstream music (Option A)
  activeVideoTrack: Song | null;
  isVideoModalOpen: boolean;
  isAutoplay: boolean;
  toggleAutoplay: () => void;
  watchVideo: (track: Song, contextQueue?: Song[]) => void;
  closeVideoModal: () => void;
  nextVideoTrack: () => void;
  prevVideoTrack: () => void;

  playTrack: (track: Song, contextQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (songId: string, songObj?: Song) => void;
  isFavorite: (songId: string) => boolean;
  addToQueue: (track: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (title: string, description?: string) => string;
  addToPlaylist: (playlistId: string, track: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  openFullScreenPlayer: () => void;
  closeFullScreenPlayer: () => void;
  toggleQueue: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Filter out legacy 30-second preview URLs (Apple Music / iTunes / mzstatic)
function isLegacyPreviewSong(song?: Partial<Song> | null): boolean {
  if (!song) return true;
  const url = (song.audioUrl || "").toLowerCase();
  const id = (song.id || "").toLowerCase();
  if (
    url.includes("apple.com") ||
    url.includes("mzstatic.com") ||
    url.includes("itunes") ||
    id.startsWith("real-") ||
    (typeof song.duration === "number" && song.duration <= 30 && song.duration > 0)
  ) {
    return true;
  }
  return false;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Honest licensing notice modal state for commercial discovery tracks
  const [licensingNoticeTrack, setLicensingNoticeTrack] = useState<Song | null>(null);
  const [isLicensingModalOpen, setIsLicensingModalOpen] = useState(false);

  // Official YouTube Player Modal state for mainstream music (Option A)
  const [activeVideoTrack, setActiveVideoTrack] = useState<Song | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Sync autoplay preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("cinova_music_autoplay");
      if (saved !== null) {
        setIsAutoplay(saved === "true");
      }
    } catch (_) {}
  }, []);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("cinova_music_autoplay", String(next));
        } catch (_) {}
      }
      return next;
    });
  }, []);

  // Single persistent HTMLAudioElement reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initial Local Cache Load
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedFavorites = localStorage.getItem("cinova_music_favorites");
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) {
          const cleanFavs = parsed.filter(
            (id: string) => typeof id === "string" && !id.startsWith("real-")
          );
          setFavoriteSongIds(cleanFavs);
        }
      }

      const savedRecent = localStorage.getItem("cinova_music_recent");
      if (savedRecent) {
        const parsed = JSON.parse(savedRecent);
        if (Array.isArray(parsed)) {
          const cleanRecent = parsed.filter(
            (s: Song) => s && !isLegacyPreviewSong(s)
          );
          setRecentlyPlayed(cleanRecent);
        }
      }

      const savedPlaylists = localStorage.getItem("cinova_music_playlists");
      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);
        if (Array.isArray(parsed)) {
          const cleanPlaylists = parsed.map((p: Playlist) => ({
            ...p,
            songs: (p.songs || []).filter((s: Song) => s && !isLegacyPreviewSong(s)),
          }));
          setUserPlaylists(cleanPlaylists);
        }
      }

      const savedVol = localStorage.getItem("cinova_music_volume");
      if (savedVol) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          setVolumeState(parsed);
          if (audioRef.current) {
            audioRef.current.volume = parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Could not load music state from localStorage", e);
    }
  }, []);

  // 2. Supabase Cloud Sync on Auth Change
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    fetchUserMusicData(user.id).then((cloudData) => {
      if (!isMounted) return;
      if (cloudData.favorites.length > 0) {
        setFavoriteSongIds((prev) => Array.from(new Set([...prev, ...cloudData.favorites])));
      }
      if (cloudData.playlists.length > 0) {
        setUserPlaylists(cloudData.playlists);
      }
      if (cloudData.recentlyPlayed.length > 0) {
        setRecentlyPlayed((prev) => {
          const combined = [...cloudData.recentlyPlayed, ...prev];
          const seen = new Set();
          return combined.filter((s) => {
            if (!s?.id || seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          }).slice(0, 25);
        });
      }
      if (cloudData.preferences) {
        setVolumeState(cloudData.preferences.volume);
        setRepeatMode(cloudData.preferences.repeatMode);
        setIsShuffle(cloudData.preferences.isShuffle);
        if (audioRef.current) {
          audioRef.current.volume = cloudData.preferences.volume;
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sync volume & mute state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync local cache
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("cinova_music_favorites", JSON.stringify(favoriteSongIds));
      localStorage.setItem("cinova_music_recent", JSON.stringify(recentlyPlayed));
      localStorage.setItem("cinova_music_playlists", JSON.stringify(userPlaylists));
      localStorage.setItem("cinova_music_volume", volume.toString());
    } catch (_) {}
  }, [favoriteSongIds, recentlyPlayed, userPlaylists, volume]);

  // Pause audio automatically if user logs out
  useEffect(() => {
    if (!user && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [user, isPlaying]);

  // Auth gate check: Logged-out users can browse freely, but playback requires login
  const requireLogin = useCallback(
    (titleContext?: string): boolean => {
      if (!user && !isAuthLoading) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("cinova:auth-gate:open", {
              detail: {
                returnTo: "/music",
                titleContext,
              },
            })
          );
        }
        return true;
      }
      return false;
    },
    [user, isAuthLoading]
  );

  const closeLicensingModal = useCallback(() => {
    setIsLicensingModalOpen(false);
    setLicensingNoticeTrack(null);
  }, []);

  const closeVideoModal = useCallback(() => {
    setIsVideoModalOpen(false);
    setActiveVideoTrack(null);
  }, []);

  const watchVideo = useCallback(
    (track: Song, contextQueue?: Song[]) => {
      if (requireLogin(track?.title)) {
        return;
      }
      if (!track?.youtubeId) {
        setAudioError("Music video is currently unavailable for this track.");
        return;
      }

      // If native HTML5 audio is currently playing, pause it to prevent audio clash
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      setIsPlaying(false);

      setActiveVideoTrack(track);
      setIsVideoModalOpen(true);

      const activeQueue = contextQueue && contextQueue.length > 0 ? contextQueue : MAINSTREAM_TRACKS;
      setQueue(activeQueue);
      const idx = activeQueue.findIndex((s) => s.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);

      // Record in recently played
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((s) => s.id !== track.id);
        return [track, ...filtered].slice(0, 25);
      });
      if (user?.id) {
        recordRecentlyPlayedTrack(user.id, track);
      }
    },
    [requireLogin, user?.id]
  );

  // Skip to next video track in the active queue
  const nextVideoTrack = useCallback(() => {
    const list = queue.length > 0 ? queue : MAINSTREAM_TRACKS;
    if (list.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * list.length);
    } else if (nextIdx >= list.length) {
      nextIdx = 0; // loop back around
    }
    const nextSong = list[nextIdx];
    if (nextSong) {
      setQueueIndex(nextIdx);
      if (nextSong.playbackType === "youtube_embed" || nextSong.youtubeId) {
        setActiveVideoTrack(nextSong);
      } else {
        playTrack(nextSong, list);
      }
    }
  }, [isShuffle, queue, queueIndex]);

  // Return to previous video track
  const prevVideoTrack = useCallback(() => {
    const list = queue.length > 0 ? queue : MAINSTREAM_TRACKS;
    if (list.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = list.length - 1;
    }
    const prevSong = list[prevIdx];
    if (prevSong) {
      setQueueIndex(prevIdx);
      if (prevSong.playbackType === "youtube_embed" || prevSong.youtubeId) {
        setActiveVideoTrack(prevSong);
      } else {
        playTrack(prevSong, list);
      }
    }
  }, [queue, queueIndex]);

  // Safe URL sanitizer for logging
  const sanitizeUrl = (url?: string): string => {
    if (!url) return "none";
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split("?")[0];
    }
  };

  // Playback dispatcher: Coordinates YouTube embedded modal (Option A) and native HTML5 audio (Independent)
  const playTrack = useCallback(
    (track: Song, contextQueue?: Song[]) => {
      // Enforce login requirement before initiating playback
      if (requireLogin(track?.title)) {
        return;
      }

      if (!track) return;

      // 1. Option A: Mainstream Songs with official YouTube embedded playout
      if (track.playbackType === "youtube_embed" || (track.source === "mainstream" && track.youtubeId)) {
        watchVideo(track, contextQueue);
        return;
      }

      // 2. If track does NOT have an authorized direct audio streaming URL (Discovery tracks)
      // or carries non-commercial restrictions (CC-NC / unverified rights):
      if (!track.audioUrl || track.playbackType === "discovery_only" || (track.license && track.license.isCommercialAllowed === false)) {
        setLicensingNoticeTrack(track);
        setIsLicensingModalOpen(true);
        return;
      }

      // 3. Close YouTube player modal if open when starting native audio
      if (isVideoModalOpen) {
        setIsVideoModalOpen(false);
        setActiveVideoTrack(null);
      }

      // 4. Block and purge legacy 30-second preview clips
      if (isLegacyPreviewSong(track)) {
        console.warn("[CINOVA Audio] Blocked legacy preview track:", track.title, track.audioUrl);
        setAudioError("30-second preview clips are removed. Please choose a licensed full-length song.");
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setRecentlyPlayed((prev) => prev.filter((s) => s.id !== track.id));
        return;
      }

      // 5. Genuine Full-Length Native HTML5 Audio Playback (Independent Music)
      setAudioError(null);
      setIsLoadingAudio(true);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      const activeQueue = contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      setQueue(activeQueue);
      const idx = activeQueue.findIndex((s) => s.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);

      // Record in recently played
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((s) => s.id !== track.id);
        return [track, ...filtered].slice(0, 25);
      });

      if (user?.id) {
        recordRecentlyPlayedTrack(user.id, track);
      }

      const audio = audioRef.current;
      if (!audio) {
        console.warn("[CINOVA Audio] audioRef not attached yet.");
        return;
      }

      console.log(
        "[CINOVA Audio] Initiating authorized audio playback for:",
        track.title,
        "| Stream source:",
        sanitizeUrl(track.audioUrl)
      );

      // Reset existing audio element state
      audio.pause();
      audio.currentTime = 0;

      // Ensure sensible volume and unmuted state
      audio.volume = isMuted ? 0 : volume > 0 ? volume : 0.85;
      audio.muted = isMuted;

      // Assign new source and call load() to reset decoding pipeline
      audio.src = track.audioUrl;
      audio.load();

      // Play with proper promise handling. Do NOT mark isPlaying = true until 'playing' event fires!
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[CINOVA Audio] play() promise resolved for:", track.title);
          })
          .catch((err) => {
            console.error("[CINOVA Audio] play() promise rejected:", err.name, err.message);
            setIsPlaying(false);
            setIsLoadingAudio(false);

            if (err.name === "NotAllowedError") {
              setAudioError("Browser autoplay policy prevented playback. Click Play to listen.");
            } else if (err.name === "NotSupportedError") {
              setAudioError("Audio format or source stream is not supported by your browser.");
            } else {
              setAudioError(`Audio stream error: ${err.message}`);
            }
          });
      }
    },
    [isMuted, requireLogin, user?.id, volume]
  );

  // Toggle play/pause (protected by login)
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (requireLogin(currentTrack.title)) {
        return;
      }

      if (!audio.src && currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
      }
      audio.volume = isMuted ? 0 : volume > 0 ? volume : 0.85;
      audio.muted = isMuted;

      audio
        .play()
        .then(() => {
          console.log("[CINOVA Audio] Resumed playback");
        })
        .catch((err) => {
          console.error("[CINOVA Audio] Resume play failed:", err);
          setIsPlaying(false);
        });
    }
  }, [currentTrack, isMuted, isPlaying, requireLogin, volume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (!currentTrack) return;
    if (requireLogin(currentTrack.title)) {
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      if (!audio.src && currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
      }
      audio.volume = isMuted ? 0 : volume > 0 ? volume : 0.85;
      audio.muted = isMuted;
      audio.play().catch(console.error);
    }
  }, [currentTrack, isMuted, requireLogin, volume]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const target = Math.max(0, Math.min(seconds, audio.duration || duration || 300));
      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration]
  );

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(vol, 1));
      setVolumeState(clamped);
      setIsMuted(clamped === 0);
      const audio = audioRef.current;
      if (audio) {
        audio.volume = clamped;
        audio.muted = clamped === 0;
      }
      if (user?.id) {
        syncUserPreferences(user.id, { volume: clamped, repeatMode, isShuffle });
      }
    },
    [isShuffle, repeatMode, user?.id]
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (isMuted) {
      setIsMuted(false);
      const restored = volume > 0 ? volume : 0.85;
      setVolumeState(restored);
      if (audio) {
        audio.muted = false;
        audio.volume = restored;
      }
    } else {
      setIsMuted(true);
      if (audio) {
        audio.muted = true;
        audio.volume = 0;
      }
    }
  }, [isMuted, volume]);

  const nextTrack = useCallback(() => {
    if (isVideoModalOpen && activeVideoTrack) {
      nextVideoTrack();
      return;
    }
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === "all") nextIdx = 0;
      else return;
    }
    const nextSong = queue[nextIdx];
    if (nextSong) playTrack(nextSong, queue);
  }, [activeVideoTrack, isShuffle, isVideoModalOpen, nextVideoTrack, playTrack, queue, queueIndex, repeatMode]);

  const prevTrack = useCallback(() => {
    if (isVideoModalOpen && activeVideoTrack) {
      prevVideoTrack();
      return;
    }
    if (currentTime > 4) {
      seek(0);
      return;
    }
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === "all" ? queue.length - 1 : 0;
    }
    const prevSong = queue[prevIdx];
    if (prevSong) playTrack(prevSong, queue);
  }, [activeVideoTrack, currentTime, isVideoModalOpen, playTrack, prevVideoTrack, queue, queueIndex, repeatMode, seek]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (user?.id) {
        syncUserPreferences(user.id, { volume, repeatMode, isShuffle: next });
      }
      return next;
    });
  }, [repeatMode, user?.id, volume]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next: RepeatMode = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      if (user?.id) {
        syncUserPreferences(user.id, { volume, repeatMode: next, isShuffle });
      }
      return next;
    });
  }, [isShuffle, user?.id, volume]);

  const toggleFavorite = useCallback(
    (songId: string, songObj?: Song) => {
      setFavoriteSongIds((prev) => {
        const isFav = prev.includes(songId);
        const next = isFav ? prev.filter((id) => id !== songId) : [...prev, songId];

        if (user?.id) {
          const songToSync =
            songObj ||
            queue.find((s) => s.id === songId) ||
            recentlyPlayed.find((s) => s.id === songId) ||
            ({ id: songId, title: "Favorite Song", artist: "Artist", coverUrl: "", duration: 0, genre: "", source: "mainstream", playbackType: "discovery_only" } as Song);
          syncUserFavorite(user.id, songToSync, !isFav);
        }
        return next;
      });
    },
    [queue, recentlyPlayed, user?.id]
  );

  const isFavorite = useCallback(
    (songId: string) => favoriteSongIds.includes(songId),
    [favoriteSongIds]
  );

  const addToQueue = useCallback((track: Song) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => prev.filter((_, idx) => idx !== index));
      if (index < queueIndex) {
        setQueueIndex((prev) => Math.max(0, prev - 1));
      }
    },
    [queueIndex]
  );

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  const createPlaylist = useCallback(
    (title: string, description?: string): string => {
      const newId = `playlist-${Date.now()}`;
      const newPlaylist: Playlist = {
        id: newId,
        title,
        description: description || "Custom Playlist",
        curator: "You",
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        songs: [],
      };
      setUserPlaylists((prev) => [newPlaylist, ...prev]);
      if (user?.id) {
        syncUserPlaylist(user.id, newPlaylist);
      }
      return newId;
    },
    [user?.id]
  );

  const addToPlaylist = useCallback(
    (playlistId: string, track: Song) => {
      setUserPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            if (pl.songs.some((s) => s.id === track.id)) return pl;
            const updated = { ...pl, songs: [...pl.songs, track] };
            if (user?.id) {
              syncUserPlaylist(user.id, updated);
            }
            return updated;
          }
          return pl;
        })
      );
    },
    [user?.id]
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setUserPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            const updated = { ...pl, songs: pl.songs.filter((s) => s.id !== songId) };
            if (user?.id) {
              syncUserPlaylist(user.id, updated);
            }
            return updated;
          }
          return pl;
        })
      );
    },
    [user?.id]
  );

  const openFullScreenPlayer = useCallback(() => setIsFullScreenPlayerOpen(true), []);
  const closeFullScreenPlayer = useCallback(() => setIsFullScreenPlayerOpen(false), []);
  const toggleQueue = useCallback(() => setIsQueueOpen((prev) => !prev), []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoadingAudio,
        audioError,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        recentlyPlayed,
        favoriteSongIds,
        userPlaylists,
        isFullScreenPlayerOpen,
        isQueueOpen,

        licensingNoticeTrack,
        isLicensingModalOpen,
        closeLicensingModal,

        activeVideoTrack,
        isVideoModalOpen,
        isAutoplay,
        toggleAutoplay,
        watchVideo,
        closeVideoModal,
        nextVideoTrack,
        prevVideoTrack,

        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        isFavorite,
        addToQueue,
        removeFromQueue,
        clearQueue,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        openFullScreenPlayer,
        closeFullScreenPlayer,
        toggleQueue,
      }}
    >
      {children}

      {/* 
        Single Persistent HTMLAudioElement for CINOVA OTT Platform.
        All audio playback states, times, and errors are driven strictly by native browser audio events.
      */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadStart={() => {
          const audio = audioRef.current;
          if (audio) {
            console.log("[CINOVA Audio:loadstart] Source:", sanitizeUrl(audio.currentSrc));
          }
          setIsLoadingAudio(true);
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio) {
            console.log(
              "[CINOVA Audio:loadedmetadata] Duration:",
              audio.duration.toFixed(2),
              "s | ReadyState:",
              audio.readyState
            );
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
              setDuration(audio.duration);
            }
          }
        }}
        onCanPlay={() => {
          const audio = audioRef.current;
          if (audio) {
            console.log("[CINOVA Audio:canplay] Buffer ready to stream. ReadyState:", audio.readyState);
          }
          setIsLoadingAudio(false);
        }}
        onPlay={() => {
          console.log("[CINOVA Audio:play] Play event confirmed by browser.");
        }}
        onPlaying={() => {
          const audio = audioRef.current;
          console.log(
            "[CINOVA Audio:playing] Sound output active! CurrentTime:",
            audio ? audio.currentTime.toFixed(2) : 0,
            "s | Volume:",
            audio ? (audio.volume * 100).toFixed(0) + "%" : "85%"
          );
          setIsPlaying(true);
          setIsLoadingAudio(false);
          setAudioError(null);
        }}
        onPause={() => {
          const audio = audioRef.current;
          console.log(
            "[CINOVA Audio:pause] Playback paused at:",
            audio ? audio.currentTime.toFixed(2) : 0,
            "s"
          );
          setIsPlaying(false);
        }}
        onWaiting={() => {
          console.log("[CINOVA Audio:waiting] Buffering audio data from network...");
          setIsLoadingAudio(true);
        }}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio) {
            setCurrentTime(audio.currentTime);
          }
        }}
        onDurationChange={() => {
          const audio = audioRef.current;
          if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        }}
        onEnded={() => {
          console.log("[CINOVA Audio:ended] Track completed.");
          setIsPlaying(false);
          if (repeatMode === "one") {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(console.error);
            }
          } else {
            nextTrack();
          }
        }}
        onError={(e) => {
          const audio = audioRef.current;
          const mediaError = audio?.error;
          console.error(
            "[CINOVA Audio:error] Playback error occurred:",
            mediaError ? `Code ${mediaError.code}: ${mediaError.message}` : "Unknown error",
            "| Target src:",
            sanitizeUrl(audio?.currentSrc)
          );
          setIsPlaying(false);
          setIsLoadingAudio(false);

          let errorMsg = "Unable to play audio stream.";
          if (mediaError) {
            switch (mediaError.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMsg = "Playback was aborted.";
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMsg = "Network error while downloading the audio stream.";
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMsg = "An error occurred while decoding the audio stream.";
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = "Audio stream format not supported or URL unavailable.";
                break;
            }
          }
          setAudioError(errorMsg);
        }}
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
