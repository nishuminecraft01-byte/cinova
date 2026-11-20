"use client";

import React, { useId } from "react";

interface CinovaLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export default function CinovaLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: CinovaLogoProps) {
  const uid = useId().replace(/:/g, "");

  const dimensions =
    size === "sm"
      ? { svg: "w-6 h-6", text: "text-base tracking-[0.14em]" }
      : size === "lg"
      ? { svg: "w-9 h-9", text: "text-2xl tracking-[0.14em]" }
      : { svg: "w-8 h-8", text: "text-lg sm:text-xl tracking-[0.14em]" };

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dimensions.svg} shrink-0 drop-shadow-[0_2px_10px_rgba(225,29,72,0.32)] transition-transform duration-200 group-hover:scale-[1.04]`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`c-top-${uid}`} x1="10" y1="6" x2="54" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF385B" />
            <stop offset="55%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#A30D32" />
          </linearGradient>
          <linearGradient id={`c-left-${uid}`} x1="10" y1="18" x2="20" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C8123F" />
            <stop offset="100%" stopColor="#650A20" />
          </linearGradient>
          <linearGradient id={`c-bottom-${uid}`} x1="12" y1="44" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#650A20" />
            <stop offset="55%" stopColor="#A30D32" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>

        {/* Top geometric angular C facet */}
        <path
          d="M32 6L54 18.5L46 23.2L32 15.2L18 23.2L10 18.5L32 6Z"
          fill={`url(#c-top-${uid})`}
        />
        {/* Left vertical beveled spine */}
        <path
          d="M10 18.5L18 23.2V40.8L10 45.5V18.5Z"
          fill={`url(#c-left-${uid})`}
        />
        {/* Bottom geometric angular C facet */}
        <path
          d="M10 45.5L18 40.8L32 48.8L46 40.8L54 45.5L32 58L10 45.5Z"
          fill={`url(#c-bottom-${uid})`}
        />
        {/* Subtle inner play-inspired chevron */}
        <path
          d="M29 24.5L41.5 32L29 39.5V24.5Z"
          fill="#FF385B"
          fillOpacity="0.92"
        />
      </svg>

      {showWordmark && (
        <span className={`font-black text-[#F5F1F3] leading-none ${dimensions.text}`}>
          CINOVA
        </span>
      )}
    </span>
  );
}
