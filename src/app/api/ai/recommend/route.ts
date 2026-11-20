export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_MOVIES } from "@/data/movies";
import { POPULAR_TMDB_CATALOG, convertCatalogItemToMovie } from "@/lib/tmdb";
import { isContentSafe, SafetyLevel } from "@/lib/safety/content-filter";
import { Movie } from "@/types/movie";

// Aggregate the verified dataset
const ALL_CATALOG_MOVIES: Movie[] = [
  ...SAMPLE_MOVIES,
  ...POPULAR_TMDB_CATALOG.map((item) => convertCatalogItemToMovie(item)),
];

// Deduplicate catalog by ID or title
const VERIFIED_VAULT: Movie[] = Array.from(
  new Map(ALL_CATALOG_MOVIES.map((m) => [m.id, m])).values()
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, safetyLevel = "GENERAL_MATURE", maxResults = 5 } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt query" }, { status: 400 });
    }

    const q = prompt.toLowerCase().trim();

    // 1. Filter out unsafe/adult content strictly
    const safeVault = VERIFIED_VAULT.filter((m) => isContentSafe(m, safetyLevel as SafetyLevel));

    // 2. Intelligent Intent Scoring grounded in verified database
    const scored = safeVault.map((m) => {
      let score = 0;
      const reasons: string[] = [];

      const titleLower = m.title.toLowerCase();
      const descLower = m.description.toLowerCase();
      const genresLower = m.genre.map((g) => g.toLowerCase());
      const langLower = m.language.toLowerCase();
      const industryLower = (m.industry || "").toLowerCase();
      const directorsLower = m.directors.map((d) => d.toLowerCase());
      const castLower = m.cast.map((c) => c.name.toLowerCase());

      // Query token matching
      const words = q.split(/\s+/).filter((w) => w.length > 2);

      // Duration checks ("under 2 hours", "short", "quick", "90 minutes")
      if (q.includes("under 2 hours") || q.includes("less than 2 hours") || q.includes("under 120")) {
        if (m.duration <= 120) {
          score += 15;
          reasons.push(`Perfect runtime at ${m.duration} minutes (under 2 hours)`);
        } else {
          score -= 10;
        }
      }
      if (q.includes("under 90") || q.includes("short")) {
        if (m.duration <= 95) {
          score += 20;
          reasons.push(`Brisk, fast-paced runtime (${m.duration} mins)`);
        }
      }

      // Family friendly intent
      if (q.includes("family") || q.includes("kids") || q.includes("children")) {
        if (["G", "PG", "TV-Y", "TV-PG"].includes(m.rating)) {
          score += 25;
          reasons.push(`Rated ${m.rating} — great for family movie night`);
        }
        if (genresLower.includes("animation") || genresLower.includes("family") || genresLower.includes("adventure")) {
          score += 15;
          reasons.push("Wholesome animation and adventure themes");
        }
      }

      // Anime intent ("anime", "beginner anime", "otaku", "japanese")
      if (q.includes("anime") || q.includes("beginner anime")) {
        const isAnime =
          industryLower === "anime" ||
          genresLower.some((g) => g.includes("anime") || g.includes("animation")) ||
          langLower === "japanese";

        if (isAnime) {
          score += 30;
          if (q.includes("beginner")) {
            if (m.imdbScore >= 8.5) {
              score += 20;
              reasons.push(`Universally acclaimed entry point with IMDb ${m.imdbScore}`);
            }
          }
        }
      }

      // Bollywood / Indian Cinema intent
      if (q.includes("bollywood") || q.includes("indian") || q.includes("hindi") || q.includes("south")) {
        if (industryLower === "bollywood" || ["hindi", "telugu", "tamil", "kannada"].includes(langLower)) {
          score += 35;
          reasons.push(`Authentic ${m.language} cinema blockbuster`);
        }
      }

      // Hollywood intent
      if (q.includes("hollywood") || q.includes("western")) {
        if (industryLower === "hollywood" || langLower === "english") {
          score += 15;
        }
      }

      // Christopher Nolan intent
      if (q.includes("nolan") || q.includes("interstellar") || q.includes("inception") || q.includes("oppenheimer")) {
        if (directorsLower.some((d) => d.includes("nolan")) || titleLower.includes("interstellar") || titleLower.includes("inception") || titleLower.includes("oppenheimer")) {
          score += 40;
          reasons.push("Masterful direction by Christopher Nolan");
        }
      }

      // Genre matching
      for (const g of m.genre) {
        if (q.includes(g.toLowerCase())) {
          score += 15;
          reasons.push(`Matches your requested genre: ${g}`);
        }
      }

      // Word frequency matching in title, plot, cast, and directors
      for (const w of words) {
        if (titleLower.includes(w)) {
          score += 20;
          reasons.push(`Title matches keyword "${w}"`);
        }
        if (directorsLower.some((d) => d.includes(w))) {
          score += 18;
          reasons.push(`Directed by ${m.directors.join(", ")}`);
        }
        if (castLower.some((c) => c.includes(w))) {
          score += 12;
          reasons.push(`Stars ${m.cast.slice(0, 2).map((c) => c.name).join(", ")}`);
        }
        if (descLower.includes(w)) {
          score += 5;
        }
      }

      // Baseline rating bonus
      score += (m.imdbScore || 7.0) * 2;

      return {
        movie: m,
        score,
        reasons: reasons.slice(0, 2),
      };
    });

    // Sort by relevance score
    scored.sort((a, b) => b.score - a.score);

    const topRecommendations = scored.slice(0, maxResults).map(({ movie, reasons, score }) => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.originalTitle,
      year: movie.releaseYear,
      duration: movie.duration,
      rating: movie.rating,
      imdbScore: movie.imdbScore,
      matchPercentage: movie.matchPercentage,
      genre: movie.genre,
      language: movie.language,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      type: movie.type,
      synopsis: movie.description,
      directors: movie.directors,
      cast: movie.cast.slice(0, 3).map((c) => c.name),
      aiReason:
        reasons.length > 0
          ? reasons.join(" • ")
          : `Critically rated ${movie.imdbScore}/10 with top-tier cinematic production.`,
    }));

    return NextResponse.json({
      query: prompt,
      safetyLevel,
      count: topRecommendations.length,
      recommendations: topRecommendations,
      summary: `Found ${topRecommendations.length} verified titles from CINOVA's global catalog tailored to: "${prompt}"`,
    });
  } catch (error) {
    console.error("AI recommendation endpoint error:", error);
    return NextResponse.json({ error: "Failed to generate AI recommendations" }, { status: 500 });
  }
}
