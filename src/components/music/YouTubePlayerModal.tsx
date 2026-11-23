"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  Youtube,
  ShieldCheck,
  Heart,
  AlertCircle,
  SkipBack,
  SkipForward,
  ListMusic,
  Zap,
  ZapOff,
  Shuffle,
  Music2,
  FolderPlus,
  Check,
  Play,
  Volume2,
} from "lucide-react";
import { Song, Playlist } from "@/types/music";
import { useMusic } from "@/context/MusicContext";
import { MAINSTREAM_TRACKS } from "@/lib/api/mainstream-client";

interface YouTubePlayerModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function YouTubePlayerModal({ song, isOpen, onClose }: YouTubePlayerModalProps) {
  const {
    toggleFavorite,
    isFavorite,
    queue,
    queueIndex,
    nextVideoTrack,
    prevVideoTrack,
    watchVideo,
    isAutoplay,
    toggleAutoplay,
    isShuffle,
    toggleShuffle,
    userPlaylists,
    addToPlaylist,
  } = useMusic();

  const [origin, setOrigin] = useState("");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Lock background scroll when modal is active to prevent scroll glitching
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddToPlaylistModal) {
          setShowAddToPlaylistModal(false);
        } else if (showPlaylist) {
          setShowPlaylist(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, showAddToPlaylistModal, showPlaylist]);

  // Autoplay handler: Listen for YouTube iframe JS API state changes
  useEffect(() => {
    if (!isOpen || !isAutoplay) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.origin.includes("youtube")) return;
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        // YouTube Player State: 0 = ENDED
        if (data?.event === "onStateChange" && data?.info === 0) {
          console.log("[CINOVA YouTube Player] Track ended, autoplaying next track...");
          nextVideoTrack();
        }
      } catch (_) {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, isAutoplay, nextVideoTrack]);

  // Current active playlist list: use context queue if available, fallback to full mainstream catalogue
  const activeList: Song[] = useMemo(() => {
    const list = queue && queue.length > 0 ? queue : MAINSTREAM_TRACKS;
    if (selectedCategory === "all") return list;
    return list.filter((s) => (s.category || "").toLowerCase() === selectedCategory.toLowerCase());
  }, [queue, selectedCategory]);

  const currentIdx = activeList.findIndex((s) => s.id === song?.id);
  const nextTrackCandidate = activeList[currentIdx !== -1 && currentIdx < activeList.length - 1 ? currentIdx + 1 : 0];

  const handleSelectSongFromPlaylist = useCallback(
    (targetSong: Song) => {
      if (targetSong.id === song?.id) return;
      watchVideo(targetSong, activeList);
    },
    [activeList, song?.id, watchVideo]
  );

  const handleAddCurrentToPlaylist = (plId: string) => {
    if (!song) return;
    addToPlaylist(plId, song);
    setAddedPlaylistId(plId);
    setTimeout(() => setAddedPlaylistId(null), 1500);
  };

  if (!isOpen || !song || !song.youtubeId) {
    return null;
  }

  const isFav = isFavorite(song.id);
  const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
  const embedUrl = `https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1${originParam}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${song.title}`}
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in select-none overflow-y-auto"
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-5xl bg-[#0B0408] border border-[rgba(225,29,72,0.35)] rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-[rgba(155,25,57,0.25)] bg-[#12060E]/95 shrink-0">
          {/* Song Info */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600/20 text-[#FF385B] border border-red-500/30 shrink-0">
              <Youtube className="w-4 h-4 fill-current" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {song.title}
                </h3>
                {song.category && (
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#E11D48]/20 text-[#FF385B] border border-[#E11D48]/30">
                    {song.category}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#AAA0A7] truncate">
                {song.artist || song.channelTitle}
              </p>
            </div>
          </div>

          {/* Controls: Prev, Next, Autoplay, Playlist, Fav, Close */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Previous Song Button */}
            <button
              type="button"
              onClick={prevVideoTrack}
              className="p-1.5 sm:p-2 rounded-xl text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-all active:scale-95 flex items-center gap-1"
              title="Previous Song"
              aria-label="Previous Song"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Next Song Button */}
            <button
              type="button"
              onClick={nextVideoTrack}
              className="p-1.5 sm:p-2 rounded-xl text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-all active:scale-95 flex items-center gap-1"
              title="Next Song"
              aria-label="Next Song"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Autoplay Toggle Button */}
            <button
              type="button"
              onClick={toggleAutoplay}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                isAutoplay
                  ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                  : "bg-[#1E0914] text-[#AAA0A7] hover:text-white border border-[rgba(155,25,57,0.3)]"
              }`}
              title={isAutoplay ? "Autoplay is ON (plays next song automatically)" : "Autoplay is OFF"}
            >
              {isAutoplay ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Autoplay</span>
            </button>

            {/* Playlist Queue Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPlaylist((prev) => !prev)}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                showPlaylist
                  ? "bg-[#FF385B] text-white"
                  : "bg-[#1E0914] text-[#AAA0A7] hover:text-white border border-[rgba(155,25,57,0.3)]"
              }`}
              title="Toggle Playlist & Queue"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Playlist</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">
                {activeList.length}
              </span>
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(song.id, song)}
              className="p-1.5 sm:p-2 rounded-xl text-[#AAA0A7] hover:text-[#FF385B] hover:bg-[#200A15] transition-colors"
              title={isFav ? "In My List" : "Add to My List"}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-[#E11D48] text-[#E11D48]" : ""}`} />
            </button>

            {/* Add to Custom Playlist Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowAddToPlaylistModal((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-colors hidden sm:flex"
              title="Add to Playlist"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            {/* External YouTube Link */}
            <a
              href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 rounded-xl text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-colors text-xs hidden md:flex items-center gap-1"
              title="Watch on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-[#AAA0A7] hover:text-white hover:bg-[#200A15] transition-colors ml-1"
              aria-label="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Video Player & Optional Playlist Side Drawer */}
        <div className="relative w-full flex-grow flex flex-col lg:flex-row overflow-hidden bg-black">
          {/* Video Section */}
          <div className={`relative flex-grow flex flex-col justify-center bg-black ${showPlaylist ? "lg:w-2/3" : "w-full"}`}>
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={embedUrl}
                title={song.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Up Next Quick Skip Banner */}
            {nextTrackCandidate && nextTrackCandidate.id !== song.id && (
              <div className="px-4 py-2 bg-[#12060E]/90 border-t border-[rgba(155,25,57,0.2)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-[#AAA0A7] font-medium text-[11px] uppercase tracking-wider">Up Next:</span>
                  <span className="text-white font-bold truncate">{nextTrackCandidate.title}</span>
                  <span className="text-[#AAA0A7] text-[11px] hidden sm:inline">by {nextTrackCandidate.artist}</span>
                </div>
                <button
                  type="button"
                  onClick={nextVideoTrack}
                  className="px-3 py-1 rounded-lg bg-[#E11D48]/20 hover:bg-[#E11D48] text-[#FF385B] hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0"
                >
                  <span>Play Next</span>
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Playlist & Queue Panel */}
          {showPlaylist && (
            <div className="w-full lg:w-1/3 bg-[#0E050B] border-t lg:border-t-0 lg:border-l border-[rgba(155,25,57,0.3)] flex flex-col max-h-[380px] lg:max-h-none overflow-hidden animate-slide-left">
              {/* Playlist Header & Categories */}
              <div className="p-3 border-b border-[rgba(155,25,57,0.2)] bg-[#140810]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-[#E11D48]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Now Playing Queue
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#AAA0A7]">
                    {currentIdx >= 0 ? `${currentIdx + 1} of ${activeList.length}` : `${activeList.length} tracks`}
                  </span>
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: "all", label: "All Songs" },
                    { id: "bollywood", label: "Bollywood" },
                    { id: "punjabi", label: "Punjabi" },
                    { id: "marathi", label: "Marathi" },
                    { id: "english", label: "English" },
                    { id: "romantic", label: "Romantic" },
                    { id: "devotional", label: "Devotional" },
                    { id: "old-classics", label: "Classics" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? "bg-[#E11D48] text-white"
                          : "bg-[#1E0914] text-[#AAA0A7] hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Song List */}
              <div className="flex-grow overflow-y-auto divide-y divide-[rgba(155,25,57,0.1)] p-1">
                {activeList.map((track, idx) => {
                  const isCurrent = track.id === song.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectSongFromPlaylist(track)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                        isCurrent
                          ? "bg-[#E11D48]/20 border border-[#E11D48]/40"
                          : "hover:bg-[#1A0A14] text-[#AAA0A7] hover:text-white"
                      }`}
                    >
                      {/* Index / Playing Equalizer Indicator */}
                      <div className="w-5 text-center shrink-0">
                        {isCurrent ? (
                          <div className="flex items-end justify-center gap-0.5 h-3.5">
                            <span className="w-0.5 h-full bg-[#FF385B] animate-pulse" />
                            <span className="w-0.5 h-2 bg-[#FF385B] animate-pulse delay-75" />
                            <span className="w-0.5 h-3 bg-[#FF385B] animate-pulse delay-150" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#746971]">{idx + 1}</span>
                        )}
                      </div>

                      {/* Cover Thumbnail */}
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#1E0914] shrink-0 border border-white/5">
                        <Image
                          src={track.coverUrl}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>

                      {/* Song Title & Artist */}
                      <div className="min-w-0 flex-grow">
                        <p className={`text-xs font-bold truncate ${isCurrent ? "text-white" : "text-[#F5F1F3]"}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-[#AAA0A7] truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-[10px] font-mono text-[#AAA0A7] shrink-0 pr-1">
                        {track.durationText || "3:30"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add to Playlist Popup Menu */}
        {showAddToPlaylistModal && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-[#12060E] border border-[rgba(225,29,72,0.4)] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(155,25,57,0.2)]">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#FF385B]" />
                  <h4 className="text-sm font-bold text-white">Add to Playlist</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddToPlaylistModal(false)}
                  className="p-1 rounded-full text-[#AAA0A7] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userPlaylists && userPlaylists.length > 0 ? (
                  userPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleAddCurrentToPlaylist(pl.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1A0A14] hover:bg-[#250E1D] text-left text-xs transition-colors"
                    >
                      <span className="text-white font-medium truncate">{pl.title}</span>
                      {addedPlaylistId === pl.id ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <span className="text-[#AAA0A7] text-[10px]">{pl.songs.length} songs</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-[#AAA0A7] text-center py-4">
                    No custom playlists created yet. You can create playlists from the Music dashboard.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddToPlaylistModal(false)}
                className="w-full py-2 rounded-xl bg-[#1E0914] hover:bg-[#2A0C1C] text-xs font-bold text-white border border-[rgba(155,25,57,0.3)]"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Footer info & compliance notice */}
        <div className="px-3 sm:px-6 py-2.5 bg-[#0B0408] border-t border-[rgba(155,25,57,0.2)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#746971] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Official YouTube Embedded Player • Content ID Protected • Full-Length Playback</span>
            <span className="sm:hidden">Official YouTube Player</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#AAA0A7]">
            <AlertCircle className="w-3 h-3 text-[#AAA0A7]" />
            <span>If video is restricted by label in your territory, click YouTube to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
