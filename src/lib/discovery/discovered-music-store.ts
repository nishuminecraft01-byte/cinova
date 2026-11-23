/**
 * CINOVA Discovered Music Store
 *
 * Persistent repository for automatically discovered music tracks.
 * Supports:
 * - Supabase database persistence (`public.music_discovered_catalogue`)
 * - Resilient file-backed / memory fallback (`src/data/discovered-music.json`)
 * - Strict duplicate prevention by YouTube Video ID
 * - 7-day NEW badge calculation
 * - Concurrency lock for daily scheduled jobs
 * - Preserves users' personal playlists, favorites, and history without modification
 */

import { Song } from "@/types/music";
import { DiscoveredTrack, DiscoverySyncLog } from "@/types/discovery";
import { FULL_WORLDWIDE_CATALOGUE } from "@/lib/api/worldwide-catalogue";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const DISCOVERED_FILE_PATH = path.join(process.cwd(), "src", "data", "discovered-music.json");
const SYNC_LOG_FILE_PATH = path.join(process.cwd(), "src", "data", "music-sync-log.json");

// In-memory cache for ultra-fast response
let inMemoryTracks: DiscoveredTrack[] = [];
let inMemoryLastLog: DiscoverySyncLog | null = null;
let isCacheLoaded = false;
let isLockActive = false;
let lockAcquiredAt = 0;
const LOCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minute lock timeout safety

/**
 * Loads tracks from file storage if exists
 */
function loadFromFileStorage(): void {
  try {
    if (fs.existsSync(DISCOVERED_FILE_PATH)) {
      const content = fs.readFileSync(DISCOVERED_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        inMemoryTracks = parsed;
      }
    }
  } catch (err) {
    console.warn("[DiscoveredMusicStore] Failed to read local discovered-music.json:", err);
  }

  try {
    if (fs.existsSync(SYNC_LOG_FILE_PATH)) {
      const logContent = fs.readFileSync(SYNC_LOG_FILE_PATH, "utf-8");
      inMemoryLastLog = JSON.parse(logContent);
    }
  } catch (_) {}

  isCacheLoaded = true;
}

/**
 * Saves current in-memory tracks to file storage
 */
function persistToFileStorage(): void {
  try {
    const dir = path.dirname(DISCOVERED_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISCOVERED_FILE_PATH, JSON.stringify(inMemoryTracks, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DiscoveredMusicStore] Failed to write discovered-music.json:", err);
  }
}

/**
 * Acquire concurrency lock to prevent overlapping runs
 */
export function acquireSyncLock(): boolean {
  const now = Date.now();
  if (isLockActive && now - lockAcquiredAt < LOCK_TIMEOUT_MS) {
    return false; // Lock already held
  }
  isLockActive = true;
  lockAcquiredAt = now;
  return true;
}

/**
 * Release concurrency lock
 */
export function releaseSyncLock(): void {
  isLockActive = false;
  lockAcquiredAt = 0;
}

/**
 * Check if concurrency lock is currently active
 */
export function isSyncLockActive(): boolean {
  if (!isLockActive) return false;
  if (Date.now() - lockAcquiredAt > LOCK_TIMEOUT_MS) {
    isLockActive = false;
    return false;
  }
  return true;
}

/**
 * Checks if a song is newly discovered (within the last 7 days)
 */
export function isTrackNew(firstDiscoveredAt: string): boolean {
  if (!firstDiscoveredAt) return false;
  const discoveredTime = new Date(firstDiscoveredAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return discoveredTime >= sevenDaysAgo;
}

/**
 * Checks if a song is added today (within the last 24 hours)
 */
export function isTrackAddedToday(firstDiscoveredAt: string): boolean {
  if (!firstDiscoveredAt) return false;
  const discoveredTime = new Date(firstDiscoveredAt).getTime();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return discoveredTime >= oneDayAgo;
}

/**
 * Check if a YouTube video ID already exists in the base catalogue or discovered tracks
 */
export function isDuplicateYouTubeId(youtubeId: string): boolean {
  if (!youtubeId) return true;
  const cleanId = youtubeId.trim();

  // 1. Check built-in worldwide catalog
  const existsInBase = FULL_WORLDWIDE_CATALOGUE.some(
    (t) => t.youtubeId === cleanId || t.id.includes(cleanId)
  );
  if (existsInBase) return true;

  // 2. Check discovered store
  if (!isCacheLoaded) loadFromFileStorage();
  const existsInDiscovered = inMemoryTracks.some(
    (t) => t.youtubeId === cleanId || t.id === `disc-${cleanId}`
  );
  return existsInDiscovered;
}

/**
 * Get all active discovered tracks with optional language/region filter
 */
export async function getDiscoveredTracks(options?: {
  language?: string;
  region?: string;
  isNewOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Song[]> {
  if (!isCacheLoaded) loadFromFileStorage();

  // Attempt Supabase fetch first if available
  try {
    let query = supabase
      .from("music_discovered_catalogue")
      .select("*")
      .eq("is_active", true)
      .eq("is_embeddable", true)
      .order("first_discovered_at", { ascending: false });

    if (options?.language && options.language !== "all") {
      query = query.eq("language", options.language.toLowerCase());
    }
    if (options?.region) {
      query = query.eq("region", options.region.toUpperCase());
    }
    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        youtubeId: row.youtube_id,
        title: row.title,
        artist: row.artist,
        artistId: row.artist_id || `artist-${row.youtube_id}`,
        album: row.album || "Single",
        coverUrl: row.cover_url,
        duration: row.duration,
        durationText: row.duration_text,
        genre: row.genre || "Worldwide Discovery",
        category: row.category || "trending",
        language: row.language,
        nativeTitle: row.native_title,
        aliases: Array.isArray(row.aliases) ? row.aliases : [],
        year: row.year || new Date(row.first_discovered_at).getFullYear(),
        plays: row.plays || 0,
        viewCountText: row.view_count_text,
        trending: Boolean(row.trending),
        isNew: isTrackNew(row.first_discovered_at),
        source: "mainstream",
        playbackType: "youtube_embed",
        license: row.license || {
          provider: "YouTube Music Video (Official Embed)",
          type: "Standard YouTube License",
          canStream: true,
          commercialUse: false,
          requiresAttribution: true,
        },
      }));
    }
  } catch (_) {
    // Graceful fallback to file/in-memory storage
  }

  // File/in-memory fallback
  let list = inMemoryTracks.filter((t) => t.isActive && t.isEmbeddable);

  if (options?.language && options.language !== "all") {
    const lang = options.language.toLowerCase();
    list = list.filter((t) => (t.language || "").toLowerCase() === lang);
  }
  if (options?.region) {
    const reg = options.region.toUpperCase();
    list = list.filter((t) => (t.region || "").toUpperCase() === reg);
  }
  if (options?.isNewOnly) {
    list = list.filter((t) => isTrackNew(t.firstDiscoveredAt));
  }

  const offset = options?.offset || 0;
  const limit = options?.limit || list.length;
  return list.slice(offset, offset + limit).map((t) => ({
    ...t,
    isNew: isTrackNew(t.firstDiscoveredAt),
  }));
}

/**
 * Returns tracks discovered within the past 7 days (New Releases)
 */
export async function getRecentlyDiscovered(limit = 15): Promise<Song[]> {
  const tracks = await getDiscoveredTracks({ isNewOnly: true, limit });
  return tracks;
}

/**
 * Returns tracks discovered today (past 24 hours)
 */
export async function getAddedToday(limit = 10): Promise<Song[]> {
  if (!isCacheLoaded) loadFromFileStorage();
  const list = inMemoryTracks
    .filter((t) => t.isActive && t.isEmbeddable && isTrackAddedToday(t.firstDiscoveredAt))
    .slice(0, limit);
  return list.map((t) => ({ ...t, isNew: true }));
}

/**
 * Batch save discovered tracks with strict duplicate prevention
 */
export async function saveDiscoveredTracksBatch(
  newTracks: DiscoveredTrack[]
): Promise<{ added: number; updated: number; rejected: number }> {
  if (!isCacheLoaded) loadFromFileStorage();

  let added = 0;
  let updated = 0;
  let rejected = 0;

  for (const track of newTracks) {
    if (!track.youtubeId || !track.title || !track.artist) {
      rejected++;
      continue;
    }

    if (!track.isEmbeddable) {
      rejected++;
      continue;
    }

    const cleanId = track.youtubeId.trim();

    // Check if duplicate in base catalog
    const isBaseDuplicate = FULL_WORLDWIDE_CATALOGUE.some(
      (t) => t.youtubeId === cleanId || t.id.includes(cleanId)
    );
    if (isBaseDuplicate) {
      rejected++;
      continue;
    }

    // Check if already in discovered memory
    const existingIndex = inMemoryTracks.findIndex(
      (t) => t.youtubeId === cleanId || t.id === track.id
    );

    if (existingIndex >= 0) {
      // Update last verified timestamp and stats without changing firstDiscoveredAt
      inMemoryTracks[existingIndex] = {
        ...inMemoryTracks[existingIndex],
        lastVerifiedAt: new Date().toISOString(),
        plays: track.plays || inMemoryTracks[existingIndex].plays,
        viewCountText: track.viewCountText || inMemoryTracks[existingIndex].viewCountText,
        isEmbeddable: track.isEmbeddable,
        isActive: track.isActive,
      };
      updated++;
    } else {
      // Add new track
      inMemoryTracks.unshift(track);
      added++;
    }
  }

  // Persist to local file storage
  persistToFileStorage();

  // Also attempt Supabase upsert
  try {
    const rows = newTracks
      .filter((t) => t.isEmbeddable && t.youtubeId)
      .map((t) => ({
        id: t.id,
        youtube_id: t.youtubeId,
        title: t.title,
        artist: t.artist,
        artist_id: t.artistId,
        album: t.album,
        cover_url: t.coverUrl,
        duration: t.duration,
        duration_text: t.durationText,
        genre: t.genre,
        category: t.category,
        language: t.language,
        native_title: t.nativeTitle,
        aliases: t.aliases || [],
        first_discovered_at: t.firstDiscoveredAt,
        last_verified_at: t.lastVerifiedAt,
        is_active: t.isActive,
        is_embeddable: t.isEmbeddable,
        region: t.region,
        plays: t.plays || 0,
        view_count_text: t.viewCountText,
        trending: t.trending,
        license: t.license,
      }));

    if (rows.length > 0) {
      await supabase
        .from("music_discovered_catalogue")
        .upsert(rows, { onConflict: "youtube_id" });
    }
  } catch (_) {
    // Supabase table optional / silent fallback
  }

  return { added, updated, rejected };
}

/**
 * Get the last synchronization log
 */
export async function getLastSyncLog(): Promise<DiscoverySyncLog | null> {
  if (!isCacheLoaded) loadFromFileStorage();
  if (inMemoryLastLog) return inMemoryLastLog;

  try {
    const { data, error } = await supabase
      .from("music_discovery_sync_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        triggeredBy: data.triggered_by,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        status: data.status,
        discoveredCount: data.discovered_count,
        duplicateCount: data.duplicate_count,
        rejectedCount: data.rejected_count,
        regionsScanned: data.regions_scanned || [],
        languagesScanned: data.languages_scanned || [],
        quotaUsedApprox: data.quota_used_approx || 0,
        errorMessage: data.error_message,
      };
    }
  } catch (_) {}

  return null;
}

/**
 * Save sync execution log
 */
export async function saveSyncLog(log: DiscoverySyncLog): Promise<void> {
  inMemoryLastLog = log;
  try {
    const dir = path.dirname(SYNC_LOG_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SYNC_LOG_FILE_PATH, JSON.stringify(log, null, 2), "utf-8");
  } catch (_) {}

  try {
    await supabase.from("music_discovery_sync_logs").insert({
      id: log.id,
      triggered_by: log.triggeredBy,
      started_at: log.startedAt,
      finished_at: log.finishedAt,
      status: log.status,
      discovered_count: log.discoveredCount,
      duplicate_count: log.duplicateCount,
      rejected_count: log.rejectedCount,
      regions_scanned: log.regionsScanned,
      languages_scanned: log.languagesScanned,
      quota_used_approx: log.quotaUsedApprox,
      error_message: log.errorMessage,
    });
  } catch (_) {}
}

/**
 * Return total count of discovered tracks
 */
export function getDiscoveredCount(): number {
  if (!isCacheLoaded) loadFromFileStorage();
  return inMemoryTracks.length;
}
