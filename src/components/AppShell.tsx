"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PlaybackAuthGate from "@/components/PlaybackAuthGate";
import PwaManager from "@/components/PwaManager";
import AndroidUpdateChecker from "@/components/AndroidUpdateChecker";
import MusicPlayer from "@/components/music/MusicPlayer";
import FullScreenPlayer from "@/components/music/FullScreenPlayer";
import MusicQueueDrawer from "@/components/music/MusicQueueDrawer";
import LicensingNoticeModal from "@/components/music/LicensingNoticeModal";
import YouTubePlayerModal from "@/components/music/YouTubePlayerModal";
import { useMusic } from "@/context/MusicContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const {
    licensingNoticeTrack,
    isLicensingModalOpen,
    closeLicensingModal,
    activeVideoTrack,
    isVideoModalOpen,
    closeVideoModal,
  } = useMusic();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as { CinovaNativeBridge?: Record<string, unknown> }).CinovaNativeBridge) {
      try {
        const bridge = (window as unknown as { CinovaNativeBridge?: { getStatusBarHeightDp?: () => number; getNavigationBarHeightDp?: () => number } }).CinovaNativeBridge;
        if (bridge && typeof bridge.getStatusBarHeightDp === "function") {
          const statusHeight = bridge.getStatusBarHeightDp();
          if (statusHeight > 0) {
            document.documentElement.style.setProperty(
              "--android-status-bar-height",
              `${statusHeight}px`
            );
          }
        }
        if (bridge && typeof bridge.getNavigationBarHeightDp === "function") {
          const navHeight = bridge.getNavigationBarHeightDp();
          if (navHeight > 0) {
            document.documentElement.style.setProperty(
              "--android-nav-bar-height",
              `${navHeight}px`
            );
          }
        }
      } catch (e) {
        console.error("Failed to read native safe area insets", e);
      }
    }
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div
        className={`flex flex-col flex-grow min-w-0 w-full ${
          isAuthRoute ? "" : "lg:pl-[76px]"
        }`}
      >
        <main className="flex-grow pt-0 pb-[calc(4.5rem+max(var(--safe-bottom,0px),8px))] lg:pb-0 min-w-0 w-full">
          {children}
        </main>
        <Footer />
      </div>
      <BottomNav />
      <MusicPlayer />
      <FullScreenPlayer />
      <MusicQueueDrawer />
      <YouTubePlayerModal
        song={activeVideoTrack}
        isOpen={isVideoModalOpen}
        onClose={closeVideoModal}
      />
      <LicensingNoticeModal
        song={licensingNoticeTrack}
        isOpen={isLicensingModalOpen}
        onClose={closeLicensingModal}
        onExploreIndependent={() => {
          if (typeof window !== "undefined") {
            const el = document.getElementById("free-independent-music");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            } else {
              window.location.href = "/music#free-independent-music";
            }
          }
        }}
      />
      <PlaybackAuthGate />
      <PwaManager />
      <AndroidUpdateChecker />
    </>
  );
}
