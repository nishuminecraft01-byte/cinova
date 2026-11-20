"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CinovaLogo from "@/components/CinovaLogo";

interface AuthShellProps {
  children: React.ReactNode;
  editorialEyebrow?: string;
  editorialHeading?: string;
  editorialSubcopy?: string;
  footerSlot?: React.ReactNode;
}

const CINEMA_BACKDROP_URL =
  "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg";

export default function AuthShell({
  children,
  editorialEyebrow = "CINOVA STREAMING",
  editorialHeading = "Stories that stay with you.",
  editorialSubcopy = "Cinema, series, and anime curated for effortless playback on every screen.",
  footerSlot,
}: AuthShellProps) {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#080506] text-[#F5F1F3] flex flex-col overflow-x-clip">
      {/* Full-viewport atmospheric backdrop photography */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[#080506] bg-cover bg-center bg-no-repeat scale-[1.02]"
        style={{ backgroundImage: `url("${CINEMA_BACKDROP_URL}")` }}
      />

      {/* Natural, controlled dark maroon layered overlays for contrast & depth */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(8, 5, 6, 0.95) 0%, rgba(16, 8, 12, 0.82) 48%, rgba(8, 5, 6, 0.94) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8, 5, 6, 0.84) 0%, rgba(8, 5, 6, 0.30) 38%, rgba(8, 5, 6, 0.94) 100%)",
        }}
      />
      {/* Subtle, restrained ambient crimson top-left light */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(640px circle at 18% 22%, rgba(163, 13, 50, 0.14), transparent 70%)",
        }}
      />

      {/* Minimal Authentication Header */}
      <header className="relative z-20 w-full">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-lg"
            aria-label="CINOVA Home"
          >
            <CinovaLogo size="md" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[rgba(155,25,57,0.28)] bg-[#160B10]/70 hover:bg-[#1D0C13] hover:border-[#E11D48]/50 transition-colors text-xs sm:text-sm font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#AAA0A7]" />
            <span className="text-[#F5F1F3]">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Responsive Two-Column Authentication Stage */}
      <main className="relative z-10 flex-1 flex items-center w-full py-6 sm:py-10 lg:py-12">
        <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Column (Desktop) */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-8 space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-3">
                <span className="w-6 h-[2px] bg-[#E11D48] rounded-full" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#AAA0A7]">
                  {editorialEyebrow}
                </span>
              </div>

              <h1 className="text-4xl xl:text-[52px] font-bold tracking-[-0.03em] leading-[1.08] text-[#F5F1F3] max-w-lg">
                {editorialHeading}
              </h1>

              <p className="text-base text-[#AAA0A7] leading-relaxed max-w-md font-normal">
                {editorialSubcopy}
              </p>

              <div className="pt-4 flex items-center gap-6 text-xs text-[#746971] tracking-wide">
                <span className="text-[#F5F1F3]/90 font-medium">4K Ultra HD</span>
                <span className="w-1 h-1 rounded-full bg-[#E11D48]/60" />
                <span className="text-[#F5F1F3]/90 font-medium">Dolby Atmos</span>
                <span className="w-1 h-1 rounded-full bg-[#E11D48]/60" />
                <span className="text-[#F5F1F3]/90 font-medium">Global Cinema &amp; Anime</span>
              </div>
            </div>

            {/* Right Authentication Panel Column */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-end">
              {/* Compact Brand Tagline on Mobile / Tablet */}
              <div className="lg:hidden w-full max-w-[440px] mb-5 text-left">
                <p className="text-xs font-medium tracking-wide text-[#AAA0A7]">
                  {editorialHeading}
                </p>
              </div>

              <div className="w-full max-w-[440px]">
                <div className="w-full rounded-2xl bg-[#10080C]/92 border border-[rgba(155,25,57,0.28)] shadow-[0_24px_64px_rgba(0,0,0,0.75)] backdrop-blur-md p-6 sm:p-9 animate-fade-in">
                  {children}
                </div>

                {footerSlot && <div className="mt-4">{footerSlot}</div>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Minimal Footer */}
      <footer className="relative z-10 w-full py-5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#746971]">
          <span>&copy; {new Date().getFullYear()} CINOVA. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Privacy</span>
            <span className="text-[#746971]/40">·</span>
            <span>Terms</span>
            <span className="text-[#746971]/40">·</span>
            <span>Help Center</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
