import { NextRequest, NextResponse } from "next/server";
import {
  searchWorldwideTracks,
  searchArtists,
  searchAlbums,
  normalizeSearchQuery,
} from "@/lib/search/smart-search-engine";
import { getDiscoveredTracks } from "@/lib/discovery/discovered-music-store";
import { searchYouTubeDataApi } from "@/lib/api/youtube-api";
import { searchJamendoTracks } from "@/lib/api/jamendo-client";
import { searchAudiusTracks } from "@/lib/api/audius-client";
import { Song, Artist, Album } from "@/types/music";

export const runtime = "nodejs";

// In-memory query cache for instant responses (100 items, 10 min TTL)
const searchCache = new Map<string, { data: any; expiry: number }>();
const SEARCH_CACHE_MAX = 100;
const SEARCH_CACHE_TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const query = rawQuery.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "24", 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const pageToken = searchParams.get("pageToken") || undefined;
    const country = searchParams.get("country") || undefined;
    const language = searchParams.get("language") || undefined;
    const tab = searchParams.get("tab") || "all";

    if (!query) {
      return NextResponse.json({
        success: true,
        tracks: [],
        artists: [],
        albums: [],
        query: "",
        didYouMean: null,
        count: 0,
        hasMore: false,
      });
    }

    // Fast Cache Check (for non-paginated requests)
    const cacheKey = !pageToken
      ? `${query.toLowerCase()}::${limit}::${offset}::${country || ""}::${language || ""}::${tab}`
      : null;

    if (cacheKey) {
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return NextResponse.json(cached.data, {
          headers: {
            "Cache-Control": "public, s-maxage=180, stale-while-revalidate=360",
            "X-Cache": "HIT",
          },
        });
      }
    }

    // A. Pagination Mode: When pageToken is present, fetch ONLY the next page from YouTube
    if (pageToken) {
      const liveResult = await searchYouTubeDataApi(
        query,
        limit,
        country,
        pageToken
      ).catch(() => ({ tracks: [] as Song[], isLive: false, nextPageToken: undefined as string | undefined }));

      return NextResponse.json({
        success: true,
        query,
        tracks: liveResult.tracks,
        artists: [],
        albums: [],
        count: liveResult.tracks.length,
        isLive: liveResult.isLive,
        nextPageToken: liveResult.nextPageToken || null,
        hasMore: Boolean(liveResult.nextPageToken),
      });
    }

    // 1. Worldwide Smart Typo-Tolerant Catalogue Search (including newly discovered dynamic songs)
    const discoveredTracks = await getDiscoveredTracks({ language, limit: 50 }).catch(() => []);
    const { tracks: localMatches, didYouMean } = searchWorldwideTracks(
      query,
      limit,
      language,
      discoveredTracks
    );

    // If a strong typo was corrected, use the corrected term to enhance YouTube discovery
    const youtubeQuery = didYouMean && localMatches.length === 0 ? didYouMean : query;

    // 2. Parallel Fetch: Live YouTube Data API (with fallback) + Independent Jamendo audio
    const [liveResult, jamendoResult, audiusTracks] = await Promise.all([
      searchYouTubeDataApi(youtubeQuery, Math.min(limit, 18), country).catch(() => ({
        tracks: [] as Song[],
        isLive: false,
        nextPageToken: undefined as string | undefined,
      })),
      offset === 0 && (!language || language === "all")
        ? searchJamendoTracks(query, Math.min(limit, 6), offset).catch(() => ({
            tracks: [],
            hasMore: false,
          }))
        : Promise.resolve({ tracks: [], hasMore: false }),
      offset === 0 && !language
        ? searchAudiusTracks(query, 3).catch(() => [])
        : Promise.resolve([]),
    ]);

    // 3. Merge & Deduplicate tracks (Local verified tracks take precedence)
    const mergedTracks: Song[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    // Add local verified matches first
    for (const track of localMatches) {
      const normKey = `${normalizeSearchQuery(track.title)}_${normalizeSearchQuery(track.artist)}`;
      if (!seenIds.has(track.id) && !seenTitles.has(normKey)) {
        seenIds.add(track.id);
        seenTitles.add(normKey);
        mergedTracks.push(track);
      }
    }

    // Add live YouTube Data API results
    for (const track of liveResult.tracks) {
      const normKey = `${normalizeSearchQuery(track.title)}_${normalizeSearchQuery(track.artist)}`;
      if (!seenIds.has(track.id) && !seenTitles.has(normKey)) {
        seenIds.add(track.id);
        seenTitles.add(normKey);
        mergedTracks.push(track);
      }
    }

    // Add independent Jamendo & Audius CC tracks
    for (const track of [...jamendoResult.tracks, ...audiusTracks]) {
      const normKey = `${normalizeSearchQuery(track.title)}_${normalizeSearchQuery(track.artist)}`;
      if (!seenIds.has(track.id) && !seenTitles.has(normKey)) {
        seenIds.add(track.id);
        seenTitles.add(normKey);
        mergedTracks.push(track);
      }
    }

    // 4. Search Artists and Albums for the query
    const matchingArtists = tab === "all" || tab === "artists" ? searchArtists(query, 6) : [];
    const matchingAlbums = tab === "all" || tab === "albums" ? searchAlbums(query, 6) : [];

    // Filter by tab
    let finalTracks = mergedTracks;
    if (tab === "videos") {
      finalTracks = mergedTracks.filter((t) => t.playbackType === "youtube_embed");
    }

    const responseData = {
      success: true,
      query,
      didYouMean: didYouMean || null,
      tracks: finalTracks.slice(0, limit),
      artists: matchingArtists,
      albums: matchingAlbums,
      count: finalTracks.length,
      isLive: liveResult.isLive,
      nextPageToken: liveResult.nextPageToken || null,
      hasMore: Boolean(liveResult.nextPageToken) || jamendoResult.hasMore || finalTracks.length >= limit,
    };

    if (cacheKey) {
      if (searchCache.size >= SEARCH_CACHE_MAX) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) searchCache.delete(oldestKey);
      }
      searchCache.set(cacheKey, { data: responseData, expiry: Date.now() + SEARCH_CACHE_TTL });
    }

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=360",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/music/search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search worldwide music catalogue",
        tracks: [],
        artists: [],
        albums: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
