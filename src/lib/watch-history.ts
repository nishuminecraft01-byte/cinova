import { createSupabaseServerAnonClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { WatchProgress, ContentType } from "@/types/movie";
import { Song } from "@/types/music";
import fs from "fs";
import path from "path";

export interface WatchProgressInput {
  contentId: string;
  title: string;
  contentType?: ContentType;
  posterUrl?: string;
  backdropUrl?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  progressSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}

export interface UserHistoryResponse {
  continueWatching: WatchProgress[];
  movies: WatchProgress[];
  series: WatchProgress[];
  music: Song[];
  totalWatchedSeconds: number;
}

// In-memory/file fallback storage for when Supabase table isn't migrated yet or during offline dev
const FALLBACK_HISTORY_FILE = path.join(process.cwd(), "src", "data", "user-watch-history.json");

interface FallbackStoreRecord extends WatchProgress {
  userId: string;
}

function readFallbackStore(): Record<string, FallbackStoreRecord[]> {
  try {
    if (fs.existsSync(FALLBACK_HISTORY_FILE)) {
      const data = fs.readFileSync(FALLBACK_HISTORY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return {};
}

function writeFallbackStore(data: Record<string, FallbackStoreRecord[]>): void {
  try {
    const dir = path.dirname(FALLBACK_HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

/**
 * Normalizes a database row or fallback record into a clean WatchProgress object.
 */
function normalizeWatchRecord(row: any): WatchProgress {
  const contentId = row.content_id || row.movieId || row.movie_id || "";
  const progressSec = Number(row.progress_seconds ?? row.progressSeconds ?? 0);
  const durationSec = Number(row.duration_seconds ?? row.durationSeconds ?? 0);
  const percentage =
    typeof row.progress_percentage === "number"
      ? row.progress_percentage
      : durationSec > 0
      ? Math.min(100, Math.round((progressSec / durationSec) * 100))
      : 0;

  const isCompleted =
    Boolean(row.completed) || (durationSec > 0 && progressSec / durationSec >= 0.92);

  const season = row.season_number ?? row.seasonNumber ?? row.season ?? undefined;
  const episode = row.episode_number ?? row.episodeNumber ?? row.episode ?? undefined;

  return {
    id: row.id,
    movieId: contentId,
    contentId,
    title: row.title || row.movie?.title || "CINOVA Content",
    contentType: row.content_type || row.contentType || (season || episode ? "series" : "movie"),
    posterUrl: row.poster_url || row.posterUrl || "",
    backdropUrl: row.backdrop_url || row.backdropUrl || "",
    progressSeconds: progressSec,
    durationSeconds: durationSec,
    progressPercentage: percentage,
    completed: isCompleted,
    lastWatched: row.last_watched || row.lastWatched || new Date().toISOString(),
    season,
    episode,
    seasonNumber: season,
    episodeNumber: episode,
    episodeTitle: row.episode_title || row.episodeTitle || "",
  };
}

/**
 * Fetch full watch history for an authenticated user.
 */
export async function getUserWatchHistory(
  userId: string,
  accessToken?: string
): Promise<UserHistoryResponse> {
  if (!userId) {
    return {
      continueWatching: [],
      movies: [],
      series: [],
      music: [],
      totalWatchedSeconds: 0,
    };
  }

  const client =
    (accessToken ? createSupabaseServerAnonClient(accessToken) : null) ||
    createSupabaseServiceClient();

  let records: WatchProgress[] = [];

  if (client) {
    try {
      // 1. Try querying public.user_watch_history
      const { data, error } = await client
        .from("user_watch_history")
        .select("*")
        .eq("user_id", userId)
        .order("last_watched", { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        records = data.map(normalizeWatchRecord);
      } else {
        // 2. Fallback query to public.watch_progress
        const { data: wpData, error: wpErr } = await client
          .from("watch_progress")
          .select("*")
          .eq("user_id", userId)
          .order("last_watched", { ascending: false })
          .limit(100);

        if (!wpErr && Array.isArray(wpData)) {
          records = wpData.map(normalizeWatchRecord);
        }
      }
    } catch {
      // Supabase table not migrated yet, use fallback store
    }
  }

  // If Supabase returned nothing or error, check fallback persistent store
  if (records.length === 0) {
    const store = readFallbackStore();
    const userRecords = store[userId] || [];
    records = userRecords.map(normalizeWatchRecord);
  }

  // Deduplicate records: latest item per content_id + season + episode
  const seenMap = new Map<string, WatchProgress>();
  for (const r of records) {
    const key = `${r.contentId}:${r.seasonNumber ?? 0}:${r.episodeNumber ?? 0}`;
    if (!seenMap.has(key)) {
      seenMap.set(key, r);
    }
  }
  const uniqueRecords = Array.from(seenMap.values());

  // Segregate into categories
  const continueWatching = uniqueRecords.filter(
    (r) => !r.completed && r.progressSeconds > 10 && (r.progressPercentage || 0) < 95
  );

  const movies = uniqueRecords.filter(
    (r) => r.contentType === "movie" || (!r.seasonNumber && !r.episodeNumber)
  );

  const series = uniqueRecords.filter(
    (r) => r.contentType === "series" || r.contentType === "anime" || r.seasonNumber || r.episodeNumber
  );

  const totalWatchedSeconds = uniqueRecords.reduce((acc, r) => acc + (r.progressSeconds || 0), 0);

  // Fetch music history
  const music = await getUserMusicHistory(userId, accessToken);

  return {
    continueWatching,
    movies,
    series,
    music,
    totalWatchedSeconds,
  };
}

/**
 * Record or update watch progress for a movie or episode.
 */
export async function recordWatchProgress(
  userId: string,
  input: WatchProgressInput,
  accessToken?: string
): Promise<WatchProgress> {
  const contentId = input.contentId.trim();
  const progressSec = Math.max(0, Math.floor(input.progressSeconds));
  const durationSec = Math.max(0, Math.floor(input.durationSeconds));
  const percentage = durationSec > 0 ? Math.min(100, Math.round((progressSec / durationSec) * 100)) : 0;
  const isCompleted =
    input.completed ?? (durationSec > 0 && progressSec / durationSec >= 0.92);

  const recordId = `${userId}_${contentId}_${input.seasonNumber ?? 0}_${input.episodeNumber ?? 0}`;
  const record: WatchProgress = {
    id: recordId,
    movieId: contentId,
    contentId,
    title: input.title || "CINOVA Content",
    contentType: input.contentType || (input.seasonNumber ? "series" : "movie"),
    posterUrl: input.posterUrl || "",
    backdropUrl: input.backdropUrl || "",
    seasonNumber: input.seasonNumber,
    episodeNumber: input.episodeNumber,
    season: input.seasonNumber,
    episode: input.episodeNumber,
    episodeTitle: input.episodeTitle || "",
    progressSeconds: progressSec,
    durationSeconds: durationSec,
    progressPercentage: percentage,
    completed: isCompleted,
    lastWatched: new Date().toISOString(),
  };

  const client =
    (accessToken ? createSupabaseServerAnonClient(accessToken) : null) ||
    createSupabaseServiceClient();

  let dbSaved = false;

  if (client) {
    try {
      // 1. Upsert into user_watch_history
      const payload = {
        user_id: userId,
        content_id: contentId,
        content_type: record.contentType,
        title: record.title,
        poster_url: record.posterUrl,
        backdrop_url: record.backdropUrl,
        season_number: input.seasonNumber ?? null,
        episode_number: input.episodeNumber ?? null,
        episode_title: input.episodeTitle ?? null,
        progress_seconds: progressSec,
        duration_seconds: durationSec,
        progress_percentage: percentage,
        completed: isCompleted,
        last_watched: record.lastWatched,
      };

      const { error: historyErr } = await client
        .from("user_watch_history")
        .upsert(payload, {
          onConflict: "user_id,content_id,season_number,episode_number",
        });

      if (!historyErr) {
        dbSaved = true;
      } else {
        // Also try watch_progress table
        await client.from("watch_progress").upsert({
          user_id: userId,
          movie_id: contentId,
          progress_seconds: progressSec,
          duration_seconds: durationSec,
          completed: isCompleted,
          last_watched: record.lastWatched,
        }, {
          onConflict: "user_id,movie_id",
        });
        dbSaved = true;
      }
    } catch {
      // Non-blocking
    }
  }

  // Always update local persistent fallback store
  try {
    const store = readFallbackStore();
    const list = store[userId] || [];
    const key = `${contentId}:${input.seasonNumber ?? 0}:${input.episodeNumber ?? 0}`;
    const filtered = list.filter(
      (item) => `${item.movieId}:${item.seasonNumber ?? 0}:${item.episodeNumber ?? 0}` !== key
    );
    const updatedList: FallbackStoreRecord[] = [{ ...record, userId }, ...filtered].slice(0, 100);
    store[userId] = updatedList;
    writeFallbackStore(store);
  } catch {}

  return record;
}

/**
 * Remove a specific item from user's history.
 */
export async function removeWatchHistoryItem(
  userId: string,
  contentId: string,
  seasonNumber?: number,
  episodeNumber?: number,
  accessToken?: string
): Promise<boolean> {
  const client =
    (accessToken ? createSupabaseServerAnonClient(accessToken) : null) ||
    createSupabaseServiceClient();

  if (client) {
    try {
      let query = client
        .from("user_watch_history")
        .delete()
        .eq("user_id", userId)
        .eq("content_id", contentId);

      if (typeof seasonNumber === "number") {
        query = query.eq("season_number", seasonNumber);
      }
      if (typeof episodeNumber === "number") {
        query = query.eq("episode_number", episodeNumber);
      }
      await query;

      // Also clean from legacy watch_progress
      await client
        .from("watch_progress")
        .delete()
        .eq("user_id", userId)
        .eq("movie_id", contentId);
    } catch {}
  }

  // Update fallback store
  try {
    const store = readFallbackStore();
    if (store[userId]) {
      store[userId] = store[userId].filter((item) => {
        if (item.movieId !== contentId && item.contentId !== contentId) return true;
        if (typeof seasonNumber === "number" && item.seasonNumber !== seasonNumber) return true;
        if (typeof episodeNumber === "number" && item.episodeNumber !== episodeNumber) return true;
        return false;
      });
      writeFallbackStore(store);
    }
  } catch {}

  return true;
}

/**
 * Clear all watch history for an authenticated user.
 */
export async function clearUserWatchHistory(
  userId: string,
  accessToken?: string
): Promise<boolean> {
  const client =
    (accessToken ? createSupabaseServerAnonClient(accessToken) : null) ||
    createSupabaseServiceClient();

  if (client) {
    try {
      await client.from("user_watch_history").delete().eq("user_id", userId);
      await client.from("watch_progress").delete().eq("user_id", userId);
    } catch {}
  }

  try {
    const store = readFallbackStore();
    delete store[userId];
    writeFallbackStore(store);
  } catch {}

  return true;
}

/**
 * Fetch user's separate Recently Played Music history from Supabase.
 */
export async function getUserMusicHistory(
  userId: string,
  accessToken?: string
): Promise<Song[]> {
  if (!userId) return [];

  const client =
    (accessToken ? createSupabaseServerAnonClient(accessToken) : null) ||
    createSupabaseServiceClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("music_recently_played")
        .select("song_data")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(20);

      if (!error && Array.isArray(data)) {
        return data
          .map((r: any) => r.song_data)
          .filter((s: any) => s && s.id && s.title);
      }
    } catch {}
  }

  return [];
}
