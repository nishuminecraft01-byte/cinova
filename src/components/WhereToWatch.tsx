"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Tv,
  ExternalLink,
  Globe,
  Film,
  Tag,
  CreditCard,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Play,
} from "lucide-react";
import {
  CountryWatchProviders,
  SUPPORTED_WATCH_COUNTRIES,
  WatchProviderItem,
} from "@/lib/tmdb-worldwide";
import { sendOutboundClickTelemetry, buildMonetizedProviderLink } from "@/lib/monetization";

interface WhereToWatchProps {
  watchProviders?: Record<string, CountryWatchProviders> | null;
  title: string;
  mediaType: "movie" | "tv";
  tmdbId: number | string;
  className?: string;
  onProviderSelect?: (provider: WatchProviderItem, country: string) => void;
}

export default function WhereToWatch({
  watchProviders,
  title,
  mediaType,
  tmdbId,
  className = "",
  onProviderSelect,
}: WhereToWatchProps) {
  // Default to India or saved user preference
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
    const saved = localStorage.getItem("cinova_watch_country");
    if (saved && typeof saved === "string") {
      setSelectedCountry(saved.toUpperCase());
    }
  }, []);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("cinova_watch_country", countryCode);
    }
  };

  // Get list of countries with available data
  const availableCountryCodes = useMemo(() => {
    if (!watchProviders) return [];
    return Object.keys(watchProviders);
  }, [watchProviders]);

  // Active country data
  const activeCountryData = watchProviders ? watchProviders[selectedCountry] : null;

  // Active country display name and flag
  const activeCountryMeta = useMemo(() => {
    const found = SUPPORTED_WATCH_COUNTRIES.find((c) => c.code === selectedCountry);
    if (found) return found;
    return {
      code: selectedCountry,
      name: activeCountryData?.countryName || selectedCountry,
      flag: "🌐",
    };
  }, [selectedCountry, activeCountryData]);

  const hasAnyProviders = Boolean(
    activeCountryData &&
      (activeCountryData.flatrate?.length > 0 ||
        activeCountryData.rent?.length > 0 ||
        activeCountryData.buy?.length > 0 ||
        activeCountryData.ads?.length > 0 ||
        activeCountryData.free?.length > 0)
  );

  const handleProviderClick = (
    provider: WatchProviderItem,
    category: "flatrate" | "rent" | "buy" | "ads" | "free",
    defaultUrl?: string
  ) => {
    const rawTarget = defaultUrl || activeCountryData?.link || `https://www.themoviedb.org/${mediaType}/${tmdbId}/watch`;
    const { url } = buildMonetizedProviderLink(provider.name, rawTarget);

    // Send telemetry without blocking navigation
    sendOutboundClickTelemetry({
      providerName: provider.name,
      mediaType,
      tmdbId,
      title,
      country: selectedCountry,
      targetUrl: url,
      category: "streaming_provider",
      timestamp: new Date().toISOString(),
    });

    if (onProviderSelect) {
      onProviderSelect(provider, selectedCountry);
    }

    // Open official provider in new tab
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      id="where-to-watch"
      className={`rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] p-5 sm:p-7 space-y-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] ${className}`}
    >
      {/* 1. Section Header & Country Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(155,25,57,0.2)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF385B]">
              Where to Watch · Legal Streaming
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5F1F3] tracking-tight">
            Official Streaming Availability
          </h2>
          <p className="text-xs text-[#AAA0A7]">
            Licensed subscription, rental, and digital purchase platforms in your region.
          </p>
        </div>

        {/* Country Selector Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-[#FF385B] shrink-0" />
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="appearance-none bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48]/70 rounded-full px-4 py-2 pr-9 text-xs font-bold text-[#F5F1F3] cursor-pointer transition-colors outline-none focus:border-[#FF385B]"
              aria-label="Select streaming country"
            >
              {SUPPORTED_WATCH_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#10080C] text-[#F5F1F3]">
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
              {/* Other countries available in payload */}
              {availableCountryCodes
                .filter((code) => !SUPPORTED_WATCH_COUNTRIES.some((c) => c.code === code))
                .slice(0, 20)
                .map((code) => (
                  <option key={code} value={code} className="bg-[#10080C] text-[#F5F1F3]">
                    🌐 {code}
                  </option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#AAA0A7] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Provider Categories or Empty State */}
      {hasAnyProviders && activeCountryData ? (
        <div className="space-y-6">
          {/* Subscription / Flatrate */}
          {activeCountryData.flatrate?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#FF385B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                  Subscription Stream ({activeCountryData.flatrate.length})
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Included with Plan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeCountryData.flatrate.map((provider) => (
                  <button
                    key={`flatrate-${provider.id}`}
                    type="button"
                    onClick={() => handleProviderClick(provider, "flatrate")}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.25)] hover:border-[#E11D48]/70 text-left transition-all duration-200 active:scale-95"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black shrink-0 border border-[rgba(155,25,57,0.3)] group-hover:border-[#FF385B]/60 transition-colors">
                      {provider.logoUrl ? (
                        <Image
                          src={provider.logoUrl}
                          alt={provider.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#FF385B]">
                          {provider.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F5F1F3] truncate group-hover:text-[#FF385B] transition-colors">
                        {provider.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#AAA0A7] group-hover:text-[#F5F1F3]">
                        <span>Watch Now</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#FF385B]" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Free with Ads */}
          {activeCountryData.ads?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF385B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                  Free with Ads ({activeCountryData.ads.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeCountryData.ads.map((provider) => (
                  <button
                    key={`ads-${provider.id}`}
                    type="button"
                    onClick={() => handleProviderClick(provider, "ads")}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.25)] hover:border-[#E11D48]/70 text-left transition-all duration-200 active:scale-95"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black shrink-0 border border-[rgba(155,25,57,0.3)]">
                      {provider.logoUrl ? (
                        <Image
                          src={provider.logoUrl}
                          alt={provider.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#FF385B]">
                          {provider.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F5F1F3] truncate group-hover:text-[#FF385B] transition-colors">
                        {provider.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#AAA0A7] group-hover:text-[#F5F1F3]">
                        <span>Free Stream</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#FF385B]" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rent */}
          {activeCountryData.rent?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF385B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                  Rent ({activeCountryData.rent.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeCountryData.rent.map((provider) => (
                  <button
                    key={`rent-${provider.id}`}
                    type="button"
                    onClick={() => handleProviderClick(provider, "rent")}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.25)] hover:border-[#E11D48]/70 text-left transition-all duration-200 active:scale-95"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black shrink-0 border border-[rgba(155,25,57,0.3)]">
                      {provider.logoUrl ? (
                        <Image
                          src={provider.logoUrl}
                          alt={provider.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#FF385B]">
                          {provider.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F5F1F3] truncate group-hover:text-[#FF385B] transition-colors">
                        {provider.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#AAA0A7] group-hover:text-[#F5F1F3]">
                        <span>Rent Online</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#FF385B]" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buy */}
          {activeCountryData.buy?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#FF385B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F1F3]">
                  Buy Digital Copy ({activeCountryData.buy.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeCountryData.buy.map((provider) => (
                  <button
                    key={`buy-${provider.id}`}
                    type="button"
                    onClick={() => handleProviderClick(provider, "buy")}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.25)] hover:border-[#E11D48]/70 text-left transition-all duration-200 active:scale-95"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black shrink-0 border border-[rgba(155,25,57,0.3)]">
                      {provider.logoUrl ? (
                        <Image
                          src={provider.logoUrl}
                          alt={provider.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#FF385B]">
                          {provider.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F5F1F3] truncate group-hover:text-[#FF385B] transition-colors">
                        {provider.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#AAA0A7] group-hover:text-[#F5F1F3]">
                        <span>Buy Digital</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#FF385B]" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State — Not Available in Region */
        <div className="p-6 sm:p-8 rounded-xl bg-[#160B10]/90 border border-[rgba(155,25,57,0.24)] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10080C] border border-[rgba(155,25,57,0.35)] flex items-center justify-center mx-auto text-[#FF385B]">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
              Not Available for Streaming in {activeCountryMeta.name} {activeCountryMeta.flag}
            </h3>
            <p className="text-xs sm:text-sm text-[#AAA0A7] leading-relaxed">
              No licensed subscription, rental, or purchase platforms were found for this title in this country on TMDB.
            </p>
          </div>

          {/* Quick Country Switcher */}
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-[#746971]">Check other regions:</span>
            {["IN", "US", "GB", "CA", "AU"]
              .filter((c) => c !== selectedCountry)
              .map((c) => {
                const meta = SUPPORTED_WATCH_COUNTRIES.find((x) => x.code === c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCountryChange(c)}
                    className="px-3 py-1 rounded-full bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] hover:border-[#FF385B] font-semibold text-[#F5F1F3] transition-colors"
                  >
                    {meta?.flag} {meta?.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. TMDB JustWatch Attribution & Legal Note */}
      <div className="pt-2 border-t border-[rgba(155,25,57,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#746971]">
        <span>
          Streaming availability provided by TMDB Watch Providers. CINOVA directs to licensed official services.
        </span>
        {activeCountryData?.link && (
          <a
            href={activeCountryData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#FF385B] hover:underline"
          >
            <span>View all regional options on TMDB</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </section>
  );
}
