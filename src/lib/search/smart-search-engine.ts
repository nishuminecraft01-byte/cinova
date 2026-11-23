/**
 * CINOVA Intelligent Smart Search Engine
 *
 * Implements:
 * - Unicode NFKD diacritic & accent stripping
 * - Case & punctuation normalization
 * - Fuzzy matching via Fuse.js + token-based Levenshtein
 * - Multilingual script preservation (Hangul, Katakana/Kanji, Arabic, Devanagari, Cyrillic)
 * - Alias & Romanized transliteration mapping
 * - "Did you mean?" intelligent typo correction
 * - Multi-criteria relevance ranking
 */

import Fuse from "fuse.js";
import { Song, Artist, Album } from "@/types/music";
import { FULL_WORLDWIDE_CATALOGUE } from "@/lib/api/worldwide-catalogue";
import { MAINSTREAM_ARTISTS, MAINSTREAM_ALBUMS } from "@/lib/api/mainstream-client";

export interface SearchResultItem {
  track: Song;
  score: number; // 0 to 1, higher is better
  matchType: "exact" | "alias" | "typo" | "partial" | "fuzzy";
}

export interface SmartSearchResponse {
  tracks: Song[];
  artists: Artist[];
  albums: Album[];
  didYouMean?: string;
  query: string;
  normalizedQuery: string;
  total: number;
}

/**
 * Normalizes text: strips accents, removes excessive punctuation,
 * converts to lowercase, preserves non-Latin script characters.
 */
export function normalizeSearchQuery(text: string): string {
  if (!text) return "";
  const latinNormalized = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return latinNormalized
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ") // Preserve unicode letters, marks/matras & numbers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Similarity ratio between 0 and 1
 */
export function stringSimilarity(a: string, b: string): number {
  const normA = normalizeSearchQuery(a);
  const normB = normalizeSearchQuery(b);
  if (normA === normB) return 1.0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(normA, normB);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Detects language and script from query string
 */
export function detectQueryLanguage(text: string): { language?: string; script: string } {
  if (!text) return { script: "latin" };
  if (/[\u0900-\u097F]/.test(text)) {
    return { language: "devanagari", script: "devanagari" };
  }
  if (/[\u0A00-\u0A7F]/.test(text)) return { language: "punjabi", script: "gurmukhi" };
  if (/[\u0B80-\u0BFF]/.test(text)) return { language: "tamil", script: "tamil" };
  if (/[\u0C00-\u0C7F]/.test(text)) return { language: "telugu", script: "telugu" };
  if (/[\u0D00-\u0D7F]/.test(text)) return { language: "malayalam", script: "malayalam" };
  if (/[\u0C80-\u0CFF]/.test(text)) return { language: "kannada", script: "kannada" };
  if (/[\u0980-\u09FF]/.test(text)) return { language: "bengali", script: "bengali" };
  if (/[\u0A80-\u0AFF]/.test(text)) return { language: "gujarati", script: "gujarati" };
  if (/[\u0600-\u06FF]/.test(text)) return { language: "arabic", script: "arabic" };
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return { language: "korean", script: "hangul" };
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return { language: "japanese", script: "japanese" };
  if (/[\u0400-\u04FF]/.test(text)) return { language: "russian", script: "cyrillic" };
  return { script: "latin" };
}

/**
 * Phonetic transformation key for robust multilingual and Romanized typo matching
 */
export function phoneticKey(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/ph/g, "f")
    .replace(/ee+/g, "i")
    .replace(/oo+/g, "u")
    .replace(/aa+/g, "a")
    .replace(/saree|sari/g, "sadi")
    .replace(/\bsing\b/g, "singh")
    .replace(/arjit/g, "arijit")
    .replace(/apateu|apateo/g, "apt")
    .replace(/despasito|despashito/g, "despacito")
    .replace(/zingat|jhingat/g, "zingaat")
    .replace(/chalya|chaliya|chaleeya/g, "chaleya")
    .replace(/toba|taba/g, "tauba")
    .replace(/kesaria/g, "kesariya")
    .replace(/satranga\s+animal/g, "satranga")
    .replace(/[^a-z0-9\u0900-\u097F]/g, "");
}

/**
 * Dynamically computes an intelligent "Did you mean?" suggestion
 * across titles, artists, albums, and aliases using phonetic + Levenshtein distance.
 */
export function computeIntelligentDidYouMean(
  query: string,
  catalog: Song[] = FULL_WORLDWIDE_CATALOGUE
): string | undefined {
  const rawQ = query.trim();
  if (!rawQ || rawQ.length < 3) return undefined;
  const normQ = normalizeSearchQuery(rawQ);

  // 1. Direct typo dictionary check
  if (KNOWN_TYPO_MAPPINGS[normQ]) {
    return KNOWN_TYPO_MAPPINGS[normQ];
  }

  const pKey = phoneticKey(rawQ);

  // 2. Candidate collection from catalog tracks, artists, and albums
  const candidates: { text: string; category: "title" | "artist" | "album" }[] = [];
  const seen = new Set<string>();

  for (const track of catalog) {
    if (!seen.has(track.title.toLowerCase())) {
      seen.add(track.title.toLowerCase());
      candidates.push({ text: track.title, category: "title" });
    }
    if (!seen.has(track.artist.toLowerCase())) {
      seen.add(track.artist.toLowerCase());
      candidates.push({ text: track.artist, category: "artist" });
    }
    if (track.album && !seen.has(track.album.toLowerCase())) {
      seen.add(track.album.toLowerCase());
      candidates.push({ text: track.album, category: "album" });
    }
    for (const alias of track.aliases || []) {
      if (!seen.has(alias.toLowerCase())) {
        seen.add(alias.toLowerCase());
        candidates.push({ text: track.title, category: "title" });
      }
    }
  }

  for (const a of MAINSTREAM_ARTISTS) {
    if (!seen.has(a.name.toLowerCase())) {
      seen.add(a.name.toLowerCase());
      candidates.push({ text: a.name, category: "artist" });
    }
  }

  let bestCandidate: string | undefined = undefined;
  let highestScore = 0;

  for (const cand of candidates) {
    const candNorm = normalizeSearchQuery(cand.text);
    if (candNorm === normQ) continue; // Skip identical

    // A. Phonetic containment / match
    const cPKey = phoneticKey(cand.text);
    if (cPKey && pKey && (pKey.includes(cPKey) || cPKey.includes(pKey))) {
      const sim = Math.min(pKey.length, cPKey.length) / Math.max(pKey.length, cPKey.length);
      const score = 0.85 + sim * 0.15;
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = cand.text;
      }
      continue;
    }

    // B. Levenshtein / String similarity
    const sim = stringSimilarity(candNorm, normQ);
    if (sim >= 0.68 && sim > highestScore) {
      highestScore = sim;
      bestCandidate = cand.text;
    }
  }

  if (highestScore >= 0.70 && bestCandidate) {
    return bestCandidate;
  }

  return undefined;
}
const fuseOptions = {
  includeScore: true,
  threshold: 0.45, // balanced fuzzy tolerance
  distance: 100,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.35 },
    { name: "artist", weight: 0.25 },
    { name: "aliases", weight: 0.25 },
    { name: "nativeTitle", weight: 0.2 },
    { name: "album", weight: 0.1 },
    { name: "genre", weight: 0.1 },
    { name: "language", weight: 0.1 },
  ],
};

const fuse = new Fuse(FULL_WORLDWIDE_CATALOGUE, fuseOptions);

/**
 * Common typo & transliteration dictionary for instant correction
 */
const KNOWN_TYPO_MAPPINGS: Record<string, string> = {
  // Devanagari Native Script Hits
  "झिंगाट": "Zingaat",
  "सैराट झिंगाट": "Zingaat",
  "गुलाबी साडी": "Gulabi Sadi",
  "तांबडी चामडी": "Taambdi Chaamdi",
  "अप्सरा आली": "Apsara Aali",
  "चंद्रा": "Chandra",
  "चलेया": "Chaleya",
  "तौबा तौबा": "Tauba Tauba",
  "केसरिया": "Kesariya",

  // Punjabi & Hindi hits
  "toba toba": "Tauba Tauba",
  "tauba taba": "Tauba Tauba",
  "toba": "Tauba Tauba",
  "chalya": "Chaleya",
  "chaliya": "Chaleya",
  "chaleeya": "Chaleya",
  "zingat": "Zingaat",
  "jhingat": "Zingaat",
  "kesaria": "Kesariya",
  "ratan lambiya": "Raataan Lambiyan",
  "raatan lambiyan": "Raataan Lambiyan",
  "chana mereya": "Channa Mereya",
  "channa meriya": "Channa Mereya",
  "kala chasma": "Kala Chashma",
  "kaala chashma": "Kala Chashma",
  "satranga animal": "Satranga",
  "apsara ali": "Apsara Aali",

  // English & Global hits
  "shape of yu": "Shape of You",
  "shape of u": "Shape of You",
  "shep of you": "Shape of You",
  "blinding light": "Blinding Lights",
  "blinded by the lights": "Blinding Lights",
  "star boy": "Starboy",
  "cruel sumer": "Cruel Summer",
  "die with smile": "Die With A Smile",
  "24 karat magic": "24K Magic",

  // Korean & K-Pop
  "apateu": "APT.",
  "apateo": "APT.",
  "gangnam": "Gangnam Style",
  "gangam style": "Gangnam Style",
  "gangnam stil": "Gangnam Style",

  // Spanish & Latin
  "despasito": "Despacito",
  "despashito": "Despacito",
  "dansa kuduro": "Danza Kuduro",
  "baylando": "Bailando",

  // Arabic, Urdu & Others
  "pasuri": "Pasoori",
  "nour el ain": "Nour El Ein",
  "noor al ain": "Nour El Ein",
  "derniere": "Dernière Danse",
  "simarik": "Şımarık",
  "kiss kiss": "Şımarık",
  "jimiki kamal": "Entammede Jimikki Kammal",
  "natu natu": "Naatu Naatu",
  "natu naatu": "Naatu Naatu",
  "o antava": "Oo Antava Mawa..Oo Oo Antava",
};

/**
 * Searches the worldwide catalogue using typo-tolerant fuzzy matching,
 * token intersection, and transliteration mapping.
 * Automatically incorporates newly discovered dynamic songs.
 */
export function searchWorldwideTracks(
  query: string,
  limit: number = 24,
  languageFilter?: string,
  extraTracks: Song[] = []
): { tracks: Song[]; didYouMean?: string } {
  const rawQ = query.trim();
  if (!rawQ) return { tracks: [] };

  const normQ = normalizeSearchQuery(rawQ);
  const matchedTracks: Map<string, { track: Song; score: number; matchType: string }> = new Map();
  let didYouMean: string | undefined;

  const allTracks = [...FULL_WORLDWIDE_CATALOGUE, ...extraTracks];

  // 1. Dynamic typo correction & "Did you mean?" intelligent computation
  didYouMean = computeIntelligentDidYouMean(rawQ, allTracks);

  // 2. Exact & Alias Scan (Highest priority)
  for (const track of allTracks) {
    if (languageFilter && track.language !== languageFilter.toLowerCase()) continue;

    const normTitle = normalizeSearchQuery(track.title);
    const normArtist = normalizeSearchQuery(track.artist);
    const normNative = track.nativeTitle ? normalizeSearchQuery(track.nativeTitle) : "";
    const aliases = (track.aliases || []).map(normalizeSearchQuery);

    // Exact Title or Native Script match
    if (normTitle === normQ || normNative === normQ || normQ.includes(normTitle)) {
      matchedTracks.set(track.id, { track, score: 1.0, matchType: "exact" });
      continue;
    }

    // Exact Artist match
    if (normArtist === normQ || normArtist.includes(normQ) || normQ.includes(normArtist)) {
      matchedTracks.set(track.id, { track, score: 0.95, matchType: "exact" });
      continue;
    }

    // Alias / Transliteration match
    for (const alias of aliases) {
      if (alias === normQ || normQ.includes(alias) || alias.includes(normQ)) {
        matchedTracks.set(track.id, { track, score: 0.92, matchType: "alias" });
        if (!didYouMean && track.title.toLowerCase() !== normQ) {
          didYouMean = track.title;
        }
        break;
      }
    }
  }

  // 3. Fuse.js Fuzzy Matching
  const dynamicFuse = extraTracks.length > 0 ? new Fuse(allTracks, fuseOptions) : fuse;
  const fuseResults = dynamicFuse.search(normQ);
  for (const res of fuseResults) {
    const track = res.item;
    if (languageFilter && track.language !== languageFilter.toLowerCase()) continue;

    const fuseScore = 1 - (res.score ?? 0.5); // Convert lower fuse distance to higher score
    const existing = matchedTracks.get(track.id);

    if (!existing || existing.score < fuseScore) {
      matchedTracks.set(track.id, {
        track,
        score: fuseScore,
        matchType: fuseScore > 0.8 ? "typo" : "fuzzy",
      });
    }

    // Detect high-confidence "Did you mean?" suggestion
    if (!didYouMean && fuseScore >= 0.75 && normalizeSearchQuery(track.title) !== normQ) {
      didYouMean = track.title;
    }
  }

  // 4. Token Intersection Check (For partial queries, e.g. "karan tauba", "arijit chaleya", "ed sheeran shape")
  const queryTokens = normQ.split(" ").filter((t) => t.length > 1);
  if (queryTokens.length > 1) {
    for (const track of FULL_WORLDWIDE_CATALOGUE) {
      if (languageFilter && track.language !== languageFilter.toLowerCase()) continue;
      if (matchedTracks.has(track.id)) continue;

      const trackText = normalizeSearchQuery(
        `${track.title} ${track.artist} ${track.album || ""} ${track.genre} ${(track.aliases || []).join(" ")}`
      );

      const allTokensMatch = queryTokens.every((token) => trackText.includes(token));
      if (allTokensMatch) {
        matchedTracks.set(track.id, { track, score: 0.85, matchType: "partial" });
      }
    }
  }

  // 5. Rank results by score descending
  const sorted = Array.from(matchedTracks.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track)
    .slice(0, limit);

  return {
    tracks: sorted,
    didYouMean: didYouMean && didYouMean.toLowerCase() !== normQ ? didYouMean : undefined,
  };
}

/**
 * Searches artists by fuzzy query
 */
export function searchArtists(query: string, limit: number = 6): Artist[] {
  const normQ = normalizeSearchQuery(query);
  if (!normQ) return [];

  return MAINSTREAM_ARTISTS.filter((a) => {
    const normName = normalizeSearchQuery(a.name);
    return (
      normName.includes(normQ) ||
      normQ.includes(normName) ||
      stringSimilarity(normName, normQ) > 0.65
    );
  }).slice(0, limit);
}

/**
 * Searches albums by fuzzy query
 */
export function searchAlbums(query: string, limit: number = 6): Album[] {
  const normQ = normalizeSearchQuery(query);
  if (!normQ) return [];

  return MAINSTREAM_ALBUMS.filter((a) => {
    const normTitle = normalizeSearchQuery(a.title);
    const normArtist = normalizeSearchQuery(a.artist);
    return (
      normTitle.includes(normQ) ||
      normArtist.includes(normQ) ||
      stringSimilarity(normTitle, normQ) > 0.65
    );
  }).slice(0, limit);
}
