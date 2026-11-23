import { Song, TrackLicense } from "./music";

export interface DiscoveredTrack extends Song {
  firstDiscoveredAt: string; // ISO 8601
  lastVerifiedAt: string;    // ISO 8601
  isEmbeddable: boolean;
  isActive: boolean;
  region?: string;           // e.g. "IN", "US", "GLOBAL"
  discoveryMethod: "chart" | "search_recent" | "curated_feed";
}

export interface DiscoverySyncLog {
  id: string;
  triggeredBy: "CRON" | "MANUAL_ADMIN" | "SYSTEM_INIT";
  startedAt: string;
  finishedAt: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "QUOTA_EXCEEDED" | "SKIPPED";
  discoveredCount: number;
  duplicateCount: number;
  rejectedCount: number;
  regionsScanned: string[];
  languagesScanned: string[];
  quotaUsedApprox: number;
  errorMessage?: string;
  notes?: string;
}

export interface DiscoveryRunOptions {
  triggeredBy?: "CRON" | "MANUAL_ADMIN" | "SYSTEM_INIT";
  maxRegions?: number;
  maxLanguages?: number;
  forceRefresh?: boolean;
}

export interface DiscoveryRunSummary {
  success: boolean;
  timestamp: string;
  durationMs: number;
  discoveredCount: number;
  duplicateCount: number;
  rejectedCount: number;
  totalCatalogueSize: number;
  regionsScanned: string[];
  languagesScanned: string[];
  quotaUsedApprox: number;
  isLiveApiUsed: boolean;
  error?: string;
}
