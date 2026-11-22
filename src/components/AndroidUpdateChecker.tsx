"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Sparkles, X, ArrowUpCircle, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

interface AppVersionData {
  versionCode: number;
  versionName: string;
  minSupportedVersionCode: number;
  apkUrl: string;
  apkSize: number;
  sha256?: string;
  releaseNotes: string;
  releasedAt: string;
  mandatory: boolean;
}

declare global {
  interface Window {
    CinovaNativeBridge?: {
      isNativeApp: () => boolean;
      getVersionCode: () => number;
      getVersionName: () => string;
      startUpdate: (apkUrl: string, targetVersion: string) => void;
    };
  }
}

export default function AndroidUpdateChecker() {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [installedVersionCode, setInstalledVersionCode] = useState<number>(0);
  const [installedVersionName, setInstalledVersionName] = useState<string>("");
  const [updateData, setUpdateData] = useState<AppVersionData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateTriggered, setUpdateTriggered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running inside the native Android Capacitor application
    const bridge = window.CinovaNativeBridge;
    if (!bridge || typeof bridge.getVersionCode !== "function") {
      return;
    }

    try {
      const code = bridge.getVersionCode();
      const name = bridge.getVersionName();
      setIsNativeApp(true);
      setInstalledVersionCode(code);
      setInstalledVersionName(name);

      // Check remote version
      const checkForUpdates = async () => {
        try {
          const res = await fetch("/api/app-version", { cache: "no-store" });
          if (!res.ok) return;
          const remote: AppVersionData = await res.json();

          if (remote.versionCode > code) {
            // Check if dismissed in this session
            const dismissedKey = `cinova_dismissed_update_${remote.versionCode}`;
            const isDismissed = sessionStorage.getItem(dismissedKey);

            if (!isDismissed || remote.mandatory) {
              setUpdateData(remote);
              // Slight delay before showing so user lands on the page first
              setTimeout(() => {
                setShowModal(true);
              }, 1500);
            }
          }
        } catch {
          // Non-blocking update check
        }
      };

      void checkForUpdates();
    } catch {
      // Bridge interaction error
    }
  }, []);

  const handleStartUpdate = useCallback(() => {
    if (!updateData || !window.CinovaNativeBridge) return;

    setIsUpdating(true);
    setUpdateTriggered(true);

    try {
      window.CinovaNativeBridge.startUpdate(updateData.apkUrl, updateData.versionName);
    } catch {
      setIsUpdating(false);
    }
  }, [updateData]);

  const handleDismiss = useCallback(() => {
    if (updateData) {
      sessionStorage.setItem(`cinova_dismissed_update_${updateData.versionCode}`, "true");
    }
    setShowModal(false);
  }, [updateData]);

  if (!isNativeApp || !showModal || !updateData) {
    return null;
  }

  const formattedSize = updateData.apkSize
    ? `${(updateData.apkSize / (1024 * 1024)).toFixed(1)} MB`
    : "3.2 MB";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#12060C] border border-[rgba(225,29,72,0.4)] p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E11D48]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Close Button (if non-mandatory) */}
        {!updateData.mandatory && !isUpdating && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Remind me later"
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#AAA0A7] hover:text-[#F5F1F3] hover:bg-[#1D0C13] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with App Update Badge */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center shrink-0 shadow-lg text-white">
            <ArrowUpCircle className="w-6 h-6 text-[#F5F1F3]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#FF385B] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Update Available</span>
            </div>

            <h3 id="update-dialog-title" className="text-lg font-bold text-[#F5F1F3] mt-1">
              CINOVA v{updateData.versionName}
            </h3>

            <p className="text-xs text-[#AAA0A7] mt-0.5">
              Installed: v{installedVersionName || "1.0.0"} • Size: {formattedSize}
            </p>
          </div>
        </div>

        {/* Release Notes */}
        <div className="rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.25)] p-4 space-y-2">
          <div className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
            What&apos;s New:
          </div>
          <div className="text-xs text-[#AAA0A7] leading-relaxed whitespace-pre-line space-y-1">
            {updateData.releaseNotes}
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center gap-2 text-[11px] text-[#AAA0A7]">
          <ShieldCheck className="w-4 h-4 text-[#E11D48] shrink-0" />
          <span>Official signed update. Existing watch history &amp; login are preserved.</span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleStartUpdate}
            disabled={isUpdating}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#C8123F] to-[#A30D32] hover:from-[#E11D48] hover:to-[#B9123B] disabled:opacity-75 disabled:cursor-wait text-[#F5F1F3] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(200,18,63,0.35)] active:scale-[0.98]"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Downloading Update...</span>
              </>
            ) : updateTriggered ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Launching Installer...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>UPDATE NOW</span>
              </>
            )}
          </button>

          {!updateData.mandatory && !isUpdating && (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-xs font-semibold text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
            >
              Remind Me Next Time
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
