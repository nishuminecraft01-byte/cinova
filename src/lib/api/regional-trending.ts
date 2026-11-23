import { NextRequest } from "next/server";
import { Song, TrackLicense } from "@/types/music";
import { MAINSTREAM_TRACKS, MAINSTREAM_LICENSE } from "@/lib/api/mainstream-client";
import { getYouTubeApiKey } from "@/lib/api/youtube-client";

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  label: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", flag: "🇮🇳", label: "India" },
  { code: "US", name: "United States", flag: "🇺🇸", label: "United States" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", label: "United Kingdom" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", label: "South Korea" },
  { code: "CA", name: "Canada", flag: "🇨🇦", label: "Canada" },
  { code: "AU", name: "Australia", flag: "🇦🇺", label: "Australia" },
  { code: "DE", name: "Germany", flag: "🇩🇪", label: "Germany" },
  { code: "GLOBAL", name: "Global", flag: "🌐", label: "Worldwide" },
];

export function getCountryInfo(code?: string | null): CountryInfo {
  const cleanCode = (code || "").toUpperCase().trim();
  const match = SUPPORTED_COUNTRIES.find((c) => c.code === cleanCode);
  return match || SUPPORTED_COUNTRIES[0]; // Default India
}

/**
 * Server-side country detection from Cloudflare headers, edge context, or manual query param
 */
export function detectUserCountry(request: NextRequest): CountryInfo {
  // 1. User manual override via query param
  const queryCountry = request.nextUrl.searchParams.get("country");
  if (queryCountry) {
    return getCountryInfo(queryCountry);
  }

  // 2. Cloudflare request.cf.country or cf-ipcountry header
  const cfHeader = request.headers.get("cf-ipcountry");
  if (cfHeader && cfHeader.length === 2 && cfHeader !== "XX") {
    return getCountryInfo(cfHeader);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfContext = (request as any).cf?.country;
  if (cfContext && typeof cfContext === "string" && cfContext.length === 2) {
    return getCountryInfo(cfContext);
  }

  // 3. Vercel edge header
  const vercelHeader = request.headers.get("x-vercel-ip-country");
  if (vercelHeader && vercelHeader.length === 2) {
    return getCountryInfo(vercelHeader);
  }

  // 4. Generic country header or default env
  const genericHeader = request.headers.get("x-country-code");
  if (genericHeader && genericHeader.length === 2) {
    return getCountryInfo(genericHeader);
  }

  const defaultEnv = process.env.DEFAULT_COUNTRY_CODE;
  return getCountryInfo(defaultEnv || "IN");
}

// Country-specific verified catalogues with genuine 1080p official music video artwork
const REGIONAL_CATALOGUES: Record<string, Song[]> = {
  // INDIA (Hindi, Punjabi, Marathi, Devotional, Bollywood)
  IN: MAINSTREAM_TRACKS,

  // UNITED STATES (Billboard Top Hits, Pop, Hip-Hop, R&B)
  US: [
    {
      id: "us-die-with-a-smile",
      title: "Die With A Smile",
      artist: "Lady Gaga & Bruno Mars",
      artistId: "artist-bruno-mars",
      album: "Die With A Smile",
      coverUrl: "https://i.ytimg.com/vi/kPa7bsKwL-c/maxresdefault.jpg",
      youtubeId: "kPa7bsKwL-c",
      duration: 251,
      durationText: "4:11",
      genre: "Pop Soul",
      category: "english",
      year: 2024,
      plays: 490000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-blinding-lights",
      title: "Blinding Lights",
      artist: "The Weeknd",
      artistId: "artist-the-weeknd",
      album: "After Hours",
      coverUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg",
      youtubeId: "4NRXx6U8ABQ",
      duration: 200,
      durationText: "3:20",
      genre: "Synthwave Pop",
      category: "english",
      year: 2020,
      plays: 950000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-cruel-summer",
      title: "Cruel Summer",
      artist: "Taylor Swift",
      artistId: "artist-taylor-swift",
      album: "Lover",
      coverUrl: "https://i.ytimg.com/vi/ic8j13piAhQ/maxresdefault.jpg",
      youtubeId: "ic8j13piAhQ",
      duration: 178,
      durationText: "2:58",
      genre: "Electropop",
      category: "english",
      year: 2019,
      plays: 820000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-birds-of-a-feather",
      title: "Birds of a Feather",
      artist: "Billie Eilish",
      artistId: "artist-billie-eilish",
      album: "Hit Me Hard and Soft",
      coverUrl: "https://i.ytimg.com/vi/V9PVRfjEBTI/maxresdefault.jpg",
      youtubeId: "V9PVRfjEBTI",
      duration: 198,
      durationText: "3:18",
      genre: "Indie Pop",
      category: "english",
      year: 2024,
      plays: 680000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-espresso",
      title: "Espresso",
      artist: "Sabrina Carpenter",
      artistId: "artist-sabrina-carpenter",
      album: "Short n' Sweet",
      coverUrl: "https://i.ytimg.com/vi/eVli-tstM5E/maxresdefault.jpg",
      youtubeId: "eVli-tstM5E",
      duration: 175,
      durationText: "2:55",
      genre: "Pop Funk",
      category: "english",
      year: 2024,
      plays: 720000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-starboy",
      title: "Starboy",
      artist: "The Weeknd ft. Daft Punk",
      artistId: "artist-the-weeknd",
      album: "Starboy",
      coverUrl: "https://i.ytimg.com/vi/34Na4j8AVgA/maxresdefault.jpg",
      youtubeId: "34Na4j8AVgA",
      duration: 230,
      durationText: "3:50",
      genre: "R&B / Pop",
      category: "english",
      year: 2016,
      plays: 890000000,
      trending: false,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-not-like-us",
      title: "Not Like Us",
      artist: "Kendrick Lamar",
      artistId: "artist-kendrick-lamar",
      album: "Not Like Us - Single",
      coverUrl: "https://i.ytimg.com/vi/H58vbez_m4E/maxresdefault.jpg",
      youtubeId: "H58vbez_m4E",
      duration: 274,
      durationText: "4:34",
      genre: "West Coast Hip-Hop",
      category: "english",
      year: 2024,
      plays: 850000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "us-24k-magic",
      title: "24K Magic",
      artist: "Bruno Mars",
      artistId: "artist-bruno-mars",
      album: "24K Magic",
      coverUrl: "https://i.ytimg.com/vi/UqyT8IEBkvY/maxresdefault.jpg",
      youtubeId: "UqyT8IEBkvY",
      duration: 226,
      durationText: "3:46",
      genre: "Funk / Party",
      category: "english",
      year: 2016,
      plays: 740000000,
      trending: false,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
  ],

  // SOUTH KOREA (K-Pop, Global Korean Hits)
  KR: [
    {
      id: "kr-apt",
      title: "APT.",
      artist: "ROSÉ & Bruno Mars",
      artistId: "artist-rose",
      album: "rosie",
      coverUrl: "https://i.ytimg.com/vi/ekr2nIex040/maxresdefault.jpg",
      youtubeId: "ekr2nIex040",
      duration: 173,
      durationText: "2:53",
      genre: "K-Pop Punk",
      category: "international",
      year: 2024,
      plays: 560000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "kr-seven",
      title: "Seven (feat. Latto)",
      artist: "Jung Kook",
      artistId: "artist-jungkook",
      album: "GOLDEN",
      coverUrl: "https://i.ytimg.com/vi/QU9c0053UAU/maxresdefault.jpg",
      youtubeId: "QU9c0053UAU",
      duration: 226,
      durationText: "3:46",
      genre: "K-Pop UK Garage",
      category: "international",
      year: 2023,
      plays: 910000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "kr-dynamite",
      title: "Dynamite",
      artist: "BTS",
      artistId: "artist-bts",
      album: "BE",
      coverUrl: "https://i.ytimg.com/vi/gdZLi9oWNZg/maxresdefault.jpg",
      youtubeId: "gdZLi9oWNZg",
      duration: 223,
      durationText: "3:43",
      genre: "Disco Pop",
      category: "international",
      year: 2020,
      plays: 1600000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "kr-super-shy",
      title: "Super Shy",
      artist: "NewJeans",
      artistId: "artist-newjeans",
      album: "Get Up",
      coverUrl: "https://i.ytimg.com/vi/ArmDp-zijuc/maxresdefault.jpg",
      youtubeId: "ArmDp-zijuc",
      duration: 154,
      durationText: "2:34",
      genre: "Jersey Club Pop",
      category: "international",
      year: 2023,
      plays: 470000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "kr-pink-venom",
      title: "Pink Venom",
      artist: "BLACKPINK",
      artistId: "artist-blackpink",
      album: "BORN PINK",
      coverUrl: "https://i.ytimg.com/vi/gQlMMD8auMs/maxresdefault.jpg",
      youtubeId: "gQlMMD8auMs",
      duration: 193,
      durationText: "3:13",
      genre: "K-Pop Hip-Hop",
      category: "international",
      year: 2022,
      plays: 820000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
  ],

  // UNITED KINGDOM (Official UK Charts, British Hits)
  GB: [
    {
      id: "gb-as-it-was",
      title: "As It Was",
      artist: "Harry Styles",
      artistId: "artist-harry-styles",
      album: "Harry's House",
      coverUrl: "https://i.ytimg.com/vi/H5v3kku4y6Q/maxresdefault.jpg",
      youtubeId: "H5v3kku4y6Q",
      duration: 167,
      durationText: "2:47",
      genre: "Synth Pop",
      category: "english",
      year: 2022,
      plays: 980000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "gb-easy-on-me",
      title: "Easy On Me",
      artist: "Adele",
      artistId: "artist-adele",
      album: "30",
      coverUrl: "https://i.ytimg.com/vi/U3ASj1L6_sY/maxresdefault.jpg",
      youtubeId: "U3ASj1L6_sY",
      duration: 224,
      durationText: "3:44",
      genre: "Soul Ballad",
      category: "english",
      year: 2021,
      plays: 890000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "gb-dance-the-night",
      title: "Dance The Night",
      artist: "Dua Lipa",
      artistId: "artist-dua-lipa",
      album: "Barbie The Album",
      coverUrl: "https://i.ytimg.com/vi/OiC1rgCPmUQ/maxresdefault.jpg",
      youtubeId: "OiC1rgCPmUQ",
      duration: 176,
      durationText: "2:56",
      genre: "Nu-Disco",
      category: "english",
      year: 2023,
      plays: 630000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "gb-cold-heart",
      title: "Cold Heart (PNAU Remix)",
      artist: "Elton John & Dua Lipa",
      artistId: "artist-elton-john",
      album: "The Lockdown Sessions",
      coverUrl: "https://i.ytimg.com/vi/qod03PVTLqk/maxresdefault.jpg",
      youtubeId: "qod03PVTLqk",
      duration: 203,
      durationText: "3:23",
      genre: "Dance Pop",
      category: "english",
      year: 2021,
      plays: 750000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "gb-bad-habits",
      title: "Bad Habits",
      artist: "Ed Sheeran",
      artistId: "artist-ed-sheeran",
      album: "=",
      coverUrl: "https://i.ytimg.com/vi/orJSJGHjBLI/maxresdefault.jpg",
      youtubeId: "orJSJGHjBLI",
      duration: 231,
      durationText: "3:51",
      genre: "Dance Pop",
      category: "english",
      year: 2021,
      plays: 840000000,
      trending: true,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
    {
      id: "gb-viva-la-vida",
      title: "Viva La Vida",
      artist: "Coldplay",
      artistId: "artist-coldplay",
      album: "Viva la Vida or Death and All His Friends",
      coverUrl: "https://i.ytimg.com/vi/dvgZkm1xWPE/maxresdefault.jpg",
      youtubeId: "dvgZkm1xWPE",
      duration: 242,
      durationText: "4:02",
      genre: "Baroque Pop",
      category: "english",
      year: 2008,
      plays: 990000000,
      trending: false,
      source: "mainstream",
      playbackType: "youtube_embed",
      license: MAINSTREAM_LICENSE,
    },
  ],
};

// Aliases for other countries
REGIONAL_CATALOGUES.CA = REGIONAL_CATALOGUES.US;
REGIONAL_CATALOGUES.AU = REGIONAL_CATALOGUES.GB;
REGIONAL_CATALOGUES.DE = REGIONAL_CATALOGUES.GB;
REGIONAL_CATALOGUES.GLOBAL = [
  ...REGIONAL_CATALOGUES.US.slice(0, 4),
  ...REGIONAL_CATALOGUES.IN.slice(0, 4),
  ...REGIONAL_CATALOGUES.KR.slice(0, 3),
];

export interface RegionalTrendingResult {
  countryCode: string;
  countryName: string;
  flag: string;
  label: string;
  heroTrack: Song;
  trendingTracks: Song[];
  topCharts: Song[];
  isLive: boolean;
  dataSource: "live_youtube_api" | "curated_fallback";
  fallbackReason?: string;
}

/**
 * Returns regional trending data.
 * If YouTube Data API key is configured, queries official YouTube mostPopular charts for regionCode.
 * If the API key is not configured, quota is exceeded, or API call fails, falls back to
 * the verified regional catalogue with 1080p official music video artwork and explicitly labels
 * it as curated fallback.
 */
export async function getRegionalTrendingData(
  countryCode: string = "IN",
  limit: number = 16
): Promise<RegionalTrendingResult> {
  const country = getCountryInfo(countryCode);
  const apiKey = getYouTubeApiKey();
  let fallbackReason = "YouTube Data API key not configured in environment.";

  // 1. Try official YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "snippet,contentDetails,statistics");
      url.searchParams.set("chart", "mostPopular");
      url.searchParams.set("videoCategoryId", "10"); // Music
      url.searchParams.set("regionCode", country.code === "GLOBAL" ? "US" : country.code);
      url.searchParams.set("maxResults", String(Math.min(limit, 25)));
      url.searchParams.set("key", apiKey);

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveTracks: Song[] = (data.items || []).map((item: any) => {
          const videoId = item.id;
          const snippet = item.snippet || {};
          return {
            id: `yt-trending-${videoId}`,
            youtubeId: videoId,
            title: snippet.title || "Trending Song",
            artist: snippet.channelTitle || "Official Artist",
            artistId: `artist-${snippet.channelId || videoId}`,
            coverUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            duration: 210,
            durationText: "Video",
            genre: country.name + " Top Hit",
            category: "trending",
            year: new Date(snippet.publishedAt || Date.now()).getFullYear(),
            plays: parseInt(item.statistics?.viewCount || "1000000", 10),
            trending: true,
            source: "mainstream",
            playbackType: "youtube_embed",
            license: MAINSTREAM_LICENSE,
          };
        });

        if (liveTracks.length > 0) {
          return {
            countryCode: country.code,
            countryName: country.name,
            flag: country.flag,
            label: country.label,
            heroTrack: liveTracks[0],
            trendingTracks: liveTracks,
            topCharts: liveTracks.slice(0, 5),
            isLive: true,
            dataSource: "live_youtube_api",
          };
        } else {
          fallbackReason = "YouTube Data API returned empty results for this region.";
        }
      } else {
        if (res.status === 403) {
          fallbackReason = "YouTube Data API quota exceeded or access forbidden (HTTP 403).";
        } else {
          fallbackReason = `YouTube Data API returned HTTP error ${res.status}.`;
        }
      }
    } catch (e) {
      fallbackReason = `YouTube Data API network request failed: ${e instanceof Error ? e.message : "Unknown error"}`;
      console.warn("YouTube live chart API error, falling back to verified catalogue:", e);
    }
  }

  // 2. Verified regional catalogue (curated fallback)
  const catalogue = REGIONAL_CATALOGUES[country.code] || REGIONAL_CATALOGUES.IN;
  const tracks = catalogue.slice(0, limit);
  const heroTrack = tracks[0] || MAINSTREAM_TRACKS[0];
  const topCharts = tracks.slice(0, 5);

  return {
    countryCode: country.code,
    countryName: country.name,
    flag: country.flag,
    label: country.label,
    heroTrack,
    trendingTracks: tracks,
    topCharts,
    isLive: false,
    dataSource: "curated_fallback",
    fallbackReason,
  };
}
