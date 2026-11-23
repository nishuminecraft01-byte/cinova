"use client";

import React from "react";
import { X, Play, Trash2, Music2, Volume2 } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MusicQueueDrawer() {
  const {
    isQueueOpen,
    toggleQueue,
    currentTrack,
    queue,
    queueIndex,
    playTrack,
    removeFromQueue,
    clearQueue,
    isPlaying,
  } = useMusic();

  if (!isQueueOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleQueue}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Queue Drawer"
        className="fixed top-0 right-0 bottom-0 z-[55] w-full max-w-md bg-[#0B0508]/98 backdrop-blur-2xl border-l border-[rgba(155,25,57,0.3)] shadow-2xl flex flex-col p-4 sm:p-6 animate-slide-left select-none"
        style={{
          paddingTop: "max(var(--safe-top, 0px), 1.5rem)",
          paddingBottom: "max(var(--safe-bottom, 0px), 1.5rem)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(155,25,57,0.2)]">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-[#E11D48]" />
            <h2 className="text-base font-bold text-[#F5F1F3]">Play Queue</h2>
            <span className="text-xs text-[#AAA0A7] px-2 py-0.5 rounded-full bg-[#160B10]">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <button
                type="button"
                onClick={clearQueue}
                className="text-xs text-[#AAA0A7] hover:text-[#FF385B] flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-[#160B10] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={toggleQueue}
              className="p-1.5 rounded-full hover:bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 no-scrollbar">
          {/* Now Playing Item */}
          {currentTrack && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E11D48] mb-2.5">
                Now Playing
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#650A20]/40 to-[#160B10]/80 border border-[#E11D48]/40 shadow-lg">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#F5F1F3] truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-[#AAA0A7] truncate">{currentTrack.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-1 bg-[#E11D48] animate-bounce h-3 rounded-full" />
                      <span className="w-1 bg-[#FF385B] animate-bounce delay-100 h-4 rounded-full" />
                      <span className="w-1 bg-[#E11D48] animate-bounce delay-200 h-2 rounded-full" />
                    </div>
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#AAA0A7]" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#AAA0A7] mb-2.5">
              Next In Queue
            </p>
            {queue.length <= 1 ? (
              <p className="text-xs text-[#746971] text-center py-8">No more tracks in queue.</p>
            ) : (
              <div className="space-y-1.5">
                {queue.map((track, idx) => {
                  if (idx === queueIndex) return null;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#160B10]/40 hover:bg-[#160B10] border border-transparent hover:border-[rgba(155,25,57,0.3)] transition-all"
                    >
                      <div
                        onClick={() => playTrack(track, queue)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-medium text-[#F5F1F3] truncate group-hover:text-[#FF385B] transition-colors">
                            {track.title}
                          </h5>
                          <p className="text-[11px] text-[#746971] truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#746971]">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromQueue(idx)}
                          aria-label="Remove from queue"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#746971] hover:text-[#FF385B] transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
