"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, Share, CheckCircle2, Smartphone, Monitor } from "lucide-react";
import CinovaLogo from "@/components/CinovaLogo";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // 1. Register Service Worker in production / compatible environments
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSw = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Listen for updates to prompt user or refresh
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New update available: notify service worker to skip waiting
                installingWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      } catch (err) {
        // Non-blocking
        console.warn("[CINOVA PWA] Service worker registration error:", err);
      }
    };

    if (document.readyState === "complete") {
      void registerSw();
    } else {
      window.addEventListener("load", () => void registerSw(), { once: true });
    }
  }, []);

  // 2. Detect Standalone / Installed state and platform
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIosStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIosStandalone;
    };

    const standaloneState = checkStandalone();
    setIsStandalone(standaloneState);

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // If already standalone, do not show install prompt
    if (standaloneState) {
      return;
    }

    // Check if dismissed recently (cooldown for 7 days)
    const dismissedUntil = localStorage.getItem("cinova_pwa_dismissed_until");
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Capture Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds before showing subtle banner to avoid interrupting initial render
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const handleCustomTrigger = () => {
      void handleInstallClick();
    };
    window.addEventListener("cinova-trigger-install", handleCustomTrigger);

    // For iOS Safari (which doesn't fire beforeinstallprompt): show subtle banner once after 6s
    if (isIosDevice && !standaloneState && !dismissedUntil) {
      const iosTimer = setTimeout(() => {
        setShowBanner(true);
      }, 6000);
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("cinova-trigger-install", handleCustomTrigger);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("cinova-trigger-install", handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIos) {
      setShowIosModal(true);
      setShowBanner(false);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch {
      // User cancelled
    }
  }, [deferredPrompt, isIos]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    // Dismiss for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("cinova_pwa_dismissed_until", nextWeek.toString());
    } catch {
      // Non-fatal
    }
  }, []);

  // Do not render if app is running as installed standalone PWA
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Discreet Install Banner (Desktop / Mobile) */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Install CINOVA App"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-[#10080C]/96 backdrop-blur-xl border border-[rgba(155,25,57,0.35)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.85)] animate-fade-in"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center shrink-0 shadow-md">
              <Download className="w-5 h-5 text-[#F5F1F3]" />
            </div>

            <div className="flex-1 min-w-0 pr-5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#F5F1F3]">Install CINOVA</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E11D48]/25 text-[#FF385B] uppercase">
                  App
                </span>
              </div>
              <p className="text-xs text-[#AAA0A7] mt-0.5 leading-snug">
                Stream 4K cinema in fullscreen with instant launch from your home screen or desktop.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95"
                >
                  Install Now
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.24)] text-[#AAA0A7] hover:text-[#F5F1F3] text-xs transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="absolute top-3 right-3 p-1 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#160B10] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari "Add to Home Screen" Instructions Modal */}
      {showIosModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.35)] p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              aria-label="Close instructions"
              className="absolute top-4 right-4 p-1 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center text-white shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F5F1F3]">Install on iOS</h3>
                <p className="text-xs text-[#AAA0A7]">Follow two quick steps in Safari</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-[#AAA0A7] pt-2">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
                <span className="w-5 h-5 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-[#F5F1F3]">Share button</strong> (
                  <Share className="inline w-3.5 h-3.5 text-[#FF385B] -mt-0.5" />) in Safari&apos;s
                  toolbar at the bottom.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.2)]">
                <span className="w-5 h-5 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-[#F5F1F3]">Add to Home Screen</strong>
                  , then tap <strong className="text-[#FF385B]">Add</strong> in the top right.
                </span>
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-[#F5F1F3] text-xs font-bold uppercase tracking-wider transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installed Confirmation Toast */}
      {installSuccess && (
        <aside
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 shadow-2xl animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>CINOVA has been added to your apps. Enjoy fullscreen streaming!</span>
        </aside>
      )}
    </>
  );
}
