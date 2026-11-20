"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Star,
  Tv,
} from "lucide-react";
import CinovaImage from "@/components/CinovaImage";
import { WorldwideCatalogItem } from "@/lib/tmdb-worldwide";

export interface WorldwideRailProps {
  feedId: string;
  title: string;
  badge?: string;
  exploreHref: string;
  aspect?: "poster" | "landscape";
  /** Preloaded initial items (optional, e.g. from batch fetch) */
  initialItems?: WorldwideCatalogItem[];
  initialTotalPages?: number;
  initialTotalResults?: number;
  /** Defer fetching until rail approaches viewport */
  lazy?: boolean;
  onSetupRequired?: () => void;
}

interface CatalogSingleFeedResponse {
  configured: boolean;
  setupRequired?: boolean;
  error?: string;
  items: WorldwideCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

function dedupeAppend(
  existing: WorldwideCatalogItem[],
  incoming: WorldwideCatalogItem[]
): WorldwideCatalogItem[] {
  const seen = new Set(existing.map((i) => `${i.mediaType}:${i.tmdbId || i.id}`));
  const next = [...existing];
  for (const item of incoming) {
    const key = `${item.mediaType}:${item.tmdbId || item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(item);
    }
  }
  return next;
}

function WorldwideRailComponent({
  feedId,
  title,
  badge,
  exploreHref,
  aspect = "poster",
  initialItems,
  initialTotalPages = 1,
  initialTotalResults = 0,
  lazy = true,
  onSetupRequired,
}: WorldwideRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [items, setItems] = useState<WorldwideCatalogItem[]>(initialItems || []);
  const [page, setPage] = useState(initialItems && initialItems.length > 0 ? 1 : 0);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [loading, setLoading] = useState(!initialItems || initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(!lazy || Boolean(initialItems && initialItems.length > 0));
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sync if batch parent supplies initialItems
  useEffect(() => {
    if (initialItems && initialItems.length > 0 && items.length === 0) {
      setItems(initialItems);
      setPage(1);
      setTotalPages(initialTotalPages);
      setTotalResults(initialTotalResults);
      setLoading(false);
      setError(null);
    }
  }, [initialItems, initialTotalPages, initialTotalResults, items.length]);

  // IntersectionObserver for smooth lazy viewport loading
  useEffect(() => {
    if (inView) return;
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/tmdb/catalog?feed=${encodeURIComponent(feedId)}&page=${targetPage}`
        );
        const json = (await res.json()) as CatalogSingleFeedResponse;

        if (json.setupRequired) {
          onSetupRequired?.();
          setError("TMDB setup required.");
          return;
        }
        if (!res.ok) {
          setError(json.error || "Unable to load titles.");
          return;
        }

        const incoming = Array.isArray(json.items) ? json.items : [];
        setItems((prev) => (append ? dedupeAppend(prev, incoming) : incoming));
        setPage(json.page || targetPage);
        setTotalPages(Math.max(1, json.totalPages || 1));
        setTotalResults(json.totalResults || incoming.length);
      } catch {
        setError("Network error while loading collection.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedId, onSetupRequired]
  );

  // Trigger page 1 fetch once visible (unless preloaded via initialItems)
  useEffect(() => {
    if (!inView) return;
    if (page > 0 || (initialItems && initialItems.length > 0)) return;
    fetchPage(1, false);
  }, [inView, page, initialItems, fetchPage]);

  const checkScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const el = trackRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const nextLeft = scrollLeft > 20;
      const nextRight = scrollLeft < scrollWidth - clientWidth - 20;
      setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
      setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));
    });
  }, []);

  const handleScroll = useCallback((direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const delta = direction === "left" ? -el.clientWidth * 0.78 : el.clientWidth * 0.78;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const isLandscape = aspect === "landscape";
  const cardWidthClass = isLandscape
    ? "w-[238px] sm:w-[272px]"
    : "w-[144px] sm:w-[170px] md:w-[182px]";
  const mediaAspectClass = isLandscape ? "aspect-video" : "aspect-[2/3]";
  const canLoadMore = page > 0 && page < Math.min(totalPages, 25);

  return (
    <section
      ref={sectionRef}
      className="relative my-5 sm:my-7 px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto group/row"
    >
      {/* Rail Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[3px] h-5 bg-[#E11D48] rounded-full shrink-0" />
          <Link
            href={exploreHref}
            className="text-base sm:text-lg font-bold tracking-tight text-[#F5F1F3] hover:text-[#FF385B] transition-colors truncate"
          >
            {title}
          </Link>
          {badge && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.28)] shrink-0">
              {badge}
            </span>
          )}
          {totalResults > 20 && !loading && (
            <span className="hidden md:inline-flex text-[11px] text-[#746971] font-medium shrink-0">
              {totalResults.toLocaleString()}+ titles
            </span>
          )}
        </div>

        <Link
          href={exploreHref}
          className="text-xs font-medium text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors flex items-center gap-1 group/see shrink-0 ml-2"
        >
          <span>See All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/see:translate-x-0.5" />
        </Link>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="flex items-center gap-3 sm:gap-3.5 overflow-hidden py-1.5">
          {Array.from({ length: isLandscape ? 5 : 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 ${cardWidthClass} rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.16)] animate-pulse`}
            >
              <div className={`${mediaAspectClass} w-full bg-[#160B10]`} />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3.5 w-4/5 rounded bg-[#1D0C13]" />
                <div className="h-3 w-1/2 rounded bg-[#160B10]" />
              </div>
            </div>
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.24)]">
          <p className="text-xs text-[#AAA0A7]">{error}</p>
          <button
            type="button"
            onClick={() => fetchPage(1, false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-semibold text-[#F5F1F3]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF385B]" />
            <span>Retry</span>
          </button>
        </div>
      ) : items.length === 0 ? null : (
        <div className="relative">
          {/* Left Scroll Paddle */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label={`Scroll ${title} left`}
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Horizontal Swipe Rail */}
          <div
            ref={trackRef}
            onScroll={checkScroll}
            className="cinova-carousel-track flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {items.map((item) => {
              const imageSrc = isLandscape
                ? item.backdropUrl || item.posterUrl
                : item.posterUrl || item.backdropUrl;

              return (
                <Link
                  key={`${feedId}-${item.mediaType}-${item.tmdbId || item.id}`}
                  href={item.detailHref}
                  className={`group/card relative flex-shrink-0 ${cardWidthClass} flex flex-col rounded-xl overflow-hidden bg-[#10080C] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(225,29,72,0.55)] transition-all duration-300 shadow-[0_8px_22px_rgba(0,0,0,0.5)]`}
                >
                  <div className={`relative ${mediaAspectClass} w-full overflow-hidden bg-[#160B10]`}>
                    <CinovaImage
                      src={imageSrc}
                      alt={item.title}
                      fallbackText={item.title}
                      aspect="custom"
                      tmdbSize={isLandscape ? "w780" : "w500"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-[1.06]"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080506] via-[#080506]/60 to-transparent pointer-events-none" />

                    {/* Top badges */}
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

                    {/* Desktop Hover Detail Preview */}
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

                    {/* Vault playable indicator ONLY when genuinely licensed in CINOVA Vault */}
                    {item.hasLicensedStream ? (
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0D2418]/90 border border-[#10B981]/50 text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        Stream Ready
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#160B10]/85 border border-[rgba(155,25,57,0.3)] text-[9px] font-semibold uppercase tracking-wider text-[#FF385B]">
                        Discovery
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
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
              );
            })}

            {/* In-Rail Load More Pagination Card */}
            {canLoadMore && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchPage(page + 1, true)}
                className={`flex-shrink-0 ${
                  isLandscape ? "w-[170px]" : "w-[136px] sm:w-[152px]"
                } rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-dashed border-[rgba(155,25,57,0.4)] hover:border-[#E11D48] flex flex-col items-center justify-center gap-2 p-4 text-center transition-colors`}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-6 h-6 text-[#FF385B] animate-spin" />
                    <span className="text-xs font-semibold text-[#AAA0A7]">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="w-10 h-10 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.35)] flex items-center justify-center text-[#FF385B]">
                      <Plus className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-[#F5F1F3]">Load More</span>
                    <span className="text-[10px] text-[#746971]">
                      Page {page + 1} of {Math.min(totalPages, 25)}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Scroll Paddle */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label={`Scroll ${title} right`}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#10080C]/95 hover:bg-[#A30D32] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] items-center justify-center transition-opacity opacity-0 group-hover/row:opacity-100 shadow-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

const WorldwideRail = memo(WorldwideRailComponent);
export default WorldwideRail;
