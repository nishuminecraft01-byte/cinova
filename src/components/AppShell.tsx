"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PlaybackAuthGate from "@/components/PlaybackAuthGate";
import PwaManager from "@/components/PwaManager";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  return (
    <>
      <Navbar />
      <Sidebar />
      <div
        className={`flex flex-col flex-grow min-w-0 w-full ${
          isAuthRoute ? "" : "lg:pl-[76px]"
        }`}
      >
        <main className="flex-grow pt-0 pb-16 lg:pb-0 min-w-0 w-full">
          {children}
        </main>
        <Footer />
      </div>
      <BottomNav />
      <PlaybackAuthGate />
      <PwaManager />
    </>
  );
}
