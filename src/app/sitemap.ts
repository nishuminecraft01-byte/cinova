import { MetadataRoute } from "next";
import { SAMPLE_MOVIES } from "@/data/movies";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cinova.pages.dev";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/series`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/music`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic movie & series routes
  const catalogRoutes: MetadataRoute.Sitemap = SAMPLE_MOVIES.map((item) => {
    const isSeries = item.type === "series";
    const segment = isSeries ? "series" : "movie";
    const href = item.tmdbId ? `tmdb-${item.tmdbId}` : item.id;
    return {
      url: `${siteUrl}/${segment}/${href}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...catalogRoutes];
}
