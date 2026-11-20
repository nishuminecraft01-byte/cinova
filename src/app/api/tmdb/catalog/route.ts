export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { TMDBConfigError, tmdb } from "@/lib/api/tmdb-client";
import { getCatalogFeedDefinition } from "@/lib/tmdb-worldwide";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedParam = (searchParams.get("feed") || "").trim().toLowerCase();
  const feedsParam = (searchParams.get("feeds") || "").trim().toLowerCase();
  const pageRaw = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.min(500, Math.floor(pageRaw))) : 1;

  // Multi-feed batch mode (capped at 6 rails per request for smooth progressive loading)
  if (feedsParam) {
    const requestedIds = feedsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (requestedIds.length === 0) {
      return NextResponse.json(
        { configured: true, setupRequired: false, feeds: {} },
        { status: 200 }
      );
    }

    try {
      const settled = await Promise.allSettled(
        requestedIds.map(async (id) => {
          const result = await tmdb.getCatalogFeed(id, 1);
          return { id, result };
        })
      );

      let configError: TMDBConfigError | null = null;
      const feeds: Record<
        string,
        {
          items: Awaited<ReturnType<typeof tmdb.getCatalogFeed>>["items"];
          page: number;
          totalPages: number;
          totalResults: number;
        }
      > = {};

      for (const entry of settled) {
        if (entry.status === "fulfilled") {
          feeds[entry.value.id] = entry.value.result;
        } else if (entry.reason instanceof TMDBConfigError) {
          configError = entry.reason;
        }
      }

      if (configError && Object.keys(feeds).length === 0) {
        return NextResponse.json(
          {
            configured: false,
            setupRequired: true,
            error:
              "TMDB credentials are not configured. Add TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local and restart the server.",
            feeds: {},
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          configured: true,
          setupRequired: false,
          feeds,
          refreshedAt: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
          },
        }
      );
    } catch (err) {
      if (err instanceof TMDBConfigError) {
        return NextResponse.json(
          {
            configured: false,
            setupRequired: true,
            error:
              "TMDB credentials are not configured. Add TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local.",
            feeds: {},
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          configured: true,
          setupRequired: false,
          error: "Unable to load worldwide catalog feeds right now.",
          feeds: {},
        },
        { status: 502 }
      );
    }
  }

  // Single paginated feed mode
  const targetFeed = feedParam || "trending-worldwide";
  const feedMeta = getCatalogFeedDefinition(targetFeed);

  try {
    const result = await tmdb.getCatalogFeed(targetFeed, page);
    const maxAge = feedMeta?.revalidateSeconds || 900;

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        feed: targetFeed,
        feedMeta,
        ...result,
        refreshedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
        },
      }
    );
  } catch (err) {
    if (err instanceof TMDBConfigError) {
      return NextResponse.json(
        {
          configured: false,
          setupRequired: true,
          error:
            "TMDB credentials are not configured. Add TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local.",
          feed: targetFeed,
          feedMeta,
          items: [],
          page: 1,
          totalPages: 1,
          totalResults: 0,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        configured: true,
        setupRequired: false,
        error: "Unable to load this catalog feed from TMDB right now.",
        feed: targetFeed,
        feedMeta,
        items: [],
        page,
        totalPages: 1,
        totalResults: 0,
      },
      { status: 502 }
    );
  }
}
