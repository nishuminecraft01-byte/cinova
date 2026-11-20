// Database Types & Interfaces matching prisma/schema.prisma

export type ContentType =
  | "MOVIE"
  | "SERIES"
  | "ANIME_MOVIE"
  | "ANIME_SERIES"
  | "DOCUMENTARY";

export type ReleaseStatus =
  | "RELEASED"
  | "AIRING"
  | "UPCOMING"
  | "PLANNED"
  | "CANCELLED";

export type ExternalSourceType = "TMDB" | "ANILIST" | "IMDB" | "MAL";

export type SyncStatus = "SUCCESS" | "PARTIAL" | "FAILED" | "RUNNING";

export type PersonRole =
  | "ACTOR"
  | "DIRECTOR"
  | "WRITER"
  | "PRODUCER"
  | "COMPOSER";

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Person {
  id: string;
  name: string;
  slug: string;
  biography?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | Date | null;
}

export interface CastMember {
  id: string;
  contentId: string;
  personId: string;
  person: Person;
  character?: string | null;
  role: PersonRole;
  order: number;
}

export interface Episode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string | null;
  duration?: number | null; // runtime in minutes
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  airDate?: string | Date | null;
}

export interface Season {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  synopsis?: string | null;
  posterUrl?: string | null;
  airDate?: string | Date | null;
  episodes: Episode[];
}

export interface MovieDetails {
  id: string;
  contentId: string;
  budget?: number | bigint | null;
  revenue?: number | bigint | null;
  boxOfficeRank?: number | null;
}

export interface SeriesDetails {
  id: string;
  contentId: string;
  totalSeasons: number;
  totalEpisodes: number;
  network?: string | null;
  seasons: Season[];
}

export interface AnimeDetails {
  id: string;
  contentId: string;
  seasonYear?: number | null;
  seasonPeriod?: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  episodesCount?: number | null;
  airingSchedule?: string | null;
  nextAiringDate?: string | Date | null;
  format?: string | null;
  studio?: string | null;
  sourceMaterial?: string | null;
}

export interface ExternalSource {
  id: string;
  contentId: string;
  source: ExternalSourceType;
  externalId: string;
  externalUrl?: string | null;
  lastSyncedAt: string | Date;
  metadataJson?: any;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string | null;
  tagline?: string | null;
  synopsis: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  videoUrl?: string | null;
  type: ContentType;
  status: ReleaseStatus;
  releaseDate?: string | Date | null;
  releaseYear: number;
  duration?: number | null;
  rating?: string | null;
  score: number; // 0.0 - 10.0
  matchPercentage: number; // 0 - 100
  language: string;
  country?: string | null;
  views: number;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  isUpcoming: boolean;
  quality: string;
  audioSpecs: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relations
  genres: Genre[];
  cast: CastMember[];
  directors: Person[];
  externalSources: ExternalSource[];
  movieDetails?: MovieDetails | null;
  seriesDetails?: SeriesDetails | null;
  animeDetails?: AnimeDetails | null;
}

export interface SyncHistoryRecord {
  id: string;
  source: "TMDB" | "ANILIST" | "ALL";
  status: SyncStatus;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorsJson?: string[] | any;
  startedAt: string | Date;
  completedAt?: string | Date | null;
  triggeredBy: "CRON" | "MANUAL" | "WEBHOOK";
}
