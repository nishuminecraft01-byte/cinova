"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  Play,
  Shuffle,
  Star,
  Tv,
} from "lucide-react";
import CinovaImage from "@/components/CinovaImage";
import { WorldwideCatalogItem } from "@/lib/tmdb-worldwide";

const RANDOM_SOURCE_FEEDS = [
  "trending-worldwide",
  "popular-today",
  "blockbuster-movies",
  "top-rated-movies",
  "popular-tv",
  "bollywood-hits",
  "south-indian",
  "korean-dramas",
  "japanese-cinema",
  "anime-collection",
  "international-cinema",
  "crime-thriller",
  "scifi-universe",
  "action-adventure",
  "comedy",
] as const;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

interface RandomizedSuggestionsRailProps {
  onSetupRequired?: () => void;
}

export default function RandomizedSuggestionsRail({
  onSetupRequired,
}: RandomizedSuggestionsRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<WorldwideCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  const loadRandomSuggestions = useCallback(
    async (isManualShuffle: boolean) => {
      if (isManualShuffle) setShuffling(true);
      else setLoading(true);

      try {
        // Pick 2 distinct random global feeds + random pages (1..12) for fresh suggestions every time
        const shuffledFeeds = shuffleArray([...RANDOM_SOURCE_FEEDS]);
        const feedA = shuffledFeeds[0];
        const feedB = shuffledFeeds[1];
        const pageA = Math.floor(Math.random() * 12) + 1;
        const pageB = Math.floor(Math.random() * 10) + 1;

        const [resA, resB] = await Promise.all([
          fetch(`/api/tmdb/catalog?feed=${encodeURIComponent(feedA)}&page=${pageA}`),
          fetch(`/api/tmdb/catalog?feed=${encodeURIComponent(feedB)}&page=${pageB}`),
        ]);

        const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);

        if (jsonA?.setupRequired && jsonB?.setupRequired) {
          onSetupRequired?.();
          return;
        }

        const combined: WorldwideCatalogItem[] = [
          ...(Array.isArray(jsonA?.items) ? jsonA.items : []),
          ...(Array.isArray(jsonB?.items) ? jsonB.items : []),
        ];

        const seen = new Set<string>();
        const unique: WorldwideCatalogItem[] = [];
        for (const item of combined) {
          const key = `${item.mediaType}:${item.tmdbId || item.id}`;
          if (seen.has(key)) continue;
          if (!item.posterUrl && !item.backdropUrl) continue;
          seen.add(key);
          unique.push(item);
        }

        setItems(shuffleArray(unique).slice(0, 18));
        if (trackRef.current) {
          trackRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
      } catch {
        // Silent fail; user can tap Shuffle to retry
      } finally {
        setLoading(false);
        setShuffling(false);
      }
    },
    [onSetupRequired]
  );

  useEffect(() => {
    loadRandomSuggestions(false);
  }, [loadRandomSuggestions]);

  const scrollTrack = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.78 : el.clientWidth * 0.78,
      behavior: "smooth",
    });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative my-5 sm:my-7 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto group/row">
      {/* Header with Shuffle Action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[3px] h-5 bg-[#E11D48] rounded-full shrink-0" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3] truncate">
            Suggested For You
          </h2>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.28)] shrink-0">
            Randomized Worldwide
          </span>
        </div>

        <button
          type="button"
          disabled={shuffling || loading}
          onClick={() => loadRandomSuggestions(true)}
          className="inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] hover:border-[#E11D48] disabled:opacity-60 text-xs font-semibold text-[#F5F1F3] transition-colors shrink-0"
        >
          {shuffling ? (
            <Loader2 className="w-3.5 h-3.5 text-[#FF385B] animate-spin" />
          ) : (
            <Shuffle className="w-3.5 h-3.5 text-[#FF385B]" />
          )}
          <span>{shuffling ? "Shuffling..." : "Shuffle Picks"}</span>
        </button>
      </div>

      {/* Skeleton or Horizontal Rail */}
      {loading ? (
        <div className="flex items-center gap-3 sm:gap-3.5 overflow-hidden py-1.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[144px] sm:w-[170px] md:w-[182px] rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.16)] animate-pulse"
            >
              <div className="aspect-[2/3] w-full bg-[#160B10]" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3.5 w-4/5 rounded bg-[#1D0C13]" />
                <div className="h-3 w-1/2 rounded bg-[#160B10]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            aria-label="Scroll suggested movies left"
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={trackRef}
            className="cinova-carousel-track flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {items.map((item) => (
              <Link
                key={`suggested-${item.mediaType}-${item.tmdbId || item.id}`}
                href={item.detailHref}
                className="group/card relative flex-shrink-0 w-[144px] sm:w-[170px] md:w-[182px] flex flex-col rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(225,29,72,0.55)] transition-all duration-300 shadow-[0_8px_22px_rgba(0,0,0,0.5)]"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#160B10]">
                  <CinovaImage
                    src={item.posterUrl || item.backdropUrl}
                    alt={item.title}
                    fallbackText={item.title}
                    aspect="custom"
                    tmdbSize="w500"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-[1.06]"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080506] via-[#080506]/60 to-transparent pointer-events-none" />

                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#080506]/85 border border-[rgba(155,25,57,0.28)] text-[10px] font-bold uppercase tracking-wider text-[#F5F1F3]">
                      {item.mediaType === "tv" ? (
                        <>
                          <Tv className="w-2.5 h-2.5 text-[#FF385B]" />
                          TV
                        </>
                      ) : (
                        <>
                          <Film className="w-2.5 h-2.5 text-[#FF385B]" />
                          Movie
                        </>
                      )}
                    </span>

                    {item.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#080506]/85 border border-[rgba(155,25,57,0.28)] text-[10px] font-bold text-[#F5F1F3]">
                        <Star className="w-2.5 h-2.5 text-[#FF385B] fill-[#FF385B]" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {item.overview && (
                    <div className="hidden sm:flex absolute inset-0 bg-[#080506]/88 p-3 flex-col justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <p className="text-[11px] text-[#F5F1F3]/90 line-clamp-3 leading-relaxed">
                        {item.overview}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#FF385B]">
                        <span>View Details</span>
                        <span>{item.originalLanguageLabel}</span>
                      </div>
                    </div>
                  )}

                  {item.hasLicensedStream && (
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[9px] font-bold uppercase tracking-wider text-[#F5F1F3]">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Vault
                    </div>
                  )}
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between gap-1">
                  <h3 className="text-xs sm:text-[13px] font-bold text-[#F5F1F3] group-hover/card:text-[#FF385B] transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-[#746971]">
                    <span>{item.releaseYear || "TBA"}</span>
                    <span className="truncate text-[#AAA0A7]">
                      {item.genres[0] || item.originalLanguageLabel}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollTrack("right")}
            aria-label="Scroll suggested movies right"
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
