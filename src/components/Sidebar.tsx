"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Music,
  Bookmark,
  History,
  User,
  Settings,
} from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { watchlist, continueWatching } = useWatchlist();
  const { user } = useAuth();
  const [queryType, setQueryType] = useState<string | null>(null);
  const [tabParam, setTabParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setQueryType(params.get("type"));
      setTabParam(params.get("tab"));
    }
  }, [pathname]);

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  if (isAuthRoute) {
    return null;
  }

  const isAnimeSearch = pathname === "/search" && queryType === "anime";

  const primaryItems = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
    { label: "Movies", href: "/movies", icon: Film, active: pathname.startsWith("/movies") || pathname.startsWith("/movie/") },
    { label: "Series", href: "/series", icon: Tv, active: pathname.startsWith("/series") },
    { label: "Anime", href: "/search?type=anime", icon: Sparkles, active: isAnimeSearch || pathname.startsWith("/anime/") },
    { label: "Music", href: "/music", icon: Music, active: pathname.startsWith("/music") },
    {
      label: "My List",
      href: "/profile?tab=watchlist",
      icon: Bookmark,
      active: pathname === "/profile" && tabParam !== "account" && tabParam !== "settings" && tabParam !== "history" && tabParam !== "continue",
      badge: watchlist.length > 0 ? watchlist.length : undefined,
    },
    {
      label: "History",
      href: "/history",
      icon: History,
      active: pathname === "/history" || (pathname === "/profile" && (tabParam === "history" || tabParam === "continue")),
      badge: continueWatching.length > 0 ? continueWatching.length : undefined,
    },
    {
      label: "Profile",
      href: "/profile?tab=account",
      icon: User,
      active: pathname === "/profile" && tabParam === "account",
    },
  ];

  const settingsHref = user?.role === "admin" ? "/admin" : "/profile?tab=settings";
  const settingsActive = pathname === "/admin" || (pathname === "/profile" && tabParam === "settings");

  return (
    <aside
      aria-label="Primary Sidebar Navigation"
      className="hidden lg:flex fixed top-16 left-0 bottom-0 w-[76px] z-40 flex-col items-center justify-between py-5 bg-[#0B0508]/92 backdrop-blur-xl border-r border-[rgba(155,25,57,0.22)] select-none"
      style={{
        backgroundImage:
          "radial-gradient(120px circle at 50% 12%, rgba(163, 13, 50, 0.16), transparent 72%)",
      }}
    >
      {/* Top / Primary Navigation Stack */}
      <nav className="w-full px-2 flex flex-col items-center gap-1.5">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`group relative w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                item.active
                  ? "bg-gradient-to-b from-[#A30D32]/45 to-[#650A20]/35 border border-[#E11D48]/35 text-[#F5F1F3] shadow-[0_4px_16px_rgba(101,10,32,0.45)]"
                  : "border border-transparent text-[#746971] hover:text-[#F5F1F3] hover:bg-[#160B10]/90"
              }`}
            >
              {/* Left active crimson indicator bar */}
              {item.active && (
                <span
                  aria-hidden="true"
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-[#E11D48]"
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    item.active ? "text-[#F5F1F3]" : "text-[#AAA0A7] group-hover:text-[#F5F1F3]"
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#E11D48] text-[#F5F1F3] text-[9px] font-bold flex items-center justify-center leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-wide leading-none ${
                  item.active ? "font-semibold text-[#F5F1F3]" : "font-medium text-[#AAA0A7] group-hover:text-[#F5F1F3]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Utility Section */}
      <div className="w-full px-2 pt-4 border-t border-[rgba(155,25,57,0.16)] flex flex-col items-center gap-1.5">
        <Link
          href={settingsHref}
          title="Settings"
          className={`group relative w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            settingsActive
              ? "bg-[#650A20]/45 border border-[#E11D48]/35 text-[#F5F1F3]"
              : "border border-transparent text-[#746971] hover:text-[#F5F1F3] hover:bg-[#160B10]/90"
          }`}
        >
          <Settings className="w-[18px] h-[18px] text-[#AAA0A7] group-hover:text-[#F5F1F3] transition-colors" />
          <span className="text-[10px] font-medium text-[#AAA0A7] group-hover:text-[#F5F1F3] leading-none">
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}
