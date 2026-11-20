/**
 * CINOVA Automated Synchronization Engine
 * Unified orchestrator ingesting, deduplicating, and updating global content
 * from TMDB and AniList APIs.
 */

import { tmdb, TMDBMovie, TMDBSeries } from "@/lib/api/tmdb-client";
import { anilist, AniListMedia } from "@/lib/api/anilist-client";
import { ContentItem, ContentType, ReleaseStatus, SyncHistoryRecord } from "@/types/database";

// In-Memory & Local Database sync store
let cachedContentItems: ContentItem[] = [];
let syncHistoryStore: SyncHistoryRecord[] = [];
let lastSyncTimestamp: Date | null = null;

function isValidArtworkUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  if (trimmed.includes("images.unsplash.com")) return false;
  return true;
}

function getCanonicalSyncKey(item: ContentItem): string {
  const primarySource = item.externalSources?.[0];
  if (primarySource?.source && primarySource?.externalId) {
    const mediaBucket =
      item.type === "SERIES"
        ? "TV"
        : item.type === "ANIME_MOVIE" || item.type === "ANIME_SERIES"
          ? "ANIME"
          : "MOVIE";
    return `${primarySource.source}:${mediaBucket}:${primarySource.externalId}`;
  }
  return item.id;
}

function mergeContentItemSafely(existing: ContentItem, incoming: ContentItem): ContentItem {
  const safePoster = isValidArtworkUrl(incoming.posterUrl)
    ? incoming.posterUrl
    : isValidArtworkUrl(existing.posterUrl)
      ? existing.posterUrl
      : "";
  const safeBackdrop = isValidArtworkUrl(incoming.backdropUrl)
    ? incoming.backdropUrl
    : isValidArtworkUrl(existing.backdropUrl)
      ? existing.backdropUrl
      : "";

  return {
    ...existing,
    ...incoming,
    id: existing.id,
    posterUrl: safePoster,
    backdropUrl: safeBackdrop,
    tagline: incoming.tagline || existing.tagline,
    synopsis: incoming.synopsis && incoming.synopsis.trim().length > 0 ? incoming.synopsis : existing.synopsis,
    trailerUrl: incoming.trailerUrl || existing.trailerUrl,
    genres: incoming.genres?.length ? incoming.genres : existing.genres,
    cast: incoming.cast?.length ? incoming.cast : existing.cast,
    directors: incoming.directors?.length ? incoming.directors : existing.directors,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
}

// Normalizer: Convert TMDB Movie to ContentItem
export function normalizeTmdbMovie(m: TMDBMovie, isUpcoming = false): ContentItem {
  const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : 2025;
  const slug = `movie-${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${m.id}`;
  const posterUrl = tmdb.getImageUrl(m.poster_path, "w780");
  const backdropUrl = tmdb.getImageUrl(m.backdrop_path, "original");
  const trailerKey = m.videos?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key;

  return {
    id: `tmdb-movie-${m.id}`,
    slug,
    title: m.title,
    originalTitle: m.original_title,
    tagline: m.tagline || undefined,
    synopsis: m.overview || "Streaming in 4K UHD with multi-server playback.",
    posterUrl,
    backdropUrl,
    trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : undefined,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    type: "MOVIE",
    status: isUpcoming ? "UPCOMING" : "RELEASED",
    releaseDate: m.release_date ? new Date(m.release_date) : null,
    releaseYear,
    duration: m.runtime || 120,
    rating: "PG-13",
    score: Number((m.vote_average || 8.5).toFixed(1)),
    matchPercentage: Math.min(99, Math.round((m.vote_average || 8) * 10) + 12),
    language: m.original_language === "hi" ? "Hindi" : m.original_language === "ja" ? "Japanese" : m.original_language === "ko" ? "Korean" : "English",
    country: m.production_countries?.[0]?.name || "United States",
    views: (m.vote_count || 100) * 1200,
    isFeatured: m.vote_average >= 8.5,
    isTrending: true,
    isPopular: true,
    isUpcoming,
    quality: "4K UHD",
    audioSpecs: "Dolby Atmos 7.1",
    createdAt: new Date(),
    updatedAt: new Date(),
    genres: (m.genres || []).map((g) => ({
      id: String(g.id),
      name: g.name,
      slug: g.name.toLowerCase().replace(/\s+/g, "-"),
    })),
    cast: (m.credits?.cast || []).slice(0, 6).map((c, idx) => ({
      id: `cast-${c.id}`,
      contentId: `tmdb-movie-${m.id}`,
      personId: String(c.id),
      person: {
        id: String(c.id),
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, "-"),
        avatarUrl: tmdb.getImageUrl(c.profile_path, "w500"),
      },
      character: c.character,
      role: "ACTOR",
      order: idx,
    })),
    directors: (m.credits?.crew || [])
      .filter((c) => c.job === "Director")
      .map((d) => ({
        id: String(d.id),
        name: d.name,
        slug: d.name.toLowerCase().replace(/\s+/g, "-"),
        avatarUrl: tmdb.getImageUrl(d.profile_path, "w500"),
      })),
    externalSources: [
      {
        id: `src-tmdb-${m.id}`,
        contentId: `tmdb-movie-${m.id}`,
        source: "TMDB",
        externalId: String(m.id),
        externalUrl: `https://www.themoviedb.org/movie/${m.id}`,
        lastSyncedAt: new Date(),
      },
    ],
    movieDetails: {
      id: `md-${m.id}`,
      contentId: `tmdb-movie-${m.id}`,
    },
  };
}

// Normalizer: Convert TMDB Series to ContentItem
export function normalizeTmdbSeries(s: TMDBSeries): ContentItem {
  const releaseYear = s.first_air_date ? new Date(s.first_air_date).getFullYear() : 2024;
  const slug = `series-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${s.id}`;
  const posterUrl = tmdb.getImageUrl(s.poster_path, "w780");
  const backdropUrl = tmdb.getImageUrl(s.backdrop_path, "original");

  return {
    id: `tmdb-tv-${s.id}`,
    slug,
    title: s.name,
    originalTitle: s.original_name,
    tagline: s.tagline || undefined,
    synopsis: s.overview || "Stream every season in Ultra HD with high quality audio.",
    posterUrl,
    backdropUrl,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "SERIES",
    status: s.status === "Returning Series" ? "AIRING" : "RELEASED",
    releaseDate: s.first_air_date ? new Date(s.first_air_date) : null,
    releaseYear,
    duration: s.episode_run_time?.[0] || 50,
    rating: "TV-MA",
    score: Number((s.vote_average || 8.6).toFixed(1)),
    matchPercentage: Math.min(99, Math.round((s.vote_average || 8) * 10) + 14),
    language: s.original_language === "hi" ? "Hindi" : s.original_language === "ko" ? "Korean" : s.original_language === "ja" ? "Japanese" : "English",
    country: s.origin_country?.[0] || "United States",
    views: (s.vote_count || 100) * 1400,
    isFeatured: s.vote_average >= 8.5,
    isTrending: true,
    isPopular: true,
    isUpcoming: false,
    quality: "4K UHD",
    audioSpecs: "Dolby Atmos 5.1",
    createdAt: new Date(),
    updatedAt: new Date(),
    genres: (s.genres || []).map((g) => ({
      id: String(g.id),
      name: g.name,
      slug: g.name.toLowerCase().replace(/\s+/g, "-"),
    })),
    cast: (s.credits?.cast || []).slice(0, 6).map((c, idx) => ({
      id: `cast-${c.id}`,
      contentId: `tmdb-tv-${s.id}`,
      personId: String(c.id),
      person: {
        id: String(c.id),
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, "-"),
        avatarUrl: tmdb.getImageUrl(c.profile_path, "w500"),
      },
      character: c.character,
      role: "ACTOR",
      order: idx,
    })),
    directors: [],
    externalSources: [
      {
        id: `src-tmdb-${s.id}`,
        contentId: `tmdb-tv-${s.id}`,
        source: "TMDB",
        externalId: String(s.id),
        externalUrl: `https://www.themoviedb.org/tv/${s.id}`,
        lastSyncedAt: new Date(),
      },
    ],
    seriesDetails: {
      id: `sd-${s.id}`,
      contentId: `tmdb-tv-${s.id}`,
      totalSeasons: s.number_of_seasons || 1,
      totalEpisodes: s.number_of_episodes || 10,
      seasons: (s.seasons || []).map((sn) => ({
        id: `season-${sn.id}`,
        seriesId: `tmdb-tv-${s.id}`,
        seasonNumber: sn.season_number,
        title: sn.name,
        synopsis: sn.overview,
        posterUrl: tmdb.getImageUrl(sn.poster_path, "w500"),
        airDate: sn.air_date ? new Date(sn.air_date) : null,
        episodes: [
          {
            id: `ep-${sn.id}-1`,
            seasonId: `season-${sn.id}`,
            episodeNumber: 1,
            title: `Episode 1`,
            synopsis: `Opening chapter of ${sn.name}.`,
            duration: 50,
            thumbnailUrl: backdropUrl,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          },
        ],
      })),
    },
  };
}

// Normalizer: Convert AniList Media to ContentItem
export function normalizeAniListMedia(a: AniListMedia): ContentItem {
  const isMovie = a.format === "MOVIE";
  const type: ContentType = isMovie ? "ANIME_MOVIE" : "ANIME_SERIES";
  const releaseYear = a.seasonYear || (a.nextAiringEpisode ? new Date(a.nextAiringEpisode.airingAt * 1000).getFullYear() : 2024);
  const title = a.title.english || a.title.romaji || "Untitled Anime";
  const slug = `anime-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${a.id}`;

  let status: ReleaseStatus = "RELEASED";
  if (a.status === "RELEASING") status = "AIRING";
  if (a.status === "NOT_YET_RELEASED") status = "UPCOMING";

  return {
    id: `anilist-${a.id}`,
    slug,
    title,
    originalTitle: a.title.native || a.title.romaji,
    tagline: a.studios.nodes[0]?.name ? `Animation Studio: ${a.studios.nodes[0].name}` : "Anime Masterpiece",
    synopsis: a.description ? a.description.replace(/<[^>]*>?/gm, "") : "Stunning Japanese animated narrative with rich characters and high-stakes battles.",
    posterUrl: a.coverImage.extraLarge || a.coverImage.large,
    backdropUrl: a.bannerImage || a.coverImage.extraLarge,
    trailerUrl: a.trailer?.site === "youtube" ? `https://www.youtube.com/watch?v=${a.trailer.id}` : undefined,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    type,
    status,
    releaseDate: a.seasonYear ? new Date(a.seasonYear, 0, 1) : null,
    releaseYear,
    duration: a.duration || 24,
    rating: "TV-14",
    score: a.averageScore ? Number((a.averageScore / 10).toFixed(1)) : 8.8,
    matchPercentage: Math.min(99, Math.round((a.averageScore || 85) * 0.95) + 15),
    language: "Japanese",
    country: "Japan",
    views: (a.popularity || 1000) * 15,
    isFeatured: (a.averageScore || 0) >= 85,
    isTrending: a.trending > 50,
    isPopular: a.popularity > 10000,
    isUpcoming: status === "UPCOMING",
    quality: "4K UHD",
    audioSpecs: "Dolby Atmos 5.1",
    createdAt: new Date(),
    updatedAt: new Date(),
    genres: (a.genres || []).map((g, idx) => ({
      id: `genre-ani-${idx}`,
      name: g,
      slug: g.toLowerCase().replace(/\s+/g, "-"),
    })),
    cast: (a.characters?.nodes || []).map((c, idx) => ({
      id: `ani-cast-${idx}`,
      contentId: `anilist-${a.id}`,
      personId: `char-${idx}`,
      person: {
        id: `char-${idx}`,
        name: c.name.full,
        slug: c.name.full.toLowerCase().replace(/\s+/g, "-"),
        avatarUrl: c.image.medium,
      },
      character: c.name.full,
      role: "ACTOR",
      order: idx,
    })),
    directors: [],
    externalSources: [
      {
        id: `src-anilist-${a.id}`,
        contentId: `anilist-${a.id}`,
        source: "ANILIST",
        externalId: String(a.id),
        externalUrl: `https://anilist.co/anime/${a.id}`,
        lastSyncedAt: new Date(),
      },
    ],
    animeDetails: {
      id: `ani-d-${a.id}`,
      contentId: `anilist-${a.id}`,
      seasonYear: a.seasonYear,
      seasonPeriod: a.season,
      episodesCount: a.episodes || 12,
      airingSchedule: a.nextAiringEpisode ? `Episode ${a.nextAiringEpisode.episode} airing soon` : "Completed",
      nextAiringDate: a.nextAiringEpisode ? new Date(a.nextAiringEpisode.airingAt * 1000) : null,
      format: a.format,
      studio: a.studios.nodes[0]?.name || "Anime Studio",
    },
  };
}

export class SynchronizationEngine {
  private isSyncing = false;

  public async runFullSync(triggeredBy: "CRON" | "MANUAL" = "MANUAL"): Promise<SyncHistoryRecord> {
    if (this.isSyncing) {
      throw new Error("Synchronization is already running in background.");
    }

    this.isSyncing = true;
    const historyId = `sync-${Date.now()}`;
    const startedAt = new Date();
    const errors: string[] = [];

    const historyRecord: SyncHistoryRecord = {
      id: historyId,
      source: "ALL",
      status: "RUNNING",
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      errorsJson: [],
      startedAt,
      triggeredBy,
    };

    syncHistoryStore.unshift(historyRecord);

    try {
      // 1. Sync TMDB Trending Movies & Upcoming
      let tmdbMovies: ContentItem[] = [];
      try {
        const trendingRaw = await tmdb.getTrendingMovies("week");
        const upcomingRaw = await tmdb.getUpcomingMovies(1);
        const topRatedRaw = await tmdb.getTopRatedMovies(1);

        const allRawMovies = [...trendingRaw, ...upcomingRaw, ...topRatedRaw];
        const uniqueRawMovies = Array.from(new Map(allRawMovies.map((m) => [m.id, m])).values());

        tmdbMovies = uniqueRawMovies.map((m) =>
          normalizeTmdbMovie(m, upcomingRaw.some((u) => u.id === m.id))
        );
        historyRecord.itemsProcessed += tmdbMovies.length;
      } catch (err: any) {
        errors.push(`TMDB Movies Sync Error: ${err.message}`);
        historyRecord.itemsFailed++;
      }

      // 2. Sync TMDB Trending Series & Top Rated Series
      let tmdbSeriesList: ContentItem[] = [];
      try {
        const trendingSeriesRaw = await tmdb.getTrendingSeries("week");
        const popularSeriesRaw = await tmdb.getPopularSeries(1);
        const allRawSeries = [...trendingSeriesRaw, ...popularSeriesRaw];
        const uniqueRawSeries = Array.from(new Map(allRawSeries.map((s) => [s.id, s])).values());

        tmdbSeriesList = uniqueRawSeries.map(normalizeTmdbSeries);
        historyRecord.itemsProcessed += tmdbSeriesList.length;
      } catch (err: any) {
        errors.push(`TMDB Series Sync Error: ${err.message}`);
        historyRecord.itemsFailed++;
      }

      // 3. Sync AniList Trending, Airing & Popular Anime
      let animeList: ContentItem[] = [];
      try {
        const trendingAnimeRaw = await anilist.getTrendingAnime(15);
        const airingAnimeRaw = await anilist.getAiringAnime(15);
        const popularAnimeRaw = await anilist.getPopularAnime(15);

        const allRawAnime = [...trendingAnimeRaw, ...airingAnimeRaw, ...popularAnimeRaw];
        const uniqueRawAnime = Array.from(new Map(allRawAnime.map((a) => [a.id, a])).values());

        animeList = uniqueRawAnime.map(normalizeAniListMedia);
        historyRecord.itemsProcessed += animeList.length;
      } catch (err: any) {
        errors.push(`AniList Sync Error: ${err.message}`);
        historyRecord.itemsFailed++;
      }

      // 4. Merge & Deduplicate with Cached Store by canonical external source identity
      const mergedIncoming = [...tmdbMovies, ...tmdbSeriesList, ...animeList];

      const existingMap = new Map<string, ContentItem>();
      for (const existingItem of cachedContentItems) {
        existingMap.set(getCanonicalSyncKey(existingItem), existingItem);
      }

      let created = 0;
      let updated = 0;

      for (const item of mergedIncoming) {
        const canonicalKey = getCanonicalSyncKey(item);
        const sanitizedIncoming: ContentItem = {
          ...item,
          posterUrl: isValidArtworkUrl(item.posterUrl) ? item.posterUrl : "",
          backdropUrl: isValidArtworkUrl(item.backdropUrl) ? item.backdropUrl : "",
        };

        if (existingMap.has(canonicalKey)) {
          // Safely merge metadata without overwriting verified artwork with empty values
          const existing = existingMap.get(canonicalKey)!;
          existingMap.set(canonicalKey, mergeContentItemSafely(existing, sanitizedIncoming));
          updated++;
        } else {
          // Add newly discovered title
          existingMap.set(canonicalKey, sanitizedIncoming);
          created++;
        }
      }

      cachedContentItems = Array.from(existingMap.values());
      historyRecord.itemsCreated = created;
      historyRecord.itemsUpdated = updated;
      historyRecord.status = errors.length > 0 ? "PARTIAL" : "SUCCESS";
      historyRecord.errorsJson = errors;
      historyRecord.completedAt = new Date();
      lastSyncTimestamp = new Date();

      return historyRecord;
    } catch (criticalErr: any) {
      historyRecord.status = "FAILED";
      errors.push(`Critical Sync Failure: ${criticalErr.message}`);
      historyRecord.errorsJson = errors;
      historyRecord.completedAt = new Date();
      return historyRecord;
    } finally {
      this.isSyncing = false;
    }
  }

  public getSyncStatus() {
    const nextSync = lastSyncTimestamp
      ? new Date(lastSyncTimestamp.getTime() + 6 * 60 * 60 * 1000)
      : new Date(Date.now() + 6 * 60 * 60 * 1000);

    return {
      isSyncing: this.isSyncing,
      lastSyncTimestamp,
      nextSyncTimestamp: nextSync,
      totalTitles: cachedContentItems.length,
      totalMovies: cachedContentItems.filter((c) => c.type === "MOVIE").length,
      totalSeries: cachedContentItems.filter((c) => c.type === "SERIES").length,
      totalAnime: cachedContentItems.filter((c) => c.type === "ANIME_MOVIE" || c.type === "ANIME_SERIES").length,
      upcomingCount: cachedContentItems.filter((c) => c.isUpcoming).length,
      recentHistory: syncHistoryStore.slice(0, 10),
    };
  }

  public getAllContent(): ContentItem[] {
    return cachedContentItems;
  }

  public setInitialContent(items: ContentItem[]) {
    if (cachedContentItems.length === 0) {
      cachedContentItems = items;
    }
  }
}

export const syncEngine = new SynchronizationEngine();
