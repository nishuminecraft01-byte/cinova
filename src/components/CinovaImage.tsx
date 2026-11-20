"use client";

import React, { useState, memo } from "react";
import CinovaLogo from "@/components/CinovaLogo";
import { optimizeTmdbImageUrl, TmdbImageSize } from "@/lib/image-utils";

interface CinovaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackText?: string;
  aspect?: "poster" | "backdrop" | "square" | "custom";
  tmdbSize?: TmdbImageSize;
  className?: string;
  containerClassName?: string;
}

const DEFAULT_SIZE_BY_ASPECT: Record<"poster" | "backdrop" | "square" | "custom", TmdbImageSize> = {
  poster: "w342",
  backdrop: "w500",
  square: "w500",
  custom: "w1280",
};

const INTRINSIC_DIMS_BY_ASPECT: Record<
  "poster" | "backdrop" | "square" | "custom",
  { width?: number; height?: number }
> = {
  poster: { width: 342, height: 513 },
  backdrop: { width: 500, height: 281 },
  square: { width: 320, height: 320 },
  custom: {},
};

function CinovaImageComponent({
  src,
  alt,
  fallbackText,
  aspect = "backdrop",
  tmdbSize,
  className = "",
  containerClassName = "",
  ...props
}: CinovaImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const targetSize = tmdbSize || DEFAULT_SIZE_BY_ASPECT[aspect];
  const optimizedSrc = optimizeTmdbImageUrl(src, targetSize);
  const hasValidSrc = Boolean(optimizedSrc.length > 0 && failedSrc !== optimizedSrc);

  const aspectClass =
    aspect === "poster"
      ? "aspect-[2/3]"
      : aspect === "backdrop"
      ? "aspect-video"
      : aspect === "square"
      ? "aspect-square"
      : "";

  const intrinsic = INTRINSIC_DIMS_BY_ASPECT[aspect];

  return (
    <div
      className={`relative overflow-hidden bg-[#140A0E] flex items-center justify-center ${aspectClass} ${containerClassName}`}
    >
      {/* Official Verified Artwork Image (sized via TMDB CDN, zero off-screen pulse loops) */}
      {hasValidSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedSrc}
          alt={alt}
          width={props.width ?? intrinsic.width}
          height={props.height ?? intrinsic.height}
          loading={props.loading || "lazy"}
          decoding="async"
          onError={() => setFailedSrc(optimizedSrc)}
          className={`w-full h-full min-w-full min-h-full object-cover ${className}`}
          {...props}
        />
      ) : (
        /* Clean CINOVA Branded Fallback Placeholder (Dark Maroon) */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#160B10] to-[#080506] text-center select-none">
          <div className="w-10 h-10 rounded-xl bg-[#650A20]/30 border border-[rgba(155,25,57,0.35)] flex items-center justify-center mb-2.5">
            <CinovaLogo size="sm" showWordmark={false} />
          </div>
          <span className="text-xs font-semibold text-[#F5F1F3]/90 line-clamp-2 px-2 leading-snug">
            {fallbackText || alt || "CINOVA"}
          </span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-[#FF385B]/75 font-semibold mt-1.5">
            CINOVA
          </span>
        </div>
      )}
    </div>
  );
}

const CinovaImage = memo(CinovaImageComponent);
export default CinovaImage;
