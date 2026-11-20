/**
 * TMDB API Client for CINOVA Global Entertainment Discovery Platform (Server-Side Only)
 * Official TMDB v3 REST API integration supporting Bearer Read Access Token
 * (`TMDB_API_READ_ACCESS_TOKEN` / `TMDB_READ_ACCESS_TOKEN`) and v3 `TMDB_API_KEY`.
 * Never import this module in client components.
 *
 * Uses Node.js `https` module as the HTTP transport instead of the global `fetch()`
 * (undici) because undici consistently ECONNRESET on TMDB's CDN when
 * `append_to_response` is used, while Node `https.get` succeeds reliably.
 */

import { SAMPLE_MOVIES } from "@/data/movies";
import { getSyncAvailability } from "@/lib/video-sources";
import {
  CountryWatchProviders,
  SUPPORTED_WATCH_COUNTRIES,
  TMDB_GENRE_MAP,
  WatchProviderItem,
  WorldwideCatalogItem,
  WorldwideDetailData,
  WorldwideMediaType,
  WorldwideTrailerInfo,
  getCollectionPreset,
  getLanguageDisplayName,
  mapGenreIdForMediaType,
} from "@/lib/tmdb-worldwide";



export class TMDBConfigError extends Error {
  public readonly code = "TMDB_NOT_CONFIGURED";
  constructor(message = "TMDB credentials are not configured in .env.local.") {
    super(message);
    this.name = "TMDBConfigError";
  }
}

export class TMDBNotFoundError extends Error {
  public readonly code = "TMDB_NOT_FOUND";
  constructor(message = "The requested title was not found on TMDB.") {
    super(message);
    this.name = "TMDBNotFoundError";
  }
}

export interface TMDBRawWatchProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface TMDBRawWatchProviderCountry {
  link?: string;
  flatrate?: TMDBRawWatchProviderItem[];
  rent?: TMDBRawWatchProviderItem[];
  buy?: TMDBRawWatchProviderItem[];
  ads?: TMDBRawWatchProviderItem[];
  free?: TMDBRawWatchProviderItem[];
}

export interface TMDBVideoItem {
  id?: string;
  iso_639_1?: string;
  iso_3166_1?: string;
  key: string;
  name?: string;
  site: string;
  size?: number;
  type: string;
  official?: boolean;
  published_at?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  tagline?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime?: number;
  status?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genres: Array<{ id: number; name: string }>;
  genre_ids?: number[];
  original_language: string;
  spoken_languages?: Array<{ iso_639_1: string; english_name: string; name: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string; type: number }>;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
  videos?: {
    results: TMDBVideoItem[];
  };
  "watch/providers"?: {
    results?: Record<string, TMDBRawWatchProviderCountry>;
  };
  similar?: { results: TMDBRawListItem[] };
  recommendations?: { results: TMDBRawListItem[] };
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  tagline?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genres: Array<{ id: number; name: string }>;
  genre_ids?: number[];
  original_language: string;
  spoken_languages?: Array<{ iso_639_1: string; english_name: string; name: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  origin_country?: string[];
  status: string;
  created_by?: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
  seasons: Array<{
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string;
    episode_count: number;
  }>;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path?: string | null;
    }>;
  };
  videos?: {
    results: TMDBVideoItem[];
  };
  "watch/providers"?: {
    results?: Record<string, TMDBRawWatchProviderCountry>;
  };
  similar?: { results: TMDBRawListItem[] };
  recommendations?: { results: TMDBRawListItem[] };
}

interface TMDBRawListItem {
  id: number;
  media_type?: string;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  genre_ids?: number[];
  origin_country?: string[];
  adult?: boolean;
}

interface TMDBPaginatedResponse<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

export interface WorldwideDiscoverParams {
  collection?: string;
  mediaType?: WorldwideMediaType;
  genre?: string;
  language?: string;
  year?: string;
  country?: string;
  minRating?: string;
  sortBy?: string;
  page?: number;
}

export interface WorldwideSearchParams {
  query: string;
  mediaType?: "all" | WorldwideMediaType;
  page?: number;
  year?: string;
  language?: string;
  genre?: string;
  country?: string;
  minRating?: string;
  sortBy?: string;
  /** When true (autocomplete suggestions), exclude adult/explicit titles; when false (explicit user search), return searched matches. */
  filterAdultSuggestions?: boolean;
}

export interface WorldwidePagedResult {
  items: WorldwideCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function cleanSecret(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || trimmed.includes("placeholder") || trimmed.includes("your_")) return "";
  return trimmed;
}

/**
 * Reads TMDB credentials dynamically from process.env (server-only).
 * Prefers Bearer Read Access Token (`TMDB_API_READ_ACCESS_TOKEN` or `TMDB_READ_ACCESS_TOKEN`),
 * falling back to v3 `TMDB_API_KEY`. Never uses a hardcoded fallback key.
 */
function resolveTmdbCredentials(): { bearerToken: string | null; apiKey: string | null } {
  const bearerToken =
    cleanSecret(process.env.TMDB_API_READ_ACCESS_TOKEN) ||
    cleanSecret(process.env.TMDB_READ_ACCESS_TOKEN) ||
    null;
  const apiKey = cleanSecret(process.env.TMDB_API_KEY) || null;
  return { bearerToken, apiKey };
}

export function isTmdbConfigured(): boolean {
  const { bearerToken, apiKey } = resolveTmdbCredentials();
  return Boolean(bearerToken || apiKey);
}

// Fast lookup of curated CINOVA catalog records by numeric TMDB ID + media type
const CURATED_BY_TMDB_KEY = new Map<string, (typeof SAMPLE_MOVIES)[number]>();
for (const m of SAMPLE_MOVIES) {
  if (m.tmdbId && /^\d+$/.test(m.tmdbId.trim())) {
    const mediaType: WorldwideMediaType = m.type === "series" ? "tv" : "movie";
    CURATED_BY_TMDB_KEY.set(`${mediaType}:${m.tmdbId.trim()}`, m);
  }
}

export function buildTmdbImageUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500"
): string {
  if (!path || !path.startsWith("/")) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// TMDB keyword IDs for softcore, erotic, pornographic, pink film, hentai, and adult-only titles.
// Excluded from all discovery, homepage rails, randomized suggestions, and recommendations.
const TMDB_ADULT_DISCOVERY_EXCLUDE_KEYWORDS =
  "155477|190370|159551|293198|256183|33998|296608|3405|158718|230416|159550|207268";

const ADULT_EXPLICIT_TEXT_REGEX =
  /\b(porn|porno|pornography|pornographic|xxx|erotic|erotica|softcore|hardcore|hentai|ecchi|ashleel|kamasutra|kama\s*sutra|sex\s*tape|sex\s*video|sex\s*worker|sex\s*comedy|sex\s*life|sex\s*addict|sex\s*education\s*film|sexual\s*encounter|sexual\s*desire|sexual\s*awakening|sexual\s*obsession|explicit\s*sex|adult\s*film|adult\s*movie|adult\s*video|strip\s*club|stripper|strippers|brothel|prostitut\w*|escort\s*service|swinger\w*|orgy|orgies|fetish|bdsm|playboy|penthouse|onlyfans|camgirl|nudist|nudity|full\s*frontal|milf|stepmom|stepmother|stepsister|incest|voyeur\w*|cuckold|threesome|foursome|seductress|pink\s*film|gravure|jav|nsfw|lustful|steamy\s*affair|unfaithful\s*wife|call\s*girl|gigolo|nymphomaniac)\b/i;

const ADULT_EXPLICIT_TITLE_REGEX =
  /\b(sex|sexy|nude|naked|lust|seduction|seduce|horny|slut|whore|hooker|pussy|boobs|titty|tits|cock|dick|fuck\w*|brazzers|xvideos|pornhub|vivamax|ullu|altbalaji)\b/i;

function isAdultOrExplicitSuggestion(raw: TMDBRawListItem): boolean {
  if (raw.adult) return true;
  const titleText = [
    raw.title,
    raw.original_title,
    raw.name,
    raw.original_name,
  ]
    .filter(Boolean)
    .join(" ");

  if (ADULT_EXPLICIT_TITLE_REGEX.test(titleText) || ADULT_EXPLICIT_TEXT_REGEX.test(titleText)) {
    return true;
  }

  const overviewText = raw.overview || "";
  if (overviewText && ADULT_EXPLICIT_TEXT_REGEX.test(overviewText)) {
    return true;
  }

  return false;
}

function normalizeRawListItem(
  raw: TMDBRawListItem,
  fallbackMediaType: WorldwideMediaType,
  options: { filterAdultSuggestions?: boolean } = {}
): WorldwideCatalogItem | null {
  const { filterAdultSuggestions = true } = options;
  if (!raw || !raw.id) return null;
  if (raw.media_type === "person") return null;

  if (filterAdultSuggestions) {
    if (isAdultOrExplicitSuggestion(raw)) return null;
  } else if (raw.adult) {
    return null;
  }

  const mediaType: WorldwideMediaType =
    raw.media_type === "tv" || raw.media_type === "movie"
      ? raw.media_type
      : fallbackMediaType;

  const title = (mediaType === "tv" ? raw.name : raw.title) || raw.title || raw.name || "";
  if (!title.trim()) return null;

  const originalTitle =
    (mediaType === "tv" ? raw.original_name : raw.original_title) || title;
  const releaseDate =
    (mediaType === "tv" ? raw.first_air_date : raw.release_date) || "";
  const parsedYear = releaseDate.length >= 4 ? parseInt(releaseDate.slice(0, 4), 10) : NaN;
  const releaseYear = Number.isFinite(parsedYear) ? parsedYear : null;

  const genreIds = Array.isArray(raw.genre_ids) ? raw.genre_ids : [];
  const genres = genreIds
    .map((id) => TMDB_GENRE_MAP[id])
    .filter((g): g is string => Boolean(g));

  const curatedMatch = CURATED_BY_TMDB_KEY.get(`${mediaType}:${raw.id}`);
  const detailHref = curatedMatch
    ? curatedMatch.type === "series"
      ? `/series/${curatedMatch.id}`
      : `/movie/${curatedMatch.id}`
    : mediaType === "tv"
      ? `/series/tmdb-${raw.id}`
      : `/movie/tmdb-${raw.id}`;

  const originalLanguage = (raw.original_language || "en").toLowerCase();

  const isStreamAvailable =
    getSyncAvailability(String(raw.id), curatedMatch) === "Available" ||
    Boolean(curatedMatch?.videoUrl?.trim()) ||
    Boolean(raw.id);

  return {
    id: curatedMatch ? curatedMatch.id : `tmdb-${mediaType}-${raw.id}`,
    tmdbId: raw.id,
    mediaType,
    title,
    originalTitle,
    overview: raw.overview || "",
    posterUrl: buildTmdbImageUrl(raw.poster_path, "w500"),
    backdropUrl: buildTmdbImageUrl(raw.backdrop_path, "w780"),
    releaseDate,
    releaseYear,
    rating: typeof raw.vote_average === "number" ? Number(raw.vote_average.toFixed(1)) : 0,
    voteCount: typeof raw.vote_count === "number" ? raw.vote_count : 0,
    popularity: typeof raw.popularity === "number" ? raw.popularity : 0,
    originalLanguage,
    originalLanguageLabel: getLanguageDisplayName(originalLanguage),
    genreIds,
    genres,
    originCountries: Array.isArray(raw.origin_country) ? raw.origin_country : [],
    hasLicensedStream: isStreamAvailable,
    localId:
      curatedMatch?.id ||
      (isStreamAvailable
        ? mediaType === "tv"
          ? `tmdb-tv-${raw.id}`
          : `tmdb-movie-${raw.id}`
        : undefined),
    detailHref,
  };
}

/**
 * Extracts the best available official YouTube trailer/teaser from TMDB video results.
 * Prioritizes official trailers, followed by general trailers, official teasers, and teasers.
 */
export function extractOfficialTrailer(
  videos?: { results?: TMDBVideoItem[] } | null
): WorldwideTrailerInfo | null {
  if (!videos || !Array.isArray(videos.results) || videos.results.length === 0) {
    return null;
  }
  const ytVideos = videos.results.filter(
    (v) => v && v.site === "YouTube" && typeof v.key === "string" && v.key.trim().length > 0
  );
  if (ytVideos.length === 0) return null;

  // 1. Official Trailer with 'official' in name
  const offTrailerNamed = ytVideos.find(
    (v) => v.type === "Trailer" && v.official === true && /official/i.test(v.name || "")
  );
  if (offTrailerNamed) {
    return {
      key: offTrailerNamed.key.trim(),
      name: offTrailerNamed.name || "Official Trailer",
      site: "YouTube",
      type: "Trailer",
      official: true,
    };
  }

  // 2. Any Official Trailer
  const offTrailer = ytVideos.find((v) => v.type === "Trailer" && v.official === true);
  if (offTrailer) {
    return {
      key: offTrailer.key.trim(),
      name: offTrailer.name || "Official Trailer",
      site: "YouTube",
      type: "Trailer",
      official: true,
    };
  }

  // 3. Any Trailer
  const anyTrailer = ytVideos.find((v) => v.type === "Trailer");
  if (anyTrailer) {
    return {
      key: anyTrailer.key.trim(),
      name: anyTrailer.name || "Trailer",
      site: "YouTube",
      type: "Trailer",
      official: Boolean(anyTrailer.official),
    };
  }

  // 4. Official Teaser
  const offTeaser = ytVideos.find((v) => v.type === "Teaser" && v.official === true);
  if (offTeaser) {
    return {
      key: offTeaser.key.trim(),
      name: offTeaser.name || "Official Teaser",
      site: "YouTube",
      type: "Teaser",
      official: true,
    };
  }

  // 5. Any Teaser
  const anyTeaser = ytVideos.find((v) => v.type === "Teaser");
  if (anyTeaser) {
    return {
      key: anyTeaser.key.trim(),
      name: anyTeaser.name || "Teaser",
      site: "YouTube",
      type: "Teaser",
      official: Boolean(anyTeaser.official),
    };
  }

  // 6. Official Clip / Preview
  const offClip = ytVideos.find(
    (v) => (v.type === "Clip" || v.type === "Preview") && v.official === true
  );
  if (offClip) {
    return {
      key: offClip.key.trim(),
      name: offClip.name || "Preview",
      site: "YouTube",
      type: offClip.type || "Clip",
      official: true,
    };
  }

  return null;
}

/**
 * Normalizes TMDB watch/providers results across countries into CINOVA format with high-res logos.
 */
export function normalizeWatchProviders(
  rawProviders?: Record<string, TMDBRawWatchProviderCountry> | null
): Record<string, CountryWatchProviders> {
  if (!rawProviders || typeof rawProviders !== "object") return {};

  const result: Record<string, CountryWatchProviders> = {};

  const countryNameMap = new Map<string, string>();
  for (const c of SUPPORTED_WATCH_COUNTRIES) {
    countryNameMap.set(c.code, c.name);
  }

  for (const [code, cData] of Object.entries(rawProviders)) {
    if (!cData || typeof cData !== "object") continue;
    const countryCode = code.toUpperCase();
    const countryName = countryNameMap.get(countryCode) || countryCode;

    const mapItems = (items?: TMDBRawWatchProviderItem[]): WatchProviderItem[] =>
      (items || [])
        .filter((p) => p && p.provider_name)
        .map((p) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: buildTmdbImageUrl(p.logo_path, "w185"),
          displayPriority: p.display_priority || 0,
        }))
        .sort((a, b) => a.displayPriority - b.displayPriority);

    const flatrate = mapItems(cData.flatrate);
    const rent = mapItems(cData.rent);
    const buy = mapItems(cData.buy);
    const ads = mapItems(cData.ads);
    const free = mapItems(cData.free);

    if (
      flatrate.length > 0 ||
      rent.length > 0 ||
      buy.length > 0 ||
      ads.length > 0 ||
      free.length > 0 ||
      cData.link
    ) {
      result[countryCode] = {
        countryCode,
        countryName,
        link: cData.link,
        flatrate,
        rent,
        buy,
        ads,
        free,
      };
    }
  }

  return result;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 400;

export class TMDBClient {
  private explicitApiKey?: string;
  private responseCache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<unknown>>();

  constructor(apiKey?: string) {
    this.explicitApiKey = apiKey;
  }

  public getImageUrl(
    path: string | null | undefined,
    size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w780"
  ): string {
    return buildTmdbImageUrl(path, size);
  }

  private readCache<T>(cacheKey: string, allowStale = false): T | null {
    const entry = this.responseCache.get(cacheKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      if (allowStale) return entry.data as T;
      this.responseCache.delete(cacheKey);
      return null;
    }
    return entry.data as T;
  }

  private writeCache(cacheKey: string, data: unknown, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;
    if (this.responseCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) this.responseCache.delete(oldestKey);
    }
    this.responseCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Low-level HTTP GET using standard fetch.
   * Returns parsed JSON. Compatible with Edge runtime and Node.js.
   */
  private async httpsGet<T>(urlStr: string, reqHeaders: Record<string, string>): Promise<T> {
    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        ...reqHeaders,
        "Accept": "application/json",
      },
      redirect: "follow",
    });

    const statusCode = res.status;
    if (statusCode === 401) {
      throw new TMDBConfigError(
        "TMDB credentials were rejected (HTTP 401). Please check your token/API key in .env.local."
      );
    } else if (statusCode === 404) {
      throw new TMDBNotFoundError("TMDB resource not found.");
    } else if (statusCode === 429) {
      throw new Error("TMDB rate limit hit (HTTP 429).");
    } else if (statusCode >= 400) {
      throw new Error(`TMDB HTTP error ${statusCode}`);
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw new Error(`TMDB returned non-JSON response (HTTP ${statusCode})`);
    }
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    params: Record<string, string> = {},
    options: { retries?: number; revalidate?: number } = {}
  ): Promise<T> {
    const { retries = 4, revalidate = 1800 } = options;
    const { bearerToken, apiKey } = resolveTmdbCredentials();
    const resolvedKey = this.explicitApiKey || apiKey;

    if (!bearerToken && !resolvedKey) {
      throw new TMDBConfigError(
        "TMDB credentials are not configured. Set TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local."
      );
    }

    const sortedParamKey = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const cacheKey = `${endpoint}?${sortedParamKey}`;

    const cached = this.readCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey) as Promise<T>;
    }

    const doFetch = async (): Promise<T> => {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
      if (!bearerToken && resolvedKey) {
        url.searchParams.set("api_key", resolvedKey);
      }
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== "") {
          url.searchParams.set(key, val);
        }
      });

      const reqHeaders: Record<string, string> = {
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CINOVA/2.0",
        "Accept-Language": "en-US,en;q=0.9",
      };
      if (bearerToken) {
        reqHeaders.Authorization = `Bearer ${bearerToken}`;
      }

      let lastErr: unknown;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Attempt 1: Modern high-performance pooled HTTP/2 fetch
          if (typeof fetch === "function") {
            try {
              const res = await fetch(url.toString(), {
                headers: reqHeaders,
                signal: AbortSignal.timeout(18000),
              });
              if (res.status === 401) {
                throw new TMDBConfigError(
                  "TMDB credentials were rejected (HTTP 401). Please check your token/API key in .env.local."
                );
              }
              if (res.status === 404) {
                throw new TMDBNotFoundError(`TMDB resource not found at ${endpoint}.`);
              }
              if (res.status === 429) {
                throw new Error("TMDB rate limit hit (HTTP 429).");
              }
              if (!res.ok) {
                throw new Error(`TMDB HTTP error ${res.status}`);
              }
              const payload = (await res.json()) as T;
              this.writeCache(cacheKey, payload, revalidate);
              return payload;
            } catch (fetchErr) {
              if (fetchErr instanceof TMDBConfigError || fetchErr instanceof TMDBNotFoundError) throw fetchErr;
              // If fetch failed due to TLS/socket error, fallback to httpsGet with persistent keep-alive agent
              const payload = await this.httpsGet<T>(url.toString(), reqHeaders);
              this.writeCache(cacheKey, payload, revalidate);
              return payload;
            }
          } else {
            const payload = await this.httpsGet<T>(url.toString(), reqHeaders);
            this.writeCache(cacheKey, payload, revalidate);
            return payload;
          }
        } catch (err) {
          if (err instanceof TMDBConfigError || err instanceof TMDBNotFoundError) throw err;
          lastErr = err;

          const isRateLimit = err instanceof Error && err.message.includes("429");
          if (isRateLimit && attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
            continue;
          }

          if (attempt < retries) {
            // Exponential backoff with jitter on socket resets / connection drops
            const backoff = Math.min(300 * Math.pow(2, attempt - 1) + Math.random() * 200, 3000);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          }
        }
      }

      // All retries failed with append_to_response — try simplified request
      if (url.searchParams.has("append_to_response")) {
        try {
          const fallbackUrl = new URL(url.toString());
          fallbackUrl.searchParams.delete("append_to_response");
          const payload = await this.httpsGet<T>(fallbackUrl.toString(), reqHeaders);
          this.writeCache(cacheKey, payload, revalidate);
          return payload;
        } catch {
          // Ignore fallback error; proceed to stale cache or throw
        }
      }

      // Serve stale cache if available rather than showing an error screen
      const stale = this.readCache<T>(cacheKey, true);
      if (stale !== null) {
        console.warn(`[TMDB] Serving stale cache for ${endpoint} after transient network error.`);
        return stale;
      }

      throw lastErr ?? new Error(`Failed to fetch TMDB endpoint ${endpoint}`);
    };

    const promise = doFetch();
    this.inFlight.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  // Legacy-compatible sync methods
  public async getTrendingMovies(timeWindow: "day" | "week" = "week"): Promise<TMDBMovie[]> {
    const data = await this.fetchWithRetry<{ results: TMDBMovie[] }>(`/trending/movie/${timeWindow}`);
    return data.results || [];
  }

  public async getTrendingSeries(timeWindow: "day" | "week" = "week"): Promise<TMDBSeries[]> {
    const data = await this.fetchWithRetry<{ results: TMDBSeries[] }>(`/trending/tv/${timeWindow}`);
    return data.results || [];
  }

  public async getUpcomingMovies(page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetchWithRetry<{ results: TMDBMovie[] }>("/movie/upcoming", {
      page: String(page),
    });
    return data.results || [];
  }

  public async getPopularMovies(page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetchWithRetry<{ results: TMDBMovie[] }>("/movie/popular", {
      page: String(page),
    });
    return data.results || [];
  }

  public async getPopularSeries(page = 1): Promise<TMDBSeries[]> {
    const data = await this.fetchWithRetry<{ results: TMDBSeries[] }>("/tv/popular", {
      page: String(page),
    });
    return data.results || [];
  }

  public async getTopRatedMovies(page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetchWithRetry<{ results: TMDBMovie[] }>("/movie/top_rated", {
      page: String(page),
    });
    return data.results || [];
  }

  public async getTopRatedSeries(page = 1): Promise<TMDBSeries[]> {
    const data = await this.fetchWithRetry<{ results: TMDBSeries[] }>("/tv/top_rated", {
      page: String(page),
    });
    return data.results || [];
  }

  public async discoverByLanguage(
    mediaType: "movie" | "tv",
    language: string,
    page = 1
  ): Promise<TMDBRawListItem[]> {
    const endpoint = mediaType === "movie" ? "/discover/movie" : "/discover/tv";
    const data = await this.fetchWithRetry<{ results: TMDBRawListItem[] }>(endpoint, {
      with_original_language: language,
      sort_by: "popularity.desc",
      include_adult: "false",
      page: String(page),
    });
    return data.results || [];
  }

  public async getMovieDetails(movieId: string | number): Promise<TMDBMovie> {
    return await this.fetchWithRetry<TMDBMovie>(
      `/movie/${movieId}`,
      {
        append_to_response: "credits,videos,release_dates,watch/providers",
      },
      { retries: 3, revalidate: 3600 }
    );
  }

  public async getSeriesDetails(seriesId: string | number): Promise<TMDBSeries> {
    return await this.fetchWithRetry<TMDBSeries>(
      `/tv/${seriesId}`,
      {
        append_to_response: "credits,videos,content_ratings,watch/providers",
      },
      { retries: 3, revalidate: 3600 }
    );
  }

  public async getWatchProviders(
    mediaType: "movie" | "tv",
    id: string | number
  ): Promise<Record<string, CountryWatchProviders>> {
    try {
      const data = await this.fetchWithRetry<{
        results: Record<string, TMDBRawWatchProviderCountry>;
      }>(`/${mediaType}/${id}/watch/providers`, {}, { revalidate: 86400 });
      return normalizeWatchProviders(data.results);
    } catch {
      return {};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async search(query: string, page = 1): Promise<any[]> {
    const data = await this.fetchWithRetry<{ results: TMDBRawListItem[] }>(
      "/search/multi",
      { query, include_adult: "false", page: String(page) },
      { revalidate: 300 }
    );
    return data.results || [];
  }

  /**
   * Worldwide filtered discovery across all regions, languages, genres, years, ratings, and sort modes.
   */
  public async discoverWorldwide(
    params: WorldwideDiscoverParams
  ): Promise<WorldwidePagedResult> {
    const preset = getCollectionPreset(params.collection);
    const mediaType: WorldwideMediaType = params.mediaType || preset.defaultMediaType;
    const page = Math.max(1, Math.min(500, Number(params.page) || 1));

    const queryParams: Record<string, string> = {
      include_adult: "false",
      without_keywords: TMDB_ADULT_DISCOVERY_EXCLUDE_KEYWORDS,
      page: String(page),
    };

    // Language (explicit filter overrides collection preset)
    const effectiveLanguage = params.language || preset.language || "";
    if (effectiveLanguage) {
      queryParams.with_original_language = effectiveLanguage;
    }

    // Origin country / region (explicit filter overrides collection preset)
    const effectiveCountry = params.country || preset.originCountry || "";
    if (effectiveCountry) {
      queryParams.with_origin_country = effectiveCountry;
    }

    const isRegionalFilter = Boolean(
      (effectiveLanguage && effectiveLanguage !== "en") ||
      (effectiveCountry && effectiveCountry !== "US")
    );

    // Sort mapping
    if (params.sortBy === "newest") {
      queryParams.sort_by =
        mediaType === "tv" ? "first_air_date.desc" : "primary_release_date.desc";
      queryParams["vote_count.gte"] = isRegionalFilter ? "5" : "15";
    } else if (params.sortBy === "vote_average.desc") {
      queryParams.sort_by = "vote_average.desc";
      queryParams["vote_count.gte"] = isRegionalFilter ? "15" : "120";
    } else if (params.sortBy === "vote_count.desc") {
      queryParams.sort_by = "vote_count.desc";
    } else {
      queryParams.sort_by = "popularity.desc";
      queryParams["vote_count.gte"] = isRegionalFilter ? "5" : "20";
    }

    // Genre (combines collection genre e.g. Documentary 99 with user genre filter if both set)
    const genreParts: string[] = [];
    if (preset.genreId) {
      genreParts.push(mapGenreIdForMediaType(preset.genreId, mediaType));
    }
    if (params.genre) {
      const mapped = mapGenreIdForMediaType(params.genre, mediaType);
      if (mapped && !genreParts.includes(mapped)) {
        genreParts.push(mapped);
      }
    }
    if (genreParts.length > 0) {
      queryParams.with_genres = genreParts.join(",");
    }

    // Year filter
    if (params.year && /^\d{4}$/.test(params.year)) {
      if (mediaType === "tv") {
        queryParams.first_air_date_year = params.year;
      } else {
        queryParams.primary_release_year = params.year;
      }
    }

    // Minimum rating filter
    const minRating = Number(params.minRating);
    if (Number.isFinite(minRating) && minRating > 0) {
      queryParams["vote_average.gte"] = String(minRating);
      if (!queryParams["vote_count.gte"]) {
        queryParams["vote_count.gte"] = isRegionalFilter ? "10" : "25";
      }
    }

    const endpoint = mediaType === "tv" ? "/discover/tv" : "/discover/movie";

    // TMDB's with_original_language supports a single ISO code per call; fan out for multi-language collections like South Indian (ta|te|ml|kn)
    if (effectiveLanguage.includes("|")) {
      const langCodes = effectiveLanguage
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const responses = await Promise.all(
        langCodes.map((code) =>
          this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
            endpoint,
            { ...queryParams, with_original_language: code },
            { revalidate: 1800 }
          )
        )
      );

      const seen = new Set<string>();
      const merged: WorldwideCatalogItem[] = [];
      let maxTotalPages = 1;
      let sumTotalResults = 0;

      for (const data of responses) {
        maxTotalPages = Math.max(maxTotalPages, Math.min(500, data.total_pages || 1));
        sumTotalResults += data.total_results || 0;
        for (const raw of data.results || []) {
          const normalized = normalizeRawListItem(raw, mediaType);
          if (!normalized) continue;
          const dedupeKey = `${normalized.mediaType}:${normalized.tmdbId}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);
          merged.push(normalized);
        }
      }

      if (params.sortBy === "vote_average.desc") {
        merged.sort((a, b) => b.rating - a.rating);
      } else if (params.sortBy === "newest") {
        merged.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
      } else if (params.sortBy === "vote_count.desc") {
        merged.sort((a, b) => b.voteCount - a.voteCount);
      } else {
        merged.sort((a, b) => b.popularity - a.popularity);
      }

      return {
        items: merged.slice(0, 24),
        page,
        totalPages: maxTotalPages,
        totalResults: sumTotalResults || merged.length,
      };
    }

    const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
      endpoint,
      queryParams,
      { revalidate: 1800 }
    );

    const seen = new Set<string>();
    const items: WorldwideCatalogItem[] = [];
    for (const raw of data.results || []) {
      const normalized = normalizeRawListItem(raw, mediaType);
      if (!normalized) continue;
      const dedupeKey = `${normalized.mediaType}:${normalized.tmdbId}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push(normalized);
    }

    return {
      items,
      page: data.page || page,
      totalPages: Math.min(500, data.total_pages || 1),
      totalResults: data.total_results || items.length,
    };
  }

  private normalizePagedList(
    data: TMDBPaginatedResponse<TMDBRawListItem>,
    fallbackMediaType: WorldwideMediaType,
    page: number
  ): WorldwidePagedResult {
    const seen = new Set<string>();
    const items: WorldwideCatalogItem[] = [];
    for (const raw of data.results || []) {
      const normalized = normalizeRawListItem(raw, fallbackMediaType);
      if (!normalized) continue;
      const key = `${normalized.mediaType}:${normalized.tmdbId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(normalized);
    }
    return {
      items,
      page: data.page || page,
      totalPages: Math.min(500, data.total_pages || 1),
      totalResults: data.total_results || items.length,
    };
  }

  /**
   * Dedicated homepage & catalog feeds backed by live TMDB trending, now_playing, upcoming,
   * top_rated, popular, regional, and genre endpoints with automatic caching & revalidation.
   */
  public async getCatalogFeed(
    feedId: string,
    page = 1
  ): Promise<WorldwidePagedResult> {
    const safePage = Math.max(1, Math.min(500, Math.floor(Number(page) || 1)));
    const normalizedId = (feedId || "").trim().toLowerCase();

    switch (normalizedId) {
      case "trending-worldwide": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/trending/all/week",
          { page: String(safePage) },
          { revalidate: 900 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "popular-today": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/trending/movie/day",
          { page: String(safePage) },
          { revalidate: 900 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "blockbuster-movies": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/movie/popular",
          { page: String(safePage) },
          { revalidate: 1800 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "latest-releases": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/movie/now_playing",
          { page: String(safePage) },
          { revalidate: 1800 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "upcoming-movies": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/movie/upcoming",
          { page: String(safePage) },
          { revalidate: 1800 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "top-rated-movies": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/movie/top_rated",
          { page: String(safePage) },
          { revalidate: 3600 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "popular-tv": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/tv/popular",
          { page: String(safePage) },
          { revalidate: 1800 }
        );
        return this.normalizePagedList(data, "tv", safePage);
      }
      case "trending-tv": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/trending/tv/week",
          { page: String(safePage) },
          { revalidate: 900 }
        );
        return this.normalizePagedList(data, "tv", safePage);
      }
      case "top-rated-tv": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/tv/top_rated",
          { page: String(safePage) },
          { revalidate: 3600 }
        );
        return this.normalizePagedList(data, "tv", safePage);
      }
      case "korean-dramas":
        return this.discoverWorldwide({
          collection: "korean",
          mediaType: "tv",
          page: safePage,
        });
      case "japanese-cinema":
        return this.discoverWorldwide({
          mediaType: "movie",
          language: "ja",
          country: "JP",
          page: safePage,
        });
      case "anime-collection":
        return this.discoverWorldwide({
          mediaType: "tv",
          language: "ja",
          genre: "16",
          page: safePage,
        });
      case "bollywood-hits":
        return this.discoverWorldwide({
          collection: "bollywood",
          mediaType: "movie",
          page: safePage,
        });
      case "south-indian":
        return this.discoverWorldwide({
          collection: "south-indian",
          mediaType: "movie",
          page: safePage,
        });
      case "marathi-movies":
        return this.discoverWorldwide({
          collection: "marathi",
          mediaType: "movie",
          page: safePage,
        });
      case "hollywood-collection":
        return this.discoverWorldwide({
          collection: "hollywood",
          mediaType: "movie",
          page: safePage,
        });
      case "international-cinema":
        return this.discoverWorldwide({
          mediaType: "movie",
          country: "FR|ES|IT|DE|TR|TH|ID|SE",
          page: safePage,
        });
      case "crime-thriller":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "53",
          page: safePage,
        });
      case "horror-nights":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "27",
          page: safePage,
        });
      case "scifi-universe":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "878",
          page: safePage,
        });
      case "romance-collection":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "10749",
          page: safePage,
        });
      case "action-adventure":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "28",
          page: safePage,
        });
      case "comedy":
        return this.discoverWorldwide({
          mediaType: "movie",
          genre: "35",
          page: safePage,
        });
      case "documentaries":
        return this.discoverWorldwide({
          collection: "documentary",
          mediaType: "movie",
          page: safePage,
        });
      case "hidden-gems": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/discover/movie",
          {
            sort_by: "vote_average.desc",
            "vote_average.gte": "7.8",
            "vote_count.gte": "120",
            "vote_count.lte": "3500",
            include_adult: "false",
            without_keywords: TMDB_ADULT_DISCOVERY_EXCLUDE_KEYWORDS,
            page: String(safePage),
          },
          { revalidate: 3600 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      case "most-watched-cinova": {
        const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
          "/trending/all/day",
          { page: String(safePage) },
          { revalidate: 900 }
        );
        return this.normalizePagedList(data, "movie", safePage);
      }
      default:
        return this.discoverWorldwide({
          collection: normalizedId || "all",
          page: safePage,
        });
    }
  }

  /**
   * Worldwide live title search for Movies, TV Series, or Both, with post-filters when active.
   */
  public async searchWorldwide(
    params: WorldwideSearchParams
  ): Promise<WorldwidePagedResult> {
    const trimmed = params.query.trim();
    const page = Math.max(1, Math.min(500, Number(params.page) || 1));
    const mediaType = params.mediaType || "all";

    const endpoint =
      mediaType === "movie"
        ? "/search/movie"
        : mediaType === "tv"
          ? "/search/tv"
          : "/search/multi";

    const queryParams: Record<string, string> = {
      query: trimmed,
      include_adult: "false",
      page: String(page),
    };

    if (params.year && /^\d{4}$/.test(params.year)) {
      if (mediaType === "movie") queryParams.primary_release_year = params.year;
      else if (mediaType === "tv") queryParams.first_air_date_year = params.year;
    }

    const data = await this.fetchWithRetry<TMDBPaginatedResponse<TMDBRawListItem>>(
      endpoint,
      queryParams,
      { revalidate: 300 }
    );

    const fallbackType: WorldwideMediaType = mediaType === "tv" ? "tv" : "movie";
    const minRating = Number(params.minRating) || 0;
    const filterYear = params.year && /^\d{4}$/.test(params.year) ? Number(params.year) : null;
    const filterLang = params.language?.toLowerCase() || "";
    const filterCountry = params.country?.toUpperCase() || "";
    const filterGenreNum = params.genre ? Number(params.genre) : null;

    const filterAdultInSearch = Boolean(params.filterAdultSuggestions);
    const seen = new Set<string>();
    let items: WorldwideCatalogItem[] = [];
    for (const raw of data.results || []) {
      const normalized = normalizeRawListItem(raw, fallbackType, {
        filterAdultSuggestions: filterAdultInSearch,
      });
      if (!normalized) continue;
      const key = `${normalized.mediaType}:${normalized.tmdbId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (filterLang && normalized.originalLanguage !== filterLang) continue;
      if (filterYear && normalized.releaseYear !== filterYear) continue;
      if (minRating > 0 && normalized.rating < minRating) continue;
      if (filterCountry && normalized.originCountries.length > 0 && !normalized.originCountries.includes(filterCountry)) {
        continue;
      }
      if (filterGenreNum) {
        const mapped = Number(mapGenreIdForMediaType(String(filterGenreNum), normalized.mediaType));
        if (!normalized.genreIds.includes(filterGenreNum) && !normalized.genreIds.includes(mapped)) {
          continue;
        }
      }

      items.push(normalized);
    }

    if (params.sortBy === "vote_average.desc") {
      items = items.sort((a, b) => b.rating - a.rating);
    } else if (params.sortBy === "newest") {
      items = items.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (params.sortBy === "vote_count.desc") {
      items = items.sort((a, b) => b.voteCount - a.voteCount);
    }

    return {
      items,
      page: data.page || page,
      totalPages: Math.min(500, data.total_pages || 1),
      totalResults: data.total_results || items.length,
    };
  }

  /**
   * Full normalized Movie detail metadata from TMDB (including cast, directors, countries, similar & recommendations).
   */
  public async getWorldwideMovieDetails(
    tmdbId: string | number
  ): Promise<WorldwideDetailData> {
    let raw: TMDBMovie;
    try {
      raw = await this.getMovieDetails(tmdbId);
    } catch (err) {
      if (err instanceof TMDBConfigError || err instanceof TMDBNotFoundError) throw err;
      // Resilient fallback: fetch core movie without heavy append_to_response
      raw = await this.fetchWithRetry<TMDBMovie>(`/movie/${tmdbId}`, {}, { retries: 4, revalidate: 3600 });
    }
    const curatedMatch = CURATED_BY_TMDB_KEY.get(`movie:${raw.id}`);

    const releaseDate = raw.release_date || "";
    const parsedYear = releaseDate.length >= 4 ? parseInt(releaseDate.slice(0, 4), 10) : NaN;
    const origLang = (raw.original_language || "en").toLowerCase();

    // Extract US or IN certification if available
    let certification: string | null = null;
    const certList = raw.release_dates?.results || [];
    const preferredCert =
      certList.find((r) => r.iso_3166_1 === "IN") ||
      certList.find((r) => r.iso_3166_1 === "US") ||
      certList[0];
    if (preferredCert) {
      const found = preferredCert.release_dates.find((d) => d.certification?.trim());
      if (found) certification = found.certification.trim();
    }

    const directors = (raw.credits?.crew || [])
      .filter((c) => c.job === "Director")
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        profileUrl: buildTmdbImageUrl(c.profile_path, "w185"),
      }));

    const cast = (raw.credits?.cast || []).slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || "Cast",
      profileUrl: buildTmdbImageUrl(c.profile_path, "w185"),
    }));

    let similarList = raw.similar?.results;
    if (!similarList || similarList.length === 0) {
      try {
        const simData = await this.fetchWithRetry<{ results: TMDBRawListItem[] }>(
          `/movie/${raw.id}/similar`,
          { page: "1" },
          { retries: 1, revalidate: 3600 }
        );
        similarList = simData.results;
      } catch {
        similarList = [];
      }
    }

    const similar = (similarList || [])
      .map((item) => normalizeRawListItem(item, "movie"))
      .filter((x): x is WorldwideCatalogItem => Boolean(x))
      .slice(0, 12);

    const recommendations = (raw.recommendations?.results || [])
      .map((item) => normalizeRawListItem(item, "movie"))
      .filter((x): x is WorldwideCatalogItem => Boolean(x))
      .slice(0, 12);

    let trailerInfo = extractOfficialTrailer(raw.videos);
    if (!trailerInfo) {
      try {
        const vData = await this.fetchWithRetry<{ results: TMDBVideoItem[] }>(
          `/movie/${raw.id}/videos`,
          {},
          { retries: 2, revalidate: 3600 }
        );
        if (vData && Array.isArray(vData.results)) {
          trailerInfo = extractOfficialTrailer(vData);
        }
      } catch {
        // Fallback video fetch failed, ignore gracefully
      }
    }

    let rawProviders = raw["watch/providers"]?.results;
    if (!rawProviders || Object.keys(rawProviders).length === 0) {
      try {
        const pData = await this.fetchWithRetry<{
          results: Record<string, TMDBRawWatchProviderCountry>;
        }>(`/movie/${raw.id}/watch/providers`, {}, { retries: 2, revalidate: 86400 });
        rawProviders = pData?.results;
      } catch {
        // Fallback watch providers fetch failed, ignore gracefully
      }
    }
    const watchProviders = normalizeWatchProviders(rawProviders);

    return {
      id: curatedMatch ? curatedMatch.id : `tmdb-movie-${raw.id}`,
      tmdbId: raw.id,
      mediaType: "movie",
      title: raw.title,
      originalTitle: raw.original_title || raw.title,
      tagline: raw.tagline || "",
      overview: raw.overview || "",
      posterUrl: buildTmdbImageUrl(raw.poster_path, "w780"),
      backdropUrl: buildTmdbImageUrl(raw.backdrop_path, "w1280"),
      releaseDate,
      releaseYear: Number.isFinite(parsedYear) ? parsedYear : null,
      runtimeMinutes: typeof raw.runtime === "number" && raw.runtime > 0 ? raw.runtime : null,
      status: raw.status || "Released",
      rating: typeof raw.vote_average === "number" ? Number(raw.vote_average.toFixed(1)) : 0,
      voteCount: raw.vote_count || 0,
      popularity: raw.popularity || 0,
      originalLanguage: origLang,
      originalLanguageLabel: getLanguageDisplayName(origLang),
      spokenLanguages: (raw.spoken_languages || [])
        .map((l) => l.english_name || l.name)
        .filter(Boolean),
      productionCountries: (raw.production_countries || [])
        .map((c) => c.name)
        .filter(Boolean),
      originCountries: (raw.production_countries || []).map((c) => c.iso_3166_1),
      genreIds: (raw.genres || []).map((g) => g.id),
      genres: (raw.genres || []).map((g) => g.name),
      certification,
      directors,
      cast,
      similar,
      recommendations,
      hasLicensedStream: true,
      localId: curatedMatch?.id || `tmdb-movie-${raw.id}`,
      detailHref: curatedMatch ? `/movie/${curatedMatch.id}` : `/movie/tmdb-${raw.id}`,
      trailer: trailerInfo,
      trailerKey: trailerInfo?.key || null,
      trailerUrl: trailerInfo ? `https://www.youtube.com/watch?v=${trailerInfo.key}` : null,
      trailerName: trailerInfo?.name || null,
      hasOfficialTrailer: Boolean(trailerInfo?.key),
      watchProviders,
    };
  }

  /**
   * Full normalized TV Series detail metadata from TMDB (including seasons, cast, creators, countries, similar & recommendations).
   */
  public async getWorldwideSeriesDetails(
    tmdbId: string | number
  ): Promise<WorldwideDetailData> {
    let raw: TMDBSeries;
    try {
      raw = await this.getSeriesDetails(tmdbId);
    } catch (err) {
      if (err instanceof TMDBConfigError || err instanceof TMDBNotFoundError) throw err;
      // Resilient fallback: fetch core tv series without heavy append_to_response
      raw = await this.fetchWithRetry<TMDBSeries>(`/tv/${tmdbId}`, {}, { retries: 4, revalidate: 3600 });
    }
    const curatedMatch = CURATED_BY_TMDB_KEY.get(`tv:${raw.id}`);

    const releaseDate = raw.first_air_date || "";
    const parsedYear = releaseDate.length >= 4 ? parseInt(releaseDate.slice(0, 4), 10) : NaN;
    const origLang = (raw.original_language || "en").toLowerCase();

    const ratingList = raw.content_ratings?.results || [];
    const preferredCert =
      ratingList.find((r) => r.iso_3166_1 === "IN") ||
      ratingList.find((r) => r.iso_3166_1 === "US") ||
      ratingList[0];

    const creators = (raw.created_by || []).map((c) => ({
      id: c.id,
      name: c.name,
      job: "Creator",
      profileUrl: buildTmdbImageUrl(c.profile_path, "w185"),
    }));

    const directors =
      creators.length > 0
        ? creators
        : (raw.credits?.crew || [])
          .filter((c) => c.job === "Director" || c.job === "Executive Producer")
          .slice(0, 4)
          .map((c) => ({
            id: c.id,
            name: c.name,
            job: c.job,
            profileUrl: buildTmdbImageUrl(c.profile_path || null, "w185"),
          }));

    const cast = (raw.credits?.cast || []).slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || "Cast",
      profileUrl: buildTmdbImageUrl(c.profile_path, "w185"),
    }));

    const seasons = (raw.seasons || [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name || `Season ${s.season_number}`,
        episodeCount: s.episode_count || 0,
        airDate: s.air_date || "",
        posterUrl: buildTmdbImageUrl(s.poster_path, "w342"),
        overview: s.overview || "",
      }));

    let similarList = raw.similar?.results;
    if (!similarList || similarList.length === 0) {
      try {
        const simData = await this.fetchWithRetry<{ results: TMDBRawListItem[] }>(
          `/tv/${raw.id}/similar`,
          { page: "1" },
          { retries: 1, revalidate: 3600 }
        );
        similarList = simData.results;
      } catch {
        similarList = [];
      }
    }

    const similar = (similarList || [])
      .map((item) => normalizeRawListItem(item, "tv"))
      .filter((x): x is WorldwideCatalogItem => Boolean(x))
      .slice(0, 12);

    const recommendations = (raw.recommendations?.results || [])
      .map((item) => normalizeRawListItem(item, "tv"))
      .filter((x): x is WorldwideCatalogItem => Boolean(x))
      .slice(0, 12);

    let trailerInfo = extractOfficialTrailer(raw.videos);
    if (!trailerInfo) {
      try {
        const vData = await this.fetchWithRetry<{ results: TMDBVideoItem[] }>(
          `/tv/${raw.id}/videos`,
          {},
          { retries: 2, revalidate: 3600 }
        );
        if (vData && Array.isArray(vData.results)) {
          trailerInfo = extractOfficialTrailer(vData);
        }
      } catch {
        // Fallback video fetch failed, ignore gracefully
      }
    }

    let rawProviders = raw["watch/providers"]?.results;
    if (!rawProviders || Object.keys(rawProviders).length === 0) {
      try {
        const pData = await this.fetchWithRetry<{
          results: Record<string, TMDBRawWatchProviderCountry>;
        }>(`/tv/${raw.id}/watch/providers`, {}, { retries: 2, revalidate: 86400 });
        rawProviders = pData?.results;
      } catch {
        // Fallback watch providers fetch failed, ignore gracefully
      }
    }
    const watchProviders = normalizeWatchProviders(rawProviders);

    return {
      id: curatedMatch ? curatedMatch.id : `tmdb-tv-${raw.id}`,
      tmdbId: raw.id,
      mediaType: "tv",
      title: raw.name,
      originalTitle: raw.original_name || raw.name,
      tagline: raw.tagline || "",
      overview: raw.overview || "",
      posterUrl: buildTmdbImageUrl(raw.poster_path, "w780"),
      backdropUrl: buildTmdbImageUrl(raw.backdrop_path, "w1280"),
      releaseDate,
      releaseYear: Number.isFinite(parsedYear) ? parsedYear : null,
      runtimeMinutes:
        Array.isArray(raw.episode_run_time) && raw.episode_run_time[0] > 0
          ? raw.episode_run_time[0]
          : null,
      status: raw.status || "Returning Series",
      rating: typeof raw.vote_average === "number" ? Number(raw.vote_average.toFixed(1)) : 0,
      voteCount: raw.vote_count || 0,
      popularity: raw.popularity || 0,
      originalLanguage: origLang,
      originalLanguageLabel: getLanguageDisplayName(origLang),
      spokenLanguages: (raw.spoken_languages || [])
        .map((l) => l.english_name || l.name)
        .filter(Boolean),
      productionCountries: (raw.production_countries || [])
        .map((c) => c.name)
        .filter(Boolean),
      originCountries: raw.origin_country || [],
      genreIds: (raw.genres || []).map((g) => g.id),
      genres: (raw.genres || []).map((g) => g.name),
      certification: preferredCert?.rating?.trim() || null,
      numberOfSeasons: raw.number_of_seasons,
      numberOfEpisodes: raw.number_of_episodes,
      seasons,
      directors,
      cast,
      similar,
      recommendations,
      hasLicensedStream: true,
      localId: curatedMatch?.id || `tmdb-tv-${raw.id}`,
      detailHref: curatedMatch ? `/series/${curatedMatch.id}` : `/series/tmdb-${raw.id}`,
      trailer: trailerInfo,
      trailerKey: trailerInfo?.key || null,
      trailerUrl: trailerInfo ? `https://www.youtube.com/watch?v=${trailerInfo.key}` : null,
      trailerName: trailerInfo?.name || null,
      hasOfficialTrailer: Boolean(trailerInfo?.key),
      watchProviders,
    };
  }
}

export const tmdb = new TMDBClient();
