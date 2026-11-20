"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Film,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Star,
  Tv,
} from "lucide-react";
import CinovaImage from "@/components/CinovaImage";
import { WorldwideCatalogItem } from "@/lib/tmdb-worldwide";

const EXPLORER_LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "tr", label: "Turkish" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
] as const;

const EXPLORER_COUNTRIES = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "KR", label: "South Korea" },
  { code: "JP", label: "Japan" },
  { code: "CN", label: "China" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "DE", label: "Germany" },
  { code: "TR", label: "Turkey" },
  { code: "TH", label: "Thailand" },
  { code: "ID", label: "Indonesia" },
] as const;

interface DiscoverApiPayload {
  configured: boolean;
  setupRequired?: boolean;
  error?: string;
  items: WorldwideCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export default function CountryLanguageExplorer() {
  const [mode, setMode] = useState<"language" | "country">("language");
  const [selectedLang, setSelectedLang] = useState<string>("hi");
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  const [items, setItems] = useState<WorldwideCatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          mediaType,
          page: String(targetPage),
          sortBy: "popularity.desc",
        });
        if (mode === "language") {
          params.set("language", selectedLang);
        } else {
          params.set("country", selectedCountry);
        }

        const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
        const json = (await res.json()) as DiscoverApiPayload;

        if (!res.ok || json.setupRequired) {
          setError(json.error || "Unable to load titles right now.");
          if (!append) setItems([]);
          return;
        }

        const incoming = Array.isArray(json.items) ? json.items : [];
        setItems((prev) => {
          if (!append) return incoming;
          const seen = new Set(prev.map((i) => `${i.mediaType}:${i.tmdbId || i.id}`));
          const merged = [...prev];
          for (const item of incoming) {
            const key = `${item.mediaType}:${item.tmdbId || item.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          return merged;
        });
        setPage(json.page || targetPage);
        setTotalPages(Math.max(1, json.totalPages || 1));
        setTotalResults(json.totalResults || incoming.length);
      } catch {
        setError("Network error while fetching regional titles.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mode, selectedLang, selectedCountry, mediaType]
  );

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const activeLabel =
    mode === "language"
      ? EXPLORER_LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang
      : EXPLORER_COUNTRIES.find((c) => c.code === selectedCountry)?.label || selectedCountry;

  const fullExploreHref =
    mode === "language"
      ? `/search?language=${selectedLang}&type=${mediaType}`
      : `/search?country=${selectedCountry}&type=${mediaType}`;

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto my-8 sm:my-10">
      <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] p-4 sm:p-6 space-y-5">
        {/* Header & Mode Switchers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-[3px] h-5 bg-[#E11D48] rounded-full" />
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F1F3] tracking-tight">
                Country &amp; Language Discovery
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#AAA0A7]">
              Explore authentic cinema and TV shows by original TMDB language and production country.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Language / Country Switch */}
            <div className="inline-flex rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] p-1">
              <button
                type="button"
                onClick={() => setMode("language")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  mode === "language"
                    ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3]"
                    : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Languages</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("country")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  mode === "country"
                    ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3]"
                    : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Countries</span>
              </button>
            </div>

            {/* Movies / TV Switch */}
            <div className="inline-flex rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] p-1">
              <button
                type="button"
                onClick={() => setMediaType("movie")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  mediaType === "movie"
                    ? "bg-[#650A20] text-[#F5F1F3]"
                    : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setMediaType("tv")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  mediaType === "tv"
                    ? "bg-[#650A20] text-[#F5F1F3]"
                    : "text-[#AAA0A7] hover:text-[#F5F1F3]"
                }`}
              >
                TV Series
              </button>
            </div>
          </div>
        </div>

        {/* Selector Pills */}
        <div className="cinova-carousel-track flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {mode === "language"
            ? EXPLORER_LANGUAGES.map((lang) => {
                const active = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/60 text-[#F5F1F3]"
                        : "bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.24)]"
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })
            : EXPLORER_COUNTRIES.map((country) => {
                const active = selectedCountry === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSelectedCountry(country.code)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] border-[#E11D48]/60 text-[#F5F1F3]"
                        : "bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] border-[rgba(155,25,57,0.24)]"
                    }`}
                  >
                    {country.label}
                  </button>
                );
              })}
        </div>

        {/* Active Selection Summary */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#AAA0A7]">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#FF385B]" />
            <span>
              <strong className="text-[#F5F1F3]">{activeLabel}</strong>{" "}
              {mediaType === "tv" ? "TV Series" : "Movies"}
              {!loading && totalResults > 0 && (
                <span className="text-[#746971]">
                  {" "}
                  · {totalResults.toLocaleString()} discoverable titles
                </span>
              )}
            </span>
          </div>

          <Link
            href={fullExploreHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF385B] hover:text-[#F5F1F3] transition-colors shrink-0"
          >
            <span>Open in Global Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid / Skeleton / Error */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden bg-[#160B10] border border-[rgba(155,25,57,0.16)] animate-pulse"
              >
                <div className="aspect-[2/3] w-full bg-[#1D0C13]/60" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3.5 w-4/5 rounded bg-[#1D0C13]" />
                  <div className="h-3 w-1/2 rounded bg-[#10080C]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.28)]">
            <p className="text-xs text-[#AAA0A7]">{error}</p>
            <button
              type="button"
              onClick={() => loadData(1, false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#F5F1F3]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF385B]" />
              <span>Retry</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#746971]">
            No titles found for {activeLabel} in this category yet.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {items.slice(0, page * 12).map((item) => (
                <Link
                  key={`explorer-${item.mediaType}-${item.tmdbId || item.id}`}
                  href={item.detailHref}
                  className="group relative flex flex-col rounded-xl overflow-hidden bg-[#160B10] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(225,29,72,0.55)] transition-all duration-300"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#080506]">
                    <CinovaImage
                      src={item.posterUrl || item.backdropUrl}
                      alt={item.title}
                      fallbackText={item.title}
                      aspect="custom"
                      tmdbSize="w500"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080506] via-[#080506]/60 to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#080506]/85 text-[10px] font-bold uppercase text-[#F5F1F3]">
                        {item.mediaType === "tv" ? (
                          <Tv className="w-2.5 h-2.5 text-[#FF385B]" />
                        ) : (
                          <Film className="w-2.5 h-2.5 text-[#FF385B]" />
                        )}
                      </span>
                      {item.rating > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#080506]/85 text-[10px] font-bold text-[#F5F1F3]">
                          <Star className="w-2.5 h-2.5 text-[#FF385B] fill-[#FF385B]" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {item.hasLicensedStream && (
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#A30D32] text-[9px] font-bold uppercase text-[#F5F1F3]">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Vault
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <h3 className="text-xs font-bold text-[#F5F1F3] group-hover:text-[#FF385B] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-[#746971]">
                      <span>{item.releaseYear || "TBA"}</span>
                      <span>{item.originalLanguageLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => loadData(page + 1, true)}
                  className="inline-flex items-center gap-2 min-h-[42px] px-6 py-2 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.34)] hover:border-[#E11D48] text-xs font-bold text-[#F5F1F3] transition-colors"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#FF385B] animate-spin" />
                      <span>Loading more {activeLabel} titles...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-[#FF385B]" />
                      <span>Load More {activeLabel} Titles</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
