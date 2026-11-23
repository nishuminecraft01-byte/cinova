"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, ArrowLeft, Heart, Music2, Clock, Shuffle, ListMusic, Loader2 } from "lucide-react";
import { getPlaylistById } from "@/data/music";
import { useMusic } from "@/context/MusicContext";
import { Song, Playlist } from "@/types/music";
import SpotifyTrackRow from "@/components/music/SpotifyTrackRow";

function formatRuntime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0 min";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    return `${hrs} hr ${mins % 60} min`;
  }
  return `${mins} min`;
}

const PLAYLIST_TAG_MAP: Record<string, string> = {
  "workout-beats": "electronic",
  "chill-hits": "chillout",
  "party-mix": "dance",
  "study-vibes": "ambient",
};

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = typeof params?.id === "string" ? params.id : "";
  const playlist = getPlaylistById(playlistId);

  const [tracks, setTracks] = useState<Song[]>(playlist?.songs || []);
  const [isLoading, setIsLoading] = useState(playlist?.songs.length === 0);

  const { playTrack, currentTrack, isPlaying, isShuffle, toggleShuffle, togglePlay } = useMusic();

  useEffect(() => {
    if (!playlistId) return;

    if (playlist && playlist.songs.length > 0) {
      setTracks(playlist.songs);
      setIsLoading(false);
      return;
    }

    const tag = PLAYLIST_TAG_MAP[playlistId] || "pop";
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/music/genres?genre=${tag}&limit=24`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.tracks)) {
          setTracks(data.tracks);
        }
      })
      .catch((err) => {
        console.error("Failed to load playlist tracks:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playlistId, playlist]);

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center">
        <ListMusic className="w-12 h-12 text-[#E11D48] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Playlist Not Found</h2>
        <p className="text-sm text-[#AAA0A7] mb-6">The requested playlist could not be located.</p>
        <Link
          href="/music"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider"
        >
          Return to Music Home
        </Link>
      </div>
    );
  }

  const isPlaylistPlaying = isPlaying && tracks.some((s) => s.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    if (!isShuffle) toggleShuffle();
    playTrack(shuffled[0], shuffled);
  };

  const totalRuntimeSeconds = tracks.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="min-h-screen pb-36 pt-20 px-3 sm:px-6 lg:px-8 max-w-[1400px] mx-auto select-none">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-medium text-[#AAA0A7] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Spotify-Style Playlist Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#220B17] via-[#14060E] to-[#0D0407] border border-[rgba(155,25,57,0.3)] p-6 sm:p-8 md:p-10 mb-8 shadow-2xl">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url(${playlist.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/85 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.85)] border border-[rgba(155,25,57,0.4)] shrink-0 bg-[#0E0509]">
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#FF385B]">
              Curated Playlist
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
              {playlist.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-xl">
              {playlist.description}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#AAA0A7] pt-1">
              <span className="font-semibold text-white">CINOVA Music Curated</span>
              <span>•</span>
              <span>{tracks.length} Songs</span>
              <span>•</span>
              <span>{formatRuntime(totalRuntimeSeconds)}</span>
              {playlist.subtitle && (
                <>
                  <span>•</span>
                  <span>{playlist.subtitle}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                type="button"
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_6px_20px_rgba(225,29,72,0.4)]"
              >
                {isPlaylistPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>Play All</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShufflePlay}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#160B10] hover:bg-[#200D16] border border-[rgba(155,25,57,0.4)] text-[#F5F1F3] text-xs font-semibold tracking-wider active:scale-95 transition-all"
              >
                <Shuffle className="w-4 h-4 text-[#FF385B]" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify-Style Playlist Tracklist Table */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#746971] border-b border-[rgba(155,25,57,0.2)]">
          <div className="flex items-center gap-4">
            <span className="w-8 text-center">#</span>
            <span>Title</span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Duration</span>
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`pl-skel-${i}`}
                className="h-14 rounded-xl bg-[#14080E]/70 border border-[rgba(155,25,57,0.2)] animate-pulse"
              />
            ))}
          </div>
        ) : tracks.length > 0 ? (
          <div className="bg-[#12070D]/80 rounded-2xl border border-[rgba(155,25,57,0.2)] p-2 sm:p-4 space-y-1">
            {tracks.map((song, idx) => (
              <SpotifyTrackRow
                key={song.id}
                index={idx + 1}
                song={song}
                queueContext={tracks}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#AAA0A7] py-8 text-center">
            No tracks found in this playlist.
          </p>
        )}
      </section>
    </div>
  );
}
