import { Movie } from "@/types/movie";

export interface IntegrityIssue {
  movieId: string;
  movieTitle: string;
  field: string;
  severity: "error" | "warning";
  message: string;
}

export interface CatalogIntegrityReport {
  totalTitles: number;
  healthyTitles: number;
  integrityScore: number; // 0 - 100%
  issues: IntegrityIssue[];
  missingPosters: number;
  missingBackdrops: number;
  duplicateTmdbIds: string[];
  duplicateMovieIds: string[];
  duplicatePosterUrls: string[];
  duplicateBackdropUrls: string[];
  placeholderArtworkCount: number;
  fallbackIdMismatches: number;
  invalidDurations: number;
  timestamp: string;
}

const BANNED_ARTWORK_HOSTS = ["images.unsplash.com"];
const KNOWN_IRON_MAN_TMDB_ID = "1726";

function isBannedArtworkUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BANNED_ARTWORK_HOSTS.some((host) => lower.includes(host));
}

/**
 * Validates a single movie object for data completeness, external identity, and artwork accuracy
 */
export function validateMovieIntegrity(movie: Movie): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  // Internal ID check
  if (!movie.id || typeof movie.id !== "string" || movie.id.trim().length === 0) {
    issues.push({
      movieId: movie.id || "unknown",
      movieTitle: movie.title || "Untitled",
      field: "id",
      severity: "error",
      message: "Missing internal catalog ID",
    });
  }

  // External TMDB identity checks
  if (movie.tmdbId !== undefined) {
    const cleanTmdb = String(movie.tmdbId).trim();
    if (!/^\d+$/.test(cleanTmdb)) {
      issues.push({
        movieId: movie.id,
        movieTitle: movie.title,
        field: "tmdbId",
        severity: "error",
        message: `Non-numeric TMDB ID detected: "${movie.tmdbId}"`,
      });
    } else {
      // Guard against the legacy hardcoded Iron Man ("1726") fallback bug
      const isIronMan = movie.title?.trim().toLowerCase() === "iron man";
      if (cleanTmdb === KNOWN_IRON_MAN_TMDB_ID && !isIronMan) {
        issues.push({
          movieId: movie.id,
          movieTitle: movie.title,
          field: "tmdbId",
          severity: "error",
          message: `Hardcoded fallback TMDB ID "1726" (Iron Man) assigned to unrelated title "${movie.title}"`,
        });
      }

      // Guard against internal id / tmdbId divergence (e.g., id="tmdb-123" with tmdbId="456")
      const idTmdbMatch = movie.id?.match(/^tmdb-(\d+)$/);
      if (idTmdbMatch && idTmdbMatch[1] !== cleanTmdb) {
        issues.push({
          movieId: movie.id,
          movieTitle: movie.title,
          field: "tmdbId",
          severity: "error",
          message: `External ID mismatch: internal id "${movie.id}" conflicts with tmdbId "${cleanTmdb}"`,
        });
      }
    }
  } else {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "tmdbId",
      severity: "warning",
      message: "Missing external TMDB ID",
    });
  }

  // Poster check
  if (!movie.posterUrl || typeof movie.posterUrl !== "string" || movie.posterUrl.trim().length === 0) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "posterUrl",
      severity: "error",
      message: "Missing poster URL",
    });
  } else if (isBannedArtworkUrl(movie.posterUrl)) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "posterUrl",
      severity: "error",
      message: `Generic stock placeholder image detected on posterUrl: ${movie.posterUrl}`,
    });
  } else if (!movie.posterUrl.startsWith("http://") && !movie.posterUrl.startsWith("https://") && !movie.posterUrl.startsWith("/")) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "posterUrl",
      severity: "warning",
      message: "Poster URL does not have standard protocol (http/https)",
    });
  }

  // Backdrop check
  if (!movie.backdropUrl || typeof movie.backdropUrl !== "string" || movie.backdropUrl.trim().length === 0) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "backdropUrl",
      severity: "warning",
      message: "Missing backdrop banner URL",
    });
  } else if (isBannedArtworkUrl(movie.backdropUrl)) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "backdropUrl",
      severity: "error",
      message: `Generic stock placeholder image detected on backdropUrl: ${movie.backdropUrl}`,
    });
  }

  // Release year sanity check
  const maxYear = new Date().getFullYear() + 10;
  if (!movie.releaseYear || movie.releaseYear < 1888 || movie.releaseYear > maxYear) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "releaseYear",
      severity: "warning",
      message: `Suspicious releaseYear value: ${movie.releaseYear}`,
    });
  }

  // Duration check
  if (!movie.duration || movie.duration <= 0) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "duration",
      severity: "warning",
      message: "Duration is missing or zero",
    });
  }

  // Rating and Genres check
  if (!movie.genre || !Array.isArray(movie.genre) || movie.genre.length === 0) {
    issues.push({
      movieId: movie.id,
      movieTitle: movie.title,
      field: "genre",
      severity: "error",
      message: "Genre array is empty",
    });
  }

  return issues;
}

/**
 * Runs a complete non-destructive audit on the movie catalog
 */
export function auditCatalogIntegrity(movies: Movie[]): CatalogIntegrityReport {
  const allIssues: IntegrityIssue[] = [];
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const seenTmdbIds = new Map<string, string>();
  const duplicateTmdb = new Set<string>();
  const seenPosters = new Map<string, string>();
  const duplicatePosters = new Set<string>();
  const seenBackdrops = new Map<string, string>();
  const duplicateBackdrops = new Set<string>();

  let missingPosters = 0;
  let missingBackdrops = 0;
  let invalidDurations = 0;
  let placeholderArtworkCount = 0;
  let fallbackIdMismatches = 0;

  for (const movie of movies) {
    // Check ID collisions
    if (seenIds.has(movie.id)) {
      duplicateIds.add(movie.id);
      allIssues.push({
        movieId: movie.id,
        movieTitle: movie.title,
        field: "id",
        severity: "error",
        message: `Duplicate internal ID collision: ${movie.id}`,
      });
    } else {
      seenIds.add(movie.id);
    }

    // Check TMDB ID collisions
    if (movie.tmdbId) {
      const existingTitle = seenTmdbIds.get(movie.tmdbId);
      if (existingTitle) {
        duplicateTmdb.add(movie.tmdbId);
        allIssues.push({
          movieId: movie.id,
          movieTitle: movie.title,
          field: "tmdbId",
          severity: "error",
          message: `Duplicate TMDB ID ${movie.tmdbId} shared between "${existingTitle}" and "${movie.title}"`,
        });
      } else {
        seenTmdbIds.set(movie.tmdbId, movie.title);
      }
    }

    // Flag duplicate poster URLs across different titles (warning only, never auto-deleted)
    if (movie.posterUrl && movie.posterUrl.trim().length > 0) {
      const existingPosterOwner = seenPosters.get(movie.posterUrl);
      if (existingPosterOwner && existingPosterOwner !== movie.title) {
        duplicatePosters.add(movie.posterUrl);
        allIssues.push({
          movieId: movie.id,
          movieTitle: movie.title,
          field: "posterUrl",
          severity: "warning",
          message: `Duplicate posterUrl shared by "${existingPosterOwner}" and "${movie.title}"`,
        });
      } else {
        seenPosters.set(movie.posterUrl, movie.title);
      }
    }

    // Flag duplicate backdrop URLs across different titles (warning only, never auto-deleted)
    if (movie.backdropUrl && movie.backdropUrl.trim().length > 0) {
      const existingBackdropOwner = seenBackdrops.get(movie.backdropUrl);
      if (existingBackdropOwner && existingBackdropOwner !== movie.title) {
        duplicateBackdrops.add(movie.backdropUrl);
        allIssues.push({
          movieId: movie.id,
          movieTitle: movie.title,
          field: "backdropUrl",
          severity: "warning",
          message: `Duplicate backdropUrl shared by "${existingBackdropOwner}" and "${movie.title}"`,
        });
      } else {
        seenBackdrops.set(movie.backdropUrl, movie.title);
      }
    }

    const movieIssues = validateMovieIntegrity(movie);
    for (const issue of movieIssues) {
      if (issue.field === "posterUrl" && issue.message === "Missing poster URL") missingPosters++;
      if (issue.field === "backdropUrl" && issue.message === "Missing backdrop banner URL") missingBackdrops++;
      if (issue.field === "duration") invalidDurations++;
      if (issue.message.includes("Generic stock placeholder image")) placeholderArtworkCount++;
      if (issue.message.includes('Hardcoded fallback TMDB ID "1726"')) fallbackIdMismatches++;
      allIssues.push(issue);
    }
  }

  const totalTitles = movies.length;
  const erroredMovieIds = new Set(allIssues.filter((i) => i.severity === "error").map((i) => i.movieId));
  const healthyTitles = Math.max(0, totalTitles - erroredMovieIds.size);
  const integrityScore = totalTitles > 0 ? Math.round((healthyTitles / totalTitles) * 100) : 100;

  return {
    totalTitles,
    healthyTitles,
    integrityScore,
    issues: allIssues,
    missingPosters,
    missingBackdrops,
    duplicateTmdbIds: Array.from(duplicateTmdb),
    duplicateMovieIds: Array.from(duplicateIds),
    duplicatePosterUrls: Array.from(duplicatePosters),
    duplicateBackdropUrls: Array.from(duplicateBackdrops),
    placeholderArtworkCount,
    fallbackIdMismatches,
    invalidDurations,
    timestamp: new Date().toISOString(),
  };
}
