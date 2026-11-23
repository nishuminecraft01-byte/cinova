"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Film, Tv, Music, Bookmark } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { watchlist } = useWatchlist();

  const items = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
    { label: "Search", href: "/search", icon: Search, active: pathname.startsWith("/search") },
    { label: "Movies", href: "/movies", icon: Film, active: pathname.startsWith("/movies") || pathname.startsWith("/movie/") },
    { label: "Series", href: "/series", icon: Tv, active: pathname.startsWith("/series") },
    { label: "Music", href: "/music", icon: Music, active: pathname.startsWith("/music") },
    {
      label: "My List",
      href: "/profile?tab=watchlist",
      icon: Bookmark,
      active: pathname === "/profile",
      badge: watchlist.length > 0 ? watchlist.length : undefined,
    },
  ];

  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/watch/")) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0508]/95 backdrop-blur-xl border-t border-[rgba(155,25,57,0.24)] px-1 sm:px-2 pt-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.65)]"
      style={{
        paddingBottom: "max(var(--safe-bottom, 0px), 8px)",
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[46px] min-h-[46px] py-1 px-1 sm:px-2 rounded-xl transition-colors relative active:scale-95 ${
                item.active
                  ? "text-[#F5F1F3] font-semibold bg-[#650A20]/30"
                  : "text-[#AAA0A7] hover:text-[#F5F1F3]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.active ? "text-[#E11D48]" : ""}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-[#E11D48] text-[#F5F1F3] text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
