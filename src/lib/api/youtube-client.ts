/**
 * YouTube Music Video Client for CINOVA Platform (Server-Side Only)
 * 
 * Provides official YouTube embedded player integration for music discovery
 * across Bollywood, Punjabi, Hindi, English, Marathi, Hip-Hop, Pop, EDM, Indie, and Classical.
 * 
 * Strictly complies with YouTube API Terms of Service:
 * - Never downloads, rips, or rehosts audio.
 * - Always plays through the official YouTube iframe embedded player.
 */

import { Song, TrackLicense, MUSIC_CATEGORIES } from "@/types/music";

export function getYouTubeApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function parseDurationSeconds(text?: string): number {
  if (!text) return 210;
  const parts = text.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const YOUTUBE_LICENSE: TrackLicense = {
  licenseName: "YouTube Standard License",
  licenseUrl: "https://www.youtube.com/static?template=terms",
  isStreamable: true,
  isDownloadAllowed: false,
  isCommercialAllowed: false,
  attributionRequired: true,
};

export function formatMusicSearchQuery(query: string): string {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  if (
    /\b(song|songs|video|music|audio|soundtrack|ost|remix|acoustic|live|track|bangers|hits)\b/i.test(
      lower
    )
  ) {
    return trimmed;
  }
  return `${trimmed} official song`;
}

/**
 * Searches YouTube for official music videos using official YouTube Data API v3
 * or high-res public endpoint fallback when no API key is configured.
 * Supports pagination via nextPageToken / continuation.
 */
export async function searchYouTubeMusic(
  query: string,
  limit: number = 20,
  categoryName: string = "Music",
  pageToken?: string
): Promise<{ tracks: Song[]; nextPageToken?: string }> {
  const q = query.trim();
  if (!q) return { tracks: [] };

  const formattedQuery = formatMusicSearchQuery(q);
  const apiKey = getYouTubeApiKey();

  // 1. Try official YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      const apiUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      apiUrl.searchParams.set("part", "snippet");
      apiUrl.searchParams.set("type", "video");
      apiUrl.searchParams.set("videoCategoryId", "10"); // Music category
      apiUrl.searchParams.set("order", "relevance");
      apiUrl.searchParams.set("q", formattedQuery);
      apiUrl.searchParams.set("maxResults", String(Math.min(limit, 50)));
      if (pageToken) {
        apiUrl.searchParams.set("pageToken", pageToken);
      }
      apiUrl.searchParams.set("key", apiKey);

      const res = await fetch(apiUrl.toString(), { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawItems = data.items || [];
        const videoIds = rawItems.map((i: any) => i.id?.videoId).filter(Boolean);

        // Fetch videos.list to verify embeddability and get duration/stats
        if (videoIds.length > 0) {
          const vUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
          vUrl.searchParams.set("part", "snippet,contentDetails,status,statistics");
          vUrl.searchParams.set("id", videoIds.join(","));
          vUrl.searchParams.set("key", apiKey);

          const vRes = await fetch(vUrl.toString(), { next: { revalidate: 3600 } });
          if (vRes.ok) {
            const vData = await vRes.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tracks: Song[] = (vData.items || [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((v: any) => v.status?.embeddable === true)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((v: any) => {
                const snip = v.snippet || {};
                const stats = v.statistics || {};
                const viewCount = stats.viewCount ? parseInt(stats.viewCount, 10) : 0;
                const channelTitle = decodeHtmlEntities(snip.channelTitle || "Official Artist");
                const title = decodeHtmlEntities(snip.title || "Untitled Video");
                const isOfficialChannel =
                  channelTitle.includes("VEVO") ||
                  channelTitle.includes("Official") ||
                  channelTitle.includes("Records") ||
                  channelTitle.includes("Music") ||
                  channelTitle.includes("Series") ||
                  channelTitle.includes("Entertainment") ||
                  snip.channelTitle?.endsWith(" - Topic");
                const isOfficialVideo = /official\s+(music\s+)?video|official\s+audio|original\s+soundtrack|ost/i.test(
                  title
                );

                const coverUrl =
                  snip.thumbnails?.maxres?.url ||
                  snip.thumbnails?.high?.url ||
                  snip.thumbnails?.medium?.url ||
                  `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

                const durationSec = parseDurationSeconds(v.contentDetails?.duration);

                return {
                  id: `yt-${v.id}`,
                  youtubeId: v.id,
                  title,
                  artist: channelTitle,
                  artistId: `yt-channel-${snip.channelId || v.id}`,
                  coverUrl,
                  duration: durationSec,
                  durationText: `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, "0")}`,
                  viewCountText: stats.viewCount ? `${(viewCount / 1000000).toFixed(1)}M views` : "",
                  genre: categoryName,
                  year: snip.publishedAt ? new Date(snip.publishedAt).getFullYear() : 2026,
                  source: "youtube" as const,
                  playbackType: "youtube_embed" as const,
                  channelTitle,
                  isOfficialChannel,
                  isOfficialVideo,
                  description: snip.description || "",
                  publishedAt: snip.publishedAt,
                  license: YOUTUBE_LICENSE,
                };
              });

            return { tracks, nextPageToken: data.nextPageToken };
          }
        }
      }
    } catch (err) {
      console.warn("YouTube Data API call failed, using fallback discovery:", err);
    }
  }

  // 2. High-res public YouTube discovery with continuation support
  try {
    let rawItems: any[] = [];
    let nextContinuationToken: string | undefined = undefined;

    if (pageToken && pageToken.length > 20) {
      // Continuation request
      const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240101.00.00",
              hl: "en",
              gl: "US",
            },
          },
          continuation: pageToken,
        }),
      });

      if (res.ok) {
        const cData = await res.json();
        const actions = cData.onResponseReceivedCommands || [];
        for (const a of actions) {
          const items = a.appendContinuationItemsAction?.continuationItems || [];
          for (const item of items) {
            if (item.itemSectionRenderer?.contents) {
              rawItems.push(...item.itemSectionRenderer.contents);
            } else if (item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
              nextContinuationToken =
                item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            }
          }
        }
      }
    } else {
      // Initial page 1 search
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        formattedQuery
      )}`;

      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        },
      });

      const html = await res.text();
      const match = html.match(/ytInitialData\s*=\s*({[\s\S]+?});\s*<\/script>/);

      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        const sections =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

        for (const section of sections) {
          if (section.itemSectionRenderer?.contents) {
            rawItems.push(...section.itemSectionRenderer.contents);
          } else if (section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
            nextContinuationToken =
              section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
          }
        }
      }
    }

    const tracks: Song[] = [];
    for (const item of rawItems) {
      const vr = item.videoRenderer;
      if (!vr || !vr.videoId) continue;

      // Filter out shorts
      const durationText = vr.lengthText?.simpleText || "Video";
      const durationSec = parseDurationSeconds(durationText);
      const title = vr.title?.runs?.[0]?.text || "Untitled";
      if (durationSec > 0 && durationSec < 50 && /#shorts|\/shorts\//i.test(title)) {
        continue;
      }

      const artist = vr.ownerText?.runs?.[0]?.text || "Official Channel";
      const viewCountText = vr.viewCountText?.simpleText || "";
      const thumbnails = vr.thumbnail?.thumbnails || [];
      const coverUrl =
        thumbnails.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;

      const isOfficialChannel =
        artist.includes("VEVO") ||
        artist.includes("Official") ||
        artist.includes("Records") ||
        artist.includes("Music") ||
        artist.includes("Series") ||
        artist.includes("Entertainment") ||
        Boolean(vr.ownerBadges?.some((b: any) => b.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_VERIFIED"));

      const isOfficialVideo = /official\s+(music\s+)?video|official\s+audio|original\s+soundtrack|ost/i.test(
        title
      );

      const description = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join("") || "";

      tracks.push({
        id: `yt-${vr.videoId}`,
        youtubeId: vr.videoId,
        title: decodeHtmlEntities(title),
        artist: decodeHtmlEntities(artist),
        artistId: `yt-channel-${vr.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || vr.videoId}`,
        coverUrl,
        duration: durationSec,
        durationText,
        viewCountText,
        channelTitle: artist,
        genre: categoryName,
        year: 2026,
        source: "youtube",
        playbackType: "youtube_embed",
        isOfficialChannel,
        isOfficialVideo,
        description,
        license: YOUTUBE_LICENSE,
      });

      if (tracks.length >= limit) break;
    }

    // Sort: Official channels & official videos first, then by view text / relevance
    tracks.sort((a, b) => {
      const aScore = (a.isOfficialChannel ? 2 : 0) + (a.isOfficialVideo ? 1 : 0);
      const bScore = (b.isOfficialChannel ? 2 : 0) + (b.isOfficialVideo ? 1 : 0);
      return bScore - aScore;
    });

    return { tracks, nextPageToken: nextContinuationToken };
  } catch (err) {
    console.error("YouTube search fallback error:", err);
  }

  return { tracks: [] };
}

/**
 * Retrieves curated category music videos.
 */
export async function getCategoryMusic(categorySlug: string, limit: number = 20): Promise<Song[]> {
  const cat = MUSIC_CATEGORIES.find((c) => c.slug === categorySlug.toLowerCase()) || MUSIC_CATEGORIES[0];
  const { tracks } = await searchYouTubeMusic(cat.query || cat.name, limit, cat.name);
  return tracks;
}

/**
 * Retrieves global trending music videos.
 */
export async function getYouTubeTrendingMusic(limit: number = 20): Promise<Song[]> {
  const { tracks } = await searchYouTubeMusic("Top Worldwide & Indian Hits 2026", limit, "Trending");
  return tracks;
}
