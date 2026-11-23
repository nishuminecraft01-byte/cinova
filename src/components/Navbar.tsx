"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Music,
  LayoutGrid,
  Bookmark,
  Search,
  Menu,
  X,
  Check,
  User,
  LogOut,
  Shield,
  CreditCard,
  ChevronDown,
  Crown,
  History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { getPlanById } from "@/lib/membership";
import CinovaLogo from "@/components/CinovaLogo";
import dynamic from "next/dynamic";

const CinovaAiModal = dynamic(() => import("@/components/CinovaAiModal"), {
  ssr: false,
});

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { watchlist, continueWatching } = useWatchlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimeQuery, setIsAnimeQuery] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrolled = window.scrollY > 18;
    setIsScrolled(lastScrolled);

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const nextScrolled = window.scrollY > 18;
        if (nextScrolled !== lastScrolled) {
          lastScrolled = nextScrolled;
          setIsScrolled(nextScrolled);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setProfileDropdownOpen(false);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsAnimeQuery(pathname === "/search" && params.get("type") === "anime");
    }
  }, [pathname]);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 60);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!mobileMenuOpen && !mobileSearchOpen && !profileDropdownOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen, mobileSearchOpen, profileDropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      router.push("/search");
    }
  };

  const isAnimeSearch = isAnimeQuery;

  const navLinks = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
    { label: "Movies", href: "/movies", icon: Film, active: pathname.startsWith("/movies") || pathname.startsWith("/movie/") },
    { label: "Series", href: "/series", icon: Tv, active: pathname.startsWith("/series") },
    { label: "Anime", href: "/search?type=anime", icon: Sparkles, active: isAnimeSearch || pathname.startsWith("/anime/") },
    { label: "Music", href: "/music", icon: Music, active: pathname.startsWith("/music") },
    { label: "Categories", href: "/categories", icon: LayoutGrid, active: pathname.startsWith("/categories") },
    { label: "Plans", href: "/pricing", icon: Crown, active: pathname.startsWith("/pricing") },
  ];

  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#080506]/92 backdrop-blur-xl border-b border-[rgba(155,25,57,0.24)] shadow-[0_8px_28px_rgba(0,0,0,0.65)]"
            : "bg-gradient-to-b from-[#080506]/95 via-[#080506]/70 to-transparent border-b border-[rgba(155,25,57,0.14)]"
        }`}
        style={{
          paddingTop: "var(--safe-top, 0px)",
        }}
      >
        <div className="w-full h-16 px-3 sm:px-5 xl:px-6 flex items-center justify-between gap-2 xl:gap-4">
          {/* Left: Brand Logo & Primary Navigation */}
          <div className="flex items-center gap-3 xl:gap-6 min-w-0 flex-1">
            <Link
              href="/"
              className="group flex items-center flex-shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              aria-label="CINOVA Home"
            >
              <span className="sm:hidden">
                <CinovaLogo size="sm" />
              </span>
              <span className="hidden sm:inline-flex">
                <CinovaLogo size="md" />
              </span>
            </Link>

            {/* Desktop Navigation (zero overlap across 1024px–1920px) */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs xl:text-[13px] font-medium min-w-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-all duration-200 ${
                      link.active
                        ? "bg-gradient-to-r from-[#650A20]/85 to-[#A30D32]/65 border-[#E11D48]/40 text-[#F5F1F3] font-semibold shadow-[0_2px_14px_rgba(163,13,50,0.35)]"
                        : "border-transparent text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10]/85"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        link.active ? "text-[#F5F1F3]" : "text-[#746971]"
                      }`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search Input, Ask AI & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Rounded Dark Search Field (Desktop/Tablet) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-40 lg:w-44 xl:w-52 2xl:w-64 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-[#746971] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-[#160B10]/90 text-[#F5F1F3] placeholder-[#746971] border border-[rgba(155,25,57,0.26)] focus:outline-none focus:border-[#E11D48]/65 focus:bg-[#1D0C13] focus:ring-1 focus:ring-[#E11D48]/30 transition-all"
              />
            </form>

            {/* Quick Mobile Search Toggle (< md) */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev);
                setMobileMenuOpen(false);
                setProfileDropdownOpen(false);
              }}
              className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                mobileSearchOpen
                  ? "bg-[#650A20]/80 border-[#E11D48] text-[#F5F1F3]"
                  : "bg-[#160B10]/90 hover:bg-[#1D0C13] border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3]"
              }`}
              aria-label={mobileSearchOpen ? "Close search" : "Search titles"}
              aria-expanded={mobileSearchOpen}
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Subtle Ask AI Button (shown in top bar on sm+; accessible inside mobile drawer on phones) */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full bg-[#160B10]/90 hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] hover:border-[#E11D48]/55 text-[#F5F1F3] text-xs font-semibold transition-all shrink-0"
              title="Open CINOVA AI Movie Advisor"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF385B] shrink-0" />
              <span className="hidden sm:inline lg:hidden xl:inline whitespace-nowrap">Ask AI</span>
            </button>

            {/* User Profile / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-[rgba(155,25,57,0.3)] hover:border-[#E11D48]/60 transition-all bg-[#160B10]/90"
                  aria-label="Open account menu"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center text-[#F5F1F3] font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#AAA0A7] hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] shadow-[0_20px_50px_rgba(0,0,0,0.8)] divide-y divide-[rgba(155,25,57,0.18)] z-50 text-xs animate-modal-in">
                    <div className="p-3.5">
                      <p className="font-bold text-[#F5F1F3]">{user.name}</p>
                      <p className="text-[#AAA0A7] truncate text-[11px]">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#650A20]/60 text-[#FF385B] border border-[#E11D48]/30">
                          {user.role}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#160B10] text-[#AAA0A7] border border-[rgba(155,25,57,0.22)]">
                          {getPlanById(user.tier).name}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#FF385B]" />
                        <span>Account &amp; Watchlist</span>
                        {watchlist.length > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-[#650A20]/60 text-[#F5F1F3] font-semibold">
                            {watchlist.length}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/history"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
                      >
                        <History className="w-4 h-4 text-[#FF385B]" />
                        <span>Watch History</span>
                        {continueWatching.length > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-[#650A20]/60 text-[#F5F1F3] font-semibold">
                            {continueWatching.length}
                          </span>
                        )}
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#FF385B]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/pricing"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-[#FF385B]" />
                        <span>Plans &amp; Upgrade</span>
                      </Link>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          void logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#FF385B] hover:bg-[#650A20]/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-semibold whitespace-nowrap transition-all shadow-[0_4px_16px_rgba(163,13,50,0.4)]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3] rounded-lg hover:bg-[#160B10]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Instant Mobile Quick Search Panel (< md) */}
        {mobileSearchOpen && (
          <>
            <div
              onClick={() => setMobileSearchOpen(false)}
              className="md:hidden fixed inset-0 bg-black/65 z-40"
              style={{ top: "calc(4rem + var(--safe-top, 0px))" }}
              aria-hidden="true"
            />
            <div className="md:hidden relative z-50 bg-[#0B0508]/98 backdrop-blur-xl border-b border-[rgba(155,25,57,0.28)] px-4 py-3.5 space-y-3 animate-fade-in shadow-2xl">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#746971] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    enterKeyHint="search"
                    placeholder="Search movies, series, anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-9 rounded-full text-base bg-[#160B10] text-[#F5F1F3] placeholder-[#746971] border border-[rgba(155,25,57,0.34)] focus:outline-none focus:border-[#E11D48]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#AAA0A7] hover:text-[#F5F1F3]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-11 px-4 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider shrink-0 active:scale-95"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 text-xs">
                <Link
                  href="/search"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] text-[#F5F1F3] font-medium whitespace-nowrap"
                >
                  All Filters
                </Link>
                <Link
                  href="/search?type=movie"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] text-[#AAA0A7] whitespace-nowrap"
                >
                  Movies
                </Link>
                <Link
                  href="/search?type=series"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] text-[#AAA0A7] whitespace-nowrap"
                >
                  Series
                </Link>
                <Link
                  href="/search?type=anime"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] text-[#AAA0A7] whitespace-nowrap"
                >
                  Anime
                </Link>
                <Link
                  href="/music"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] border border-[rgba(155,25,57,0.26)] text-[#AAA0A7] whitespace-nowrap"
                >
                  Music
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/65 z-40"
              style={{ top: "calc(4rem + var(--safe-top, 0px))" }}
              aria-hidden="true"
            />
            <div
              className="lg:hidden relative z-50 bg-[#0B0508]/98 backdrop-blur-xl border-b border-[rgba(155,25,57,0.26)] px-4 py-4 space-y-1.5 text-sm font-medium animate-fade-in overflow-y-auto"
              style={{ maxHeight: "calc(100dvh - 4rem - var(--safe-top, 0px))" }}
            >
              {/* Mobile Search (16px font prevents iOS Safari auto-zoom) */}
              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <Search className="w-4 h-4 text-[#746971] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search movies, series, anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-full text-base sm:text-sm bg-[#160B10] text-[#F5F1F3] placeholder-[#746971] border border-[rgba(155,25,57,0.28)] focus:outline-none focus:border-[#E11D48]"
                />
              </form>

              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl transition-colors ${
                      link.active
                        ? "bg-[#650A20]/60 border border-[#E11D48]/35 text-[#F5F1F3] font-semibold"
                        : "text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}

              <Link
                href="/profile?tab=watchlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bookmark className="w-4 h-4" />
                  <span>My List</span>
                </div>
                {watchlist.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-[#650A20]/70 text-[#F5F1F3]">
                    {watchlist.length}
                  </span>
                )}
              </Link>

              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  <span>Watch History</span>
                </div>
                {continueWatching.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-[#650A20]/70 text-[#F5F1F3]">
                    {continueWatching.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAiModalOpen(true);
                }}
                className="w-full flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-[#FF385B] hover:bg-[#160B10] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask CINOVA AI</span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* CINOVA AI Recommendation Assistant Modal (loaded lazily on demand) */}
      {aiModalOpen && (
        <CinovaAiModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      )}
    </>
  );
}
