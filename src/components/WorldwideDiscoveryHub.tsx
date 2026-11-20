"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Compass, Globe, Search } from "lucide-react";
import WorldwideRail from "@/components/WorldwideRail";
import CountryLanguageExplorer from "@/components/CountryLanguageExplorer";
import RandomizedSuggestionsRail from "@/components/RandomizedSuggestionsRail";
import {
  HOMEPAGE_CATALOG_RAILS,
  WorldwideCatalogItem,
} from "@/lib/tmdb-worldwide";

interface BatchFeedEntry {
  items: WorldwideCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

interface BatchResponse {
  configured: boolean;
  setupRequired?: boolean;
  error?: string;
  feeds: Record<string, BatchFeedEntry>;
}

const EAGER_FEED_IDS = [
  "trending-worldwide",
  "popular-today",
  "blockbuster-movies",
  "latest-releases",
  "upcoming-movies",
  "top-rated-movies",
];

export default function WorldwideDiscoveryHub() {
  const [preloadedFeeds, setPreloadedFeeds] = useState<Record<string, BatchFeedEntry>>({});
  const [setupRequired, setSetupRequired] = useState(false);

  const handleSetupRequired = useCallback(() => {
    setSetupRequired(true);
  }, []);

  // Preload the top 6 flagship global rails in one fast cached batch request
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadInitialBatch() {
      try {
        const res = await fetch(
          `/api/tmdb/catalog?feeds=${encodeURIComponent(EAGER_FEED_IDS.join(","))}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as BatchResponse;
        if (!active) return;

        if (json.setupRequired) {
          setSetupRequired(true);
          return;
        }
        if (json.feeds && typeof json.feeds === "object") {
          setPreloadedFeeds(json.feeds);
        }
      } catch {
        // Individual rails still have independent retry handling
      }
    }

    loadInitialBatch();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const primaryRails = HOMEPAGE_CATALOG_RAILS.slice(0, 9);
  const regionalAndGenreRails = HOMEPAGE_CATALOG_RAILS.slice(9);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Worldwide Catalog Section Divider / Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto pt-4">
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#FF385B]">
              <Globe className="w-3.5 h-3.5" />
              <span>CINOVA Global Discovery · Live TMDB Catalog</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F5F1F3] tracking-tight">
              Explore Thousands of Movies &amp; TV Series Worldwide
            </h2>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-2xl leading-relaxed">
              Automatically updated global charts across Bollywood, South Indian, Marathi, Hollywood, K-Drama, Anime, European, Turkish, Thai, and international cinema.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-xs font-bold text-[#F5F1F3] transition-all shadow-[0_6px_20px_rgba(225,29,72,0.32)]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Global Search</span>
            </Link>
            <Link
              href="/categories?tab=worldwide"
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#F5F1F3] transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF385B]" />
              <span>Regions</span>
            </Link>
          </div>
        </div>
      </section>

      {setupRequired ? (
        <section className="px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto">
          <div className="rounded-xl bg-[#10080C] border border-[rgba(225,29,72,0.4)] p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF385B] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-[#F5F1F3]">
                TMDB Global Discovery Not Configured
              </p>
              <p className="text-[#AAA0A7]">
                Add <code className="text-[#F5F1F3]">TMDB_API_READ_ACCESS_TOKEN</code> or{" "}
                <code className="text-[#F5F1F3]">TMDB_API_KEY</code> in{" "}
                <code className="text-[#F5F1F3]">.env.local</code> and restart the server to populate all 24 worldwide collections. Your curated CINOVA Vault titles above remain fully available.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Randomized Worldwide Suggestions (refreshes every visit + instant Shuffle Picks button) */}
          <RandomizedSuggestionsRail onSetupRequired={handleSetupRequired} />

          {/* Global Charts: Trending Worldwide, Popular Today, Blockbusters, Latest Releases, Upcoming, Top Rated, Popular/Trending/Top-Rated TV */}
          {primaryRails.map((rail, index) => {
            const pre = preloadedFeeds[rail.id];
            return (
              <WorldwideRail
                key={rail.id}
                feedId={rail.id}
                title={rail.title}
                badge={rail.badge}
                exploreHref={rail.exploreHref}
                aspect={rail.cardAspect || "poster"}
                initialItems={pre?.items}
                initialTotalPages={pre?.totalPages}
                initialTotalResults={pre?.totalResults}
                lazy={index >= EAGER_FEED_IDS.length}
                onSetupRequired={handleSetupRequired}
              />
            );
          })}

          {/* Interactive Country & Language Explorer */}
          <CountryLanguageExplorer />

          {/* Regional Cinema & Genre Collections (Korean, Japanese, Anime, Bollywood, South Indian, Marathi, Hollywood, International, Crime & Thriller, Horror, Sci-Fi, Romance, Action & Adventure, Comedy, Documentaries) */}
          {regionalAndGenreRails.map((rail) => (
            <WorldwideRail
              key={rail.id}
              feedId={rail.id}
              title={rail.title}
              badge={rail.badge}
              exploreHref={rail.exploreHref}
              aspect={rail.cardAspect || "poster"}
              lazy
              onSetupRequired={handleSetupRequired}
            />
          ))}
        </>
      )}
    </div>
  );
}
