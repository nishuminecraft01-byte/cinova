import { NextResponse } from "next/server";
import { syncEngine } from "@/lib/sync/sync-engine";
import { SAMPLE_MOVIES } from "@/data/movies";
import { ContentItem } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "MOVIE", "SERIES", "ANIME", "UPCOMING", "AIRING", "ALL"
  const genre = searchParams.get("genre");
  const country = searchParams.get("country");
  const language = searchParams.get("language");
  const year = searchParams.get("year");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const sort = searchParams.get("sort") || "popular"; // "popular", "newest", "score", "views"
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  let allItems = syncEngine.getAllContent();

  // If sync engine has not populated yet, initialize from rich sample database
  if (allItems.length === 0) {
    const fallbackNormalized: ContentItem[] = SAMPLE_MOVIES.map((m) => {
      const isSeries = m.type === "series";
      const isAnime = m.genre.includes("Animation") || m.industry === "anime";
      let contentType: any = "MOVIE";
      if (isAnime && isSeries) contentType = "ANIME_SERIES";
      else if (isAnime) contentType = "ANIME_MOVIE";
      else if (isSeries) contentType = "SERIES";

      return {
        id: m.id,
        slug: m.id,
        title: m.title,
        originalTitle: m.originalTitle,
        tagline: m.tagline,
        synopsis: m.description,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        trailerUrl: m.trailerUrl,
        videoUrl: m.videoUrl,
        type: contentType,
        status: "RELEASED",
        releaseDate: new Date(m.releaseYear, 0, 1),
        releaseYear: m.releaseYear,
        duration: m.duration,
        rating: m.rating,
        score: m.imdbScore,
        matchPercentage: m.matchPercentage,
        language: m.language,
        country: m.language === "Hindi" ? "India" : m.language === "Japanese" ? "Japan" : "United States",
        views: m.views,
        isFeatured: !!m.isFeatured,
        isTrending: !!m.isTrending,
        isPopular: !!m.isPopular,
        isUpcoming: false,
        quality: m.quality,
        audioSpecs: m.audioSpecs,
        createdAt: new Date(),
        updatedAt: new Date(),
        genres: m.genre.map((g) => ({ id: g, name: g, slug: g.toLowerCase() })),
        cast: m.cast.map((c, idx) => ({
          id: `c-${idx}`,
          contentId: m.id,
          personId: `p-${idx}`,
          person: { id: `p-${idx}`, name: c.name, slug: c.name.toLowerCase() },
          character: c.character,
          role: "ACTOR",
          order: idx,
        })),
        directors: m.directors.map((d, idx) => ({
          id: `d-${idx}`,
          name: d,
          slug: d.toLowerCase(),
        })),
        externalSources: [
          {
            id: `src-${m.id}`,
            contentId: m.id,
            source: "TMDB",
            externalId: m.tmdbId || m.id,
            lastSyncedAt: new Date(),
          },
        ],
      };
    });

    syncEngine.setInitialContent(fallbackNormalized);
    allItems = syncEngine.getAllContent();
  }

  // Filtering
  let filtered = allItems.filter((item) => {
    if (type && type !== "ALL") {
      if (type === "MOVIE" && item.type !== "MOVIE" && item.type !== "ANIME_MOVIE") return false;
      if (type === "SERIES" && item.type !== "SERIES" && item.type !== "ANIME_SERIES") return false;
      if (type === "ANIME" && item.type !== "ANIME_MOVIE" && item.type !== "ANIME_SERIES") return false;
      if (type === "UPCOMING" && !item.isUpcoming && item.status !== "UPCOMING") return false;
      if (type === "AIRING" && item.status !== "AIRING") return false;
    }

    if (genre && genre !== "All") {
      if (!item.genres.some((g) => g.name.toLowerCase() === genre.toLowerCase())) return false;
    }

    if (country && country !== "All") {
      if (!item.country?.toLowerCase().includes(country.toLowerCase())) return false;
    }

    if (language && language !== "All") {
      if (item.language.toLowerCase() !== language.toLowerCase()) return false;
    }

    if (year && year !== "All") {
      if (String(item.releaseYear) !== year) return false;
    }

    if (search) {
      const matchTitle = item.title.toLowerCase().includes(search);
      const matchOrig = item.originalTitle?.toLowerCase().includes(search);
      const matchSynopsis = item.synopsis.toLowerCase().includes(search);
      const matchCast = item.cast.some((c) => c.person.name.toLowerCase().includes(search));
      const matchDir = item.directors.some((d) => d.name.toLowerCase().includes(search));
      if (!matchTitle && !matchOrig && !matchSynopsis && !matchCast && !matchDir) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === "newest") return b.releaseYear - a.releaseYear;
    if (sort === "score") return b.score - a.score;
    if (sort === "views") return b.views - a.views;
    if (sort === "title") return a.title.localeCompare(b.title);
    return (b.views || 0) - (a.views || 0); // popular default
  });

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json(
    {
      success: true,
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      items: paginated,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
