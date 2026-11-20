export type ContentType = "movie" | "series" | "short";

export interface CastMember {
  name: string;
  character: string;
  avatarUrl?: string;
}

export interface Episode {
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface StreamingServer {
  id: string;
  name: string;
  provider: string;
  badge: string;
  quality: string;
  type: "embed" | "direct";
  url: string;
}

export interface Movie {
  id: string;
  tmdbId?: string;
  imdbId?: string;
  franchiseId?: string;
  franchiseName?: string;
  watchOrder?: number;
  title: string;
  originalTitle?: string;
  tagline: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  trailerUrl?: string;
  duration: number; // in minutes
  releaseYear: number;
  rating: "G" | "PG" | "PG-13" | "R" | "NC-17" | "TV-14" | "TV-MA";
  imdbScore: number;
  matchPercentage: number;
  genre: string[];
  type: ContentType;
  industry?: "hollywood" | "bollywood" | "anime" | "k-drama" | "global";
  language: string;
  availableLanguages: string[];
  subtitles: string[];
  quality: "4K UHD" | "1080p FHD" | "720p HD";
  audioSpecs: string;
  directors: string[];
  cast: CastMember[];
  isTrending?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isRecentlyAdded?: boolean;
  isUpcoming?: boolean;
  isAdult?: boolean;
  views: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  seasons?: Season[];
  servers?: StreamingServer[];
}

export interface FranchiseCollection {
  id: string;
  name: string;
  category: string;
  description: string;
  backdropUrl: string;
  filmCount: number;
  firstYear: number;
  films: {
    id: string;
    title: string;
    year: number;
    tmdbId?: string;
    posterUrl?: string;
    watchOrder?: number;
  }[];
}

export interface CreatorSubmission {
  id: string;
  userId: string;
  creatorName: string;
  creatorEmail: string;
  title: string;
  synopsis: string;
  genre: string[];
  type: ContentType;
  industry?: "hollywood" | "bollywood" | "anime" | "k-drama" | "global";
  language: string;
  duration: number;
  releaseYear: number;
  videoUrl: string;
  posterUrl: string;
  backdropUrl?: string;
  rightsStatement: string;
  licenseType: "Exclusive" | "Non-Exclusive" | "Public Domain" | "Creative Commons";
  hasDistributionRights: boolean;
  status: "Pending" | "Under Review" | "Approved" | "Rejected";
  submittedAt: string;
  reviewNotes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "user" | "creator" | "admin";
  avatar: string;
  tier: "Free" | "Standard" | "Ultra";
  planExpiry?: string;
  subscription?: string;
}

export interface WatchProgress {
  movieId: string;
  progressSeconds: number;
  durationSeconds: number;
  lastWatched: string;
  completed: boolean;
  serverId?: string;
  season?: number;
  episode?: number;
}
