"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, ArrowLeft, Disc3, Clock, Loader2, Music2 } from "lucide-react";
import { Album, Song } from "@/types/music";
import { useMusic } from "@/context/MusicContext";
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

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = typeof params?.id === "string" ? params.id : "";

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();

  useEffect(() => {
    if (!albumId) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/music/albums/${encodeURIComponent(albumId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success) {
          if (data.album) setAlbum(data.album);
          if (Array.isArray(data.tracks)) setTracks(data.tracks);
        }
      })
      .catch((err) => {
        console.error("Failed to load album:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [albumId]);

  const isAlbumPlaying =
    isPlaying && tracks.some((s) => s.id === currentTrack?.id);

  const handlePlayAlbum = () => {
    if (tracks.length === 0) return;
    if (isAlbumPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  const totalRuntimeSeconds = tracks.reduce((acc, s) => acc + (s.duration || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4">
        <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin mb-3" />
        <p className="text-xs text-[#AAA0A7] font-medium tracking-wider">Loading album...</p>
      </div>
    );
  }

  if (!album && tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center">
        <Disc3 className="w-12 h-12 text-[#E11D48] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Album Not Found</h2>
        <p className="text-sm text-[#AAA0A7] mb-6">The requested album could not be located.</p>
        <Link
          href="/music"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider"
        >
          Return to Music Home
        </Link>
      </div>
    );
  }

  const coverUrl =
    album?.coverUrl ||
    tracks[0]?.coverUrl ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80";
  const albumTitle = album?.title || tracks[0]?.album || "Album Release";
  const artistName = album?.artist || tracks[0]?.artist || "Unknown Artist";
  const artistId = album?.artistId || tracks[0]?.artistId || "jamendo-artist";
  const releaseYear = album?.releaseYear || 2026;
  const genre = album?.genre || tracks[0]?.genre || "Independent";

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

      {/* Spotify-Style Album Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#220B17] via-[#14060E] to-[#0D0407] border border-[rgba(155,25,57,0.3)] p-6 sm:p-8 md:p-10 mb-8 shadow-2xl">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/85 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.85)] border border-[rgba(155,25,57,0.4)] shrink-0 bg-[#0E0509]">
            <img
              src={coverUrl}
              alt={albumTitle}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#FF385B]">
              Album • {genre}
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
              {albumTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-xl line-clamp-2">
              {album?.description || `High-fidelity audio streaming release by ${artistName}.`}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#AAA0A7] pt-1">
              <Link
                href={`/music/artist/${artistId}`}
                className="font-bold text-white hover:text-[#FF385B] transition-colors"
              >
                {artistName}
              </Link>
              <span>•</span>
              <span>{releaseYear}</span>
              <span>•</span>
              <span>{tracks.length} Songs, {formatRuntime(totalRuntimeSeconds)}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={handlePlayAlbum}
                className="flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(225,29,72,0.5)] hover:scale-105 active:scale-95 transition-all"
              >
                {isAlbumPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause Album</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>Play Album</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify-Style Track List */}
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

        <div className="bg-[#12070D]/80 rounded-2xl border border-[rgba(155,25,57,0.2)] p-2 sm:p-4 space-y-1">
          {tracks.map((song, idx) => (
            <SpotifyTrackRow
              key={song.id}
              index={idx + 1}
              song={song}
              queueContext={tracks}
              showAlbum={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
