"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bookmark,
  Clock,
  Settings,
  Sparkles,
  Trash2,
  Play,
  Check,
  Sliders,
  Volume2,
  Shield,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import { Movie } from "@/types/movie";
import {
  FREE_DAILY_WATCH_LIMIT_MINUTES,
  formatTimeUntilReset,
  formatWatchTimeRemaining,
  getPlanById,
} from "@/lib/membership";

function ProfileContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    watchlist,
    removeFromWatchlist,
    continueWatching,
    removeFromHistory,
    clearHistory,
    getMovieById,
  } = useWatchlist();

  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<"watchlist" | "continue" | "settings">(
    tabParam === "settings"
      ? "settings"
      : tabParam === "continue" || tabParam === "history"
      ? "continue"
      : "watchlist"
  );
  const [preferredQuality, setPreferredQuality] = useState("720p (HD)");
  const [preferSubtitles, setPreferSubtitles] = useState(true);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cinova_playback_prefs");
      if (saved) {
        const parsed = JSON.parse(saved) as { quality?: string; preferSubtitles?: boolean };
        if (parsed.quality) setPreferredQuality(parsed.quality);
        if (typeof parsed.preferSubtitles === "boolean") setPreferSubtitles(parsed.preferSubtitles);
      }
    } catch {
      // Ignore invalid local prefs
    }
  }, []);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [watchQuota, setWatchQuota] = useState<{
    isUnlimited: boolean;
    remainingSeconds: number | null;
    isLimitReached: boolean;
    resetsAtIst: string;
  } | null>(null);

  const activePlan = getPlanById(user?.tier);

  useEffect(() => {
    if (tabParam === "settings") setActiveTab("settings");
    else if (tabParam === "continue" || tabParam === "history") setActiveTab("continue");
    else if (tabParam === "watchlist") setActiveTab("watchlist");
  }, [tabParam]);

  useEffect(() => {
    let active = true;

    fetch("/api/watch-time", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.quota) {
          setWatchQuota(data.quota);
        }
      })
      .catch(() => {
        // Non-blocking
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  // Resolve watchlist movies
  const watchlistMovies = watchlist
    .map((id) => getMovieById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getMovieById>>[];

  // Resolve continue watching
  const continueItems = continueWatching
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
    }>;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        "cinova_playback_prefs",
        JSON.stringify({ quality: preferredQuality, preferSubtitles })
      );
    } catch {
      // Non-fatal
    }
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 3000);
  };

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
      {/* Profile Header Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[rgba(155,25,57,0.24)] bg-[#10080C] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] border border-[#E11D48]/40 shadow-lg shadow-[#650A20]/40 flex items-center justify-center font-bold text-[#F5F1F3] text-2xl shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "C"}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">
                  {user?.name || "CINOVA Guest"}
                </h1>
                {user?.role && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#650A20]/55 text-[#FF385B] border border-[#E11D48]/35 text-[10px] uppercase font-bold tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#AAA0A7] font-mono">
                {user?.email || "Not signed in • Browsing on CINOVA Free"}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                <span className="flex items-center gap-1.5 text-[#F5F1F3] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF385B]" />
                  {activePlan.name} ({activePlan.maxQualityLabel})
                </span>
                <span className="text-[#746971]">•</span>
                {watchQuota && !watchQuota.isUnlimited ? (
                  <span className="text-[#AAA0A7]">
                    {watchQuota.isLimitReached
                      ? `Daily ${FREE_DAILY_WATCH_LIMIT_MINUTES}m limit reached • Resets in ${formatTimeUntilReset(watchQuota.resetsAtIst)}`
                      : `${formatWatchTimeRemaining(watchQuota.remainingSeconds ?? 0)} / ${FREE_DAILY_WATCH_LIMIT_MINUTES}m watch time left today`}
                  </span>
                ) : (
                  <span className="text-[#AAA0A7]">Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
            {!user && (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs transition-all"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-xs shadow-[0_6px_18px_rgba(163,13,50,0.38)] transition-all"
            >
              Manage Plan
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs transition-all"
              >
                Admin Panel
              </Link>
            )}
            {user?.role === "creator" && (
              <Link
                href="/creator"
                className="px-4 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs transition-all"
              >
                Creator Studio
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Owner / Administrator Access Callout */}
      {user?.role === "admin" && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#650A20]/60 via-[#160B10] to-[#10080C] border border-[#E11D48]/40 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#650A20] border border-[#E11D48]/50 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#FF385B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF385B]">
                  Platform Owner Access
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E11D48]/20 text-[#F5F1F3] border border-[#E11D48]/40">
                  ADMIN
                </span>
              </div>
              <h2 className="text-base font-bold text-[#F5F1F3]">
                CINOVA Owner Admin Dashboard is Active
              </h2>
              <p className="text-xs text-[#AAA0A7] mt-0.5">
                You have verified administrative privileges to manage catalog, ingest TMDB content, review submissions, and trigger scheduled syncs.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(225,29,72,0.35)] transition-all"
          >
            Open Admin Dashboard &rarr;
          </Link>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-[rgba(155,25,57,0.2)] pb-3 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${activeTab === "watchlist"
            ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3]"
            : "border-transparent text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10]"
            }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          My Watchlist ({watchlistMovies.length})
        </button>

        <button
          onClick={() => setActiveTab("continue")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${activeTab === "continue"
            ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3]"
            : "border-transparent text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10]"
            }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Continue Watching ({continueItems.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${activeTab === "settings"
            ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/50 text-[#F5F1F3]"
            : "border-transparent text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10]"
            }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Stream Preferences
        </button>
      </div>

      {/* Tab: Watchlist */}
      {activeTab === "watchlist" && (
        <div>
          {watchlistMovies.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] space-y-3">
              <Bookmark className="w-12 h-12 text-[#E11D48]/40 mx-auto" />
              <h3 className="text-lg font-bold text-[#F5F1F3]">Your Watchlist is empty</h3>
              <p className="text-xs text-[#AAA0A7] max-w-sm mx-auto">
                Explore movies and series on CINOVA and tap + to pin them to your queue.
              </p>
              <Link
                href="/movies"
                className="inline-block mt-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-xs transition-all"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {watchlistMovies.map((movie) => (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    movie={movie}
                    aspect="landscape"
                    fluid
                    onOpenModal={(m) => setModalMovie(m)}
                  />
                  <button
                    onClick={() => removeFromWatchlist(movie.id)}
                    className="absolute top-2.5 left-2.5 z-30 p-1.5 rounded-full bg-[#080506]/90 hover:bg-[#E11D48] border border-[rgba(155,25,57,0.35)] text-[#F5F1F3] opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    title="Remove from My List"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Continue Watching */}
      {activeTab === "continue" && (
        <div>
          {continueItems.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] space-y-3">
              <Clock className="w-12 h-12 text-[#E11D48]/40 mx-auto" />
              <h3 className="text-lg font-bold text-[#F5F1F3]">No active watching sessions</h3>
              <p className="text-xs text-[#AAA0A7] max-w-sm mx-auto">
                Start watching any title to pause and resume playback seamlessly.
              </p>
              <Link
                href="/history"
                className="inline-block mt-3 px-5 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] font-semibold text-xs transition-all"
              >
                Open Watch History
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#AAA0A7]">
                  Showing {continueItems.length} active sessions
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => clearHistory()}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                  <Link
                    href="/history"
                    className="text-xs text-[#FF385B] hover:text-[#F5F1F3] font-semibold transition-colors"
                  >
                    View Dedicated History Page &rarr;
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {continueItems.map(({ movie, progressSeconds, durationSeconds }) => {
                  const pct = Math.min(
                    100,
                    Math.round((progressSeconds / (durationSeconds || 1)) * 100)
                  );
                  return (
                    <div
                      key={movie.id}
                      className="group/card relative p-4 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.22)] flex items-center gap-4 hover:border-[#E11D48]/55 transition-all"
                    >
                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-[#080506] flex-shrink-0 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={movie.backdropUrl || movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <Link
                            href={`/watch/${movie.id}`}
                            className="w-7 h-7 rounded-full bg-[#E11D48] flex items-center justify-center text-[#F5F1F3]"
                          >
                            <Play className="w-3.5 h-3.5 fill-[#F5F1F3] ml-0.5" />
                          </Link>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-sm font-bold text-[#F5F1F3] truncate">{movie.title}</h4>
                        <p className="text-xs text-[#AAA0A7] mt-0.5">
                          {Math.floor(progressSeconds / 60)}m watched ({pct}%)
                        </p>
                        <div className="w-full bg-[#080506] h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-[#E11D48] h-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromHistory(movie.id)}
                        title="Remove from history"
                        aria-label={`Remove ${movie.title} from history`}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-[#10080C] hover:bg-rose-600 text-[#AAA0A7] hover:text-white border border-transparent hover:border-rose-400 transition-all opacity-0 group-hover/card:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[rgba(155,25,57,0.18)]">
            <Sliders className="w-5 h-5 text-[#E11D48]" />
            <h3 className="text-lg font-bold text-[#F5F1F3]">Playback &amp; Quality Settings</h3>
          </div>

          {savedSettingsMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" /> Preferences saved successfully.
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#AAA0A7] uppercase tracking-wider block mb-2">
              Default Stream Quality
            </label>
            <select
              value={preferredQuality}
              onChange={(e) => setPreferredQuality(e.target.value)}
              className="w-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] rounded-xl px-4 py-2.5 text-xs text-[#F5F1F3] focus:outline-none focus:border-[#E11D48]"
            >
              <option value="720p (HD)">Up to 720p HD (CINOVA Free)</option>
              <option value="1080p (FHD)">Full HD 1080p (CINOVA Standard — Coming Soon)</option>
              <option value="4K UHD (Future-ready)">4K UHD (CINOVA Ultra — Future-ready)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.24)]">
            <div>
              <p className="text-xs font-bold text-[#F5F1F3] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#E11D48]" />
                Prefer Subtitles When Available
              </p>
              <p className="text-[11px] text-[#AAA0A7]">
                Standard stereo audio is active on CINOVA Free. Enable default subtitle preference across supported players.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferSubtitles}
              onChange={(e) => setPreferSubtitles(e.target.checked)}
              className="w-4 h-4 accent-[#E11D48] shrink-0"
            />
          </div>

          <div className="pt-4 border-t border-[rgba(155,25,57,0.18)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#AAA0A7] mb-3">
              Progressive Web App
            </h4>
            <div className="p-4 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#F5F1F3] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#FF385B]" />
                  Install CINOVA on this Device
                </p>
                <p className="text-[11px] text-[#AAA0A7] mt-0.5 leading-relaxed">
                  Fast fullscreen OTT streaming, quick launch from your home screen or desktop, and offline library support.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const event = new CustomEvent("cinova-trigger-install");
                  window.dispatchEvent(event);
                }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-xs transition-all shrink-0 shadow-md self-start sm:self-auto"
              >
                Install App
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-semibold text-xs transition-all"
          >
            Save Preferences
          </button>
        </form>
      )}

      <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080506] pt-32 text-center text-[#AAA0A7] text-xs">
          Loading Profile...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
