"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Film,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { GENRES, LANGUAGES } from "@/data/genres";
import { ContentType } from "@/types/movie";

export default function CreatorStudioPage() {
  const { user } = useAuth();
  const { submissions, addSubmission } = useWatchlist();

  // Submission Form State
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("Sci-Fi");
  const [type, setType] = useState<ContentType>("movie");
  const [language, setLanguage] = useState("English");
  const [duration, setDuration] = useState<number>(90);
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [videoUrl, setVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4");
  const [posterUrl, setPosterUrl] = useState("https://image.tmdb.org/t/p/w780/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg");
  const [rightsStatement, setRightsStatement] = useState("");
  const [licenseType, setLicenseType] = useState<"Exclusive" | "Non-Exclusive" | "Public Domain" | "Creative Commons">("Non-Exclusive");
  const [hasRightsCheck, setHasRightsCheck] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !synopsis || !hasRightsCheck) {
      alert("Please complete the required title, synopsis, and copyright declaration.");
      return;
    }

    addSubmission({
      userId: user?.id || "usr-anon-creator",
      creatorName: user?.name || "Independent Filmmaker",
      creatorEmail: user?.email || "filmmaker@example.com",
      title,
      synopsis,
      genre: [selectedGenre],
      type,
      language,
      duration: Number(duration),
      releaseYear: Number(releaseYear),
      videoUrl,
      posterUrl,
      rightsStatement: rightsStatement || "Producer certifies full chain of title, synch rights, and digital SVOD clearance.",
      licenseType,
      hasDistributionRights: hasRightsCheck,
    });

    setSubmittedSuccess(true);
    // Reset form
    setTitle("");
    setSynopsis("");
    setRightsStatement("");
    setHasRightsCheck(false);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  const userSubmissions = submissions;

  return (
    <div className="min-h-screen cinova-atmosphere bg-[#080506] pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.28)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <UploadCloud className="w-3.5 h-3.5 text-[#E11D48]" /> CINOVA Creator Studio
          </span>
          <span className="text-xs text-[#746971]">•</span>
          <span className="text-xs text-[#AAA0A7]">Independent Filmmaker Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#F5F1F3] tracking-tight">
          Submit & Distribute Content
        </h1>
        <p className="text-sm text-[#AAA0A7] mt-2 max-w-2xl leading-relaxed">
          Publish your feature films, web series episodes, and festival shorts to CINOVA. Every submission undergoes a rights verification check before going live to our global audience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Submission Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#160B10] rounded-3xl border border-[rgba(155,25,57,0.24)] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(155,25,57,0.22)]">
            <h2 className="text-lg font-bold text-[#F5F1F3] flex items-center gap-2">
              <Film className="w-4 h-4 text-[#E11D48]" /> Film Submission Dossier
            </h2>
            <span className="text-xs text-[#AAA0A7] font-mono">Step 1 of 2: Submission</span>
          </div>

          {submittedSuccess && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">Film Submitted Successfully!</p>
                <p className="text-emerald-300">
                  Your project has been queued for editorial rights verification in the Admin Dashboard.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Title & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Movie / Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chronicles of Neon Light"
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-3.5 py-2.5 text-[#F5F1F3] placeholder-[#746971] focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Format Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContentType)}
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-3 py-2.5 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                >
                  <option value="movie">Feature Film</option>
                  <option value="series">Web Series</option>
                  <option value="short">Short Film</option>
                </select>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <label className="block font-semibold text-[#AAA0A7] mb-1">
                Logline & Synopsis *
              </label>
              <textarea
                required
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Provide a compelling description of the narrative, themes, and protagonist journey..."
                className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl p-3 text-[#F5F1F3] placeholder-[#746971] focus:outline-none focus:border-[#E11D48] transition-colors resize-none"
              />
            </div>

            {/* Genre, Language, Duration, Release Year */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">Primary Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-2.5 py-2 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                >
                  {GENRES.filter((g) => g !== "All").map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">Original Audio</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-2.5 py-2 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                >
                  {LANGUAGES.filter((l) => l !== "All").map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-2.5 py-2 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">Release Year</label>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(Number(e.target.value))}
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-2.5 py-2 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>
            </div>

            {/* Media URLs: Stream URL & Poster URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Authorized Stream Link (MP4 / HLS)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-3 py-2 text-[#F5F1F3] text-xs placeholder-[#746971] focus:outline-none focus:border-[#E11D48] transition-colors"
                />
                <span className="text-[10px] text-[#746971] mt-1 block">
                  Demo default pre-filled with authorized Blender stream
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w780/..."
                  className="w-full bg-[#10080C] border border-[rgba(155,25,57,0.25)] rounded-xl px-3 py-2 text-[#F5F1F3] text-xs placeholder-[#746971] focus:outline-none focus:border-[#E11D48] transition-colors"
                />
                <span className="text-[10px] text-[#746971] mt-1 block">
                  Official high-res 2:3 vertical poster artwork
                </span>
              </div>
            </div>

            {/* Section: Streaming Rights Information & Licensing */}
            <div id="rights" className="p-4 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.24)] space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
                <h3 className="font-bold text-[#F5F1F3] text-xs">
                  Streaming Rights & Legal Clearance
                </h3>
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Distribution License Type
                </label>
                <select
                  value={licenseType}
                  onChange={(e) =>
                    setLicenseType(e.target.value as "Exclusive" | "Non-Exclusive" | "Public Domain" | "Creative Commons")
                  }
                  className="w-full bg-[#160B10] border border-[rgba(155,25,57,0.25)] rounded-xl px-3 py-2 text-[#F5F1F3] focus:outline-none focus:border-[#E11D48] transition-colors"
                >
                  <option value="Non-Exclusive">Non-Exclusive Global SVOD License</option>
                  <option value="Exclusive">Exclusive CINOVA Premiere Window (6 Months)</option>
                  <option value="Creative Commons">Creative Commons (CC BY 4.0 / CC0)</option>
                  <option value="Public Domain">Verified Public Domain Master</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#AAA0A7] mb-1">
                  Chain of Title / Rights Clearance Statement
                </label>
                <textarea
                  rows={2}
                  value={rightsStatement}
                  onChange={(e) => setRightsStatement(e.target.value)}
                  placeholder="Declare underlying rights ownership, sync licenses for music, and cast image releases..."
                  className="w-full bg-[#160B10] border border-[rgba(155,25,57,0.25)] rounded-xl p-2.5 text-[#F5F1F3] placeholder-[#746971] focus:outline-none focus:border-[#E11D48] transition-colors resize-none text-[11px]"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={hasRightsCheck}
                  onChange={(e) => setHasRightsCheck(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#E11D48] rounded"
                />
                <span className="text-[11px] text-[#AAA0A7] leading-snug">
                  I solemnly certify that I own or control all necessary digital distribution and music rights for this media, and authorize CINOVA to stream this title to subscribers upon verification.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#C0103C] hover:to-[#FF385B] text-[#F5F1F3] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#650A20]/35 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              Submit Film for Review
            </button>
          </form>
        </div>

        {/* Right Column: Submission Tracker & Workflow Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Submission Status Tracker Card */}
          <div className="bg-[#160B10] rounded-3xl border border-[rgba(155,25,57,0.24)] p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#F5F1F3] mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E11D48]" /> Your Submission Queue
            </h2>
            <p className="text-xs text-[#AAA0A7] mb-4">
              Real-time audit status for submissions reviewed by CINOVA Curators.
            </p>

            <div className="space-y-3">
              {userSubmissions.map((sub) => {
                const statusColor =
                  sub.status === "Approved"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                    : sub.status === "Rejected"
                    ? "bg-red-950 text-red-300 border-red-500/40"
                    : "bg-amber-950 text-amber-300 border-amber-500/40";

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl bg-[#10080C] border border-[rgba(155,25,57,0.22)] text-xs space-y-2 hover:border-[#E11D48]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-[#F5F1F3]">{sub.title}</h4>
                        <p className="text-[11px] text-[#AAA0A7]">
                          {sub.creatorName} • {sub.genre.join(", ")}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusColor}`}>
                        {sub.status}
                      </span>
                    </div>

                    {sub.reviewNotes && (
                      <p className="text-[11px] text-[#AAA0A7] bg-[#080506]/80 p-2.5 rounded-lg border border-[rgba(155,25,57,0.22)] italic">
                        &ldquo;{sub.reviewNotes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#746971] pt-1 border-t border-[rgba(155,25,57,0.18)]">
                      <span>{sub.licenseType}</span>
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guidelines & Rights Clearance Note */}
          <div className="rounded-3xl border border-[rgba(155,25,57,0.24)] bg-[#160B10] p-6 space-y-3">
            <h3 className="text-xs font-bold text-[#FF385B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" /> Curator Review Timeline
            </h3>
            <ul className="text-xs text-[#AAA0A7] space-y-2 list-disc list-inside leading-relaxed">
              <li>Editorial review typically completes within 48-72 business hours.</li>
              <li>Approved content is automatically converted to 4K HLS streaming manifests.</li>
              <li>Creators receive quarterly statements and transparent viewership analytics.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
