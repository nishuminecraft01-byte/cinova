"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Film,
  Globe,
  Info,
  Layers,
  Play,
  Plus,
  Share2,
  Star,
  Tv,
  User,
  Languages,
  MapPin,
  ExternalLink,
} from "lucide-react";
import CinovaImage from "@/components/CinovaImage";
import { LoginRequiredCard } from "@/components/PlaybackAuthGate";
import { PlaybackUnavailableCard } from "@/components/PlaybackUnavailableCard";
import TrailerModal from "@/components/TrailerModal";
import WhereToWatch from "@/components/WhereToWatch";
import AdSlot from "@/components/monetization/AdSlot";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { WorldwideCatalogItem, WorldwideDetailData } from "@/lib/tmdb-worldwide";

interface WorldwideDetailViewProps {
  data: WorldwideDetailData;
}

function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

function formatDate(iso: string): string {
  if (!iso) return "TBA";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RelatedTitleGrid({
  title,
  items,
}: {
  title: string;
  items: WorldwideCatalogItem[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
          <h2 className="text-lg sm:text-xl font-bold text-[#F5F1F3] tracking-tight">
            {title}
          </h2>
        </div>
        <span className="text-xs text-[#746971]">{items.length} titles</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {items.map((item) => (
          <Link
            key={`${item.mediaType}-${item.tmdbId}`}
            href={item.detailHref}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(225,29,72,0.5)] transition-all duration-300"
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
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080506] via-[#080506]/60 to-transparent" />
              {item.rating > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#080506]/85 border border-[rgba(155,25,57,0.3)] text-[11px] font-bold text-[#F5F1F3]">
                  <Star className="w-3 h-3 text-[#FF385B] fill-[#FF385B]" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="p-2.5 space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold text-[#F5F1F3] line-clamp-1 group-hover:text-[#FF385B] transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-[#746971]">
                <span>{item.releaseYear || "TBA"}</span>
                <span className="uppercase text-[10px] text-[#FF385B] font-mono">
                  {item.mediaType}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function WorldwideDetailView({ data }: WorldwideDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isSeries = data.mediaType === "tv";
  const watchlistId = data.localId || `tmdb-${data.mediaType}-${data.tmdbId}`;
  const inList = isInWatchlist(watchlistId);

  const runtimeLabel = formatRuntime(data.runtimeMinutes);
  const showOriginalTitle =
    data.originalTitle &&
    data.originalTitle.toLowerCase() !== data.title.toLowerCase();

  // Find top streaming option in India or US for quick jump
  const topStreamProvider = useMemo(() => {
    if (!data.watchProviders) return null;
    const inProv = data.watchProviders["IN"]?.flatrate?.[0];
    if (inProv) return { provider: inProv, country: "IN" };
    const usProv = data.watchProviders["US"]?.flatrate?.[0];
    if (usProv) return { provider: usProv, country: "US" };
    const anyCountry = Object.values(data.watchProviders).find((c) => c.flatrate?.length > 0);
    if (anyCountry && anyCountry.flatrate?.[0]) {
      return { provider: anyCountry.flatrate[0], country: anyCountry.countryCode };
    }
    return null;
  }, [data.watchProviders]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(isSeries ? "/series" : "/movies");
    }
  };

  const handlePlayClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const watchTarget =
      data.localId ||
      (data.tmdbId ? `tmdb-${isSeries ? "tv" : "movie"}-${data.tmdbId}` : null);
    if (watchTarget) {
      const extraQuery = isSeries ? "?season=1&ep=1" : "";
      router.push(`/watch/${watchTarget}${extraQuery}`);
      return;
    }
    setShowUnavailableModal(true);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const scrollToWhereToWatch = () => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("where-to-watch");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Schema.org structured data for SEO indexing
  const schemaLd = useMemo(() => {
    const isTv = data.mediaType === "tv";
    return {
      "@context": "https://schema.org",
      "@type": isTv ? "TVSeries" : "Movie",
      name: data.title,
      alternateName: data.originalTitle !== data.title ? data.originalTitle : undefined,
      description: data.overview,
      image: data.posterUrl || data.backdropUrl,
      datePublished: data.releaseDate || undefined,
      genre: data.genres,
      inLanguage: data.originalLanguage,
      aggregateRating:
        data.rating > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: data.rating,
              bestRating: 10,
              worstRating: 1,
              ratingCount: data.voteCount || 1,
            }
          : undefined,
      actor: data.cast?.slice(0, 8).map((c) => ({
        "@type": "Person",
        name: c.name,
      })),
      director: data.directors?.slice(0, 3).map((d) => ({
        "@type": "Person",
        name: d.name,
      })),
    };
  }, [data]);

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] pb-24">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLd) }}
      />

      {/* 1. Cinematic Backdrop Hero */}
      <div className="relative w-full min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] overflow-hidden bg-[#080506] flex flex-col justify-between pt-20 pb-10 sm:pt-24 sm:pb-12">
        <div className="absolute inset-0">
          <CinovaImage
            src={data.backdropUrl || data.posterUrl}
            alt={data.title}
            fallbackText={data.title}
            aspect="custom"
            tmdbSize="w1280"
            loading="eager"
            className="w-full h-full object-cover opacity-70 scale-105"
            containerClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080506] via-[#080506]/82 to-[#080506]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/65 to-[#080506]/45" />
        </div>

        {/* Top Back Navigation */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-full bg-[#10080C]/85 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] text-xs font-semibold text-[#F5F1F3] transition-colors backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF385B]" />
            <span>Back</span>
          </button>

          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-full bg-[#10080C]/85 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors backdrop-blur-md"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF385B]" />
            <span>Worldwide Catalog</span>
          </Link>
        </div>

        {/* Hero Foreground: Poster + Metadata */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 lg:gap-8">
            {/* Poster */}
            <div className="w-36 sm:w-44 md:w-56 flex-shrink-0 rounded-2xl overflow-hidden border border-[rgba(155,25,57,0.35)] shadow-[0_20px_50px_rgba(0,0,0,0.75)] bg-[#10080C]">
              <div className="aspect-[2/3] w-full">
                <CinovaImage
                  src={data.posterUrl || data.backdropUrl}
                  alt={data.title}
                  fallbackText={data.title}
                  aspect="custom"
                  tmdbSize="w780"
                  loading="eager"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
            </div>

            {/* Title & Core Meta */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] text-[11px] font-bold tracking-wider uppercase shadow-[0_4px_14px_rgba(163,13,50,0.4)]">
                  {isSeries ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                  {isSeries ? "TV Series" : "Movie"}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    data.hasLicensedStream
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                      : "bg-[#160B10] text-[#AAA0A7] border-[rgba(155,25,57,0.3)]"
                  }`}
                >
                  {data.hasLicensedStream ? "Stream Ready" : "Explore Mode"}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.3)] text-[11px] font-semibold">
                  {data.originalLanguageLabel}
                </span>

                {data.certification && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#160B10] text-[#F5F1F3] border border-[rgba(155,25,57,0.28)] text-[11px] font-semibold">
                    {data.certification}
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full bg-[#160B10] text-[#AAA0A7] border border-[rgba(155,25,57,0.22)] text-[11px] font-medium">
                  {data.status}
                </span>
              </div>

              {/* Title + Original Title */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#F5F1F3] tracking-tight leading-[1.08] text-shadow-cinova">
                  {data.title}
                </h1>
                {showOriginalTitle && (
                  <p className="text-sm sm:text-base text-[#AAA0A7] font-medium">
                    Original Title: <span className="text-[#F5F1F3]/90">{data.originalTitle}</span>
                  </p>
                )}
                {data.tagline && (
                  <p className="text-xs sm:text-sm italic text-[#FF385B]/90 pt-1">
                    “{data.tagline}”
                  </p>
                )}
              </div>

              {/* Key Stats Row */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-[#AAA0A7]">
                {data.rating > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[#F5F1F3] font-bold">
                    <Star className="w-4 h-4 text-[#FF385B] fill-[#FF385B]" />
                    <span>{data.rating.toFixed(1)} / 10</span>
                    {data.voteCount > 0 && (
                      <span className="text-[#746971] font-normal">
                        ({data.voteCount.toLocaleString()} votes)
                      </span>
                    )}
                  </span>
                )}

                {data.releaseDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>{formatDate(data.releaseDate)}</span>
                  </span>
                )}

                {!isSeries && runtimeLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>{runtimeLabel}</span>
                  </span>
                )}

                {isSeries && data.numberOfSeasons ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>
                      {data.numberOfSeasons}{" "}
                      {data.numberOfSeasons === 1 ? "Season" : "Seasons"}
                      {data.numberOfEpisodes ? ` · ${data.numberOfEpisodes} Episodes` : ""}
                    </span>
                  </span>
                ) : null}
              </div>

              {/* Genres */}
              {data.genres.length > 0 && (
                <div className="flex items-center flex-wrap gap-2">
                  {data.genres.map((genre, idx) => {
                    const genreId = data.genreIds[idx];
                    return (
                      <Link
                        key={genre}
                        href={
                          genreId
                            ? `/search?mediaType=${data.mediaType}&genre=${genreId}`
                            : `/search?q=${encodeURIComponent(genre)}`
                        }
                        className="px-3 py-1 rounded-full bg-[#160B10]/90 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] hover:border-[#E11D48]/60 text-xs font-medium text-[#F5F1F3] transition-colors"
                      >
                        {genre}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Actions + Honest Playback Availability + Where to Watch Quick Action */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center flex-wrap gap-3">
                  {/* CINOVA Stream Ready or Official Trailer */}
                  {data.hasLicensedStream ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePlayClick}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-sm font-bold text-[#F5F1F3] shadow-[0_8px_24px_rgba(225,29,72,0.38)] transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{isSeries ? "Play Series" : "Play Movie"}</span>
                      </button>

                      {data.trailerKey && (
                        <button
                          type="button"
                          onClick={() => setShowTrailerModal(true)}
                          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] hover:border-[#E11D48]/60 text-sm font-semibold text-[#F5F1F3] transition-colors"
                        >
                          <Film className="w-4 h-4 text-[#FF385B]" />
                          <span>Watch Trailer</span>
                        </button>
                      )}
                    </>
                  ) : data.trailerKey ? (
                    <button
                      type="button"
                      onClick={() => setShowTrailerModal(true)}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-sm font-bold text-[#F5F1F3] shadow-[0_8px_24px_rgba(225,29,72,0.38)] active:scale-95 transition-all"
                    >
                      <Film className="w-4 h-4 text-[#F5F1F3]" />
                      <span>Watch Trailer</span>
                    </button>
                  ) : (
                    <div
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full bg-[#160B10]/80 border border-[rgba(155,25,57,0.25)] text-xs font-medium text-[#746971] select-none"
                      title="No official trailer available on TMDB"
                    >
                      <Film className="w-4 h-4 text-[#746971]" />
                      <span>Trailer Unavailable</span>
                    </div>
                  )}

                  {/* Smart Where to Watch jump button */}
                  <button
                    type="button"
                    onClick={scrollToWhereToWatch}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] hover:border-[#FF385B]/60 text-sm font-semibold text-[#F5F1F3] transition-all"
                  >
                    <Tv className="w-4 h-4 text-[#FF385B]" />
                    <span>
                      {topStreamProvider
                        ? `Watch on ${topStreamProvider.provider.name}`
                        : "Where to Watch"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWatchlist(watchlistId)}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-sm font-semibold text-[#F5F1F3] transition-colors"
                  >
                    {inList ? (
                      <>
                        <Check className="w-4 h-4 text-[#FF385B]" />
                        <span>In My List</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#FF385B]" />
                        <span>Add to List</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full bg-[#160B10]/90 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-sm font-semibold text-[#F5F1F3] transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-[#FF385B]" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-[#AAA0A7]" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Discovery Notice for TMDB Metadata-Only Titles */}
                {!data.hasLicensedStream && (
                  <div className="max-w-2xl flex items-start gap-3 p-3.5 rounded-xl bg-[#10080C]/90 border border-[rgba(155,25,57,0.32)] backdrop-blur-md">
                    <Info className="w-4 h-4 text-[#FF385B] flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <p className="font-semibold text-[#F5F1F3] flex items-center gap-2">
                        <span>Worldwide Entertainment Discovery</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-[10px] uppercase font-bold text-[#FF385B]">
                          Discovery Mode
                        </span>
                      </p>
                      <p className="text-[#AAA0A7] leading-relaxed">
                        {data.trailerKey
                          ? "This title is in discovery mode. You can watch the official high-definition trailer above or explore verified streaming platforms below."
                          : "This title is available to explore. Check the Where to Watch section below to see where it is streaming legally in your region."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body Sections */}
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pt-8">
        {/* Where to Watch — Official Streaming Platform Availability */}
        <div id="where-to-watch" className="scroll-mt-24">
          <WhereToWatch
            watchProviders={data.watchProviders}
            title={data.title}
            mediaType={data.mediaType}
            tmdbId={data.tmdbId}
          />
        </div>

        {/* Overview & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F1F3]">Synopsis</h2>
            </div>
            <p className="text-sm sm:text-base text-[#AAA0A7] leading-relaxed">
              {data.overview || "No synopsis is currently available for this title on TMDB."}
            </p>
          </div>

          {/* Metadata Specification Card */}
          <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#FF385B]">
              Production Details
            </h3>

            <dl className="space-y-3 text-xs sm:text-sm">
              {data.directors.length > 0 && (
                <div className="flex items-start justify-between gap-4 border-b border-[rgba(155,25,57,0.14)] pb-2.5">
                  <dt className="text-[#746971] flex items-center gap-1.5 flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>{isSeries ? "Creator" : "Director"}</span>
                  </dt>
                  <dd className="text-right text-[#F5F1F3] font-medium">
                    {data.directors.map((d) => d.name).join(", ")}
                  </dd>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 border-b border-[rgba(155,25,57,0.14)] pb-2.5">
                <dt className="text-[#746971] flex items-center gap-1.5 flex-shrink-0">
                  <Languages className="w-3.5 h-3.5 text-[#FF385B]" />
                  <span>Original Language</span>
                </dt>
                <dd className="text-right text-[#F5F1F3] font-medium">
                  {data.originalLanguageLabel} ({data.originalLanguage.toUpperCase()})
                </dd>
              </div>

              {data.spokenLanguages.length > 0 && (
                <div className="flex items-start justify-between gap-4 border-b border-[rgba(155,25,57,0.14)] pb-2.5">
                  <dt className="text-[#746971] flex items-center gap-1.5 flex-shrink-0">
                    <Globe className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>Spoken Languages</span>
                  </dt>
                  <dd className="text-right text-[#F5F1F3] font-medium">
                    {data.spokenLanguages.join(", ")}
                  </dd>
                </div>
              )}

              {data.productionCountries.length > 0 && (
                <div className="flex items-start justify-between gap-4 border-b border-[rgba(155,25,57,0.14)] pb-2.5">
                  <dt className="text-[#746971] flex items-center gap-1.5 flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#FF385B]" />
                    <span>Countries</span>
                  </dt>
                  <dd className="text-right text-[#F5F1F3] font-medium">
                    {data.productionCountries.join(", ")}
                  </dd>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#746971] flex-shrink-0">TMDB ID</dt>
                <dd className="text-right text-[#AAA0A7] font-mono text-xs">
                  #{data.tmdbId}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Seasons Breakdown (TV Series) */}
        {isSeries && data.seasons && data.seasons.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F1F3]">
                Seasons ({data.seasons.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.seasons.map((season) => (
                <div
                  key={season.seasonNumber}
                  className="flex gap-3.5 p-3.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.22)]"
                >
                  <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
                    <CinovaImage
                      src={season.posterUrl || data.posterUrl}
                      alt={season.name}
                      fallbackText={`S${season.seasonNumber}`}
                      aspect="custom"
                      tmdbSize="w342"
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold text-[#F5F1F3] line-clamp-1">
                      {season.name}
                    </p>
                    <p className="text-xs text-[#FF385B] font-semibold">
                      {season.episodeCount}{" "}
                      {season.episodeCount === 1 ? "Episode" : "Episodes"}
                      {season.airDate ? ` · ${season.airDate.slice(0, 4)}` : ""}
                    </p>
                    {season.overview && (
                      <p className="text-xs text-[#AAA0A7] line-clamp-2 leading-relaxed">
                        {season.overview}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Cast */}
        {data.cast.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F1F3]">Top Cast</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {data.cast.map((member) => (
                <div
                  key={`${member.id}-${member.name}`}
                  className="rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.2)]"
                >
                  <div className="aspect-[3/4] w-full bg-[#160B10] overflow-hidden">
                    {member.profileUrl ? (
                      <CinovaImage
                        src={member.profileUrl}
                        alt={member.name}
                        fallbackText={member.name}
                        aspect="custom"
                        tmdbSize="w342"
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1D0C13] to-[#10080C]">
                        <User className="w-10 h-10 text-[#746971]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-[#F5F1F3] line-clamp-1">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-[#746971] line-clamp-1">
                      {member.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sponsored Banner Slot */}
        <AdSlot slot="detail-sidebar" className="my-8" />

        {/* Recommended Titles */}
        <RelatedTitleGrid title="Recommended Titles" items={data.recommendations} />

        {/* Similar Titles */}
        <RelatedTitleGrid title="Similar Titles" items={data.similar} />

        {/* TMDB & JustWatch Attribution Note */}
        <p className="text-[11px] text-[#746971] pt-4 border-t border-[rgba(155,25,57,0.18)]">
          Streaming availability data provided by JustWatch via TMDB. Metadata and artwork provided by TMDB. CINOVA does not host or fabricate unauthorized streams for discovery-only titles.
        </p>
      </div>

      {/* Login Required Modal (logged-out Play click) */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#080506]/82 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginPrompt(false);
          }}
        >
          <LoginRequiredCard
            returnTo={
              data.hasLicensedStream && data.localId
                ? `/watch/${data.localId}`
                : data.detailHref
            }
            titleContext={data.title}
            onContinueExploring={() => setShowLoginPrompt(false)}
          />
        </div>
      )}

      {/* Playback Unavailable Modal (logged-in Play click when no connected video source exists) */}
      {showUnavailableModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#080506]/82 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUnavailableModal(false);
          }}
        >
          <PlaybackUnavailableCard
            title={data.title}
            showCloseButton
            exploreHref="/movies"
            trailerKey={data.trailerKey}
            onWatchTrailer={
              data.trailerKey
                ? () => {
                    setShowUnavailableModal(false);
                    setShowTrailerModal(true);
                  }
                : undefined
            }
            detailHref="#where-to-watch"
            onGoBack={() => setShowUnavailableModal(false)}
          />
        </div>
      )}

      {/* Official YouTube Trailer Modal */}
      <TrailerModal
        isOpen={showTrailerModal}
        onClose={() => setShowTrailerModal(false)}
        trailerKey={data.trailerKey || null}
        title={data.title}
        trailerName={data.trailerName || "Official Trailer"}
        mediaType={data.mediaType}
      />
    </div>
  );
}
