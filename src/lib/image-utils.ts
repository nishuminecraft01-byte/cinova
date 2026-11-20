/**
 * TMDB Image Sizing Utility for CINOVA
 * Requests appropriately sized official TMDB CDN thumbnails while preserving
 * 100% of verified title-to-artwork path mappings.
 */

export type TmdbImageSize = "w342" | "w500" | "w780" | "w1280" | "original";

const TMDB_SIZE_REGEX = /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)(\/.+)$/;

export function optimizeTmdbImageUrl(
  url: string | undefined | null,
  targetSize: TmdbImageSize
): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const match = trimmed.match(TMDB_SIZE_REGEX);
  if (!match) return trimmed;

  return `${match[1]}${targetSize}${match[2]}`;
}
