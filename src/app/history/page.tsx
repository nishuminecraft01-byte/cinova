"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Play,
  Trash2,
  Clock,
  Sparkles,
  Film,
  Tv,
  Music2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Check,
  Disc3,
  X,
  RotateCcw,
} from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useAuth } from "@/context/AuthContext";
import { useMusic } from "@/context/MusicContext";
import CinovaImage from "@/components/CinovaImage";
import { WatchProgress } from "@/types/movie";
import { Song } from "@/types/music";

type HistoryTab = "all" | "continue" | "movies" | "series" | "music";

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  const remainingM = m % 60;
  if (h > 0) {
    return `${h}h ${remainingM}m`;
  }
  return `${m}m`;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Recently";
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMinutes = Math.floor((now - past) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function HistoryPage() {
  const { continueWatching, removeFromHistory, clearHistory, getMovieById } = useWatchlist();
  const { user } = useAuth();
  const { recentlyPlayed, playTrack } = useMusic();

  const [activeTab, setActiveTab] = useState<HistoryTab>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  // Normalize all history items with fallback to stored metadata
  const normalizedVideoHistory = useMemo(() => {
    return continueWatching.map((item) => {
      const foundMovie = getMovieById(item.movieId);
      const title = foundMovie?.title || item.title || "CINOVA Content";
      const totalDur = item.durationSeconds || (foundMovie?.duration ? foundMovie.duration * 60 : 0) || 1;
      const progressSec = item.progressSeconds || 0;
      const pct =
        typeof item.progressPercentage === "number"
          ? item.progressPercentage
          : Math.min(100, Math.round((progressSec / totalDur) * 100));

      const isCompleted = Boolean(item.completed) || pct >= 92;
      const sNum = item.seasonNumber ?? item.season;
      const eNum = item.episodeNumber ?? item.episode;
      const isTv = item.contentType === "series" || item.contentType === "anime" || Boolean(sNum || eNum);
      const image =
        item.backdropUrl ||
        item.posterUrl ||
        foundMovie?.backdropUrl ||
        foundMovie?.posterUrl ||
        "";

      const watchHref =
        sNum && eNum
          ? `/watch/${item.movieId}?season=${sNum}&ep=${eNum}`
          : `/watch/${item.movieId}`;

      const detailHref = isTv ? `/series/${item.movieId}` : `/movie/${item.movieId}`;

      return {
        ...item,
        title,
        image,
        totalDur,
        progressSec,
        percentage: pct,
        isCompleted,
        isTv,
        sNum,
        eNum,
        watchHref,
        detailHref,
        formattedProgress: formatSeconds(progressSec),
        formattedTotal: formatSeconds(totalDur),
        quality: foundMovie?.quality || "1080p FHD",
      };
    });
  }, [continueWatching, getMovieById]);

  // Categorize
  const continueItems = useMemo(
    () => normalizedVideoHistory.filter((i) => !i.isCompleted && i.progressSec > 10 && i.percentage < 95),
    [normalizedVideoHistory]
  );

  const movieHistory = useMemo(
    () => normalizedVideoHistory.filter((i) => !i.isTv),
    [normalizedVideoHistory]
  );

  const seriesHistory = useMemo(
    () => normalizedVideoHistory.filter((i) => i.isTv),
    [normalizedVideoHistory]
  );

  const totalMinutesWatched = useMemo(() => {
    return Math.floor(
      continueWatching.reduce((acc, curr) => acc + (curr.progressSeconds || 0), 0) / 60
    );
  }, [continueWatching]);

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 4000);
  };

  return (
    <main className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8 lg:pl-28 max-w-[1600px] mx-auto select-none">
      {/* Page Header */}
      <div className="relative rounded-2xl overflow-hidden border border-[rgba(155,25,57,0.24)] bg-[#10080C] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center text-[#F5F1F3] shadow-lg shadow-[#650A20]/40">
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#FF385B]">
                CINOVA Library
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F1F3] tracking-tight">
              Watch &amp; Music History
            </h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-2xl leading-relaxed">
              Resume video and audio playback seamlessly right where you left off. Watch progress and
              listening history are automatically synchronized across all your devices.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3]">
                <Film className="w-3.5 h-3.5 text-[#FF385B]" />
                <span className="font-bold">{normalizedVideoHistory.length}</span>
                <span className="text-[#AAA0A7]">video titles</span>
              </span>

              {totalMinutesWatched > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3]">
                  <Clock className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span className="font-bold">{formatSeconds(totalMinutesWatched * 60)}</span>
                  <span className="text-[#AAA0A7]">streamed</span>
                </span>
              )}

              {recentlyPlayed.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3]">
                  <Music2 className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span className="font-bold">{recentlyPlayed.length}</span>
                  <span className="text-[#AAA0A7]">songs played</span>
                </span>
              )}

              {user ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Synced with CINOVA Cloud
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10]/80 border border-amber-500/30 text-amber-300 text-[11px] hover:border-amber-400"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Guest Mode • Sign in to sync across devices &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            {normalizedVideoHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#160B10] hover:bg-rose-950/40 text-[#AAA0A7] hover:text-rose-300 border border-[rgba(155,25,57,0.28)] hover:border-rose-700/50 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}

            <Link
              href="/movies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(225,29,72,0.35)] transition-all"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-6 border-t border-[rgba(155,25,57,0.18)] mt-6">
          {[
            { id: "all", label: "All History", count: normalizedVideoHistory.length + recentlyPlayed.length },
            { id: "continue", label: "Continue Watching", count: continueItems.length },
            { id: "movies", label: "Movies", count: movieHistory.length },
            { id: "series", label: "Series & Anime", count: seriesHistory.length },
            { id: "music", label: "Recently Played Music", count: recentlyPlayed.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as HistoryTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#E11D48] text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)]"
                    : "bg-[#160B10] text-[#AAA0A7] hover:text-white hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.22)]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? "bg-black/30 text-white" : "bg-[#250E1D] text-[#FF385B]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cleared Notice Banner */}
      {clearedNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Your watch history has been cleared successfully.</span>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.35)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-[#F5F1F3]">Clear Watch History?</h3>
            </div>

            <p className="text-xs text-[#AAA0A7] leading-relaxed">
              This will clear all {normalizedVideoHistory.length} saved video playback sessions from your account. Your
              saved watchlist will not be affected.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/50"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: CONTINUE WATCHING (when tab is all or continue) */}
      {(activeTab === "all" || activeTab === "continue") && continueItems.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F1F3]">
              Continue Watching
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#650A20]/50 text-[#FF385B] border border-[#E11D48]/30">
              {continueItems.length} in progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {continueItems.map((item) => (
              <VideoHistoryCard
                key={`${item.movieId}-${item.sNum || 0}-${item.eNum || 0}`}
                item={item}
                onRemove={() => removeFromHistory(item.movieId, item.sNum, item.eNum)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: RECENTLY WATCHED MOVIES */}
      {(activeTab === "all" || activeTab === "movies") && movieHistory.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F1F3]">
              Recently Watched Movies
            </h2>
            <span className="text-xs text-[#AAA0A7]">({movieHistory.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {movieHistory.map((item) => (
              <VideoHistoryCard
                key={item.movieId}
                item={item}
                onRemove={() => removeFromHistory(item.movieId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: RECENTLY WATCHED SERIES & ANIME */}
      {(activeTab === "all" || activeTab === "series") && seriesHistory.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F1F3]">
              Recently Watched Series &amp; Anime
            </h2>
            <span className="text-xs text-[#AAA0A7]">({seriesHistory.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {seriesHistory.map((item) => (
              <VideoHistoryCard
                key={`${item.movieId}-${item.sNum || 0}-${item.eNum || 0}`}
                item={item}
                onRemove={() => removeFromHistory(item.movieId, item.sNum, item.eNum)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: RECENTLY PLAYED MUSIC */}
      {(activeTab === "all" || activeTab === "music") && recentlyPlayed.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 bg-[#FF385B] rounded-full" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F1F3]">
                Recently Played Music
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#650A20]/50 text-[#FF385B] border border-[#E11D48]/30">
                {recentlyPlayed.length} tracks
              </span>
            </div>
            <Link
              href="/music"
              className="text-xs font-semibold text-[#AAA0A7] hover:text-[#FF385B] transition-colors"
            >
              Open Music &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {recentlyPlayed.map((song) => (
              <div
                key={song.id}
                className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#14060F] border border-[rgba(225,29,72,0.2)] hover:border-[#FF385B]/60 transition-all hover:bg-[#1E0916]"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#1D0C13] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.coverUrl || "/icon.svg"}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => playTrack(song)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Play ${song.title}`}
                  >
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#FF385B] transition-colors">
                    {song.title}
                  </p>
                  <p className="text-[11px] text-[#AAA0A7] truncate">{song.artist}</p>
                  <span className="inline-block mt-0.5 text-[9px] font-semibold text-[#FF385B] uppercase tracking-wider">
                    {song.category || song.language || "Music"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => playTrack(song)}
                  className="w-8 h-8 rounded-full bg-[#E11D48]/20 hover:bg-[#E11D48] text-[#FF385B] hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="Play song"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {normalizedVideoHistory.length === 0 && recentlyPlayed.length === 0 && (
        <div className="text-center py-20 px-6 rounded-2xl bg-[#10080C]/80 border border-[rgba(155,25,57,0.2)] max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center mx-auto text-[#E11D48]/60">
            <History className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#F5F1F3]">No Watch or Music History Yet</h2>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-md mx-auto leading-relaxed">
              Whenever you stream a movie, series, anime, or play a song, your progress is saved here
              automatically so you can resume playback anytime.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/movies"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider shadow-[0_6px_20px_rgba(225,29,72,0.35)] transition-all"
            >
              Browse Movies
            </Link>
            <Link
              href="/series"
              className="px-6 py-3 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider transition-all"
            >
              Explore Series
            </Link>
            <Link
              href="/music"
              className="px-6 py-3 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider transition-all"
            >
              Discover Music
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function VideoHistoryCard({
  item,
  onRemove,
}: {
  item: any;
  onRemove: () => void;
}) {
  return (
    <article className="group relative rounded-2xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.24)] hover:border-[#E11D48]/60 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#650A20]/30 flex flex-col">
      {/* Thumbnail & Progress Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#080506]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image || "/icon.svg"}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#10080C] via-black/40 to-transparent" />

        {/* Play Overlay Button */}
        <Link
          href={item.watchHref}
          aria-label={`Resume watching ${item.title}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#A30D32] to-[#E11D48] text-white flex items-center justify-center shadow-xl shadow-[#E11D48]/50 transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-[#F5F1F3] border border-white/10 backdrop-blur-md">
              {item.isTv ? "Series" : "Movie"}
            </span>
            {item.sNum && item.eNum && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E11D48]/80 text-white backdrop-blur-md">
                S{item.sNum} : E{item.eNum}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            title="Remove from history"
            aria-label={`Remove ${item.title} from history`}
            className="w-7 h-7 rounded-full bg-black/75 hover:bg-rose-600 text-[#AAA0A7] hover:text-white flex items-center justify-center border border-white/10 transition-all opacity-80 hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
          <div
            className={`h-full transition-all ${
              item.isCompleted
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-[#A30D32] to-[#E11D48]"
            }`}
            style={{ width: `${item.percentage}%` }}
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#AAA0A7]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF385B]" />
              {item.isCompleted ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Completed
                </span>
              ) : (
                `${item.formattedProgress} of ${item.formattedTotal} (${item.percentage}%)`
              )}
            </span>
            <span>{formatRelativeTime(item.lastWatched)}</span>
          </div>

          <h3 className="font-bold text-sm text-[#F5F1F3] line-clamp-1 group-hover:text-[#FF385B] transition-colors">
            {item.title}
          </h3>

          {item.episodeTitle && (
            <p className="text-xs text-[#AAA0A7] line-clamp-1">{item.episodeTitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2 border-t border-[rgba(155,25,57,0.16)]">
          <Link
            href={item.watchHref}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-semibold shadow-md transition-all"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{item.isCompleted ? "Watch Again" : "Resume"}</span>
          </Link>

          <Link
            href={item.detailHref}
            title="View Details"
            className="p-2 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
          >
            <Info className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
