"use client";

import React, { useState } from "react";
import {
  Tag,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Layers,
} from "lucide-react";
import AdSlot, { AdSlotPosition } from "@/components/monetization/AdSlot";

const SLOTS: Array<{
  id: AdSlotPosition;
  name: string;
  description: string;
  format: string;
  active: boolean;
}> = [
  {
    id: "homepage-banner",
    name: "Homepage Sponsored Banner",
    description: "Full-width high-visibility placement directly above the discovery hub.",
    format: "Responsive Banner / 728x90",
    active: true,
  },
  {
    id: "catalog-inline",
    name: "Catalog Inline Spotlight",
    description: "Appears periodically between discovery rails for seamless integration.",
    format: "In-Feed Native Spotlight",
    active: true,
  },
  {
    id: "detail-sidebar",
    name: "Detail View Placement",
    description: "Displays below the top cast row and above recommendations on movie/series pages.",
    format: "Display Banner / 970x250 or Native Card",
    active: true,
  },
  {
    id: "search-sponsored",
    name: "Search Results Spotlight",
    description: "Renders at the top of search result grids for matching queries.",
    format: "Native Search Card",
    active: true,
  },
];

export default function AdminAdsManager() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1F3] tracking-tight">
          Ad Slot &amp; Monetization Placements
        </h2>
        <p className="text-xs text-[#AAA0A7] pt-0.5">
          Manage sponsored display placements, publisher scripts, and affiliate tag injection rules.
        </p>
      </div>

      {/* Ad Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.25)] p-5 flex flex-col justify-between space-y-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF385B]">
                  ID: {slot.id}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold uppercase text-emerald-400">
                  Active
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F5F1F3]">{slot.name}</h3>
              <p className="text-xs text-[#AAA0A7] leading-relaxed">{slot.description}</p>
            </div>

            <div className="pt-2 border-t border-[rgba(155,25,57,0.18)] flex items-center justify-between text-xs text-[#746971]">
              <span>Format: {slot.format}</span>
              <span className="text-[#AAA0A7]">Automatic Safe Mode</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview of Ad Slot Component */}
      <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
          <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
            Live Component Preview: Detail View Ad Slot
          </h3>
        </div>
        <p className="text-xs text-[#AAA0A7]">
          This is the exact UI component displayed to users across movie and series detail views:
        </p>
        <div className="pt-2">
          <AdSlot slot="detail-sidebar" />
        </div>
      </div>

      {/* Environment Variable Setup Guide */}
      <div className="rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#FF385B] to-[#650A20]" />
          <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3]">
            Environment Configuration
          </h3>
        </div>
        <p className="text-xs text-[#AAA0A7]">
          To activate direct publisher ad serving or affiliate network commissions, add any of these variables to your <code className="text-[#F5F1F3]">.env.local</code> file:
        </p>

        <div className="space-y-3 pt-1">
          {[
            {
              key: "NEXT_PUBLIC_ADSENSE_PUBLISHER_ID",
              label: "Google AdSense Publisher ID",
              example: "ca-pub-1234567890123456",
            },
            {
              key: "NEXT_PUBLIC_AMAZON_AFFILIATE_TAG",
              label: "Amazon Associates Tag",
              example: "cinova-20",
            },
            {
              key: "NEXT_PUBLIC_APPLE_AFFILIATE_TOKEN",
              label: "Apple Services Affiliate Token",
              example: "1000l3XYZ",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.22)] gap-4"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-[#F5F1F3] truncate">{item.label}</p>
                <code className="text-[11px] font-mono text-[#FF385B] block truncate">
                  {item.key}={item.example}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.key, `${item.key}=${item.example}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10080C] border border-[rgba(155,25,57,0.3)] text-xs text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors shrink-0"
              >
                {copiedKey === item.key ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
