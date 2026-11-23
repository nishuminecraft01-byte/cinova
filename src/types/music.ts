export type MusicSource = "mainstream" | "jamendo" | "audius" | "dsp" | "audio" | "youtube";
export type PlaybackType = "audio" | "licensed_stream" | "discovery_only" | "youtube_embed";

export interface TrackLicense {
  licenseUrl?: string;
  licenseName?: string;
  isStreamable: boolean;
  isDownloadAllowed?: boolean;
  isCommercialAllowed: boolean;
  attributionRequired: boolean;
  licensingNotice?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  albumId?: string;
  coverUrl: string;
  audioUrl?: string; // Direct audio streaming URL (Jamendo / Audius / Licensed DSP)
  duration: number; // in seconds
  durationText?: string; // Formatted duration e.g. "3:45"
  genre: string;
  category?: string; // 12 standard categories
  year?: number;
  plays?: number;
  featured?: boolean;
  trending?: boolean;
  lyrics?: string[];
  license?: TrackLicense;
  source: MusicSource;
  playbackType: PlaybackType;
  youtubeId?: string;
  channelTitle?: string;
  viewCountText?: string;
  language?: string; // e.g. "hindi", "marathi", "punjabi", "korean", "spanish", "english", etc.
  nativeTitle?: string; // Native script title e.g. "아파트", "アイドル", "نور العين"
  aliases?: string[]; // Transliterated/common misspellings e.g. ["toba toba", "chalya", "apateu"]
  isOfficialChannel?: boolean;
  isOfficialVideo?: boolean;
  isNew?: boolean; // Discovered in the last 7 days
  description?: string;
  publishedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  releaseYear: number;
  genre: string;
  description: string;
  songs: Song[];
  trending?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  headerUrl?: string;
  bio: string;
  genres: string[];
  monthlyListeners: string;
  topSongs: Song[];
  albums: Album[];
  popular?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl: string;
  description: string;
  curator: string;
  songs: Song[];
  topPlaylist?: boolean;
}

export interface MusicCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  query?: string;
}

/**
 * 12 Mandatory CINOVA Music Catalogue Categories
 */
export const MUSIC_CATEGORIES: MusicCategoryItem[] = [
  { id: "bollywood", name: "Bollywood Hits", slug: "bollywood", description: "Iconic Hindi Cinema Anthems & Blockbuster Soundtracks", tagline: "Blockbuster Soundtracks" },
  { id: "hindi", name: "Hindi Songs", slug: "hindi", description: "Soulful Melodies, Indie Pop & Heartfelt Hindi Ballads", tagline: "Soulful Melodies" },
  { id: "punjabi", name: "Punjabi Hits", slug: "punjabi", description: "High-Octane Punjabi Anthems, Bhangra & Urban Hip-Hop", tagline: "Urban Punjabi Beats" },
  { id: "marathi", name: "Marathi Songs", slug: "marathi", description: "Authentic Marathi Film Hits, Folk Fusion & Modern Classics", tagline: "Cultural Anthems" },
  { id: "english", name: "English Hits", slug: "english", description: "Global Billboard Top Tracks, Pop Sensations & Chart Toppers", tagline: "Global Billboard Hits" },
  { id: "romantic", name: "Romantic", slug: "romantic", description: "Timeless Love Songs, Serene Duets & Emotional Ballads", tagline: "Timeless Love Songs" },
  { id: "party", name: "Party", slug: "party", description: "High-Energy Club Bangers, Dance Anthems & Celebration Beats", tagline: "Club & Dance Bangers" },
  { id: "trending", name: "Trending", slug: "trending", description: "The Hottest Viral Hits & Most-Streamed Tracks Right Now", tagline: "Viral Sensations" },
  { id: "old-classics", name: "Old Classics", slug: "old-classics", description: "Golden Era Melodies, Vintage Treasures & Nostalgic Masterpieces", tagline: "Golden Era Nostalgia" },
  { id: "latest-releases", name: "Latest Releases", slug: "latest-releases", description: "Brand-New Singles, Fresh Album Drops & Contemporary Hits", tagline: "Fresh Album Drops" },
  { id: "sad-songs", name: "Sad Songs", slug: "sad-songs", description: "Deeply Moving Melodies, Heartbreak Ballads & Melancholy Tunes", tagline: "Heartbreak & Solitude" },
  { id: "devotional", name: "Devotional", slug: "devotional", description: "Peaceful Prayers, Spiritual Mantras & Sacred Bhajans", tagline: "Sacred Spiritual Peace" },
];

export interface MusicGenre {
  id: string;
  name: string;
  description?: string;
  bannerUrl: string;
}

export type RepeatMode = "off" | "all" | "one";
