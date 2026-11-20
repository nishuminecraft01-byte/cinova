/**
 * AniList GraphQL API Client for CINOVA Global Entertainment Discovery Platform
 * Official public GraphQL integration fetching anime metadata, airing schedules, seasons, and rankings.
 */

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string;
  format: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA";
  status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED";
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null; // minutes per episode
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  averageScore: number | null; // 0 - 100
  popularity: number;
  trending: number;
  studios: {
    nodes: Array<{ name: string; isAnimationStudio: boolean }>;
  };
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  characters?: {
    nodes: Array<{
      name: { full: string };
      image: { medium: string | null };
    }>;
  };
  trailer?: {
    id: string;
    site: string;
  } | null;
}

const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

const ANIME_QUERY = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  description(asHtml: false)
  format
  status
  season
  seasonYear
  episodes
  duration
  coverImage {
    extraLarge
    large
    color
  }
  bannerImage
  genres
  averageScore
  popularity
  trending
  studios(isMain: true) {
    nodes {
      name
      isAnimationStudio
    }
  }
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
  characters(role: MAIN, perPage: 6) {
    nodes {
      name {
        full
      }
      image {
        medium
      }
    }
  }
  trailer {
    id
    site
  }
`;

export class AniListClient {
  private async queryGraphQL<T>(query: string, variables: Record<string, any> = {}, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ query, variables }),
          next: { revalidate: 3600 }, // Cache response for 1 hour
        });

        if (!res.ok) {
          if (res.status === 429 && attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
            continue;
          }
          throw new Error(`AniList GraphQL error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].message);
        }

        return data.data as T;
      } catch (err) {
        if (attempt >= retries) throw err;
        await new Promise((resolve) => setTimeout(resolve, attempt * 800));
      }
    }

    throw new Error(`Failed to query AniList GraphQL after ${retries} attempts`);
  }

  // 1. Trending Anime
  public async getTrendingAnime(perPage = 20): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
            ${ANIME_QUERY}
          }
        }
      }
    `;
    const data = await this.queryGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
      page: 1,
      perPage,
    });
    return data.Page?.media || [];
  }

  // 2. All-Time Popular Anime
  public async getPopularAnime(perPage = 20): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
            ${ANIME_QUERY}
          }
        }
      }
    `;
    const data = await this.queryGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
      page: 1,
      perPage,
    });
    return data.Page?.media || [];
  }

  // 3. Currently Airing Anime
  public async getAiringAnime(perPage = 20): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(status: RELEASING, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
            ${ANIME_QUERY}
          }
        }
      }
    `;
    const data = await this.queryGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
      page: 1,
      perPage,
    });
    return data.Page?.media || [];
  }

  // 4. Upcoming Anime
  public async getUpcomingAnime(perPage = 20): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
            ${ANIME_QUERY}
          }
        }
      }
    `;
    const data = await this.queryGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
      page: 1,
      perPage,
    });
    return data.Page?.media || [];
  }

  // 5. Single Anime Details by ID
  public async getAnimeById(id: number): Promise<AniListMedia | null> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${ANIME_QUERY}
        }
      }
    `;
    const data = await this.queryGraphQL<{ Media: AniListMedia }>(query, { id });
    return data.Media || null;
  }

  // 6. Search Anime by Title
  public async searchAnime(search: string, perPage = 20): Promise<AniListMedia[]> {
    const query = `
      query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(search: $search, type: ANIME, isAdult: false) {
            ${ANIME_QUERY}
          }
        }
      }
    `;
    const data = await this.queryGraphQL<{ Page: { media: AniListMedia[] } }>(query, {
      search,
      perPage,
    });
    return data.Page?.media || [];
  }
}

export const anilist = new AniListClient();
