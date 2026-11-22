"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Check, Sparkles, ShieldCheck, ArrowDownToLine, Monitor, Tag } from "lucide-react";

interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  apkSize: number;
  releaseNotes: string;
}

export default function AppDownloadBanner() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installStatus, setInstallStatus] = useState<"idle" | "triggered" | "installed">("idle");
  const [appVersion, setAppVersion] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIosStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIosStandalone;
    };

    setIsStandalone(checkStandalone());

    const onAppInstalled = () => {
      setInstallStatus("installed");
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", onAppInstalled);

    // Fetch dynamic version info from CINOVA domain
    fetch("/api/app-version")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AppVersionInfo | null) => {
        if (data) setAppVersion(data);
      })
      .catch(() => {});

    return () => window.removeEventListener("appinstalled", onAppInstalled);
  }, []);

  const handleInstallClick = () => {
    setInstallStatus("triggered");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cinova-trigger-install"));
    }
    setTimeout(() => {
      setInstallStatus((prev) => (prev === "triggered" ? "idle" : prev));
    }, 4000);
  };

  const selfHostedApkUrl = "/CINOVA.apk";
  const displayVersion = appVersion?.versionName ? `v${appVersion.versionName}` : "v1.1.1";
  const displaySize = appVersion?.apkSize
    ? `${(appVersion.apkSize / (1024 * 1024)).toFixed(1)} MB`
    : "3.2 MB";

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1380px] mx-auto my-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A0A12] via-[#12060C] to-[#0A0407] border border-[rgba(225,29,72,0.35)] shadow-[0_12px_36px_rgba(0,0,0,0.65)] p-6 sm:p-8 lg:p-10">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E11D48]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#9B1939]/15 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10">
          {/* Left Text Column */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/15 border border-[#E11D48]/35 text-[#FF385B] text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official CINOVA Apps</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F5F1F3]">
              Watch Anywhere — Native App &amp; Web App
            </h2>

            <p className="text-sm sm:text-base text-[#AAA0A7] leading-relaxed">
              Install the high-speed progressive web app directly in your browser, or download the official
              Android APK file hosted directly on our CINOVA domain. Fast, lightweight, and automatically updatable.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#746971]">
              <span className="flex items-center gap-1.5 text-[#AAA0A7]">
                <Tag className="w-3.5 h-3.5 text-[#FF385B]" />
                <span className="font-semibold text-white">{displayVersion}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-[#AAA0A7]">
                <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
                Direct Release APK ({displaySize})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-[#AAA0A7]">
                <Smartphone className="w-4 h-4 text-[#FF385B]" />
                Android 8.0 to 15+
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-[#AAA0A7]">
                <Monitor className="w-4 h-4 text-[#AAA0A7]" />
                PWA for Desktop &amp; iOS
              </span>
            </div>
          </div>

          {/* Right Action Buttons Column */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto shrink-0">
            {/* 1. Install App Button (PWA) */}
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isStandalone}
              className={`min-h-[50px] px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg active:scale-[0.98] ${
                isStandalone
                  ? "bg-[#1E1117] text-[#746971] border border-[rgba(155,25,57,0.3)] cursor-default"
                  : "bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] text-[#F5F1F3] shadow-[0_8px_24px_rgba(200,18,63,0.38)] hover:shadow-[0_10px_28px_rgba(225,29,72,0.48)]"
              }`}
            >
              {isStandalone ? (
                <>
                  <Check className="w-4 h-4 text-[#FF385B]" />
                  <span>App Installed</span>
                </>
              ) : installStatus === "installed" ? (
                <>
                  <Check className="w-4 h-4 text-[#FF385B]" />
                  <span>Installed Successfully</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>INSTALL APP</span>
                </>
              )}
            </button>

            {/* 2. Download Android App Button (Self-hosted APK directly from CINOVA domain) */}
            <a
              href={selfHostedApkUrl}
              download="CINOVA.apk"
              className="min-h-[50px] px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 bg-[#160B10]/90 hover:bg-[#200D16] border border-[#E11D48]/55 hover:border-[#FF385B] text-[#F5F1F3] transition-all duration-200 shadow-md hover:shadow-[0_8px_20px_rgba(225,29,72,0.25)] active:scale-[0.98]"
            >
              <ArrowDownToLine className="w-4 h-4 text-[#FF385B]" />
              <span>DOWNLOAD ANDROID APP</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
