/**
 * CINOVA Monetization & Affiliate System
 * Handles official streaming platform referrals, affiliate tag decoration,
 * and outbound click analytics without fabricating earnings or fake links.
 */

export interface OutboundClickEvent {
  id?: string;
  providerName: string;
  mediaType: "movie" | "tv";
  tmdbId: number | string;
  title: string;
  country: string;
  targetUrl: string;
  category: "streaming_provider" | "affiliate" | "ad";
  timestamp: string;
}

// Configurable official affiliate partnership tags (configured via env or dashboard)
export interface AffiliateConfig {
  amazonAssociateTag?: string;
  appleCampaignToken?: string;
  disneyAffiliateId?: string;
  enabled: boolean;
}

// In-memory analytics ring buffer for real-time admin telemetry
const MAX_RECORDED_CLICKS = 1000;
const recordedClicks: OutboundClickEvent[] = [];

export function recordClick(event: OutboundClickEvent): void {
  if (recordedClicks.length >= MAX_RECORDED_CLICKS) {
    recordedClicks.shift();
  }
  recordedClicks.push({
    ...event,
    id: `click_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  });
}

export function getRecordedClicks(): OutboundClickEvent[] {
  return [...recordedClicks].reverse();
}

export function getClicksSummary(): {
  totalClicks: number;
  byProvider: Record<string, number>;
  byCountry: Record<string, number>;
  recentClicks: OutboundClickEvent[];
} {
  const byProvider: Record<string, number> = {};
  const byCountry: Record<string, number> = {};

  for (const c of recordedClicks) {
    byProvider[c.providerName] = (byProvider[c.providerName] || 0) + 1;
    byCountry[c.country] = (byCountry[c.country] || 0) + 1;
  }

  return {
    totalClicks: recordedClicks.length,
    byProvider,
    byCountry,
    recentClicks: recordedClicks.slice(-20).reverse(),
  };
}

/**
 * Decorates an official streaming provider URL with affiliate parameters
 * ONLY when legitimate affiliate keys are configured in server environment.
 * Never fabricates invalid or deceptive tracking links.
 */
export function buildMonetizedProviderLink(
  providerName: string,
  rawUrl: string,
  affiliateConfig?: AffiliateConfig
): { url: string; isAffiliate: boolean } {
  if (!rawUrl) return { url: "", isAffiliate: false };

  const lower = providerName.toLowerCase();

  // Amazon Prime Video affiliate tag decoration
  if (lower.includes("amazon") || lower.includes("prime video")) {
    const tag = affiliateConfig?.amazonAssociateTag || process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
    if (tag) {
      try {
        const u = new URL(rawUrl);
        u.searchParams.set("tag", tag);
        return { url: u.toString(), isAffiliate: true };
      } catch {
        return { url: rawUrl, isAffiliate: false };
      }
    }
  }

  // Apple TV affiliate campaign token decoration
  if (lower.includes("apple") || lower.includes("itunes")) {
    const token = affiliateConfig?.appleCampaignToken || process.env.NEXT_PUBLIC_APPLE_CAMPAIGN_TOKEN;
    if (token) {
      try {
        const u = new URL(rawUrl);
        u.searchParams.set("ct", token);
        return { url: u.toString(), isAffiliate: true };
      } catch {
        return { url: rawUrl, isAffiliate: false };
      }
    }
  }

  return { url: rawUrl, isAffiliate: false };
}

/**
 * Client-side helper to record outbound streaming clicks before navigation.
 */
export function sendOutboundClickTelemetry(event: OutboundClickEvent): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify(event);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/monetization/click", blob);
    } else {
      fetch("/api/monetization/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Graceful degradation
  }
}
