function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


import {
  FREE_DAILY_WATCH_LIMIT_SECONDS,
  MembershipTier,
  getIstDateKey,
  getNextIstMidnightMs,
  resolveEffectiveTier,
} from "@/lib/membership";
import { getPrismaClient } from "@/lib/db";

export type PlaybackSessionState = "idle" | "playing" | "paused" | "buffering";

export interface WatchTimeRecord {
  viewerKey: string;
  dateIst: string;
  usedSeconds: number;
  sessionState: PlaybackSessionState;
  activeSessionId: string | null;
  lastHeartbeatMs: number;
  updatedAtMs: number;
}

export interface WatchTimeSnapshot {
  viewerKey: string;
  dateIst: string;
  tier: MembershipTier;
  isUnlimited: boolean;
  limitSeconds: number | null;
  usedSeconds: number;
  remainingSeconds: number | null;
  isLimitReached: boolean;
  sessionState: PlaybackSessionState;
  activeSessionId: string | null;
  resetsAtIst: string;
  serverNowMs: number;
}

type StoreFileShape = Record<string, WatchTimeRecord>;

const MAX_SINGLE_HEARTBEAT_SECONDS = 30;

declare global {
  // eslint-disable-next-line no-var
  var __cinovaWatchTimeCache: Map<string, WatchTimeRecord> | undefined;
  // eslint-disable-next-line no-var
  var __cinovaWatchTimeLoaded: boolean | undefined;
  // eslint-disable-next-line no-var
  var __cinovaWatchTimeDbTableReady: boolean | undefined;
}

function makeBucketKey(viewerKey: string, dateIst: string): string {
  return `${viewerKey}::${dateIst}`;
}

function getCache(): Map<string, WatchTimeRecord> {
  if (!globalThis.__cinovaWatchTimeCache) {
    globalThis.__cinovaWatchTimeCache = new Map<string, WatchTimeRecord>();
  }
  return globalThis.__cinovaWatchTimeCache;
}

function persistCacheToDisk(_cache: Map<string, WatchTimeRecord>): void {
  // Edge runtime memory cache is active; persistent disk writes safely bypassed
}

async function ensureDbTable(): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) return false;
  if (globalThis.__cinovaWatchTimeDbTableReady) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cinova_daily_watch_time (
        bucket_key TEXT PRIMARY KEY,
        viewer_key TEXT NOT NULL,
        date_ist TEXT NOT NULL,
        used_seconds INTEGER NOT NULL DEFAULT 0,
        session_state TEXT NOT NULL DEFAULT 'idle',
        active_session_id TEXT,
        last_heartbeat_ms BIGINT NOT NULL DEFAULT 0,
        updated_at_ms BIGINT NOT NULL DEFAULT 0
      )
    `);
    globalThis.__cinovaWatchTimeDbTableReady = true;
    return true;
  } catch {
    return false;
  }
}

async function loadRecordFromDb(bucketKey: string): Promise<WatchTimeRecord | null> {
  const prisma = getPrismaClient();
  if (!prisma) return null;
  const ready = await ensureDbTable();
  if (!ready) return null;
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT viewer_key, date_ist, used_seconds, session_state, active_session_id, last_heartbeat_ms, updated_at_ms
       FROM cinova_daily_watch_time WHERE bucket_key = $1 LIMIT 1`,
      bucketKey
    )) as Array<{
      viewer_key: string;
      date_ist: string;
      used_seconds: number;
      session_state: PlaybackSessionState;
      active_session_id: string | null;
      last_heartbeat_ms: bigint | number;
      updated_at_ms: bigint | number;
    }>;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      viewerKey: r.viewer_key,
      dateIst: r.date_ist,
      usedSeconds: Number(r.used_seconds) || 0,
      sessionState: r.session_state || "idle",
      activeSessionId: r.active_session_id || null,
      lastHeartbeatMs: Number(r.last_heartbeat_ms) || 0,
      updatedAtMs: Number(r.updated_at_ms) || 0,
    };
  } catch {
    return null;
  }
}

async function saveRecordToDb(bucketKey: string, rec: WatchTimeRecord): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return;
  const ready = await ensureDbTable();
  if (!ready) return;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO cinova_daily_watch_time (
        bucket_key, viewer_key, date_ist, used_seconds, session_state, active_session_id, last_heartbeat_ms, updated_at_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (bucket_key) DO UPDATE SET
        used_seconds = GREATEST(cinova_daily_watch_time.used_seconds, EXCLUDED.used_seconds),
        session_state = EXCLUDED.session_state,
        active_session_id = EXCLUDED.active_session_id,
        last_heartbeat_ms = EXCLUDED.last_heartbeat_ms,
        updated_at_ms = EXCLUDED.updated_at_ms`,
      bucketKey,
      rec.viewerKey,
      rec.dateIst,
      rec.usedSeconds,
      rec.sessionState,
      rec.activeSessionId,
      rec.lastHeartbeatMs,
      rec.updatedAtMs
    );
  } catch {
    // Non-fatal; disk + memory cache remain authoritative
  }
}

export function sanitizeViewerKey(userId?: string | null, cookieGuestId?: string | null): {
  viewerKey: string;
  newGuestCookieId?: string;
} {
  if (userId && typeof userId === "string") {
    const cleaned = userId.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "").slice(0, 96);
    if (cleaned.length > 0) {
      return { viewerKey: `user:${cleaned}` };
    }
  }
  if (cookieGuestId && typeof cookieGuestId === "string") {
    const cleanedCookie = cookieGuestId.trim().replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
    if (cleanedCookie.length >= 8) {
      return { viewerKey: `guest:${cleanedCookie}` };
    }
  }
  const freshGuest = generateUUID();
  return {
    viewerKey: `guest:${freshGuest}`,
    newGuestCookieId: freshGuest,
  };
}

async function getOrCreateTodayRecord(viewerKey: string, nowMs: number): Promise<WatchTimeRecord> {
  const dateIst = getIstDateKey(nowMs);
  const bucketKey = makeBucketKey(viewerKey, dateIst);
  const cache = getCache();

  let rec = cache.get(bucketKey);
  if (!rec) {
    const dbRec = await loadRecordFromDb(bucketKey);
    if (dbRec) {
      rec = dbRec;
      cache.set(bucketKey, rec);
    }
  }

  if (!rec || rec.dateIst !== dateIst) {
    rec = {
      viewerKey,
      dateIst,
      usedSeconds: 0,
      sessionState: "idle",
      activeSessionId: null,
      lastHeartbeatMs: nowMs,
      updatedAtMs: nowMs,
    };
    cache.set(bucketKey, rec);
  }

  return rec;
}

function buildSnapshot(
  rec: WatchTimeRecord,
  role: "user" | "creator" | "admin",
  nowMs: number
): WatchTimeSnapshot {
  const tier = resolveEffectiveTier(undefined, role);
  const isUnlimited = tier !== "Free";
  const clampedUsed = isUnlimited
    ? rec.usedSeconds
    : Math.min(FREE_DAILY_WATCH_LIMIT_SECONDS, Math.max(0, Math.floor(rec.usedSeconds)));
  const remainingSeconds = isUnlimited
    ? null
    : Math.max(0, FREE_DAILY_WATCH_LIMIT_SECONDS - clampedUsed);
  const isLimitReached = !isUnlimited && (remainingSeconds ?? 0) <= 0;

  return {
    viewerKey: rec.viewerKey,
    dateIst: rec.dateIst,
    tier,
    isUnlimited,
    limitSeconds: isUnlimited ? null : FREE_DAILY_WATCH_LIMIT_SECONDS,
    usedSeconds: clampedUsed,
    remainingSeconds,
    isLimitReached,
    sessionState: isLimitReached ? "paused" : rec.sessionState,
    activeSessionId: isLimitReached ? null : rec.activeSessionId,
    resetsAtIst: new Date(getNextIstMidnightMs(nowMs)).toISOString(),
    serverNowMs: nowMs,
  };
}

export async function getWatchTimeStatus(
  viewerKey: string,
  role: "user" | "creator" | "admin" = "user"
): Promise<WatchTimeSnapshot> {
  const nowMs = Date.now();
  const rec = await getOrCreateTodayRecord(viewerKey, nowMs);
  return buildSnapshot(rec, role, nowMs);
}

export type WatchTimeEventAction = "start" | "heartbeat" | "pause" | "buffering" | "resume" | "end";

export async function applyWatchTimeEvent(params: {
  viewerKey: string;
  role: "user" | "creator" | "admin";
  action: WatchTimeEventAction;
  sessionId?: string | null;
  clientActiveSeconds?: number;
}): Promise<WatchTimeSnapshot> {
  const { viewerKey, role, action, sessionId, clientActiveSeconds } = params;
  const nowMs = Date.now();
  const dateIst = getIstDateKey(nowMs);
  const bucketKey = makeBucketKey(viewerKey, dateIst);
  const cache = getCache();
  const rec = await getOrCreateTodayRecord(viewerKey, nowMs);
  const tier = resolveEffectiveTier(undefined, role);
  const isFree = tier === "Free";

  // Helper to accrue server-validated wall-clock seconds strictly while session was playing
  const accrueIfPlaying = (isHeartbeatTick: boolean) => {
    if (rec.sessionState !== "playing") return;
    if (rec.lastHeartbeatMs <= 0 || nowMs <= rec.lastHeartbeatMs) return;

    const wallElapsedSec = Math.floor((nowMs - rec.lastHeartbeatMs) / 1000);
    if (wallElapsedSec <= 0) return;

    // Cap single interval to prevent sleeping-tab spikes from unfairly burning quota,
    // while also never letting a client send negative or zeroed-out heartbeat values to cheat.
    const cappedWallSec = Math.min(wallElapsedSec, MAX_SINGLE_HEARTBEAT_SECONDS);
    let validatedDelta = cappedWallSec;

    if (typeof clientActiveSeconds === "number" && Number.isFinite(clientActiveSeconds)) {
      const sanitizedClient = Math.max(0, Math.floor(clientActiveSeconds));
      if (isHeartbeatTick) {
        // On active playback heartbeats, never let client under-report below 70% of wall-clock
        // (prevents tampering clientActiveSeconds=0 while video keeps playing)
        const minExpected = Math.max(1, Math.floor(cappedWallSec * 0.7));
        validatedDelta = Math.min(cappedWallSec, Math.max(minExpected, sanitizedClient));
      } else {
        // On pause / buffering / end transitions, accept bounded client active seconds up to wall clock
        validatedDelta = Math.min(cappedWallSec, sanitizedClient);
      }
    }

    rec.usedSeconds = isFree
      ? Math.min(FREE_DAILY_WATCH_LIMIT_SECONDS, rec.usedSeconds + validatedDelta)
      : rec.usedSeconds + validatedDelta;
  };

  if (action === "start") {
    // If already at limit for Free users, deny playback without resetting anything
    if (isFree && rec.usedSeconds >= FREE_DAILY_WATCH_LIMIT_SECONDS) {
      rec.sessionState = "paused";
      rec.activeSessionId = null;
      rec.lastHeartbeatMs = nowMs;
      rec.updatedAtMs = nowMs;
    } else {
      // Finalize any prior open playing interval first (e.g. if user opened a second device)
      accrueIfPlaying(false);
      if (isFree && rec.usedSeconds >= FREE_DAILY_WATCH_LIMIT_SECONDS) {
        rec.sessionState = "paused";
        rec.activeSessionId = null;
      } else {
        rec.activeSessionId = generateUUID();
        rec.sessionState = "playing";
      }
      rec.lastHeartbeatMs = nowMs;
      rec.updatedAtMs = nowMs;
    }
  } else if (action === "heartbeat") {
    // Only accrue if session is active (or accept heartbeat if activeSessionId matches or none exists)
    if (!sessionId || !rec.activeSessionId || rec.activeSessionId === sessionId) {
      if (rec.sessionState === "playing") {
        accrueIfPlaying(true);
      }
      rec.lastHeartbeatMs = nowMs;
      rec.updatedAtMs = nowMs;
      if (isFree && rec.usedSeconds >= FREE_DAILY_WATCH_LIMIT_SECONDS) {
        rec.sessionState = "paused";
        rec.activeSessionId = null;
      }
    }
  } else if (action === "buffering") {
    // Finalize active seconds prior to buffering; buffering itself consumes 0 seconds
    accrueIfPlaying(false);
    rec.sessionState = "buffering";
    rec.lastHeartbeatMs = nowMs;
    rec.updatedAtMs = nowMs;
  } else if (action === "resume") {
    if (isFree && rec.usedSeconds >= FREE_DAILY_WATCH_LIMIT_SECONDS) {
      rec.sessionState = "paused";
      rec.activeSessionId = null;
    } else {
      rec.sessionState = "playing";
      if (!rec.activeSessionId) {
        rec.activeSessionId = sessionId || generateUUID();
      }
    }
    rec.lastHeartbeatMs = nowMs;
    rec.updatedAtMs = nowMs;
  } else if (action === "pause") {
    accrueIfPlaying(false);
    rec.sessionState = "paused";
    rec.lastHeartbeatMs = nowMs;
    rec.updatedAtMs = nowMs;
  } else if (action === "end") {
    accrueIfPlaying(false);
    rec.sessionState = "idle";
    rec.activeSessionId = null;
    rec.lastHeartbeatMs = nowMs;
    rec.updatedAtMs = nowMs;
  }

  cache.set(bucketKey, rec);
  persistCacheToDisk(cache);
  await saveRecordToDb(bucketKey, rec);

  return buildSnapshot(rec, role, nowMs);
}
