export type MembershipTier = "Free" | "Standard" | "Ultra";

export const PAYMENTS_ENABLED = false;

/** Free tier receives exactly 60 minutes (3,600 seconds) of active playback per IST day. */
export const FREE_DAILY_WATCH_LIMIT_MINUTES = 60;
export const FREE_DAILY_WATCH_LIMIT_SECONDS = FREE_DAILY_WATCH_LIMIT_MINUTES * 60;

/** IST (India Standard Time) is fixed at UTC+05:30 with no daylight saving transitions. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface MembershipPlan {
  id: MembershipTier;
  name: string;
  shortName: string;
  priceAmount: number;
  priceDisplay: string;
  periodDisplay: string;
  billingLabel: string;
  originalAnnualPriceAmount?: number;
  originalAnnualPriceDisplay?: string;
  savingsAmount?: number;
  savingsDisplay?: string;
  discountPercent?: number;
  effectiveMonthlyAmount?: number;
  effectiveMonthlyDisplay?: string;
  tagline: string;
  badges: string[];
  highlighted: boolean;
  comingSoon: boolean;
  buttonLabel: string;
  dailyWatchLimitMinutes: number | null; // null = unlimited
  maxQualityLabel: string;
  maxDevicesLabel: string;
  features: string[];
}

export const MEMBERSHIP_PLANS: readonly MembershipPlan[] = [
  {
    id: "Free",
    name: "CINOVA FREE",
    shortName: "Free",
    priceAmount: 0,
    priceDisplay: "₹0",
    periodDisplay: "Forever",
    billingLabel: "Forever Free",
    tagline: "Browse the entire CINOVA catalog with 60 minutes of daily viewing.",
    badges: [],
    highlighted: false,
    comingSoon: false,
    buttonLabel: "SELECT CINOVA FREE",
    dailyWatchLimitMinutes: FREE_DAILY_WATCH_LIMIT_MINUTES,
    maxQualityLabel: "Up to 720p HD",
    maxDevicesLabel: "1 device at a time",
    features: [
      "60 minutes daily watch time",
      "Stream on 1 device at a time",
      "Up to 720p HD resolution",
      "Browse the content library",
      "Access available movies, series, anime, and shorts",
      "Search and My List",
      "Daily watch-time reset",
      "Standard stereo audio",
    ],
  },
  {
    id: "Standard",
    name: "CINOVA STANDARD",
    shortName: "Standard",
    priceAmount: 29,
    priceDisplay: "₹29",
    periodDisplay: "month",
    billingLabel: "Billed monthly",
    tagline: "Unlimited Full HD streaming with zero ads on up to 2 devices.",
    badges: ["POPULAR"],
    highlighted: false,
    comingSoon: true,
    buttonLabel: "SELECT CINOVA STANDARD",
    dailyWatchLimitMinutes: null,
    maxQualityLabel: "Full HD 1080p",
    maxDevicesLabel: "Up to 2 simultaneous devices",
    features: [
      "Unlimited streaming",
      "Full HD 1080p playback",
      "Complete available content library",
      "Ad-free experience",
      "Up to 2 simultaneous devices",
      "Standard audio experience",
      "Unlimited daily watch time",
    ],
  },
  {
    id: "Ultra",
    name: "CINOVA ULTRA",
    shortName: "Ultra",
    priceAmount: 279,
    priceDisplay: "₹279",
    periodDisplay: "year",
    billingLabel: "Billed annually",
    originalAnnualPriceAmount: 348,
    originalAnnualPriceDisplay: "₹348",
    savingsAmount: 69,
    savingsDisplay: "₹69",
    discountPercent: 20,
    effectiveMonthlyAmount: 23.25,
    effectiveMonthlyDisplay: "₹23.25/month",
    tagline: "Our finest annual cinema membership with priority access to future releases.",
    badges: ["BEST VALUE", "SAVE 20%"],
    highlighted: true,
    comingSoon: true,
    buttonLabel: "SELECT CINOVA ULTRA",
    dailyWatchLimitMinutes: null,
    maxQualityLabel: "4K UHD (Future-ready)",
    maxDevicesLabel: "Priority multi-device",
    features: [
      "Unlimited streaming",
      "4K UHD option (Future-ready as 4K streams roll out)",
      "Premium ad-free experience",
      "Unlimited daily watch time",
      "Priority access to future premium releases",
      "Premium cinema experience",
    ],
  },
] as const;

export interface ComparisonRow {
  category: string;
  free: string;
  standard: string;
  ultra: string;
  note?: string;
}

export const MEMBERSHIP_COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    category: "Daily watch limit",
    free: "60 minutes / day (resets midnight IST)",
    standard: "Unlimited",
    ultra: "Unlimited",
  },
  {
    category: "Video quality",
    free: "Up to 720p HD",
    standard: "Full HD 1080p",
    ultra: "4K UHD (Future-ready)",
    note: "Actual resolution depends on available stream source.",
  },
  {
    category: "Device limit",
    free: "1 device at a time",
    standard: "Up to 2 simultaneous devices",
    ultra: "Priority multi-device (Coming soon)",
  },
  {
    category: "Ad experience",
    free: "Standard access",
    standard: "Ad-free experience",
    ultra: "Premium ad-free experience",
  },
  {
    category: "Content access",
    free: "Available movies, series, anime & shorts",
    standard: "Complete available content library",
    ultra: "Complete library + future premium releases",
  },
  {
    category: "Offline downloads",
    free: "Not included",
    standard: "Coming soon",
    ultra: "Coming soon",
    note: "Offline downloads are not yet active in the current player.",
  },
  {
    category: "Audio",
    free: "Standard stereo audio",
    standard: "Standard audio experience",
    ultra: "Premium cinema audio (Future-ready)",
  },
  {
    category: "Premium access",
    free: "Browse, Search & My List",
    standard: "Unlimited standard streaming",
    ultra: "Priority access to future premium releases",
  },
] as const;

export const MEMBERSHIP_COMING_SOON_MODAL = {
  title: "CINOVA MEMBERSHIPS",
  message:
    "We're preparing something special. CINOVA memberships and payments will be available soon.",
  buttonLabel: "GOT IT",
} as const;

export function getPlanById(tier?: string | null): MembershipPlan {
  const normalized = (tier || "Free").toLowerCase();
  const found = MEMBERSHIP_PLANS.find((p) => p.id.toLowerCase() === normalized);
  return found || MEMBERSHIP_PLANS[0];
}

export function getPlanPriceSummary(plan: MembershipPlan): string {
  if (plan.id === "Free") return `${plan.priceDisplay} / ${plan.billingLabel}`;
  return `${plan.priceDisplay}/${plan.periodDisplay}`;
}

/**
 * Resolves the authoritative effective tier.
 * While payments are not enabled, paid tiers are never granted to viewer/creator accounts via UI;
 * administrators retain unrestricted access for platform operations and QA.
 */
export function resolveEffectiveTier(
  requestedTier?: string | null,
  role?: "user" | "creator" | "admin" | null
): MembershipTier {
  if (role === "admin") {
    return "Ultra";
  }
  if (!PAYMENTS_ENABLED) {
    return "Free";
  }
  if (requestedTier === "Standard" || requestedTier === "Ultra") {
    return requestedTier;
  }
  return "Free";
}

/**
 * Returns YYYY-MM-DD for the current date in India Standard Time (Asia/Kolkata, UTC+05:30).
 */
export function getIstDateKey(nowMs: number = Date.now()): string {
  const istDate = new Date(nowMs + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the exact UTC timestamp (ms) of the next midnight in IST (00:00:00 IST).
 */
export function getNextIstMidnightMs(nowMs: number = Date.now()): number {
  const istNow = new Date(nowMs + IST_OFFSET_MS);
  const nextIstMidnightUtcMs =
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate() + 1,
      0,
      0,
      0,
      0
    ) - IST_OFFSET_MS;
  return nextIstMidnightUtcMs;
}

/**
 * Formats remaining seconds into a crisp human-readable duration (e.g. "47m 12s" or "60m").
 */
export function formatWatchTimeRemaining(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

/**
 * Formats time until midnight IST reset (e.g. "5h 42m").
 */
export function formatTimeUntilReset(resetsAtIso: string, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, new Date(resetsAtIso).getTime() - nowMs);
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
