export const runtime = 'edge';

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SAMPLE_MOVIES } from "@/data/movies";
import ContentDetailView from "@/components/ContentDetailView";
import WorldwideDetailView from "@/components/WorldwideDetailView";
import { TMDBConfigError, TMDBNotFoundError, tmdb } from "@/lib/api/tmdb-client";

export const dynamic = "force-dynamic";

interface MoviePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { slug } = params;
  const clean = decodeURIComponent(slug).trim().toLowerCase();
  const normalizedTmdb = clean.replace(/^tmdb-(?:movie-)?/, "");

  if (/^\d+$/.test(normalizedTmdb)) {
    try {
      const details = await tmdb.getWorldwideMovieDetails(normalizedTmdb);
      return {
        title: `${details.title} (${details.releaseYear || "Movie"}) | Where to Watch & Stream | CINOVA`,
        description: details.overview || `Explore ${details.title}. Check streaming platforms, cast, and trailer.`,
        openGraph: {
          title: `${details.title} | CINOVA`,
          description: details.overview,
          images: details.backdropUrl ? [details.backdropUrl] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: `${details.title} | CINOVA`,
          description: details.overview,
          images: details.backdropUrl ? [details.backdropUrl] : [],
        },
      };
    } catch {
      // Fallback to local sample movies
    }
  }

  const movie = SAMPLE_MOVIES.find((m) => {
    if (m.type === "series") return false;
    return (
      m.id.toLowerCase() === clean ||
      (m.tmdbId && (m.tmdbId.toLowerCase() === clean || m.tmdbId.toLowerCase() === normalizedTmdb))
    );
  });

  if (movie) {
    return {
      title: `${movie.title} (${movie.releaseYear}) | Watch on CINOVA`,
      description: movie.description || `Explore ${movie.title} on CINOVA.`,
      openGraph: {
        title: `${movie.title} | CINOVA`,
        description: movie.description,
        images: movie.backdropUrl ? [movie.backdropUrl] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.title} | CINOVA`,
        description: movie.description,
        images: movie.backdropUrl ? [movie.backdropUrl] : [],
      },
    };
  }

  return {
    title: "Movie Details | CINOVA",
  };
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { slug } = params;
  const clean = decodeURIComponent(slug).trim().toLowerCase();
  const normalizedTmdb = clean.replace(/^tmdb-(?:movie-)?/, "");

  // Helper to find title in local curated catalog (e.g. open source / platform exclusives)
  const findLocalMovie = () =>
    SAMPLE_MOVIES.find((m) => {
      if (m.type === "series") return false;
      const titleSlug = m.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const tmdbMatches =
        m.tmdbId !== undefined &&
        (m.tmdbId.toLowerCase() === clean || m.tmdbId.toLowerCase() === normalizedTmdb);

      return (
        m.id.toLowerCase() === clean ||
        tmdbMatches ||
        titleSlug === clean ||
        (m.tmdbId !== undefined && `movie-${titleSlug}-${m.tmdbId.toLowerCase()}` === clean)
      );
    });

  // 1. Dynamic Worldwide Catalog: If numeric TMDB ID, prioritize live TMDB details
  if (/^\d+$/.test(normalizedTmdb)) {
    try {
      const details = await tmdb.getWorldwideMovieDetails(normalizedTmdb);
      return <WorldwideDetailView data={details} />;
    } catch (err) {
      if (err instanceof TMDBConfigError) {
        return (
          <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center px-4 pt-24 pb-20">
            <div className="max-w-lg w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.3)] p-6 sm:p-8 space-y-4 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-bold uppercase tracking-wider text-[#FF385B]">
                TMDB Configuration Required
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1F3]">
                Unable to load worldwide movie details
              </h1>
              <p className="text-sm text-[#AAA0A7] leading-relaxed">
                Add your TMDB API Read Access Token (<code className="text-[#F5F1F3]">TMDB_API_READ_ACCESS_TOKEN</code>) or <code className="text-[#F5F1F3]">TMDB_API_KEY</code> to <code className="text-[#F5F1F3]">.env.local</code> and restart the server.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/search"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-sm font-bold text-[#F5F1F3]"
                >
                  Back to Search
                </Link>
                <Link
                  href="/movies"
                  className="px-5 py-2.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.3)] text-sm font-semibold text-[#F5F1F3]"
                >
                  CINOVA Movies
                </Link>
              </div>
            </div>
          </div>
        );
      }

      if (err instanceof TMDBNotFoundError) {
        notFound();
      }

      // Fast resilient second attempt before falling back
      try {
        const retryDetails = await tmdb.getWorldwideMovieDetails(normalizedTmdb);
        return <WorldwideDetailView data={retryDetails} />;
      } catch {
        // Proceed to fallback
      }

      // If TMDB threw network error, fallback to local curated movie before giving up
      const localFallback = findLocalMovie();
      if (localFallback) {
        return <ContentDetailView movie={localFallback} typeLabel="Movie" />;
      }

      // Transient TMDB network error
      return (
        <div className="min-h-screen cinova-atmosphere bg-[#080506] text-[#F5F1F3] flex items-center justify-center px-4 pt-24 pb-20">
          <div className="max-w-md w-full rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.34)] p-6 sm:p-8 space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#1D0C13] border border-[rgba(155,25,57,0.35)] text-xs font-bold uppercase tracking-wider text-[#FF385B]">
              Temporary Connection Issue
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1F3]">
              Unable to load movie details right now
            </h1>
            <p className="text-sm text-[#AAA0A7] leading-relaxed">
              The worldwide metadata service took too long to respond. Please refresh or keep exploring CINOVA.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={`/movie/tmdb-${normalizedTmdb}`}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-sm font-bold text-[#F5F1F3] hover:from-[#B9123B] hover:to-[#FF385B] transition-all shadow-[0_4px_14px_rgba(225,29,72,0.3)]"
              >
                Try Again
              </a>
              <Link
                href="/movies"
                className="px-5 py-2.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.3)] text-sm font-semibold text-[#F5F1F3] hover:text-white transition-colors"
              >
                Explore Movies
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. Curated local catalog (exclusive / open source movies)
  const movie = findLocalMovie();
  if (movie) {
    return <ContentDetailView movie={movie} typeLabel="Movie" />;
  }

  notFound();
}
