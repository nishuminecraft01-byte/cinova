"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, ArrowLeft, Music2, Loader2, Disc3 } from "lucide-react";
import { Artist, Song } from "@/types/music";
import { useMusic } from "@/context/MusicContext";
import SpotifyTrackRow from "@/components/music/SpotifyTrackRow";

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const artistId = typeof params?.id === "string" ? params.id : "";

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();

  useEffect(() => {
    if (!artistId) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/music/artists/${encodeURIComponent(artistId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success) {
          if (data.artist) setArtist(data.artist);
          if (Array.isArray(data.tracks)) setTracks(data.tracks);
        }
      })
      .catch((err) => {
        console.error("Failed to load artist profile:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [artistId]);

  const isArtistPlaying =
    isPlaying && tracks.some((s) => s.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isArtistPlaying) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4">
        <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin mb-3" />
        <p className="text-xs text-[#AAA0A7] font-medium tracking-wider">Loading artist profile...</p>
      </div>
    );
  }

  if (!artist && tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center">
        <Music2 className="w-12 h-12 text-[#E11D48] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Artist Not Found</h2>
        <p className="text-sm text-[#AAA0A7] mb-6">The requested artist profile does not exist.</p>
        <Link
          href="/music"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider"
        >
          Return to Music Home
        </Link>
      </div>
    );
  }

  const artistName = artist?.name || tracks[0]?.artist || "Artist";
  const avatarUrl =
    artist?.avatarUrl ||
    tracks[0]?.coverUrl ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";
  const bio = artist?.bio || `Independent artist streaming high-fidelity audio on CINOVA Music.`;
  const listeners = artist?.monthlyListeners || "250K+";

  return (
    <div className="min-h-screen pb-36 pt-20 px-3 sm:px-6 lg:px-8 max-w-[1400px] mx-auto select-none">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-medium text-[#AAA0A7] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Music
      </button>

      {/* Spotify-Style Artist Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#220B17] via-[#14060E] to-[#0D0407] border border-[rgba(155,25,57,0.3)] p-6 sm:p-10 mb-8 shadow-2xl">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080506] via-[#080506]/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#650A20] to-[#E11D48] shadow-[0_10px_35px_rgba(225,29,72,0.4)] shrink-0">
            <img
              src={avatarUrl}
              alt={artistName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#FF385B]">
              Verified Artist
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
              {artistName}
            </h1>
            <p className="text-xs sm:text-sm text-[#AAA0A7] max-w-xl line-clamp-2">
              {bio}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-[#AAA0A7] pt-1">
              <span>{listeners} Monthly Listeners</span>
              <span>•</span>
              <span>{tracks.length} Available Songs</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A30D32] to-[#E11D48] text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isArtistPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>Play Popular Tracks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify-Style Popular Tracks Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[#FF385B] font-black text-lg tracking-tighter">///</span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Popular Tracks
            </h2>
          </div>
          <span className="text-xs text-[#AAA0A7]">High-Quality Streaming</span>
        </div>

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
      </section>
    </div>
  );
}
