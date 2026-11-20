import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cinova.stream";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/movies", "/series", "/movie/*", "/series/*", "/search", "/categories"],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/watch/*",
          "/profile",
          "/settings",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
