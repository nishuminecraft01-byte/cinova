export type WorldwideMediaType = "movie" | "tv";

export interface WorldwideTrailerInfo {
  key: string; // e.g. "bJCiuJe--jw"
  name: string; // e.g. "Official Trailer [Subtitled]"
  site: string; // "YouTube"
  type: string; // "Trailer" | "Teaser" | "Clip"
  official: boolean;
}

export interface WatchProviderItem {
  id: number;
  name: string;
  logoUrl: string;
  displayPriority: number;
}

export interface CountryWatchProviders {
  countryCode: string;
  countryName: string;
  link?: string;
  flatrate: WatchProviderItem[]; // Subscription
  rent: WatchProviderItem[]; // Rent
  buy: WatchProviderItem[]; // Buy
  ads: WatchProviderItem[]; // Free with Ads
  free: WatchProviderItem[]; // Free
}

export const SUPPORTED_WATCH_COUNTRIES: ReadonlyArray<{ code: string; name: string; flag: string }> = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
];

export interface WorldwideCatalogItem {
  id: string; // Stable ID: "tmdb-movie-123" or "tmdb-tv-456" (or curated local id when matched)
  tmdbId: number;
  mediaType: WorldwideMediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  releaseYear: number | null;
  rating: number;
  voteCount: number;
  popularity: number;
  originalLanguage: string;
  originalLanguageLabel: string;
  genreIds: number[];
  genres: string[];
  originCountries: string[];
  /** True ONLY when matched to a curated playable CINOVA vault record; never fabricated for metadata-only TMDB items. */
  hasLicensedStream: boolean;
  localId?: string;
  detailHref: string;
  trailerKey?: string | null;
  hasOfficialTrailer?: boolean;
}

export interface WorldwideDetailData extends WorldwideCatalogItem {
  tagline: string;
  runtimeMinutes: number | null;
  status: string;
  spokenLanguages: string[];
  productionCountries: string[];
  certification: string | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
    airDate: string;
    posterUrl: string;
    overview: string;
  }>;
  directors: Array<{
    id: number;
    name: string;
    job: string;
    profileUrl: string;
  }>;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profileUrl: string;
  }>;
  similar: WorldwideCatalogItem[];
  recommendations: WorldwideCatalogItem[];
  trailer?: WorldwideTrailerInfo | null;
  trailerKey?: string | null;
  trailerUrl?: string | null;
  trailerName?: string | null;
  hasOfficialTrailer: boolean;
  watchProviders?: Record<string, CountryWatchProviders> | null;
}

export interface WorldwideCollectionPreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  defaultMediaType: WorldwideMediaType;
  language?: string;
  originCountry?: string;
  genreId?: string;
  sortBy?: string;
}

export const WORLDWIDE_COLLECTIONS: readonly WorldwideCollectionPreset[] = [
  {
    id: "all",
    label: "Worldwide Popular",
    shortLabel: "Worldwide",
    description: "Popular global releases across every region and language.",
    defaultMediaType: "movie",
  },
  {
    id: "hollywood",
    label: "Hollywood",
    shortLabel: "Hollywood",
    description: "Major English-language studio releases from the United States.",
    defaultMediaType: "movie",
    language: "en",
    originCountry: "US",
  },
  {
    id: "bollywood",
    label: "Bollywood",
    shortLabel: "Bollywood",
    description: "Hindi mainstream cinema and pan-Indian blockbusters from India.",
    defaultMediaType: "movie",
    language: "hi",
    originCountry: "IN",
  },
  {
    id: "hindi",
    label: "Hindi Films",
    shortLabel: "Hindi",
    description: "Hindi-language feature films and acclaimed Indian dramas.",
    defaultMediaType: "movie",
    language: "hi",
  },
  {
    id: "tamil",
    label: "Tamil Films",
    shortLabel: "Tamil",
    description: "Kollywood action, thrillers, and award-winning Tamil cinema.",
    defaultMediaType: "movie",
    language: "ta",
  },
  {
    id: "telugu",
    label: "Telugu Films",
    shortLabel: "Telugu",
    description: "Tollywood epics, high-octane action, and Telugu cinema.",
    defaultMediaType: "movie",
    language: "te",
  },
  {
    id: "marathi",
    label: "Marathi Films",
    shortLabel: "Marathi",
    description: "Critically acclaimed Marathi storytelling and regional cinema.",
    defaultMediaType: "movie",
    language: "mr",
  },
  {
    id: "malayalam",
    label: "Malayalam Films",
    shortLabel: "Malayalam",
    description: "Mollywood realism, thrillers, and celebrated Malayalam films.",
    defaultMediaType: "movie",
    language: "ml",
  },
  {
    id: "korean",
    label: "Korean Movies & Dramas",
    shortLabel: "Korean",
    description: "Korean cinema and K-Dramas from South Korea.",
    defaultMediaType: "tv",
    language: "ko",
    originCountry: "KR",
  },
  {
    id: "japanese",
    label: "Japanese Movies & Anime",
    shortLabel: "Japanese & Anime",
    description: "Japanese animation, anime series, and live-action cinema.",
    defaultMediaType: "tv",
    language: "ja",
    originCountry: "JP",
  },
  {
    id: "chinese",
    label: "Chinese Movies & Series",
    shortLabel: "Chinese",
    description: "Mandarin and Cantonese cinema and television series.",
    defaultMediaType: "movie",
    language: "zh",
  },
  {
    id: "spanish",
    label: "Spanish-Language Content",
    shortLabel: "Spanish",
    description: "Films and series from Spain, Mexico, Argentina, and Latin America.",
    defaultMediaType: "movie",
    language: "es",
  },
  {
    id: "south-indian",
    label: "South Indian Cinema",
    shortLabel: "South Indian",
    description: "Tamil, Telugu, Malayalam, and Kannada cinema from South India.",
    defaultMediaType: "movie",
    language: "ta|te|ml|kn",
    originCountry: "IN",
  },
  {
    id: "turkish",
    label: "Turkish Cinema & Series",
    shortLabel: "Turkish",
    description: "Popular Turkish dramas, thrillers, and acclaimed feature films.",
    defaultMediaType: "tv",
    language: "tr",
    originCountry: "TR",
  },
  {
    id: "thai",
    label: "Thai Movies & Series",
    shortLabel: "Thai",
    description: "Action, horror, romance, and series from Thailand.",
    defaultMediaType: "movie",
    language: "th",
    originCountry: "TH",
  },
  {
    id: "indonesian",
    label: "Indonesian Cinema",
    shortLabel: "Indonesian",
    description: "Indonesian martial arts, horror, drama, and regional cinema.",
    defaultMediaType: "movie",
    language: "id",
    originCountry: "ID",
  },
  {
    id: "european",
    label: "European Cinema",
    shortLabel: "European",
    description: "Acclaimed films and series from France, Germany, Italy, UK, and Scandinavia.",
    defaultMediaType: "movie",
    originCountry: "FR|DE|IT|GB|SE|DK|NO|NL|BE|PL",
  },
  {
    id: "documentary",
    label: "International Documentaries",
    shortLabel: "Documentaries",
    description: "Non-fiction cinema, science, nature, and global investigative docs.",
    defaultMediaType: "movie",
    genreId: "99",
  },
] as const;

export const WORLDWIDE_LANGUAGES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "pa", label: "Punjabi" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "tr", label: "Turkish" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "ar", label: "Arabic" },
  { code: "sv", label: "Swedish" },
];

export const WORLDWIDE_COUNTRIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "", label: "All Regions" },
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "KR", label: "South Korea" },
  { code: "JP", label: "Japan" },
  { code: "CN", label: "China" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "DE", label: "Germany" },
  { code: "TR", label: "Turkey" },
  { code: "TH", label: "Thailand" },
  { code: "ID", label: "Indonesia" },
  { code: "HK", label: "Hong Kong" },
  { code: "TW", label: "Taiwan" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "SE", label: "Sweden" },
];

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export const WORLDWIDE_GENRE_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "", label: "All Genres" },
  { id: "28", label: "Action" },
  { id: "12", label: "Adventure" },
  { id: "16", label: "Animation / Anime" },
  { id: "35", label: "Comedy" },
  { id: "80", label: "Crime" },
  { id: "99", label: "Documentary" },
  { id: "18", label: "Drama" },
  { id: "10751", label: "Family" },
  { id: "14", label: "Fantasy" },
  { id: "36", label: "History" },
  { id: "27", label: "Horror" },
  { id: "9648", label: "Mystery" },
  { id: "10749", label: "Romance" },
  { id: "878", label: "Sci-Fi" },
  { id: "53", label: "Thriller" },
  { id: "10752", label: "War" },
];

export const WORLDWIDE_SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "newest", label: "Newest Releases" },
  { value: "vote_count.desc", label: "Most Voted" },
];

export function getLanguageDisplayName(isoCode?: string | null): string {
  if (!isoCode) return "International";
  const lower = isoCode.toLowerCase();
  const match = WORLDWIDE_LANGUAGES.find((l) => l.code === lower);
  return match ? match.label : lower.toUpperCase();
}

export function getCollectionPreset(collectionId?: string | null): WorldwideCollectionPreset {
  if (!collectionId) return WORLDWIDE_COLLECTIONS[0];
  return (
    WORLDWIDE_COLLECTIONS.find((c) => c.id === collectionId.toLowerCase()) ||
    WORLDWIDE_COLLECTIONS[0]
  );
}

/** Map unified movie genre IDs to TV genre IDs where TMDB differs (e.g. Action 28 -> 10759, Sci-Fi 878 -> 10765). */
export function mapGenreIdForMediaType(
  genreId: string,
  mediaType: WorldwideMediaType
): string {
  if (!genreId) return "";
  if (mediaType === "tv") {
    if (genreId === "28" || genreId === "12") return "10759";
    if (genreId === "878" || genreId === "14") return "10765";
    if (genreId === "10752") return "10768";
  }
  return genreId;
}

export interface CatalogFeedDefinition {
  id: string;
  title: string;
  badge?: string;
  description: string;
  exploreHref: string;
  cardAspect?: "poster" | "landscape";
  /** Refresh interval in seconds for server-side cache & revalidation */
  revalidateSeconds: number;
}

export const HOMEPAGE_CATALOG_RAILS: readonly CatalogFeedDefinition[] = [
  {
    id: "trending-worldwide",
    title: "Trending Worldwide",
    badge: "Live Global",
    description: "The hottest movies and TV shows trending across the globe this week.",
    exploreHref: "/search?feed=trending-worldwide",
    cardAspect: "landscape",
    revalidateSeconds: 900,
  },
  {
    id: "popular-today",
    title: "Popular Today",
    badge: "Updated Daily",
    description: "Today's most talked-about feature films worldwide.",
    exploreHref: "/search?feed=popular-today",
    cardAspect: "poster",
    revalidateSeconds: 900,
  },
  {
    id: "blockbuster-movies",
    title: "Blockbuster Movies",
    badge: "Global Hits",
    description: "Massive crowd-pleasing films dominating worldwide charts.",
    exploreHref: "/search?feed=blockbuster-movies",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "latest-releases",
    title: "Latest Releases",
    badge: "Now Playing",
    description: "Fresh theatrical and new releases playing worldwide right now.",
    exploreHref: "/search?feed=latest-releases",
    cardAspect: "landscape",
    revalidateSeconds: 1800,
  },
  {
    id: "upcoming-movies",
    title: "Upcoming Movies",
    badge: "Coming Soon",
    description: "Anticipated global films arriving in theaters and catalogs soon.",
    exploreHref: "/search?feed=upcoming-movies",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "top-rated-movies",
    title: "Top Rated Movies",
    badge: "Acclaimed",
    description: "Highest-rated masterpieces across world cinema history.",
    exploreHref: "/search?feed=top-rated-movies",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "popular-tv",
    title: "Popular TV Shows",
    badge: "Series",
    description: "Most popular television dramas, thrillers, and shows globally.",
    exploreHref: "/search?feed=popular-tv",
    cardAspect: "landscape",
    revalidateSeconds: 1800,
  },
  {
    id: "trending-tv",
    title: "Trending TV Shows",
    badge: "This Week",
    description: "Binge-worthy TV series rising fastest worldwide.",
    exploreHref: "/search?feed=trending-tv",
    cardAspect: "poster",
    revalidateSeconds: 900,
  },
  {
    id: "top-rated-tv",
    title: "Top Rated Series",
    badge: "Prestige TV",
    description: "Critically acclaimed television series from every continent.",
    exploreHref: "/search?feed=top-rated-tv",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "korean-dramas",
    title: "Korean Dramas",
    badge: "K-Drama",
    description: "Popular South Korean television dramas and thrillers.",
    exploreHref: "/search?collection=korean&type=tv",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "japanese-cinema",
    title: "Japanese Cinema",
    badge: "Japan",
    description: "Live-action Japanese films, acclaimed dramas, and theatrical features.",
    exploreHref: "/search?language=ja&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "anime-collection",
    title: "Anime Collection",
    badge: "Animation",
    description: "Japanese anime series and animated worlds loved worldwide.",
    exploreHref: "/search?type=anime",
    cardAspect: "landscape",
    revalidateSeconds: 1800,
  },
  {
    id: "bollywood-hits",
    title: "Bollywood Hits",
    badge: "Hindi",
    description: "Popular Hindi mainstream films and Indian blockbusters.",
    exploreHref: "/search?collection=bollywood&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "south-indian",
    title: "South Indian Cinema",
    badge: "Tamil · Telugu · Malayalam · Kannada",
    description: "Action epics, gripping thrillers, and dramas across South India.",
    exploreHref: "/search?collection=south-indian&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "marathi-movies",
    title: "Marathi Movies",
    badge: "Marathi",
    description: "Celebrated Marathi cinema and regional storytelling from Maharashtra.",
    exploreHref: "/search?collection=marathi&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "hollywood-collection",
    title: "Hollywood Collection",
    badge: "USA",
    description: "English-language studio hits and iconic Hollywood releases.",
    exploreHref: "/search?collection=hollywood&type=movie",
    cardAspect: "landscape",
    revalidateSeconds: 1800,
  },
  {
    id: "international-cinema",
    title: "International Cinema",
    badge: "World Film",
    description: "Acclaimed films from France, Spain, Italy, Germany, Turkey, Thailand & Indonesia.",
    exploreHref: "/search?feed=international-cinema",
    cardAspect: "poster",
    revalidateSeconds: 1800,
  },
  {
    id: "crime-thriller",
    title: "Crime & Thriller",
    badge: "Suspense",
    description: "High-stakes mysteries, neo-noir crime sagas, and edge-of-seat thrillers.",
    exploreHref: "/search?genre=53&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "horror-nights",
    title: "Horror Nights",
    badge: "Chills",
    description: "Supernatural hauntings, psychological horror, and global fright cinema.",
    exploreHref: "/search?genre=27&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "scifi-universe",
    title: "Sci-Fi Universe",
    badge: "Futuristic",
    description: "Space odysseys, dystopian worlds, and mind-bending science fiction.",
    exploreHref: "/search?genre=878&type=movie",
    cardAspect: "landscape",
    revalidateSeconds: 3600,
  },
  {
    id: "romance-collection",
    title: "Romance Collection",
    badge: "Love Stories",
    description: "Heartfelt romantic dramas and timeless love stories worldwide.",
    exploreHref: "/search?genre=10749&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "action-adventure",
    title: "Action & Adventure",
    badge: "Adrenaline",
    description: "Explosive set-pieces, martial arts, and epic quests.",
    exploreHref: "/search?genre=28&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "comedy",
    title: "Comedy",
    badge: "Laughs",
    description: "Feel-good comedies, sharp satires, and global crowd favorites.",
    exploreHref: "/search?genre=35&type=movie",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    badge: "Under The Radar",
    description: "Highly rated, lesser-known cinematic treasures from around the world.",
    exploreHref: "/search?feed=hidden-gems",
    cardAspect: "poster",
    revalidateSeconds: 3600,
  },
  {
    id: "most-watched-cinova",
    title: "Most Watched on CINOVA",
    badge: "Trending on CINOVA",
    description: "Titles capturing the most attention and active viewing on CINOVA.",
    exploreHref: "/search?feed=most-watched-cinova",
    cardAspect: "landscape",
    revalidateSeconds: 900,
  },
  {
    id: "documentaries",
    title: "Documentaries",
    badge: "Non-Fiction",
    description: "Real-world investigations, nature, history, and global documentary cinema.",
    exploreHref: "/search?collection=documentary&type=movie",
    cardAspect: "landscape",
    revalidateSeconds: 3600,
  },
] as const;

export function getCatalogFeedDefinition(feedId?: string | null): CatalogFeedDefinition | null {
  if (!feedId) return null;
  const lower = feedId.trim().toLowerCase();
  return HOMEPAGE_CATALOG_RAILS.find((f) => f.id === lower) || null;
}
