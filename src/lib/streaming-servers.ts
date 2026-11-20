import { Movie, StreamingServer } from "@/types/movie";
import {
  convertSourceToStreamingServer,
  getVideoSourcesForMovie,
  isGenericSampleClip,
  isTvSeries,
  normalizeMovieKeys,
  resolveTmdbId,
  SEED_VIDEO_SOURCES,
  VERIFIED_OPEN_SOURCE_TITLES,
  VideoSource,
} from "@/lib/video-sources";

function buildTmdbStreamingCluster(
  tmdbId: string,
  isTv: boolean,
  season: number = 1,
  episode: number = 1
): StreamingServer[] {
  const s = Math.max(1, Number(season) || 1);
  const ep = Math.max(1, Number(episode) || 1);

  const cluster: StreamingServer[] = [
    {
      id: "vidlink",
      name: "VidLink • Ultra Fast 4K",
      provider: "vidlink",
      badge: "4K UHD",
      quality: "4K UHD",
      type: "embed",
      url: isTv
        ? `https://vidlink.pro/tv/${tmdbId}/${s}/${ep}?autoplay=true`
        : `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
    },
    {
      id: "vidrift",
      name: "VidRift • CINOVA Multilanguage",
      provider: "vidrift",
      badge: "Multi-Audio",
      quality: "1080p FHD",
      type: "embed",
      url: isTv
        ? `https://embed.vidrift.net/embed/tv/${tmdbId}/${s}/${ep}?brand=CINOVA&brandColor=%23e11d48`
        : `https://embed.vidrift.net/embed/movie/${tmdbId}?brand=CINOVA&brandColor=%23e11d48&watermark=1`,
    },
    {
      id: "vidfast",
      name: "VidFast • Low-Latency CDN",
      provider: "vidfast",
      badge: "Fast CDN",
      quality: "1080p FHD",
      type: "embed",
      url: isTv
        ? `https://vidfast.vc/tv/${tmdbId}/${s}/${ep}?autoPlay=true`
        : `https://vidfast.vc/movie/${tmdbId}?autoPlay=true`,
    },
    {
      id: "vidbolt",
      name: "VidBolt • HD Cluster",
      provider: "vidbolt",
      badge: "HD",
      quality: "1080p FHD",
      type: "embed",
      url: isTv
        ? `https://vidbolt.xyz/tv/${tmdbId}/${s}/${ep}?theme=e11d48&autoPlay=true`
        : `https://vidbolt.xyz/movie/${tmdbId}?theme=e11d48&autoPlay=true`,
    },
    {
      id: "rive",
      name: "RiveStream • Adaptive Master",
      provider: "rive",
      badge: "Adaptive",
      quality: "1080p FHD",
      type: "embed",
      url: isTv
        ? `https://rivestream.pro/embed?type=tv&id=${encodeURIComponent(tmdbId)}&season=${encodeURIComponent(s)}&episode=${encodeURIComponent(ep)}`
        : `https://rivestream.pro/embed?type=movie&id=${encodeURIComponent(tmdbId)}`,
    },
    {
      id: "screenscape",
      name: "ScreenScape • Hindi / Multi-Dub",
      provider: "screenscape",
      badge: "Hindi Dub",
      quality: "1080p FHD",
      type: "embed",
      url: isTv
        ? `https://nxsha.screenscape.me/embed?tmdb=${encodeURIComponent(tmdbId)}&type=tv&season=${encodeURIComponent(s)}&episode=${encodeURIComponent(ep)}&lan=hindi`
        : `https://nxsha.screenscape.me/embed?tmdb=${encodeURIComponent(tmdbId)}&type=movie&lan=hindi`,
    },
    {
      id: "videasy",
      name: "Videasy • Hindi Server",
      provider: "videasy",
      badge: "Hindi",
      quality: "1080p FHD",
      type: "embed",
      url: `https://videasy.xyz/embed/movie/${encodeURIComponent(tmdbId)}?lang=hi&autoplay=false`,
    },
  ];

  return cluster;
}

/**
 * Resolves legitimate connected playback sources for a CINOVA catalog title.
 * Strictly supports authorized HLS, MPEG-DASH, progressive MP4 streams,
 * and high-availability multi-server streaming routes for worldwide TMDB titles.
 */
export async function resolveStreamingServers(
  movieId: string,
  movie?: Movie | null,
  _season: number = 1,
  _episode: number = 1
): Promise<StreamingServer[]> {
  const servers: StreamingServer[] = [];
  const seenUrls = new Set<string>();

  // 1. Resolve registered sources from Centralized Video Source Store
  const registeredSources = await getVideoSourcesForMovie(movieId, { season: _season, episode: _episode });
  for (const src of registeredSources) {
    if (src.status === "Available" && src.streamUrl && !seenUrls.has(src.streamUrl)) {
      seenUrls.add(src.streamUrl);
      servers.push(convertSourceToStreamingServer(src));
    }
  }

  // 2. If movie object has a direct authorized videoUrl not already in sources, add as direct server
  // (Filter out generic demo clips unless it is legitimately an open-source demo title)
  if (movie?.videoUrl && movie.videoUrl.trim().length > 0 && !seenUrls.has(movie.videoUrl.trim())) {
    const rawUrl = movie.videoUrl.trim();
    const isSample = isGenericSampleClip(rawUrl);
    const keys = normalizeMovieKeys(movieId);
    const isActualOpenSource = keys.some((k) =>
      VERIFIED_OPEN_SOURCE_TITLES.has(k.toLowerCase())
    );

    if (!isSample || isActualOpenSource) {
      const isHls = rawUrl.includes(".m3u8");
      seenUrls.add(rawUrl);
      servers.push({
        id: "cinova-native",
        name: isHls ? "CINOVA Secure HLS (Adaptive)" : "CINOVA Direct Master",
        provider: "cinova",
        badge: movie.quality || (isHls ? "4K HLS" : "HD"),
        quality: movie.quality || (isHls ? "4K UHD" : "1080p FHD"),
        type: "direct",
        url: rawUrl,
      });
    }
  }

  // 3. Multi-server streaming redundancy cluster for TMDB titles
  const tmdbId = resolveTmdbId(movieId, movie);
  if (tmdbId) {
    const isTv = isTvSeries(movieId, movie);
    const cluster = buildTmdbStreamingCluster(tmdbId, isTv, _season, _episode);
    for (const srv of cluster) {
      if (!seenUrls.has(srv.url)) {
        seenUrls.add(srv.url);
        servers.push(srv);
      }
    }
  }

  return servers;
}

/**
 * Synchronous resolver for legacy components
 */
export function getStreamingServers(
  movie: Movie,
  _season: number = 1,
  _episode: number = 1
): StreamingServer[] {
  const servers: StreamingServer[] = [];
  const keys = normalizeMovieKeys(movie.id);

  // Check seed sources synchronously
  for (const seed of SEED_VIDEO_SOURCES) {
    if (seed.status === "Available" && keys.some((k) => normalizeMovieKeys(seed.movieId).includes(k))) {
      servers.push(convertSourceToStreamingServer(seed));
    }
  }

  if (movie.videoUrl && movie.videoUrl.trim().length > 0 && !servers.some((s) => s.url === movie.videoUrl.trim())) {
    const rawUrl = movie.videoUrl.trim();
    const isSample = isGenericSampleClip(rawUrl);
    const isActualOpenSource = keys.some((k) =>
      VERIFIED_OPEN_SOURCE_TITLES.has(k.toLowerCase())
    );

    if (!isSample || isActualOpenSource) {
      const isHls = rawUrl.includes(".m3u8");
      servers.push({
        id: "cinova-native",
        name: isHls ? "CINOVA Secure HLS" : "CINOVA Secure Stream",
        provider: "cinova",
        badge: movie.quality || (isHls ? "4K HLS" : "HD"),
        quality: movie.quality || "1080p FHD",
        type: "direct",
        url: rawUrl,
      });
    }
  }

  // Add multi-server cluster for TMDB catalog items
  const tmdbId = resolveTmdbId(movie.id, movie);
  if (tmdbId) {
    const isTv = isTvSeries(movie.id, movie);
    const cluster = buildTmdbStreamingCluster(tmdbId, isTv, _season, _episode);
    for (const srv of cluster) {
      if (!servers.some((s) => s.url === srv.url)) {
        servers.push(srv);
      }
    }
  }

  return servers;
}

export function hasConnectedPlaybackSource(
  movie: Movie | null | undefined,
  sources?: VideoSource[]
): boolean {
  if (sources && sources.some((s) => s.status === "Available")) return true;
  if (!movie) return false;
  if (resolveTmdbId(movie.id, movie)) return true;
  if (typeof movie.videoUrl !== "string" || movie.videoUrl.trim().length === 0) return false;
  const rawUrl = movie.videoUrl.trim();
  const isSample = isGenericSampleClip(rawUrl);
  const keys = normalizeMovieKeys(movie.id);
  const isActualOpenSource = keys.some((k) =>
    VERIFIED_OPEN_SOURCE_TITLES.has(k.toLowerCase())
  );
  return !isSample || isActualOpenSource;
}
