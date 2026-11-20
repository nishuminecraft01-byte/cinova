import { Movie } from "@/types/movie";

export type SafetyLevel = "FAMILY_SAFE" | "TEEN_SAFE" | "GENERAL_MATURE";

// Prohibited adult ratings and keywords
const ADULT_RATINGS = new Set(["NC-17", "R18+", "18+", "X", "XXX", "ADULT", "PORN"]);
const ADULT_KEYWORDS = ["hentai", "erotica", "porn", "pornography", "adult-only", "explicit sex", "nsfw"];

// Family-safe allowed ratings
const FAMILY_RATINGS = new Set(["G", "PG", "TV-G", "TV-Y", "TV-Y7", "TV-PG", "ALL AGES", "U"]);

// Teen-safe allowed ratings (includes Family + PG-13/TV-14)
const TEEN_RATINGS = new Set([
  "G",
  "PG",
  "TV-G",
  "TV-Y",
  "TV-Y7",
  "TV-PG",
  "ALL AGES",
  "U",
  "PG-13",
  "TV-14",
  "U/A",
  "12+",
]);

/**
 * Checks if a title is strictly non-adult (CINOVA platform baseline requirement)
 * Non-adult platform: never allow NC-17, explicit erotica, or pornography
 */
export function isNonAdult(movie: Partial<Movie>): boolean {
  if (!movie) return false;

  // Check explicit adult flag
  if (movie.isAdult === true) return false;

  // Check rating
  const ratingUpper = (movie.rating || "").toUpperCase().trim();
  if (ADULT_RATINGS.has(ratingUpper)) return false;

  // Check genre keywords
  if (Array.isArray(movie.genre)) {
    for (const g of movie.genre) {
      const gLower = g.toLowerCase();
      for (const kw of ADULT_KEYWORDS) {
        if (gLower.includes(kw)) return false;
      }
    }
  }

  // Check synopsis/title for blatant adult spam
  const textToCheck = `${movie.title || ""} ${movie.description || ""}`.toLowerCase();
  if (textToCheck.includes("pornography") || textToCheck.includes("xxx adult")) {
    return false;
  }

  return true;
}

/**
 * Evaluates whether a title complies with the requested safety filter level
 */
export function isContentSafe(movie: Movie, level: SafetyLevel = "GENERAL_MATURE"): boolean {
  // Baseline: must pass non-adult platform rule
  if (!isNonAdult(movie)) return false;

  const ratingUpper = (movie.rating || "PG-13").toUpperCase().trim();

  if (level === "FAMILY_SAFE") {
    // Only allow G / PG / TV-Y / TV-PG
    return FAMILY_RATINGS.has(ratingUpper);
  }

  if (level === "TEEN_SAFE") {
    // Allows up to PG-13 / TV-14
    return TEEN_RATINGS.has(ratingUpper);
  }

  // GENERAL_MATURE: allow up to R / TV-MA, but strict non-adult
  return true;
}

/**
 * Filters a collection of movies based on the chosen safety level
 */
export function filterContentBySafety(movies: Movie[], level: SafetyLevel = "GENERAL_MATURE"): Movie[] {
  return movies.filter((m) => isContentSafe(m, level));
}
