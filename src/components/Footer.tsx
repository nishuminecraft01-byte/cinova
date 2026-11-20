"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import CinovaLogo from "@/components/CinovaLogo";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <footer className="bg-[#0B0508] text-[#AAA0A7] pt-14 pb-12 mt-14 border-t border-[rgba(155,25,57,0.22)]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-xs space-y-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <CinovaLogo size="sm" />
          <span className="text-[11px] text-[#FF385B]/90 font-medium">
            Stories. Anytime. Anywhere.
          </span>
        </div>

        <p className="text-[#746971]">
          Customer Support &amp; Concierge:{" "}
          <span className="text-[#F5F1F3] hover:underline cursor-pointer">support@cinova.stream</span>
        </p>

        {/* 4-Column Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-2">
          <ul className="space-y-3">
            <li>
              <Link href="/" className="hover:text-[#F5F1F3] transition-colors">
                FAQ &amp; Help Center
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-[#F5F1F3] transition-colors">
                Subscription Plans
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-[#F5F1F3] transition-colors">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/movies" className="hover:text-[#F5F1F3] transition-colors">
                Ways to Watch
              </Link>
            </li>
          </ul>

          <ul className="space-y-3">
            <li>
              <Link href="/creator" className="hover:text-[#F5F1F3] transition-colors">
                Creator Studio
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[#F5F1F3] transition-colors">
                Admin Command Center
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-[#F5F1F3] transition-colors">
                Explore Universes
              </Link>
            </li>
            <li>
              <Link href="/search?filter=trending" className="hover:text-[#F5F1F3] transition-colors">
                Only on CINOVA
              </Link>
            </li>
          </ul>

          <ul className="space-y-3">
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Terms of Service</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Privacy Statement</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Cookie Preferences</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Legal Notices</span>
            </li>
          </ul>

          <ul className="space-y-3">
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Speed Test</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Audio &amp; Subtitles</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">Security &amp; Integrity</span>
            </li>
            <li>
              <span className="hover:text-[#F5F1F3] transition-colors cursor-pointer">System Status</span>
            </li>
          </ul>
        </div>

        {/* Language selector & Copyright */}
        <div className="pt-5 border-t border-[rgba(155,25,57,0.18)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(155,25,57,0.25)] bg-[#160B10] text-[#F5F1F3]">
            <Globe className="w-3.5 h-3.5 text-[#FF385B]" />
            <span className="text-xs">English (Global)</span>
          </div>
          <p className="text-[11px] text-[#746971]">
            &copy; {new Date().getFullYear()} CINOVA Streaming Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
