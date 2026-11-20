"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Tv,
  Globe,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle,
} from "lucide-react";

interface AnalyticsData {
  users: {
    totalRegistered: number;
    activeDailyUsers: number;
    activeMonthlyUsers: number;
    adminCount: number;
    premiumSubscribers: number;
  };
  monetization: {
    revenue: {
      currency: string;
      totalRecorded: number;
      formatted: string;
      affiliatePending: number;
      note: string;
    };
    outboundStreamingReferrals: number;
    clicksByProvider: Record<string, number>;
    recentClicks: Array<{
      id: string;
      providerName: string;
      title: string;
      mediaType: string;
      country: string;
      timestamp: number;
    }>;
    affiliatePartnersConfigured: {
      amazon: boolean;
      apple: boolean;
      adsense: boolean;
    };
  };
  catalog: {
    totalCurated: number;
    movies: number;
    series: number;
    anime: number;
    playableVaultTitles: number;
    totalConnectedSources: number;
  };
  systemStatus: {
    tmdbLiveConfigured: boolean;
    supabaseAuthLive: boolean;
    streamingTelemetryLive: boolean;
  };
}

export default function AdminAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      } else {
        throw new Error(json.error || "Failed to load analytics");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-6 h-6 text-[#FF385B] animate-spin" />
        <p className="text-sm text-[#AAA0A7]">Loading authoritative platform analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl bg-[#10080C] border border-[rgba(225,29,72,0.35)] p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-[#FF385B]">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.3)] text-xs font-bold text-[#F5F1F3]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { users, monetization, catalog, systemStatus } = data!;
  const providerEntries = Object.entries(monetization.clicksByProvider).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1F3] tracking-tight">
            Platform Analytics &amp; Monetization Telemetry
          </h2>
          <p className="text-xs text-[#AAA0A7] pt-0.5">
            Real database metrics, outbound streaming partner clicks, and live audience telemetry.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-semibold text-[#F5F1F3] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF385B] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.25)] p-5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746971]">
              Registered Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#FF385B]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">
              {users.totalRegistered.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#AAA0A7] pt-1">
              {users.adminCount} Admins · {users.premiumSubscribers} Premium
            </div>
          </div>
        </div>

        {/* Active Daily Audience */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.25)] p-5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746971]">
              Audience (DAU / MAU)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">
              {users.activeDailyUsers.toLocaleString()} <span className="text-sm font-normal text-[#746971]">DAU</span>
            </div>
            <div className="text-[11px] text-[#AAA0A7] pt-1">
              Monthly Active: {users.activeMonthlyUsers.toLocaleString()} users
            </div>
          </div>
        </div>

        {/* Real Revenue */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.25)] p-5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746971]">
              Recorded Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#FF385B]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">
              {monetization.revenue.formatted}
            </div>
            <div className="text-[11px] text-[#AAA0A7] pt-1 truncate" title={monetization.revenue.note}>
              Est. Affiliate Pending: ${monetization.revenue.affiliatePending}
            </div>
          </div>
        </div>

        {/* Outbound Streaming Referrals */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.25)] p-5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746971]">
              Streaming Referrals
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.3)] flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-[#FF385B]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#F5F1F3]">
              {monetization.outboundStreamingReferrals.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#AAA0A7] pt-1">
              Tracked partner provider clicks
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Streaming Providers Click Breakdown + System Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clicked Providers */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
            <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
              Top Streaming Platforms Clicked
            </h3>
          </div>

          {providerEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#746971]">
              No outbound provider clicks recorded in this session yet. User clicks on "Watch on Netflix / Prime Video / Disney+" will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-3">
              {providerEntries.map(([name, count]) => {
                const total = monetization.outboundStreamingReferrals || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-[#F5F1F3]">{name}</span>
                      <span className="text-[#AAA0A7]">
                        {count} {count === 1 ? "click" : "clicks"} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#160B10] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#A30D32] to-[#E11D48]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Affiliate Partner & Integration Status */}
        <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
            <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
              Affiliate Partner Networks
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#F5F1F3]">Amazon Associates</p>
                <p className="text-xs text-[#746971]">Direct affiliate tag appending on Amazon Video clicks</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  monetization.affiliatePartnersConfigured.amazon
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    : "bg-[#10080C] text-[#746971] border-[rgba(155,25,57,0.2)]"
                }`}
              >
                {monetization.affiliatePartnersConfigured.amazon ? "Active" : "Not Set"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#F5F1F3]">Apple Performance Network</p>
                <p className="text-xs text-[#746971]">Campaign token appending on Apple TV / iTunes clicks</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  monetization.affiliatePartnersConfigured.apple
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    : "bg-[#10080C] text-[#746971] border-[rgba(155,25,57,0.2)]"
                }`}
              >
                {monetization.affiliatePartnersConfigured.apple ? "Active" : "Not Set"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#F5F1F3]">Google AdSense / Publisher</p>
                <p className="text-xs text-[#746971]">Display ads rendered inside sponsored catalog slots</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  monetization.affiliatePartnersConfigured.adsense
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    : "bg-[#10080C] text-[#746971] border-[rgba(155,25,57,0.2)]"
                }`}
              >
                {monetization.affiliatePartnersConfigured.adsense ? "Active" : "Spotlight Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Outbound Click Activity Feed */}
      <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
            <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
              Recent Outbound Referral Clicks
            </h3>
          </div>
          <span className="text-xs text-[#746971]">
            {monetization.recentClicks.length} recorded events
          </span>
        </div>

        {monetization.recentClicks.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#746971]">
            No click events recorded yet. Click a provider button on any movie/series to test telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[rgba(155,25,57,0.2)] text-[#746971] text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Media</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Region</th>
                  <th className="pb-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(155,25,57,0.12)]">
                {monetization.recentClicks.map((click) => (
                  <tr key={click.id} className="hover:bg-[#160B10]/50 transition-colors">
                    <td className="py-3 font-medium text-[#F5F1F3] max-w-xs truncate">
                      {click.title}
                    </td>
                    <td className="py-3 uppercase text-[11px] text-[#FF385B] font-mono">
                      {click.mediaType}
                    </td>
                    <td className="py-3 text-[#F5F1F3] font-semibold">
                      {click.providerName}
                    </td>
                    <td className="py-3 text-[#AAA0A7]">
                      {click.country}
                    </td>
                    <td className="py-3 text-right text-xs text-[#746971]">
                      {new Date(click.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
