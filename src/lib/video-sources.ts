import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Movie, StreamingServer } from "@/types/movie";

function getDatabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type VideoProtocol = "hls" | "dash" | "mp4" | "local_file";
export type VideoProvider =
  | "cinova"
  | "cloudflare"
  | "bunny"
  | "mux"
  | "direct_cdn"
  | "local"
  | "custom";

export type PlaybackAvailabilityStatus =
  | "Available"
  | "Source Missing"
  | "Processing"
  | "Temporarily Unavailable";

export interface VideoTrack {
  id: string;
  sourceId: string;
  trackType: "audio" | "subtitle";
  languageCode: string; // e.g. "en", "hi", "ja", "ko", "es", "fr"
  label: string; // e.g. "English [CC]", "Hindi Original", etc.
  trackUrl: string;
  isDefault?: boolean;
}

export interface VideoSource {
  id: string;
  movieId: string; // Canonical movie ID or TMDB ID (e.g. "dune", "tmdb-693134", "693134")
  title?: string;
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
  protocol: VideoProtocol;
  provider: VideoProvider;
  streamUrl: string;
  quality: "4K UHD" | "1080p FHD" | "720p HD" | "480p SD";
  badge?: string;
  status: PlaybackAvailabilityStatus;
  isPrimary: boolean;
  drmProtected?: boolean;
  tracks?: VideoTrack[];
  createdAt?: string;
  updatedAt?: string;
}

const KNOWN_TMDB_SLUG_MAP: Record<string, string> = {
  "night-of-the-living-dead": "10331",
  "charade": "4808",
  "his-girl-friday": "3085",
  "carnival-of-souls": "16093",
  "tears-of-steel": "115214",
  "big-buck-bunny": "10378",
  "the-general": "961",
  "metropolis": "19",
  "sintel": "45745",
  "elephants-dream": "14881",
  "john-wick-chapter-4": "603692",
  "oppenheimer": "872585",
  "dune": "438631",
  "interstellar": "157336",
  "the-batman": "414906",
  "fight-club": "550",
  "inception": "27205",
  "avatar": "19995",
  "the-dark-knight": "155",
  "breaking-bad": "1396",
  "stranger-things": "66732",
  "game-of-thrones": "1399",
  "the-last-of-us": "100088",
  "money-heist": "71446",
  "wednesday": "119051",
  "loki": "84958",
  "peaky-blinders": "60574",
  "tmdb-1003596": "1003596",
  "avengers-doomsday": "1003596",
  "tmdb-533535": "533535",
  "deadpool-wolverine": "533535",
  "tmdb-693134": "693134",
  "dune-part-two": "693134",
  "tmdb-569094": "569094",
  "spider-man-across-the-spider-verse": "569094",
  "tmdb-76600": "76600",
  "avatar-the-way-of-water": "76600",
  "tmdb-361743": "361743",
  "top-gun-maverick": "361743",
  "tmdb-558449": "558449",
  "gladiator-ii": "558449",
  "tmdb-299534": "299534",
  "avengers-endgame": "299534",
  "tmdb-1726": "1726",
  "iron-man": "1726",
  "tmdb-872906": "872906",
  "jawan": "872906",
  "tmdb-864692": "864692",
  "pathaan": "864692",
  "tmdb-579974": "579974",
  "rrr": "579974",
  "tmdb-587412": "587412",
  "k-g-f-chapter-2": "587412",
  "tmdb-801688": "801688",
  "kalki-2898-ad": "801688",
  "tmdb-781732": "781732",
  "animal": "781732",
  "tmdb-1163258": "1163258",
  "12th-fail": "1163258",
  "tmdb-1112426": "1112426",
  "stree-2": "1112426",
  "tmdb-360814": "360814",
  "dangal": "360814",
  "tmdb-656908": "656908",
  "ramayana-rise-of-a-legend": "656908",
  "tmdb-84092": "84092",
  "ramayana-the-legend-of-prince-rama": "84092",
  "tmdb-85937": "85937",
  "demon-slayer-kimetsu-no-yaiba": "85937",
  "demon-slayer": "85937",
  "tmdb-635302": "635302",
  "demon-slayer-mugen-train": "635302",
  "tmdb-127532": "127532",
  "solo-leveling": "127532",
  "tmdb-95479": "95479",
  "jujutsu-kaisen": "95479",
  "tmdb-810693": "810693",
  "jujutsu-kaisen-0": "810693",
  "tmdb-1429": "1429",
  "attack-on-titan": "1429",
  "tmdb-114410": "114410",
  "chainsaw-man": "114410",
  "tmdb-13916": "13916",
  "death-note": "13916",
  "tmdb-372058": "372058",
  "your-name": "372058",
  "tmdb-129": "129",
  "spirited-away": "129",
  "tmdb-94997": "94997",
  "house-of-the-dragon": "94997",
  "tmdb-93405": "93405",
  "squid-game": "93405",
  "tmdb-76479": "76479",
  "the-boys": "76479",
  "tmdb-84105": "84105",
  "mirzapur": "84105",
  "tmdb-79352": "79352",
  "sacred-games": "79352",
  "tmdb-101352": "101352",
  "panchayat": "101352",
  "tmdb-84958": "84958",
  "tmdb-550": "550",
  "tmdb-872585": "872585",
  "tmdb-157336": "157336",
  "tmdb-155": "155",
  "tmdb-27205": "27205",
  "tmdb-414906": "414906",
  "tmdb-603692": "603692",
  "tmdb-66732": "66732",
  "tmdb-1396": "1396",
  "tmdb-1399": "1399",
  "tmdb-119051": "119051",
  "tmdb-100088": "100088",
  "tmdb-71446": "71446",
  "tmdb-60574": "60574"
};

const KNOWN_SERIES_TMDB_IDS = new Set([
  "1396",
  "66732",
  "1399",
  "100088",
  "71446",
  "119051",
  "84958",
  "60574",
  "85937",
  "127532",
  "95479",
  "1429",
  "114410",
  "13916",
  "94997",
  "93405",
  "76479",
  "84105",
  "79352",
  "101352",
]);

/**
 * Normalizes movie IDs to match across local keys and TMDB IDs.
 * e.g. "tmdb-693134" -> ["tmdb-693134", "693134", "dune-part-two"]
 */
export function normalizeMovieKeys(movieId: string): string[] {
  if (!movieId) return [];
  const clean = String(movieId).trim();
  const numericOnly = clean.replace(/^tmdb-(?:movie-|tv-|series-)?/, "");
  const keys = new Set<string>([clean, clean.toLowerCase()]);
  if (numericOnly) {
    keys.add(numericOnly);
    keys.add(`tmdb-${numericOnly}`);
    keys.add(`tmdb-movie-${numericOnly}`);
    keys.add(`tmdb-tv-${numericOnly}`);
  }
  const mapped =
    KNOWN_TMDB_SLUG_MAP[clean.toLowerCase()] ||
    (numericOnly ? KNOWN_TMDB_SLUG_MAP[numericOnly] : undefined);
  if (mapped) {
    keys.add(mapped);
    keys.add(mapped.toLowerCase());
    keys.add(`tmdb-${mapped}`);
    keys.add(`tmdb-movie-${mapped}`);
    keys.add(`tmdb-tv-${mapped}`);
  }
  return Array.from(keys);
}

export const VERIFIED_OPEN_SOURCE_TITLES = new Set([
  "night-of-the-living-dead",
  "charade",
  "his-girl-friday",
  "carnival-of-souls",
  "tears-of-steel",
  "big-buck-bunny",
  "sintel",
  "elephants-dream",
  "the-general",
  "metropolis",
  "10331",
  "4808",
  "3085",
  "16093",
  "115214",
  "10378",
]);

export function isGenericSampleClip(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("commondatastorage.googleapis.com/gtv-videos-bucket/sample/") ||
    url.includes("test-streams.mux.dev") ||
    url.includes("bitdash-a.akamaihd.net")
  );
}

/**
 * Baseline verified open-license production seed sources.
 * Includes authorized HLS adaptive multi-bitrate streams and progressive HD sources.
 */
export const SEED_VIDEO_SOURCES: VideoSource[] = [
  {
    id: "src-notld-1080p",
    movieId: "night-of-the-living-dead",
    title: "Night of the Living Dead (1968 Original Master)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://dn710704.ca.archive.org/0/items/night_of_the_living_dead_dvd/Night.mp4",
    quality: "1080p FHD",
    badge: "HD Master",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-notld-sub-en",
        sourceId: "src-notld-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-charade-720p",
    movieId: "charade",
    title: "Charade (1963 Cary Grant & Audrey Hepburn)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://ia800800.us.archive.org/19/items/charade-1963-cary-grant-audrey-hepburn-walter-matthau-1080p-reup/Charade%20%281963%29%20%5B720p%20Blu-Ray%20Rip%5D.mp4",
    quality: "720p HD",
    badge: "720p BluRay",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-charade-sub-en",
        sourceId: "src-charade-720p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-his-girl-friday-1080p",
    movieId: "his-girl-friday",
    title: "His Girl Friday (1940 Cary Grant & Rosalind Russell)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://dn721306.ca.archive.org/0/items/his_girl_friday/his_girl_friday.mp4",
    quality: "1080p FHD",
    badge: "HD Remaster",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-hgf-sub-en",
        sourceId: "src-his-girl-friday-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-carnival-souls-1080p",
    movieId: "carnival-of-souls",
    title: "Carnival of Souls (1962 Cult Master)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://dn711406.ca.archive.org/0/items/carnival_of_souls/carnival_of_souls.mp4",
    quality: "1080p FHD",
    badge: "HD Master",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-carnival-sub-en",
        sourceId: "src-carnival-souls-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-tears-of-steel-hls",
    movieId: "tears-of-steel",
    title: "Tears of Steel (Unified Adaptive HLS)",
    protocol: "hls",
    provider: "cinova",
    streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    quality: "1080p FHD",
    badge: "Adaptive HLS",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-tos-sub-en",
        sourceId: "src-tears-of-steel-hls",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-mux-demo-hls",
    movieId: "big-buck-bunny",
    title: "Big Buck Bunny (Adaptive HLS 1080p)",
    protocol: "hls",
    provider: "mux",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    quality: "1080p FHD",
    badge: "1080p HLS",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-bbb-sub-en",
        sourceId: "src-mux-demo-hls",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-the-general-1080p",
    movieId: "the-general",
    title: "The General (1926 Buster Keaton Silent Masterpiece)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://ia800300.us.archive.org/34/items/TheGeneral1926_201804/The%20General%20%281926%29.mp4",
    quality: "1080p FHD",
    badge: "1080p Master",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-general-sub-en",
        sourceId: "src-the-general-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English Cards",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-metropolis-1080p",
    movieId: "metropolis",
    title: "Metropolis (1927 Fritz Lang Restored Edition)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://ia800701.us.archive.org/24/items/metropolis-1927-restored-edition/Metropolis%20%281927%29%20%5B1080p%5D.mp4",
    quality: "1080p FHD",
    badge: "Restored HD",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-metropolis-sub-en",
        sourceId: "src-metropolis-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-sintel-hls",
    movieId: "sintel",
    title: "Sintel (Adaptive Multi-Bitrate HLS Master)",
    protocol: "hls",
    provider: "cinova",
    streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    quality: "4K UHD",
    badge: "4K HLS",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-sintel-sub-en",
        sourceId: "src-sintel-hls",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "src-elephants-dream-1080p",
    movieId: "elephants-dream",
    title: "Elephants Dream (Blender Open Foundation)",
    protocol: "mp4",
    provider: "cinova",
    streamUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
    quality: "1080p FHD",
    badge: "1080p Open",
    status: "Available",
    isPrimary: true,
    tracks: [
      {
        id: "tr-ed-sub-en",
        sourceId: "src-elephants-dream-1080p",
        trackType: "subtitle",
        languageCode: "en",
        label: "English [CC]",
        trackUrl: "",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
];

// In-memory runtime cache for server operations
let memorySourceRegistry = new Map<string, VideoSource>();
SEED_VIDEO_SOURCES.forEach((s) => memorySourceRegistry.set(s.id, s));

/**
 * Retrieves all video sources (merges database records with baseline seeds).
 */
export async function getAllVideoSources(): Promise<VideoSource[]> {
  const client = getDatabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("video_sources")
        .select(`
          id,
          movie_id,
          provider,
          protocol,
          stream_url,
          quality,
          badge,
          status,
          is_primary,
          drm_protected,
          created_at,
          updated_at
        `);

      if (!error && Array.isArray(data)) {
        const dbSources: VideoSource[] = data.map((row: any) => ({
          id: row.id,
          movieId: row.movie_id,
          mediaType: (row.media_type as "movie" | "tv") || "movie",
          season: typeof row.season === "number" ? row.season : undefined,
          episode: typeof row.episode === "number" ? row.episode : undefined,
          provider: row.provider as VideoProvider,
          protocol: row.protocol as VideoProtocol,
          streamUrl: row.stream_url,
          quality: row.quality || "1080p FHD",
          badge: row.badge || "HD",
          status: row.status as PlaybackAvailabilityStatus,
          isPrimary: Boolean(row.is_primary),
          drmProtected: Boolean(row.drm_protected),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // Merge DB sources with seed registry
        dbSources.forEach((s) => memorySourceRegistry.set(s.id, s));
      }
    } catch {
      // Graceful fallback to memory registry
    }
  }

  return Array.from(memorySourceRegistry.values());
}

/**
 * Retrieves all active video sources matching a specific movie ID or TMDB ID.
 * Optionally filters by season and episode for TV Series.
 */
export async function getVideoSourcesForMovie(
  movieId: string,
  options?: { season?: number; episode?: number }
): Promise<VideoSource[]> {
  if (!movieId) return [];
  const keys = normalizeMovieKeys(movieId);
  const allSources = await getAllVideoSources();

  return allSources.filter((s) => {
    const sKeys = normalizeMovieKeys(s.movieId);
    const matchesKey = keys.some((k) => sKeys.includes(k));
    if (!matchesKey) return false;

    if (options?.season !== undefined && s.season !== undefined) {
      if (s.season !== options.season) return false;
    }
    if (options?.episode !== undefined && s.episode !== undefined) {
      if (s.episode !== options.episode) return false;
    }
    return true;
  });
}

/**
 * Resolves the primary available video source for a movie or episode.
 */
export async function getPrimaryVideoSource(
  movieId: string,
  options?: { season?: number; episode?: number }
): Promise<VideoSource | null> {
  const sources = await getVideoSourcesForMovie(movieId, options);
  const activeSources = sources.filter((s) => s.status === "Available");

  if (activeSources.length === 0) return null;
  const primary = activeSources.find((s) => s.isPrimary);
  return primary || activeSources[0] || null;
}

export function resolveTmdbId(movieId?: string | null, movie?: Movie | null): string | null {
  if (movie?.tmdbId && /^\d+$/.test(String(movie.tmdbId).trim())) {
    return String(movie.tmdbId).trim();
  }
  const clean = String(movieId || "").trim();
  if (!clean) return null;
  if (/^\d+$/.test(clean)) {
    return clean;
  }
  const tmdbMatch = clean.match(/^tmdb-(?:movie-|tv-|series-)?(\d+)$/i);
  if (tmdbMatch) {
    return tmdbMatch[1];
  }
  const anyDigitsMatch = clean.match(/[-_](\d{2,})$/);
  if (anyDigitsMatch && anyDigitsMatch[1]) {
    return anyDigitsMatch[1];
  }
  const cleanLower = clean.toLowerCase();
  const strippedPrefix = cleanLower.replace(/^tmdb-(?:movie-|tv-|series-)?/i, "");
  const normalizedSlug = cleanLower.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const mapped =
    KNOWN_TMDB_SLUG_MAP[cleanLower] ||
    KNOWN_TMDB_SLUG_MAP[strippedPrefix] ||
    KNOWN_TMDB_SLUG_MAP[normalizedSlug];

  if (mapped && /^\d+$/.test(mapped)) {
    return mapped;
  }
  return null;
}

export function isTvSeries(movieId?: string | null, movie?: Movie | null): boolean {
  if (movie?.type === "series") return true;
  const clean = String(movieId || "").toLowerCase();
  if (
    clean.includes("-tv-") ||
    clean.includes("-series-") ||
    clean.startsWith("tv-") ||
    clean.startsWith("series-")
  ) {
    return true;
  }
  const tmdbId = resolveTmdbId(movieId, movie);
  if (tmdbId && KNOWN_SERIES_TMDB_IDS.has(tmdbId)) {
    return true;
  }
  return false;
}

/**
 * Queries real-time playback availability status for a title.
 */
export async function getPlaybackAvailability(
  movieId: string,
  options?: { season?: number; episode?: number }
): Promise<{
  status: PlaybackAvailabilityStatus;
  isPlayable: boolean;
  sourceCount: number;
  primarySource: VideoSource | null;
}> {
  const sources = await getVideoSourcesForMovie(movieId, options);
  const activeSources = sources.filter((s) => s.status === "Available");

  if (activeSources.length > 0) {
    const primary = activeSources.find((s) => s.isPrimary) || activeSources[0];
    return {
      status: "Available",
      isPlayable: true,
      sourceCount: activeSources.length,
      primarySource: primary,
    };
  }

  // Worldwide TMDB multi-server streaming routes
  const tmdbId = resolveTmdbId(movieId);
  if (tmdbId) {
    return {
      status: "Available",
      isPlayable: true,
      sourceCount: 7,
      primarySource: null,
    };
  }

  const processingSource = sources.find((s) => s.status === "Processing");
  if (processingSource) {
    return {
      status: "Processing",
      isPlayable: false,
      sourceCount: sources.length,
      primarySource: null,
    };
  }

  const unavailableSource = sources.find((s) => s.status === "Temporarily Unavailable");
  if (unavailableSource) {
    return {
      status: "Temporarily Unavailable",
      isPlayable: false,
      sourceCount: sources.length,
      primarySource: null,
    };
  }

  return {
    status: "Source Missing",
    isPlayable: false,
    sourceCount: 0,
    primarySource: null,
  };
}

/**
 * Synchronous client-side helper to determine availability status for fast UI rendering.
 */
export function getSyncAvailability(
  movieId?: string | null,
  movie?: Movie | null
): PlaybackAvailabilityStatus {
  if (!movieId && !movie) return "Source Missing";
  const targetId = movieId || movie?.id || "";
  const keys = normalizeMovieKeys(targetId);

  // Check memory source registry
  for (const s of Array.from(memorySourceRegistry.values())) {
    if (s.status === "Available" && keys.some((k) => normalizeMovieKeys(s.movieId).includes(k))) {
      return "Available";
    }
  }

  // Check movie object's direct videoUrl (excluding generic sample clips unless legitimately that open-source film)
  if (movie?.videoUrl && typeof movie.videoUrl === "string" && movie.videoUrl.trim().length > 0) {
    const url = movie.videoUrl.trim();
    if (isGenericSampleClip(url)) {
      const isActualOpenSource = keys.some((k) =>
        VERIFIED_OPEN_SOURCE_TITLES.has(k.toLowerCase())
      );
      if (isActualOpenSource) {
        return "Available";
      }
      return "Source Missing";
    }
    return "Available";
  }

  // TMDB titles have multi-server streaming cluster available
  if (resolveTmdbId(targetId, movie)) {
    return "Available";
  }

  return "Source Missing";
}

/**
 * Upserts a video source into the registry (Supabase DB + runtime memory).
 */
export async function upsertVideoSource(
  source: Omit<VideoSource, "id"> & { id?: string }
): Promise<VideoSource> {
  const client = getDatabaseClient();
  const id = source.id || `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const formattedSource: VideoSource = {
    ...source,
    id,
    movieId: source.movieId.trim(),
    streamUrl: source.streamUrl.trim(),
    mediaType: source.mediaType || "movie",
    season: source.season,
    episode: source.episode,
    createdAt: source.createdAt || now,
    updatedAt: now,
  };

  // Update memory registry immediately
  memorySourceRegistry.set(id, formattedSource);

  // Persist to Supabase if client is configured
  if (client) {
    try {
      await client
        .from("video_sources")
        .upsert(
          {
            id: formattedSource.id,
            movie_id: formattedSource.movieId,
            media_type: formattedSource.mediaType,
            season: formattedSource.season,
            episode: formattedSource.episode,
            provider: formattedSource.provider,
            protocol: formattedSource.protocol,
            stream_url: formattedSource.streamUrl,
            quality: formattedSource.quality,
            badge: formattedSource.badge,
            status: formattedSource.status,
            is_primary: formattedSource.isPrimary,
            drm_protected: formattedSource.drmProtected,
            updated_at: now,
          },
          { onConflict: "id" }
        );
    } catch (err: any) {
      console.warn(`[CINOVA Video Sources] Could not upsert to Supabase:`, err?.message);
    }
  }

  return formattedSource;
}

/**
 * Removes a video source from registry.
 */
export async function deleteVideoSource(sourceId: string): Promise<boolean> {
  memorySourceRegistry.delete(sourceId);
  const client = getDatabaseClient();

  if (client) {
    try {
      await client.from("video_sources").delete().eq("id", sourceId);
    } catch {
      // Non-blocking
    }
  }

  return true;
}

/**
 * Converts a VideoSource into a StreamingServer descriptor for playback authorization.
 */
export function convertSourceToStreamingServer(source: VideoSource): StreamingServer {
  return {
    id: source.id,
    name:
      source.provider === "cloudflare"
        ? "Cloudflare Stream (Fast)"
        : source.provider === "bunny"
          ? "Bunny Stream (Edge CDN)"
          : source.provider === "mux"
            ? "Mux Video (Adaptive)"
            : source.protocol === "hls"
              ? "CINOVA Ultra HLS"
              : "CINOVA Direct Master",
    provider: source.provider,
    badge: source.badge || (source.protocol === "hls" ? "HLS" : "HD"),
    quality: source.quality,
    type: source.protocol === "hls" || source.protocol === "mp4" ? "direct" : "direct",
    url: source.streamUrl,
  };
}
