"use client";

import React, { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Star, Film } from "lucide-react";
import { Movie } from "@/types/movie";
import { useWatchlist } from "@/context/WatchlistContext";
import { getSyncAvailability } from "@/lib/video-sources";
import CinovaImage from "@/components/CinovaImage";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
  aspect?: "landscape" | "poster";
  fluid?: boolean;
  onOpenModal?: (movie: Movie) => void;
}

function MovieCardComponent({
  movie,
  priority = false,
  aspect = "landscape",
  fluid = false,
  onOpenModal,
}: MovieCardProps) {
  const router = useRouter();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const inWatchlist = isInWatchlist(movie.id);
  const isLandscape = aspect === "landscape";
  const displayImage = isLandscape
    ? movie.backdropUrl || movie.posterUrl
    : movie.posterUrl || movie.backdropUrl;

  const widthClass = fluid
    ? "w-full"
    : isLandscape
    ? "w-[228px] sm:w-[272px] lg:w-[292px]"
    : "w-[144px] sm:w-[174px] md:w-[192px]";

  const hasRating = typeof movie.imdbScore === "number" && movie.imdbScore > 0;
  const isPlayable = getSyncAvailability(movie.id, movie) === "Available";

  const handleCardActivate = () => {
    if (onOpenModal) {
      onOpenModal(movie);
    } else {
      router.push(`/title/${movie.id}`);
    }
  };

  return (
    <article
      onClick={handleCardActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardActivate();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ""}`}
      className={`group/card relative flex-shrink-0 snap-start cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-xl ${widthClass}`}
    >
      {/* Cinematic Card Frame */}
      <div
        className={`relative w-full rounded-xl overflow-hidden bg-[#160B10] border border-[rgba(155,25,57,0.22)] shadow-[0_8px_22px_rgba(0,0,0,0.55)] transition-colors duration-200 ease-out group-hover/card:border-[#E11D48]/55 ${
          isLandscape ? "aspect-video" : "aspect-[2/3]"
        }`}
      >
        {/* Official Verified Artwork (sized cleanly for card viewport) */}
        <CinovaImage
          src={displayImage}
          alt={movie.title}
          fallbackText={movie.title}
          aspect={isLandscape ? "backdrop" : "poster"}
          tmdbSize={isLandscape ? "w500" : "w342"}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.04]"
        />

        {/* Playable vs Discovery Indicator Badge */}
        {isPlayable ? (
          <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-[#0D2418]/90 border border-[#10B981]/50 text-[#10B981] text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Stream Ready
          </span>
        ) : (
          <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-[#160B10]/90 border border-[rgba(155,25,57,0.35)] text-[#FF385B] text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-xs">
            Discovery
          </span>
        )}

        {/* Subtle Top-Right Watchlist Action (visible on touch, hover-revealed on desktop) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWatchlist(movie.id);
          }}
          className={`absolute top-2 right-2 z-20 w-8 h-8 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-opacity duration-200 active:scale-95 ${
            inWatchlist
              ? "opacity-100 bg-[#650A20]/95 border-[#E11D48]/65 text-[#F5F1F3]"
              : "opacity-85 sm:opacity-0 sm:group-hover/card:opacity-100 bg-[#080506]/85 border-[rgba(155,25,57,0.42)] hover:border-[#E11D48] text-[#F5F1F3]"
          }`}
          title={inWatchlist ? "Remove from My List" : "Add to My List"}
          aria-label={inWatchlist ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`}
        >
          {inWatchlist ? <Check className="w-3.5 h-3.5 text-[#FF385B]" /> : <Plus className="w-3.5 h-3.5" />}
        </button>

        {/* Dark Bottom Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#080506]/96 via-[#080506]/65 to-transparent pointer-events-none z-10"
        />

        {/* Bottom Card Metadata & Play Action */}
        <div className="absolute inset-x-3 bottom-2.5 z-20 flex items-end justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-[13px] sm:text-sm font-bold text-[#F5F1F3] group-hover/card:text-white transition-colors truncate leading-snug text-shadow-cinova">
              {movie.title}
            </h4>

            <div className="flex items-center gap-1.5 text-[11px] text-[#AAA0A7] leading-none tabular-nums">
              {movie.releaseYear && <span>{movie.releaseYear}</span>}
              {movie.releaseYear && hasRating && <span className="text-[#746971]">•</span>}
              {hasRating && (
                <span className="inline-flex items-center gap-0.5 text-[#F5F1F3]/90 font-medium">
                  <Star className="w-2.5 h-2.5 fill-[#FF385B] text-[#FF385B]" />
                  {movie.imdbScore.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {isPlayable ? (
            <Link
              href={`/watch/${movie.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#160B10]/95 border border-[rgba(155,25,57,0.48)] group-hover/card:bg-[#E11D48] group-hover/card:border-[#E11D48] text-[#F5F1F3] flex items-center justify-center shrink-0 transition-colors duration-200 shadow-md active:scale-95"
              title={`Play ${movie.title}`}
              aria-label={`Play ${movie.title}`}
            >
              <Play className="w-3.5 h-3.5 fill-[#F5F1F3] text-[#F5F1F3] ml-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardActivate();
              }}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#160B10]/95 border border-[rgba(155,25,57,0.42)] group-hover/card:bg-[#1D0C13] group-hover/card:border-[#E11D48]/70 text-[#AAA0A7] group-hover/card:text-[#F5F1F3] flex items-center justify-center shrink-0 transition-colors duration-200 shadow-md active:scale-95"
              title={`Explore & Preview ${movie.title}`}
              aria-label={`Explore & Preview ${movie.title}`}
            >
              <Film className="w-3.5 h-3.5 text-[#FF385B]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const MovieCard = memo(MovieCardComponent);
export default MovieCard;
