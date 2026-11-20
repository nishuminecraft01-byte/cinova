import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SAMPLE_MOVIES } from "@/data/movies";
import ContentDetailView from "@/components/ContentDetailView";
import WorldwideDetailView from "@/components/WorldwideDetailView";
import { TMDBConfigError, TMDBNotFoundError, tmdb } from "@/lib/api/tmdb-client";

export const dynamic = "force-dynamic";

interface AnimePageProps {
  params: {
    slug: string;
  };
}

export default async function AnimeDetailPage({ params }: AnimePageProps) {
  const { slug } = params;
  const clean = decodeURIComponent(slug).trim().toLowerCase();
  const normalizedTmdb = clean.replace(/^tmdb-(?:tv-|movie-|anime-)?/, "");

  // Match strictly by exact ID, TMDB ID, or exact slugified title
  const anime = SAMPLE_MOVIES.find((m) => {
    const titleSlug = m.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return (
      m.id.toLowerCase() === clean ||
      (m.tmdbId !== undefined &&
        (m.tmdbId.toLowerCase() === clean || m.tmdbId.toLowerCase() === normalizedTmdb)) ||
      titleSlug === clean ||
      (m.tmdbId !== undefined && `anime-${titleSlug}-${m.tmdbId.toLowerCase()}` === clean)
    );
  });

  if (anime) {
    return <ContentDetailView movie={anime} typeLabel="Anime" />;
  }

  if (/^\d+$/.test(normalizedTmdb)) {
    try {
      const seriesDetails = await tmdb.getWorldwideSeriesDetails(normalizedTmdb);
      return <WorldwideDetailView data={seriesDetails} />;
    } catch (seriesErr) {
      if (seriesErr instanceof TMDBNotFoundError) {
        try {
          const movieDetails = await tmdb.getWorldwideMovieDetails(normalizedTmdb);
          return <WorldwideDetailView data={movieDetails} />;
        } catch (movieErr) {
          if (movieErr instanceof TMDBNotFoundError) notFound();
        }
      }
      if (seriesErr instanceof TMDBConfigError) {
        return (
          <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center px-4 pt-24 pb-20">
            <div className="max-w-lg w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.3)] p-6 sm:p-8 space-y-4 text-center">
              <h1 className="text-xl font-bold text-[#F5F1F3]">TMDB Configuration Required</h1>
              <p className="text-sm text-[#AAA0A7]">
                Configure <code className="text-[#F5F1F3]">TMDB_API_READ_ACCESS_TOKEN</code> or{" "}
                <code className="text-[#F5F1F3]">TMDB_API_KEY</code> in <code className="text-[#F5F1F3]">.env.local</code>.
              </p>
              <Link
                href="/search?type=anime"
                className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-sm font-bold text-[#F5F1F3]"
              >
                Explore Anime
              </Link>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center px-4 pt-24 pb-20">
          <div className="max-w-md w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.34)] p-6 sm:p-8 space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-bold uppercase tracking-wider text-[#FF385B]">
              Temporary Connection Issue
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1F3]">
              Unable to load anime details right now
            </h1>
            <p className="text-sm text-[#AAA0A7] leading-relaxed">
              The worldwide metadata service took too long to respond. Please try again or keep exploring CINOVA.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={`/anime/tmdb-${normalizedTmdb}`}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-sm font-bold text-[#F5F1F3] hover:from-[#B9123B] hover:to-[#FF385B] transition-all shadow-[0_4px_14px_rgba(225,29,72,0.3)]"
              >
                Try Again
              </a>
              <Link
                href="/anime"
                className="px-5 py-2.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.3)] text-sm font-semibold text-[#F5F1F3] hover:text-white transition-colors"
              >
                Explore Anime
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  notFound();
}
