/**
 * Jamendo API v3.0 Client for CINOVA OTT Platform (Server-Side Only)
 * 
 * Secure server-side client for querying Jamendo's official v3.0 REST API.
 * Never import this module in client components to prevent leaking JAMENDO_CLIENT_ID.
 */

import { Song, Album, Artist, TrackLicense } from "@/types/music";

const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

/**
 * Retrieves the configured Jamendo Client ID from server-only environment.
 */
export function getJamendoClientId(): string | null {
  const rawId = process.env.JAMENDO_CLIENT_ID?.trim();
  const clientId = rawId ? rawId.replace(/^["']|["']$/g, "").trim() : null;
  return clientId && clientId.length > 0 ? clientId : null;
}

/**
 * Evaluates Jamendo license terms for streamability, commercial usage, and attribution.
 * Tracks under CC-NC licenses cannot be used commercially on CINOVA.
 */
export function parseJamendoLicense(ccUrl?: string, downloadAllowed?: boolean): TrackLicense {
  const url = (ccUrl || "").toLowerCase();
  
  const isNC = url.includes("-nc") || url.includes("/nc") || url.includes("noncommercial") || url.includes("non-commercial");
  const isND = url.includes("-nd") || url.includes("/nd");
  const isSA = url.includes("-sa") || url.includes("/sa");
  const isCC0 = url.includes("publicdomain") || url.includes("zero") || url.includes("cc0");

  let shortName = "Creative Commons";
  if (isCC0) {
    shortName = "CC0 Public Domain";
  } else if (isNC && isSA) {
    shortName = "CC BY-NC-SA (Non-Commercial)";
  } else if (isNC && isND) {
    shortName = "CC BY-NC-ND (Non-Commercial)";
  } else if (isNC) {
    shortName = "CC BY-NC (Non-Commercial)";
  } else if (isSA) {
    shortName = "CC BY-SA";
  } else if (isND) {
    shortName = "CC BY-ND";
  } else if (url.includes("/by/")) {
    shortName = "CC BY";
  }

  const isCommercialAllowed = !isNC && (isCC0 || url.includes("/by/") || isSA || isND);

  return {
    licenseUrl: ccUrl || "https://creativecommons.org/licenses/",
    licenseName: shortName,
    isStreamable: true,
    isDownloadAllowed: Boolean(downloadAllowed),
    isCommercialAllowed,
    attributionRequired: !isCC0,
  };
}

/**
 * Transforms raw Jamendo Track response into CINOVA Song model.
 * STRICT AUDIT COMPLIANCE:
 * Rejects all tracks with Non-Commercial restrictions (CC BY-NC, CC BY-NC-SA, CC BY-NC-ND).
 * Only returns a valid Song when commercial platform streaming is permitted (CC BY, CC BY-SA, CC0).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformJamendoTrack(raw: any): Song | null {
  const license = parseJamendoLicense(raw.license_ccurl, raw.audiodownload_allowed);

  // Strict rejection of non-commercial licenses
  if (!license.isCommercialAllowed || (license.licenseName && license.licenseName.includes("Non-Commercial"))) {
    return null;
  }

  const rawGenre = raw.musicinfo?.tags?.genres?.[0] || "Indie";
  const genre = rawGenre.charAt(0).toUpperCase() + rawGenre.slice(1);
  const releaseYear = raw.releasedate ? new Date(raw.releasedate).getFullYear() : 2026;
  const duration = typeof raw.duration === "number" ? raw.duration : 210;
  
  // Must be genuine full length (at least 60 seconds)
  if (duration < 60 || !raw.audio) {
    return null;
  }

  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);
  const durationText = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return {
    id: `jamendo-${raw.id}`,
    title: raw.name || "Untitled Track",
    artist: raw.artist_name || "Unknown Artist",
    artistId: `jamendo-artist-${raw.artist_id}`,
    album: raw.album_name || "Single",
    albumId: raw.album_id ? `jamendo-album-${raw.album_id}` : "single",
    coverUrl:
      raw.image ||
      raw.album_image ||
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    audioUrl: raw.audio || "",
    duration,
    durationText,
    genre,
    year: isNaN(releaseYear) ? 2026 : releaseYear,
    plays: raw.stats?.listens_total || 25000,
    trending: true,
    license,
    source: "jamendo",
    playbackType: "audio",
  };
}

/**
 * Fetches trending music tracks via Jamendo charts or popularity ranking.
 */
export async function getTrendingTracks(
  limit: number = 20,
  offset: number = 0
): Promise<{ tracks: Song[]; hasMore: boolean }> {
  const clientId = getJamendoClientId();
  if (!clientId) {
    return { tracks: [], hasMore: false };
  }

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${clientId}&format=json&limit=${limit}&offset=${offset}&order=popularity_total_desc&audioformat=mp32&imagesize=500&include=musicinfo+licenses+stats`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = data.results
        .map((raw: any) => transformJamendoTrack(raw))
        .filter((s: Song | null): s is Song => s !== null);
      return { tracks, hasMore: tracks.length >= limit };
    } else {
      console.warn("Jamendo API returned empty results or error:", data?.headers);
    }
  } catch (err) {
    console.error("Failed to fetch Jamendo trending tracks:", err);
  }

  return { tracks: [], hasMore: false };
}

/**
 * Searches music tracks on Jamendo by title, artist, or tags.
 */
export async function searchJamendoTracks(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ tracks: Song[]; hasMore: boolean }> {
  const q = query.trim();
  if (!q) {
    return { tracks: [], hasMore: false };
  }

  const clientId = getJamendoClientId();
  if (!clientId) {
    return { tracks: [], hasMore: false };
  }

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${clientId}&format=json&namesearch=${encodeURIComponent(
        q
      )}&limit=${limit}&offset=${offset}&audioformat=mp32&ccnc=false&include=musicinfo+licenses+stats`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();

    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = data.results
        .map((raw: any) => transformJamendoTrack(raw))
        .filter((s: Song | null): s is Song => s !== null);
      return { tracks, hasMore: tracks.length >= limit };
    }
  } catch (err) {
    console.error(`Failed to search Jamendo tracks for "${q}":`, err);
  }

  return { tracks: [], hasMore: false };
}

/**
 * Fetches tracks filtered by music genre / tags from Jamendo.
 */
export async function getTracksByGenre(
  genre: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ tracks: Song[]; hasMore: boolean }> {
  const g = genre.toLowerCase().trim();
  const clientId = getJamendoClientId();

  if (!clientId) {
    return { tracks: [], hasMore: false };
  }

  try {
    const tagParam = g === "all" ? "" : `&fuzzytags=${encodeURIComponent(g)}`;
    const res = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${clientId}&format=json${tagParam}&limit=${limit}&offset=${offset}&order=popularity_total_desc&audioformat=mp32&include=musicinfo+licenses+stats`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = data.results
        .map((raw: any) => transformJamendoTrack(raw))
        .filter((s: Song | null): s is Song => s !== null);
      return { tracks, hasMore: tracks.length >= limit };
    }
  } catch (err) {
    console.error(`Failed to fetch Jamendo tracks for genre "${g}":`, err);
  }

  return { tracks: [], hasMore: false };
}

/**
 * Fetches popular artists from Jamendo.
 */
export async function getPopularArtists(
  limit: number = 10,
  offset: number = 0
): Promise<{ artists: Artist[]; hasMore: boolean }> {
  const clientId = getJamendoClientId();
  if (!clientId) {
    return { artists: [], hasMore: false };
  }

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/artists/?client_id=${clientId}&format=json&order=popularity_total_desc&limit=${limit}&offset=${offset}&hasimage=true`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();

    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const artists: Artist[] = data.results.map((raw: any) => ({
        id: `jamendo-artist-${raw.id}`,
        name: raw.name || "Artist",
        avatarUrl:
          raw.image ||
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        headerUrl: raw.image,
        bio: `Independent Jamendo artist. Joined ${raw.joindate || "recently"}.`,
        genres: ["Indie", "Global"],
        monthlyListeners: "500K+",
        topSongs: [],
        albums: [],
        popular: true,
      }));
      return { artists, hasMore: artists.length >= limit };
    }
  } catch (err) {
    console.error("Failed to fetch Jamendo artists:", err);
  }

  return { artists: [], hasMore: false };
}

/**
 * Fetches popular albums from Jamendo.
 */
export async function getPopularAlbums(
  limit: number = 8,
  offset: number = 0
): Promise<{ albums: Album[]; hasMore: boolean }> {
  const clientId = getJamendoClientId();
  if (!clientId) {
    return { albums: [], hasMore: false };
  }

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/albums/?client_id=${clientId}&format=json&order=popularity_total_desc&limit=${limit}&offset=${offset}&imagesize=500`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();

    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const albums: Album[] = data.results.map((raw: any) => {
        const releaseYear = raw.releasedate ? new Date(raw.releasedate).getFullYear() : 2026;
        return {
          id: `jamendo-album-${raw.id}`,
          title: raw.name || "Album",
          artist: raw.artist_name || "Unknown Artist",
          artistId: `jamendo-artist-${raw.artist_id}`,
          coverUrl:
            raw.image ||
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
          releaseYear: isNaN(releaseYear) ? 2026 : releaseYear,
          genre: "Independent",
          description: `Full independent album by ${raw.artist_name}.`,
          songs: [],
          trending: true,
        };
      });
      return { albums, hasMore: albums.length >= limit };
    }
  } catch (err) {
    console.error("Failed to fetch Jamendo albums:", err);
  }

  return { albums: [], hasMore: false };
}

/**
 * Fetches tracks belonging to an album.
 */
export async function getTracksByAlbum(
  albumId: string,
  limit: number = 25
): Promise<{ tracks: Song[]; album?: Album }> {
  const rawId = albumId.replace(/^jamendo-album-/, "");
  const clientId = getJamendoClientId();
  if (!clientId || !rawId) return { tracks: [] };

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${clientId}&format=json&album_id=${rawId}&limit=${limit}&audioformat=mp32&ccnc=false&include=musicinfo+licenses+stats`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = data.results
        .map((raw: any) => transformJamendoTrack(raw))
        .filter((s: Song | null): s is Song => s !== null);
      let albumInfo: Album | undefined;
      if (tracks.length > 0) {
        albumInfo = {
          id: `jamendo-album-${rawId}`,
          title: tracks[0].album || "Album",
          artist: tracks[0].artist,
          artistId: tracks[0].artistId,
          coverUrl: tracks[0].coverUrl,
          releaseYear: 2026,
          genre: tracks[0].genre,
          description: `Album release by ${tracks[0].artist}.`,
          songs: tracks,
        };
      }
      return { tracks, album: albumInfo };
    }
  } catch (err) {
    console.error(`Failed to fetch tracks for album ${rawId}:`, err);
  }

  return { tracks: [] };
}

/**
 * Fetches tracks by an artist.
 */
export async function getTracksByArtist(
  artistId: string,
  limit: number = 25
): Promise<{ tracks: Song[]; artist?: Artist }> {
  const rawId = artistId.replace(/^jamendo-artist-/, "");
  const clientId = getJamendoClientId();
  if (!clientId || !rawId) return { tracks: [] };

  try {
    const res = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${clientId}&format=json&artist_id=${rawId}&limit=${limit}&order=popularity_total_desc&audioformat=mp32&ccnc=false&include=musicinfo+licenses+stats`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (data?.results && Array.isArray(data.results)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks = data.results
        .map((raw: any) => transformJamendoTrack(raw))
        .filter((s: Song | null): s is Song => s !== null);
      let artistInfo: Artist | undefined;
      if (tracks.length > 0) {
        artistInfo = {
          id: `jamendo-artist-${rawId}`,
          name: tracks[0].artist,
          avatarUrl: tracks[0].coverUrl,
          headerUrl: tracks[0].coverUrl,
          bio: `Independent artist on Jamendo. Discover high-quality music streaming.`,
          genres: [tracks[0].genre, "Independent"],
          monthlyListeners: "250K+",
          topSongs: tracks,
          albums: [],
        };
      }
      return { tracks, artist: artistInfo };
    }
  } catch (err) {
    console.error(`Failed to fetch tracks for artist ${rawId}:`, err);
  }

  return { tracks: [] };
}
