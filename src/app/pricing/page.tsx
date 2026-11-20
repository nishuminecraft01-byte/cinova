"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Crown,
  ShieldCheck,
  Sparkles,
  X,
  ArrowRight,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  FREE_DAILY_WATCH_LIMIT_MINUTES,
  MEMBERSHIP_COMING_SOON_MODAL,
  MEMBERSHIP_COMPARISON_ROWS,
  MEMBERSHIP_PLANS,
  MembershipPlan,
  formatTimeUntilReset,
  formatWatchTimeRemaining,
  getPlanPriceSummary,
} from "@/lib/membership";

interface QuotaPreview {
  tier: string;
  isUnlimited: boolean;
  usedSeconds: number;
  remainingSeconds: number | null;
  limitSeconds: number | null;
  isLimitReached: boolean;
  resetsAtIst: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [quota, setQuota] = useState<QuotaPreview | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/watch-time", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.quota) {
          setQuota(data.quota);
        }
      })
      .catch(() => {
        // Non-blocking telemetry preview
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedPlan) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPlan(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlan]);

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen bg-[#080506] text-[#F5F2F3] relative overflow-x-clip">
      {/* Subtle cinematic ambient background wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(101, 10, 32, 0.34) 0%, rgba(16, 8, 12, 0.45) 48%, rgba(8, 5, 6, 0) 100%)",
        }}
      />

      <div className="relative max-w-[1260px] mx-auto pt-24 sm:pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <header className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5F2F3]/90 mb-5">
            <Crown className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>CINOVA Memberships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#F5F2F3] leading-[1.08]">
            Cinema tailored to how you watch.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#AAA0A7] max-w-2xl mx-auto leading-relaxed">
            Explore movies, acclaimed series, anime, and shorts on CINOVA Free, or preview our upcoming Standard and Ultra memberships built for uninterrupted streaming.
          </p>

          {/* Current Free Watch-Time Status Pill */}
          {quota && !quota.isUnlimited && (
            <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#F5F2F3]">
                <Clock className="w-3.5 h-3.5 text-[#E11D48]" />
                Free Daily Allowance:
              </span>
              <span
                className={
                  quota.isLimitReached
                    ? "font-bold text-[#E11D48]"
                    : "font-semibold text-[#F5F2F3]"
                }
              >
                {quota.isLimitReached
                  ? "0m remaining today"
                  : `${formatWatchTimeRemaining(quota.remainingSeconds ?? 0)} / ${FREE_DAILY_WATCH_LIMIT_MINUTES}m remaining`}
              </span>
              <span className="text-[#746971] hidden sm:inline">•</span>
              <span className="text-[#AAA0A7]">
                Resets at midnight IST ({formatTimeUntilReset(quota.resetsAtIst)})
              </span>
            </div>
          )}
        </header>

        {/* 3-Tier Pricing Cards Grid */}
        <section
          aria-label="Membership Plans"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7 items-stretch mb-20"
        >
          {MEMBERSHIP_PLANS.map((plan) => {
            const isUltra = plan.highlighted;
            const isCurrentTier = (user?.tier || "Free") === plan.id && user?.role !== "admin";

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
                  isUltra
                    ? "bg-gradient-to-b from-[#1E0C13] via-[#160B10] to-[#10080C] border border-[#A30D32]/75 shadow-[0_24px_60px_rgba(0,0,0,0.65)] lg:-translate-y-2"
                    : "bg-[#160B10] border border-[rgba(155,25,57,0.22)] hover:border-[rgba(163,13,50,0.48)] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                }`}
              >
                {/* Top subtle crimson hairline accent on Ultra */}
                {isUltra && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#E11D48] to-transparent"
                  />
                )}

                <div>
                  {/* Top Badge Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px] mb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {plan.badges.map((badge) => {
                        const isSaveBadge = badge.includes("SAVE");
                        return (
                          <span
                            key={badge}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] ${
                              isSaveBadge
                                ? "bg-[#650A20]/70 text-[#F5F2F3] border border-[#E11D48]/45"
                                : isUltra
                                ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F2F3]"
                                : "bg-[#10080C] text-[#F5F2F3] border border-[#A30D32]/50"
                            }`}
                          >
                            {badge}
                          </span>
                        );
                      })}
                      {isCurrentTier && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#10080C] text-[#AAA0A7] border border-[rgba(155,25,57,0.26)]">
                          Active Plan
                        </span>
                      )}
                    </div>

                    {plan.comingSoon && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.14em] bg-[#10080C] text-[#AAA0A7] border border-[rgba(155,25,57,0.24)]">
                        COMING SOON
                      </span>
                    )}
                  </div>

                  {/* Plan Title & Tagline */}
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F2F3]">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#AAA0A7] leading-relaxed min-h-[40px]">
                    {plan.tagline}
                  </p>

                  {/* Pricing Block */}
                  <div className="mt-6 pb-6 border-b border-[rgba(155,25,57,0.2)]">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-4xl sm:text-[44px] font-black tracking-tight text-[#F5F2F3] leading-none">
                        {plan.priceDisplay}
                      </span>
                      <span className="text-sm font-medium text-[#AAA0A7]">
                        / {plan.periodDisplay}
                      </span>
                      {plan.originalAnnualPriceDisplay && (
                        <span className="text-base font-semibold text-[#746971] line-through ml-1">
                          {plan.originalAnnualPriceDisplay}
                        </span>
                      )}
                    </div>

                    {/* Billing & Savings Metadata */}
                    <div className="mt-2.5 min-h-[38px] flex flex-col justify-center">
                      {plan.id === "Free" && (
                        <p className="text-xs text-[#AAA0A7]">
                          {plan.billingLabel} • Browse freely, {FREE_DAILY_WATCH_LIMIT_MINUTES} min/day viewing
                        </p>
                      )}
                      {plan.id === "Standard" && (
                        <p className="text-xs text-[#AAA0A7]">
                          {plan.billingLabel} • Unlimited daily streaming
                        </p>
                      )}
                      {plan.id === "Ultra" && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#E11D48]">
                            {plan.effectiveMonthlyDisplay} equivalent • Save {plan.savingsDisplay}/year ({plan.discountPercent}% off)
                          </p>
                          <p className="text-[11px] text-[#AAA0A7]">
                            Original annual price {plan.originalAnnualPriceDisplay}/year
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-6 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#746971]">
                      Included in {plan.shortName}
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-[13px] text-[#F5F2F3]/88 leading-snug"
                        >
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isUltra ? "text-[#E11D48]" : "text-[#A30D32]"
                            }`}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Selection CTA */}
                <div className="mt-8 pt-6 border-t border-[rgba(155,25,57,0.18)]">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-[0.12em] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] ${
                      isUltra
                        ? "bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F2F3] shadow-[0_10px_28px_rgba(163,13,50,0.38)]"
                        : plan.id === "Standard"
                        ? "bg-[#650A20]/85 hover:bg-[#A30D32] text-[#F5F2F3] border border-[#A30D32]/65"
                        : "bg-[#10080C] hover:bg-[#1D0C13] text-[#F5F2F3] border border-[rgba(155,25,57,0.3)] hover:border-[#A30D32]"
                    }`}
                  >
                    <span>{plan.buttonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Feature Comparison Section */}
        <section
          aria-labelledby="comparison-heading"
          className="rounded-3xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="p-6 sm:p-8 border-b border-[rgba(155,25,57,0.2)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E11D48] mb-1.5">
                Compare Plans
              </p>
              <h2
                id="comparison-heading"
                className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F2F3]"
              >
                Transparent Feature Breakdown
              </h2>
              <p className="text-xs sm:text-sm text-[#AAA0A7] mt-1.5 max-w-2xl">
                Every tier is clearly documented. Features still in development are marked honestly as Coming Soon or Future-ready.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[#AAA0A7] bg-[#160B10] border border-[rgba(155,25,57,0.22)] px-3.5 py-2 rounded-xl self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-[#E11D48] shrink-0" />
              <span>Payments launching soon</span>
            </div>
          </div>

          {/* Desktop Comparison Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#160B10] border-b border-[rgba(155,25,57,0.22)]">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#AAA0A7] w-[26%]">
                    Feature
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#F5F2F3] w-[24%]">
                    CINOVA FREE
                    <span className="block text-[11px] font-normal text-[#AAA0A7] normal-case mt-0.5">
                      ₹0 / Forever
                    </span>
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#F5F2F3] w-[24%]">
                    CINOVA STANDARD
                    <span className="block text-[11px] font-normal text-[#AAA0A7] normal-case mt-0.5">
                      ₹29 / month
                    </span>
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#F5F2F3] bg-[#650A20]/25 w-[26%]">
                    <span className="inline-flex items-center gap-1.5">
                      CINOVA ULTRA
                      <span className="px-1.5 py-0.5 rounded bg-[#E11D48] text-[9px] text-[#F5F2F3]">
                        BEST VALUE
                      </span>
                    </span>
                    <span className="block text-[11px] font-normal text-[#E11D48] normal-case mt-0.5">
                      ₹279 / year (₹23.25/mo)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(155,25,57,0.16)] text-[13px]">
                {MEMBERSHIP_COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.category}
                    className="hover:bg-[#160B10]/60 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-[#F5F2F3]">
                      <div>{row.category}</div>
                      {row.note && (
                        <p className="text-[11px] font-normal text-[#746971] mt-0.5">
                          {row.note}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#AAA0A7]">{row.free}</td>
                    <td className="py-4 px-6 text-[#F5F2F3]/90">{row.standard}</td>
                    <td className="py-4 px-6 text-[#F5F2F3] font-medium bg-[#650A20]/15">
                      {row.ultra}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden divide-y divide-[rgba(155,25,57,0.18)]">
            {MEMBERSHIP_COMPARISON_ROWS.map((row) => (
              <div key={row.category} className="p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F2F3]">{row.category}</h3>
                  {row.note && (
                    <p className="text-[11px] text-[#746971] mt-0.5">{row.note}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.18)]">
                    <span className="font-semibold text-[#AAA0A7]">FREE</span>
                    <span className="text-[#AAA0A7] text-right">{row.free}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.18)]">
                    <span className="font-semibold text-[#F5F2F3]">STANDARD</span>
                    <span className="text-[#F5F2F3]/90 text-right">{row.standard}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-[#650A20]/25 border border-[#A30D32]/40">
                    <span className="font-bold text-[#E11D48]">ULTRA</span>
                    <span className="text-[#F5F2F3] font-medium text-right">{row.ultra}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Free Browsing Assurance Strip */}
        <div className="mt-10 rounded-2xl bg-[#160B10] border border-[rgba(155,25,57,0.22)] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-[13px] text-[#AAA0A7] leading-relaxed">
              <strong className="text-[#F5F2F3]">How CINOVA Free works:</strong>{" "}
              Browse the full catalog, search titles, and manage My List anytime with zero limits. Only active video playback counts toward your 60-minute daily quota (buffering and paused time never count), and your timer resets automatically at 12:00 AM IST.
            </div>
          </div>
          <Link
            href="/movies"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-xs font-semibold text-[#F5F2F3] transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Coming Soon Membership Modal */}
      {selectedPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="membership-modal-title"
          onClick={() => setSelectedPlan(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#10080C] border border-[rgba(155,25,57,0.34)] p-6 sm:p-8 shadow-[0_28px_70px_rgba(0,0,0,0.85)] relative animate-modal-in"
          >
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 p-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F2F3] border border-[rgba(155,25,57,0.24)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[#650A20]/55 border border-[#E11D48]/40 flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5 text-[#E11D48]" />
            </div>

            <h3
              id="membership-modal-title"
              className="text-lg sm:text-xl font-black tracking-wide text-[#F5F2F3]"
            >
              {MEMBERSHIP_COMING_SOON_MODAL.title}
            </h3>

            <p className="mt-2.5 text-sm text-[#AAA0A7] leading-relaxed">
              {MEMBERSHIP_COMING_SOON_MODAL.message}
            </p>

            {/* Selected Plan Summary */}
            <div className="mt-5 p-4 rounded-2xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#746971]">
                  Selected Plan
                </span>
                {selectedPlan.comingSoon && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#650A20]/60 text-[#F5F2F3] border border-[#E11D48]/35">
                    Coming Soon
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-bold text-[#F5F2F3]">
                  {selectedPlan.name}
                </span>
                <span className="text-base font-black text-[#E11D48]">
                  {getPlanPriceSummary(selectedPlan)}
                </span>
              </div>

              {selectedPlan.id === "Ultra" && (
                <p className="text-[11px] text-[#AAA0A7] pt-1 border-t border-[rgba(155,25,57,0.16)]">
                  Includes {selectedPlan.discountPercent}% annual savings ({selectedPlan.savingsDisplay} off {selectedPlan.originalAnnualPriceDisplay}/year • {selectedPlan.effectiveMonthlyDisplay} equivalent)
                </p>
              )}

              {selectedPlan.id === "Free" && (
                <p className="text-[11px] text-[#AAA0A7] pt-1 border-t border-[rgba(155,25,57,0.16)]">
                  You can continue browsing CINOVA and streaming up to {FREE_DAILY_WATCH_LIMIT_MINUTES} minutes per day on CINOVA Free right now.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F2F3] font-bold text-xs uppercase tracking-[0.14em] transition-all shadow-[0_8px_24px_rgba(163,13,50,0.38)]"
            >
              {MEMBERSHIP_COMING_SOON_MODAL.buttonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
