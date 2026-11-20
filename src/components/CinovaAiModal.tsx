"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, X, Play, Info, Star, Clock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import CinovaImage from "@/components/CinovaImage";

interface AiRecommendation {
  id: string;
  title: string;
  year: number;
  duration: number;
  rating: string;
  imdbScore: number;
  matchPercentage: number;
  genre: string[];
  language: string;
  posterUrl: string;
  backdropUrl: string;
  type: string;
  synopsis: string;
  aiReason: string;
}

interface CinovaAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  "Mind-bending sci-fi like Interstellar or Inception",
  "Great movies under 2 hours with fast pacing",
  "High-octane action thriller like John Wick",
  "Dark psychological crime thriller",
  "Wholesome family anime or animation",
  "Epic superhero multiversal cinema",
];

export default function CinovaAiModal({ isOpen, onClose }: CinovaAiModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState<"FAMILY_SAFE" | "TEEN_SAFE" | "GENERAL_MATURE">("GENERAL_MATURE");
  const [results, setResults] = useState<AiRecommendation[]>([]);
  const [summary, setSummary] = useState<string>("");

  if (!isOpen) return null;

  const handleSearch = async (userQuery: string) => {
    const q = userQuery || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setPrompt(q);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, safetyLevel }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.recommendations || []);
        setSummary(data.summary || "");
      }
    } catch (err) {
      console.error("AI recommend error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(prompt);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#10080C] rounded-2xl overflow-hidden shadow-2xl border border-[rgba(155,25,57,0.28)] my-6 sm:my-10 animate-modal-in"
      >
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0B0508] via-[#10080C] to-[#160B10] border-b border-[rgba(155,25,57,0.22)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#650A20] via-[#A30D32] to-[#E11D48] flex items-center justify-center text-[#F5F1F3] shadow-lg shadow-[#650A20]/40">
              <Sparkles className="w-5 h-5 fill-[#F5F1F3] text-[#F5F1F3]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F1F3] flex items-center gap-2">
                <span>CINOVA AI Discovery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#160B10] text-[#FF385B] border border-[rgba(155,25,57,0.3)]">
                  Live
                </span>
              </h3>
              <p className="text-xs text-[#AAA0A7]">
                Natural language semantic movie &amp; series recommendation engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.26)] text-[#AAA0A7] hover:text-[#F5F1F3] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What kind of movie or mood are you looking for?"
              className="w-full pl-4 pr-24 py-3 rounded-xl bg-[#160B10] text-[#F5F1F3] placeholder-[#746971] border border-[rgba(155,25,57,0.28)] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 text-sm transition-all"
            />
            <button
              onClick={() => handleSearch(prompt)}
              disabled={loading || !prompt.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-gradient-to-r from-[#A30D32] to-[#E11D48] hover:from-[#B9123B] hover:to-[#FF385B] disabled:from-[#1D0C13] disabled:to-[#1D0C13] disabled:text-[#746971] text-[#F5F1F3] text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Safety Filter Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#AAA0A7]">
              <ShieldCheck className="w-4 h-4 text-[#FF385B]" />
              <span className="font-semibold">Safety Filter:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "FAMILY_SAFE", label: "Family Safe (G/PG)" },
                  { id: "TEEN_SAFE", label: "Teen Safe (PG-13)" },
                  { id: "GENERAL_MATURE", label: "General Mature" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSafetyLevel(id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    safetyLevel === id
                      ? "bg-[#A30D32] text-[#F5F1F3] shadow-sm"
                      : "bg-[#160B10] text-[#AAA0A7] hover:text-[#F5F1F3] border border-[rgba(155,25,57,0.22)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Prompts Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#746971] uppercase tracking-wider block">
              Try an idea:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => handleSearch(sp)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/55 text-[#AAA0A7] hover:text-[#F5F1F3] transition-all text-left"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* AI Explanation / Summary */}
          {summary && (
            <div className="p-3.5 rounded-xl bg-[#160B10] border border-[rgba(155,25,57,0.35)] text-xs text-[#AAA0A7] font-medium leading-relaxed">
              <span className="font-bold text-[#F5F1F3] mr-1.5">Advisor insight:</span>
              {summary}
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#F5F1F3] uppercase tracking-wider block">
                Top Matches for you ({results.length}):
              </span>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#160B10] hover:bg-[#1D0C13] border border-[rgba(155,25,57,0.22)] hover:border-[#E11D48]/55 transition-all flex items-start gap-3.5 group"
                  >
                    <div className="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-[#080506] flex-shrink-0 border border-[rgba(155,25,57,0.22)]">
                      <CinovaImage
                        src={item.posterUrl || item.backdropUrl}
                        alt={item.title}
                        fallbackText={item.title}
                        aspect="poster"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-grow min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#F5F1F3] group-hover:text-[#FF385B] transition-colors truncate">
                          {item.title}
                        </h4>
                        <span className="text-xs font-semibold text-[#FF385B] flex-shrink-0">
                          {item.matchPercentage}% Match
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#AAA0A7]">
                        <span>{item.year}</span>
                        <span>•</span>
                        <span className="px-1 py-0.2 rounded border border-[rgba(155,25,57,0.25)] text-[9px] uppercase font-mono">
                          {item.rating}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-[#F5F1F3]">
                          <Star className="w-3 h-3 fill-[#FF385B] text-[#FF385B]" />
                          {item.imdbScore}
                        </span>
                        <span>•</span>
                        <span>{item.genre.slice(0, 2).join(", ")}</span>
                      </div>

                      <p className="text-xs text-[#AAA0A7] line-clamp-2 leading-relaxed">
                        {item.aiReason || item.synopsis}
                      </p>

                      <div className="pt-1.5 flex items-center gap-2">
                        <Link
                          href={`/watch/${item.id}`}
                          onClick={onClose}
                          className="px-3 py-1 rounded-full bg-[#E11D48] hover:bg-[#FF385B] text-[#F5F1F3] font-semibold text-xs flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-[#F5F1F3]" />
                          <span>Watch</span>
                        </Link>
                        <Link
                          href={`/title/${item.id}`}
                          onClick={onClose}
                          className="px-3 py-1 rounded-full bg-[#10080C] hover:bg-[#160B10] border border-[rgba(155,25,57,0.28)] text-[#AAA0A7] hover:text-[#F5F1F3] text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          <span>Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
