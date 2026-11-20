"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Search,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  FileText,
  Volume2,
  Film,
} from "lucide-react";
import { VideoSource, VideoTrack, PlaybackAvailabilityStatus } from "@/lib/video-sources";
import { Movie } from "@/types/movie";

interface AdminVideoSourcesManagerProps {
  movies: Movie[];
}

export default function AdminVideoSourcesManager({ movies }: AdminVideoSourcesManagerProps) {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [counts, setCounts] = useState<{ total: number; available: number; processing: number; unavailable: number }>({
    total: 0,
    available: 0,
    processing: 0,
    unavailable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlaybackAvailabilityStatus>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "movie" | "tv">("all");

  // Media Server (Jellyfin / CDN) Probe State
  const [isMediaServerModalOpen, setIsMediaServerModalOpen] = useState(false);
  const [mediaServerType, setMediaServerType] = useState<"jellyfin" | "cloudflare" | "bunny" | "custom_cdn">("jellyfin");
  const [mediaServerUrl, setMediaServerUrl] = useState("");
  const [mediaServerApiKey, setMediaServerApiKey] = useState("");
  const [mediaServerLoading, setMediaServerLoading] = useState(false);
  const [mediaServerResult, setMediaServerResult] = useState<{
    connected: boolean;
    serverName?: string;
    serverVersion?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Partial<VideoSource> | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    success?: boolean;
    reachable?: boolean;
    statusCode?: number;
    contentType?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Subtitle/Audio Track sub-form state
  const [tempTracks, setTempTracks] = useState<VideoTrack[]>([]);
  const [newTrackType, setNewTrackType] = useState<"subtitle" | "audio">("subtitle");
  const [newTrackLang, setNewTrackLang] = useState("en");
  const [newTrackLabel, setNewTrackLabel] = useState("English [CC]");
  const [newTrackUrl, setNewTrackUrl] = useState("");

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sources", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch video sources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleOpenAdd = (presetMovie?: Movie) => {
    setProbeResult(null);
    setSaveError("");
    setSaveSuccess("");
    setTempTracks([]);
    setEditingSource({
      movieId: presetMovie?.id || (presetMovie?.tmdbId ? `tmdb-${presetMovie.tmdbId}` : ""),
      title: presetMovie?.title || "",
      mediaType: presetMovie?.type === "series" ? "tv" : "movie",
      season: presetMovie?.type === "series" ? 1 : undefined,
      episode: presetMovie?.type === "series" ? 1 : undefined,
      protocol: "hls",
      provider: "cinova",
      streamUrl: "",
      quality: "1080p FHD",
      badge: "HLS",
      status: "Available",
      isPrimary: true,
      drmProtected: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (src: VideoSource) => {
    setProbeResult(null);
    setSaveError("");
    setSaveSuccess("");
    setTempTracks(src.tracks || []);
    setEditingSource({ ...src });
    setIsModalOpen(true);
  };

  const handleProbe = async () => {
    const url = editingSource?.streamUrl?.trim();
    if (!url) {
      setSaveError("Please enter a stream URL before probing.");
      return;
    }
    setProbeLoading(true);
    setProbeResult(null);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/sources/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamUrl: url }),
      });
      const data = await res.json();
      setProbeResult(data);
      if (data.detectedFormat && data.detectedFormat !== "other") {
        setEditingSource((prev) => ({
          ...prev,
          protocol: data.detectedFormat,
          badge: data.detectedFormat.toUpperCase(),
        }));
      }
    } catch {
      setProbeResult({ reachable: false, error: "Network error during probe." });
    } finally {
      setProbeLoading(false);
    }
  };

  const handleAddTrack = () => {
    if (!newTrackUrl.trim()) return;
    const track: VideoTrack = {
      id: `tr-${Date.now()}`,
      sourceId: editingSource?.id || "temp",
      trackType: newTrackType,
      languageCode: newTrackLang.trim().toLowerCase(),
      label: newTrackLabel.trim() || newTrackLang,
      trackUrl: newTrackUrl.trim(),
      isDefault: tempTracks.length === 0,
    };
    setTempTracks((prev) => [...prev, track]);
    setNewTrackUrl("");
  };

  const handleRemoveTrack = (trackId: string) => {
    setTempTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource?.movieId?.trim() || !editingSource?.streamUrl?.trim()) {
      setSaveError("Please provide both Movie ID and Video Stream URL.");
      return;
    }

    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingSource,
          tracks: tempTracks,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || "Failed to save video source.");
        return;
      }
      setSaveSuccess("Video source connected and verified successfully!");
      setTimeout(() => {
        setIsModalOpen(false);
        fetchSources();
      }, 1000);
    } catch {
      setSaveError("Failed to save source. Please verify connection.");
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm("Are you sure you want to disconnect this video source?")) return;
    try {
      const res = await fetch(`/api/admin/sources?id=${encodeURIComponent(sourceId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Filter sources
  const filteredSources = sources.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const isTV = s.mediaType === "tv" || s.season !== undefined;
    const matchesMediaType =
      mediaTypeFilter === "all" ||
      (mediaTypeFilter === "tv" ? isTV : !isTV);
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.movieId.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      s.streamUrl.toLowerCase().includes(q) ||
      s.provider.toLowerCase().includes(q);
    return matchesStatus && matchesMediaType && matchesQuery;
  });

  // 4-tier title status metrics
  const connectedMovieIds = new Set(sources.map((s) => s.movieId));
  const streamReadyCount = counts.available;
  const trailerAvailableCount = movies.filter(
    (m) =>
      (m.trailerUrl || m.tmdbId) &&
      !connectedMovieIds.has(m.id) &&
      (!m.tmdbId || (!connectedMovieIds.has(`tmdb-${m.tmdbId}`) && !connectedMovieIds.has(m.tmdbId)))
  ).length;
  const titlesMissingSources = movies.filter(
    (m) =>
      !connectedMovieIds.has(m.id) &&
      (!m.tmdbId || (!connectedMovieIds.has(`tmdb-${m.tmdbId}`) && !connectedMovieIds.has(m.tmdbId))) &&
      (!m.videoUrl || m.videoUrl.includes("commondatastorage.googleapis.com"))
  );
  const sourceErrorCount = counts.unavailable;

  const handleTestMediaServer = async () => {
    if (!mediaServerUrl.trim()) return;
    setMediaServerLoading(true);
    setMediaServerResult(null);
    try {
      const res = await fetch("/api/admin/media-server/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mediaServerType,
          serverUrl: mediaServerUrl.trim(),
          apiKey: mediaServerApiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      setMediaServerResult(data.result || { connected: false, error: data.error || "Probe failed" });
    } catch {
      setMediaServerResult({ connected: false, error: "Network connection failed during probe." });
    } finally {
      setMediaServerLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4-Tier Title Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-[#160B10] border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Stream Ready</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{streamReadyCount}</p>
          <p className="text-[11px] text-[#AAA0A7] mt-1">Verified authorized HLS, DASH &amp; MP4 streams</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#160B10] border border-cyan-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">Trailer Available</span>
            <Film className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-cyan-400">{trailerAvailableCount}</p>
          <p className="text-[11px] text-[#AAA0A7] mt-1">Official trailers &amp; legal Where to Watch platforms</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#160B10] border border-[#E11D48]/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-[#FF385B]">Source Missing</span>
            <AlertTriangle className="w-5 h-5 text-[#FF385B]" />
          </div>
          <p className="text-3xl font-black text-[#FF385B]">{titlesMissingSources.length}</p>
          <p className="text-[11px] text-[#AAA0A7] mt-1">Titles set to Explore-Only / Discovery mode</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#160B10] border border-amber-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Source Error / Offline</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{sourceErrorCount}</p>
          <p className="text-[11px] text-[#AAA0A7] mt-1">Disabled or CDN reachability probe failed</p>
        </div>
      </div>

      {/* Control Bar: Search & Action Buttons */}
      <div className="p-6 rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#AAA0A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sources by Movie ID, title, URL, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-xs text-[#F5F1F3] placeholder-[#746971] focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenAdd()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(225,29,72,0.35)] transition-all"
            >
              <Plus className="w-4 h-4" /> Connect Video Source
            </button>
            <button
              onClick={() => {
                setMediaServerResult(null);
                setIsMediaServerModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.38)] hover:border-[#E11D48] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Server className="w-4 h-4 text-[#FF385B]" /> Media Server Probe
            </button>
            <button
              onClick={fetchSources}
              className="p-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
              title="Refresh Sources"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(155,25,57,0.18)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#746971] uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: "all", label: `All (${sources.length})` },
              { id: "Available", label: `Available (${counts.available})` },
              { id: "Processing", label: `Processing (${counts.processing})` },
              { id: "Temporarily Unavailable", label: `Unavailable (${counts.unavailable})` },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${statusFilter === pill.id
                  ? "bg-[#650A20]/80 border-[#E11D48] text-[#F5F1F3]"
                  : "border-transparent bg-[#10080C] text-[#AAA0A7] hover:text-[#F5F1F3]"
                  }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#746971] uppercase tracking-wider mr-1">Format:</span>
            {[
              { id: "all", label: "All Formats" },
              { id: "movie", label: "Movies" },
              { id: "tv", label: "TV Series / Episodes" },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setMediaTypeFilter(pill.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${mediaTypeFilter === pill.id
                  ? "bg-[#650A20]/80 border-[#E11D48] text-[#F5F1F3]"
                  : "border-transparent bg-[#10080C] text-[#AAA0A7] hover:text-[#F5F1F3]"
                  }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Video Sources Table */}
      <div className="rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[rgba(155,25,57,0.2)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#F5F1F3]">Connected Playback Streams</h2>
            <p className="text-xs text-[#AAA0A7] mt-0.5">
              Authorized HLS manifests, progressive MP4 streams, and multi-track audio/subtitles.
            </p>
          </div>
          <span className="text-xs font-mono text-[#AAA0A7]">{filteredSources.length} showing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#10080C] text-[#AAA0A7] uppercase text-[10px] tracking-wider border-b border-[rgba(155,25,57,0.2)]">
              <tr>
                <th className="py-3.5 px-5">Target Title / Movie ID</th>
                <th className="py-3.5 px-4">Protocol</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Quality</th>
                <th className="py-3.5 px-4">Tracks (Sub/Audio)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(155,25,57,0.14)]">
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#AAA0A7]">
                    <Server className="w-8 h-8 text-[#E11D48]/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#F5F1F3]">No video sources match your search</p>
                    <p className="text-xs text-[#746971] mt-1">Connect a new HLS or MP4 stream above.</p>
                  </td>
                </tr>
              ) : (
                filteredSources.map((src) => {
                  const matchingMovie = movies.find(
                    (m) => m.id === src.movieId || m.tmdbId === src.movieId || `tmdb-${m.tmdbId}` === src.movieId
                  );
                  return (
                    <tr key={src.id} className="hover:bg-[#1A0B12]/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-bold text-[#F5F1F3] text-sm">
                            {src.title || matchingMovie?.title || src.movieId}
                          </div>
                          {(src.mediaType === "tv" || src.season !== undefined) ? (
                            <span className="px-2 py-0.5 rounded bg-[#650A20] text-[#FF385B] text-[10px] font-bold uppercase font-mono border border-[#E11D48]/30">
                              Series {src.season !== undefined ? `S${src.season}` : ""}{src.episode !== undefined ? `E${src.episode}` : ""}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[#1A0B12] text-[#AAA0A7] text-[10px] font-semibold uppercase font-mono border border-[rgba(155,25,57,0.2)]">
                              Movie
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-[#FF385B] mt-0.5">{src.movieId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono bg-[#650A20]/60 text-[#FF385B] border border-[#E11D48]/30">
                          {src.protocol.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#AAA0A7]">{src.provider}</td>
                      <td className="py-4 px-4 font-semibold text-[#F5F1F3]">{src.quality}</td>
                      <td className="py-4 px-4">
                        {src.tracks && src.tracks.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7]">
                            <FileText className="w-3 h-3 text-[#FF385B]" />
                            {src.tracks.length} track{src.tracks.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[#746971] text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${src.status === "Available"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : src.status === "Processing"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${src.status === "Available" ? "bg-emerald-400" : src.status === "Processing" ? "bg-amber-400" : "bg-red-400"}`} />
                          {src.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(src)}
                          className="p-1.5 rounded-lg bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3] transition-colors"
                          title="Edit Source & Tracks"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(src.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
                          title="Disconnect Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catalog Titles Missing Sources (One-Click Connect Shelf) */}
      {titlesMissingSources.length > 0 && (
        <div className="rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.24)] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#F5F1F3] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF385B]" />
                Catalog Titles Missing Video Sources ({titlesMissingSources.length})
              </h2>
              <p className="text-xs text-[#AAA0A7] mt-0.5">
                These titles are currently set to explore-only / trailer mode. Click Connect to attach an authorized stream.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {titlesMissingSources.slice(0, 9).map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#F5F1F3] text-xs truncate">{m.title}</p>
                  <p className="text-[10px] font-mono text-[#746971] truncate">{m.id} • {m.releaseYear}</p>
                </div>
                <button
                  onClick={() => handleOpenAdd(m)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] text-[11px] font-bold uppercase transition-all"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect / Edit Video Source Modal */}
      {isModalOpen && editingSource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.36)] p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(155,25,57,0.2)]">
              <div>
                <h3 className="text-xl font-black text-[#F5F1F3]">
                  {editingSource.id ? "Edit Video Playback Source" : "Connect Authorized Video Source"}
                </h3>
                <p className="text-xs text-[#AAA0A7] mt-0.5">
                  Attach an authorized HLS (.m3u8), DASH (.mpd), or progressive MP4 stream.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" /> {saveSuccess}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Target ID (TMDB / ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dune, tmdb-693134, 213375"
                    value={editingSource.movieId || ""}
                    onChange={(e) => setEditingSource({ ...editingSource, movieId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] focus:border-[#E11D48] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Catalog Title (Display Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dune: Part Two or VisionQuest"
                    value={editingSource.title || ""}
                    onChange={(e) => setEditingSource({ ...editingSource, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] focus:border-[#E11D48] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Media Format
                  </label>
                  <select
                    value={editingSource.mediaType || "movie"}
                    onChange={(e) => {
                      const newType = e.target.value as "movie" | "tv";
                      setEditingSource({
                        ...editingSource,
                        mediaType: newType,
                        season: newType === "tv" ? editingSource.season || 1 : undefined,
                        episode: newType === "tv" ? editingSource.episode || 1 : undefined,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                  >
                    <option value="movie">Movie / Feature Film</option>
                    <option value="tv">TV Series / Episode</option>
                  </select>
                </div>
              </div>

              {editingSource.mediaType === "tv" && (
                <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-[#1D0C13] border border-[#E11D48]/30">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#FF385B] mb-1">
                      Season Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={editingSource.season ?? 1}
                      onChange={(e) =>
                        setEditingSource({
                          ...editingSource,
                          season: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] text-xs font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#FF385B] mb-1">
                      Episode Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={editingSource.episode ?? 1}
                      onChange={(e) =>
                        setEditingSource({
                          ...editingSource,
                          episode: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                  Stream Source URL (HLS / DASH / MP4 / Local) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://cdn.example.com/master.m3u8 or /videos/local-file.mp4"
                    value={editingSource.streamUrl || ""}
                    onChange={(e) => setEditingSource({ ...editingSource, streamUrl: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] focus:border-[#E11D48] outline-none font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleProbe}
                    disabled={probeLoading}
                    className="px-4 py-2.5 rounded-xl bg-[#650A20] hover:bg-[#830D2B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shrink-0"
                  >
                    {probeLoading ? "Testing..." : "Test Reachability"}
                  </button>
                </div>

                {/* Probe Live Feedback */}
                {probeResult && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-[11px] flex items-center justify-between ${probeResult.reachable
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {probeResult.reachable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>
                        {probeResult.reachable
                          ? `Reachable (HTTP ${probeResult.statusCode}) • Latency: ${probeResult.latencyMs}ms • MIME: ${probeResult.contentType}`
                          : `Unreachable: ${probeResult.error || "Connection failed"}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Streaming Protocol
                  </label>
                  <select
                    value={editingSource.protocol || "hls"}
                    onChange={(e) => setEditingSource({ ...editingSource, protocol: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                  >
                    <option value="hls">HLS (.m3u8)</option>
                    <option value="dash">MPEG-DASH (.mpd)</option>
                    <option value="mp4">Progressive MP4</option>
                    <option value="local_file">Local Video File</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Provider
                  </label>
                  <select
                    value={editingSource.provider || "cinova"}
                    onChange={(e) => setEditingSource({ ...editingSource, provider: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                  >
                    <option value="cinova">CINOVA Direct Master</option>
                    <option value="cloudflare">Cloudflare Stream</option>
                    <option value="bunny">Bunny Stream</option>
                    <option value="mux">Mux Video</option>
                    <option value="direct_cdn">Direct CDN Storage</option>
                    <option value="local">Local Storage (/videos)</option>
                    <option value="custom">Custom Host</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Stream Quality
                  </label>
                  <select
                    value={editingSource.quality || "1080p FHD"}
                    onChange={(e) => setEditingSource({ ...editingSource, quality: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="480p SD">480p SD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                  Playback Availability Status
                </label>
                <select
                  value={editingSource.status || "Available"}
                  onChange={(e) => setEditingSource({ ...editingSource, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                >
                  <option value="Available">Available (Playable in Player)</option>
                  <option value="Processing">Processing (Transcoding / Ingesting)</option>
                  <option value="Source Missing">Source Missing (Explore-Only Mode)</option>
                  <option value="Temporarily Unavailable">Temporarily Unavailable (Offline for maintenance)</option>
                </select>
              </div>

              {/* Subtitles & Audio Track Manager */}
              <div className="pt-3 border-t border-[rgba(155,25,57,0.2)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F1F3] uppercase tracking-wider text-[11px]">
                    Subtitles &amp; Audio Tracks ({tempTracks.length})
                  </span>
                </div>

                {/* Existing Tracks List */}
                {tempTracks.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {tempTracks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-lg bg-[#10080C] border border-[rgba(155,25,57,0.2)] flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          {t.trackType === "subtitle" ? (
                            <FileText className="w-3.5 h-3.5 text-[#FF385B]" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="font-bold text-[#F5F1F3]">{t.label}</span>
                          <span className="font-mono text-[#AAA0A7]">({t.languageCode})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(t.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Track Inputs */}
                <div className="p-3 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.2)] grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newTrackType}
                    onChange={(e) => setNewTrackType(e.target.value as any)}
                    className="px-2 py-1.5 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-[#F5F1F3] text-[11px]"
                  >
                    <option value="subtitle">Subtitle (.vtt)</option>
                    <option value="audio">Audio Track</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Lang (e.g. en, hi)"
                    value={newTrackLang}
                    onChange={(e) => setNewTrackLang(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-[#F5F1F3] text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. English [CC])"
                    value={newTrackLabel}
                    onChange={(e) => setNewTrackLabel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-[#F5F1F3] text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    className="px-3 py-1.5 rounded-lg bg-[#650A20] hover:bg-[#830D2B] text-[#F5F1F3] font-bold text-[11px] uppercase tracking-wider"
                  >
                    + Add Track
                  </button>
                  <input
                    type="url"
                    placeholder="Track URL (https://cdn.example.com/subs/en.vtt)"
                    value={newTrackUrl}
                    onChange={(e) => setNewTrackUrl(e.target.value)}
                    className="col-span-full px-2.5 py-1.5 rounded-lg bg-[#160B10] border border-[rgba(155,25,57,0.24)] text-[#F5F1F3] text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(155,25,57,0.2)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(225,29,72,0.35)]"
                >
                  Save &amp; Connect Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Server Integration Probe Modal */}
      {isMediaServerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-[#160B10] border border-[rgba(155,25,57,0.36)] p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(155,25,57,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#650A20] to-[#10080C] border border-[#E11D48]/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-[#FF385B]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#F5F1F3]">Media Server Infrastructure Probe</h3>
                  <p className="text-xs text-[#AAA0A7] mt-0.5">
                    Test connectivity with Jellyfin or streaming storage origins.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMediaServerModalOpen(false)}
                className="p-2 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] text-[#AAA0A7] hover:text-[#F5F1F3] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                  Server Type
                </label>
                <select
                  value={mediaServerType}
                  onChange={(e) => setMediaServerType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] outline-none"
                >
                  <option value="jellyfin">Jellyfin Media Server (Self-Hosted / Remote)</option>
                  <option value="cloudflare">Cloudflare Stream Origin</option>
                  <option value="bunny">Bunny Stream CDN</option>
                  <option value="custom_cdn">Custom CDN / Cloud Storage Origin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                  Server Base URL *
                </label>
                <input
                  type="url"
                  placeholder={mediaServerType === "jellyfin" ? "http://localhost:8096 or https://jellyfin.example.com" : "https://cdn.example.com"}
                  value={mediaServerUrl}
                  onChange={(e) => setMediaServerUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] focus:border-[#E11D48] outline-none font-mono"
                />
              </div>

              {mediaServerType === "jellyfin" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AAA0A7] mb-1.5">
                    Jellyfin API Key (Optional for Public Info, Required for Playback Tokens)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Jellyfin API token (kept securely on server)"
                    value={mediaServerApiKey}
                    onChange={(e) => setMediaServerApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#10080C] border border-[rgba(155,25,57,0.28)] text-[#F5F1F3] focus:border-[#E11D48] outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#746971] mt-1">
                    Server-to-server token verification. API keys are never leaked to client bundles.
                  </p>
                </div>
              )}

              {/* Probe Result Feedback */}
              {mediaServerResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${mediaServerResult.connected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {mediaServerResult.connected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Media Server Connected Successfully</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Connection Failed</span>
                      </>
                    )}
                  </div>
                  {mediaServerResult.connected ? (
                    <p className="text-[11px] opacity-90">
                      Server: <strong>{mediaServerResult.serverName || "Online"}</strong> • Version: {mediaServerResult.serverVersion || "Verified"} • Latency: {mediaServerResult.latencyMs}ms
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-90">
                      {mediaServerResult.error || "Unable to reach server. Please check the URL and network permissions."}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(155,25,57,0.2)]">
                <button
                  type="button"
                  onClick={() => setIsMediaServerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#10080C] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3] font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleTestMediaServer}
                  disabled={mediaServerLoading || !mediaServerUrl.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] text-[#F5F1F3] font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(225,29,72,0.35)]"
                >
                  {mediaServerLoading ? "Testing..." : "Test Connection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
