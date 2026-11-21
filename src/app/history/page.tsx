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
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useAuth } from "@/context/AuthContext";

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  // Resolve watch progress items to movies
  const historyItems = useMemo(() => {
    return continueWatching
      .map((item) => {
        const movie = getMovieById(item.movieId);
        if (!movie) return null;
        const totalDuration = item.durationSeconds || movie.duration * 60 || 1;
        const pct = Math.min(
          100,
          Math.max(1, Math.round((item.progressSeconds / totalDuration) * 100))
        );
        return {
          ...item,
          movie,
          percentage: pct,
          formattedProgress: formatSeconds(item.progressSeconds),
          formattedTotal: formatSeconds(totalDuration),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [continueWatching, getMovieById]);

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
    <main className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8 lg:pl-28 max-w-[1600px] mx-auto">
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
              Watch History
            </h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-2xl leading-relaxed">
              Resume playback seamlessly right where you left off. Watch history is saved locally and
              available for all viewers across all movies, series, and anime.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3]">
                <Film className="w-3.5 h-3.5 text-[#FF385B]" />
                <span className="font-bold">{historyItems.length}</span>
                <span className="text-[#AAA0A7]">
                  {historyItems.length === 1 ? "title" : "titles"}
                </span>
              </span>

              {totalMinutesWatched > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3]">
                  <Clock className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span className="font-bold">{formatSeconds(totalMinutesWatched * 60)}</span>
                  <span className="text-[#AAA0A7]">streamed</span>
                </span>
              )}

              {!user && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160B10]/80 border border-amber-500/30 text-amber-300 text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Guest Mode • Synced to this device
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#160B10] hover:bg-rose-950/40 text-[#AAA0A7] hover:text-rose-300 border border-[rgba(155,25,57,0.28)] hover:border-rose-700/50 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
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
              This will remove all {historyItems.length} playback sessions from this browser. Your
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

      {/* Main Grid / Empty State */}
      {historyItems.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-2xl bg-[#10080C]/80 border border-[rgba(155,25,57,0.2)] max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center mx-auto text-[#E11D48]/60">
            <History className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#F5F1F3]">No Watch History Yet</h2>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-md mx-auto leading-relaxed">
              Whenever you play a movie, series episode, or anime, your progress is tracked here
              automatically so you never lose your place.
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {historyItems.map((item) => {
            const { movie, percentage, formattedProgress, formattedTotal } = item;
            const isCompleted = item.completed || percentage >= 95;

            return (
              <article
                key={item.movieId}
                className="group relative rounded-2xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.24)] hover:border-[#E11D48]/60 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#650A20]/30 flex flex-col"
              >
                {/* Thumbnail & Progress Overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#080506]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.backdropUrl || movie.posterUrl || "/icon.svg"}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#10080C] via-black/40 to-transparent" />

                  {/* Play Overlay Button */}
                  <Link
                    href={`/watch/${movie.id}`}
                    aria-label={`Resume watching ${movie.title}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#A30D32] to-[#E11D48] text-white flex items-center justify-center shadow-xl shadow-[#E11D48]/50 transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </Link>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-[#F5F1F3] border border-white/10 backdrop-blur-md">
                      {movie.type === "series" ? "Series" : "Movie"}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromHistory(item.movieId)}
                      title="Remove from history"
                      aria-label={`Remove ${movie.title} from history`}
                      className="w-7 h-7 rounded-full bg-black/75 hover:bg-rose-600 text-[#AAA0A7] hover:text-white flex items-center justify-center border border-white/10 transition-all opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                    <div
                      className={`h-full transition-all ${
                        isCompleted
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-[#A30D32] to-[#E11D48]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#AAA0A7]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF385B]" />
                        {isCompleted ? "Watched" : `${formattedProgress} of ${formattedTotal}`}
                      </span>
                      <span>{formatRelativeTime(item.lastWatched)}</span>
                    </div>

                    <h3 className="font-bold text-sm text-[#F5F1F3] line-clamp-1 group-hover:text-[#FF385B] transition-colors">
                      {movie.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-[#746971]">
                      <span>{movie.releaseYear}</span>
                      <span>•</span>
                      <span>{movie.rating}</span>
                      {movie.genre?.[0] && (
                        <>
                          <span>•</span>
                          <span className="truncate">{movie.genre[0]}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2 border-t border-[rgba(155,25,57,0.16)]">
                    <Link
                      href={`/watch/${movie.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-semibold shadow-md transition-all"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{isCompleted ? "Watch Again" : "Resume"}</span>
                    </Link>

                    <Link
                      href={`/movie/${movie.id}`}
                      title="View Movie Details"
                      className="p-2 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
