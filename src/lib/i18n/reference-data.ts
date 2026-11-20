/**
 * Centralized ISO-compliant Language, Country, Regional Default, and Genre Reference Data.
 * Used both for idempotent PostgreSQL seeding (prisma/seed.ts) and as a fallback
 * reference dictionary when the database is not yet provisioned.
 */

export interface LanguageDefinition {
  code: string; // ISO 639-1
  iso639_2: string; // ISO 639-2
  englishName: string;
  nativeName: string;
  isRtl: boolean;
  isUiSupported: boolean;
  isActive: boolean;
}

export interface CountryDefinition {
  code: string; // ISO 3166-1 alpha-2
  englishName: string;
  nativeName: string;
  regionGroup: "SOUTH_ASIA" | "NORTH_AMERICA" | "EAST_ASIA" | "SOUTHEAST_ASIA" | "EUROPE" | "LATIN_AMERICA" | "MIDDLE_EAST" | "OCEANIA";
  isActive: boolean;
}

export interface RegionalDefaultDefinition {
  countryCode: string;
  defaultUiLanguageCode: string;
  fallbackUiLanguageCode: string;
  defaultAudioLanguageCode: string;
  secondaryAudioLanguageCode: string | null;
  defaultSubtitleLanguageCode: string | null;
  featuredLanguageCodes: string[];
}

export interface GenreDefinition {
  slug: string;
  name: string;
  tmdbGenreId?: number;
  localizations?: Record<string, string>;
}

export const REFERENCE_LANGUAGES: LanguageDefinition[] = [
  { code: "en", iso639_2: "eng", englishName: "English", nativeName: "English", isRtl: false, isUiSupported: true, isActive: true },
  { code: "hi", iso639_2: "hin", englishName: "Hindi", nativeName: "हिन्दी", isRtl: false, isUiSupported: true, isActive: true },
  { code: "mr", iso639_2: "mar", englishName: "Marathi", nativeName: "मराठी", isRtl: false, isUiSupported: true, isActive: true },
  { code: "ta", iso639_2: "tam", englishName: "Tamil", nativeName: "தமிழ்", isRtl: false, isUiSupported: true, isActive: true },
  { code: "te", iso639_2: "tel", englishName: "Telugu", nativeName: "తెలుగు", isRtl: false, isUiSupported: true, isActive: true },
  { code: "ml", iso639_2: "mal", englishName: "Malayalam", nativeName: "മലയാളം", isRtl: false, isUiSupported: true, isActive: true },
  { code: "kn", iso639_2: "kan", englishName: "Kannada", nativeName: "ಕನ್ನಡ", isRtl: false, isUiSupported: true, isActive: true },
  { code: "bn", iso639_2: "ben", englishName: "Bengali", nativeName: "বাংলা", isRtl: false, isUiSupported: true, isActive: true },
  { code: "pa", iso639_2: "pan", englishName: "Punjabi", nativeName: "ਪੰਜਾਬੀ", isRtl: false, isUiSupported: false, isActive: true },
  { code: "gu", iso639_2: "guj", englishName: "Gujarati", nativeName: "ગુજરાતી", isRtl: false, isUiSupported: false, isActive: true },
  { code: "ur", iso639_2: "urd", englishName: "Urdu", nativeName: "اردو", isRtl: true, isUiSupported: false, isActive: true },
  { code: "ja", iso639_2: "jpn", englishName: "Japanese", nativeName: "日本語", isRtl: false, isUiSupported: true, isActive: true },
  { code: "ko", iso639_2: "kor", englishName: "Korean", nativeName: "한국어", isRtl: false, isUiSupported: true, isActive: true },
  { code: "zh", iso639_2: "zho", englishName: "Chinese", nativeName: "中文", isRtl: false, isUiSupported: true, isActive: true },
  { code: "fr", iso639_2: "fra", englishName: "French", nativeName: "Français", isRtl: false, isUiSupported: true, isActive: true },
  { code: "de", iso639_2: "deu", englishName: "German", nativeName: "Deutsch", isRtl: false, isUiSupported: true, isActive: true },
  { code: "es", iso639_2: "spa", englishName: "Spanish", nativeName: "Español", isRtl: false, isUiSupported: true, isActive: true },
  { code: "pt", iso639_2: "por", englishName: "Portuguese", nativeName: "Português", isRtl: false, isUiSupported: true, isActive: true },
  { code: "ar", iso639_2: "ara", englishName: "Arabic", nativeName: "العربية", isRtl: true, isUiSupported: true, isActive: true },
  { code: "tr", iso639_2: "tur", englishName: "Turkish", nativeName: "Türkçe", isRtl: false, isUiSupported: true, isActive: true },
  { code: "id", iso639_2: "ind", englishName: "Indonesian", nativeName: "Bahasa Indonesia", isRtl: false, isUiSupported: false, isActive: true },
  { code: "th", iso639_2: "tha", englishName: "Thai", nativeName: "ไทย", isRtl: false, isUiSupported: false, isActive: true },
  { code: "vi", iso639_2: "vie", englishName: "Vietnamese", nativeName: "Tiếng Việt", isRtl: false, isUiSupported: false, isActive: true },
  { code: "ru", iso639_2: "rus", englishName: "Russian", nativeName: "Русский", isRtl: false, isUiSupported: false, isActive: true },
  { code: "it", iso639_2: "ita", englishName: "Italian", nativeName: "Italiano", isRtl: false, isUiSupported: true, isActive: true },
];

export const REFERENCE_COUNTRIES: CountryDefinition[] = [
  { code: "IN", englishName: "India", nativeName: "भारत", regionGroup: "SOUTH_ASIA", isActive: true },
  { code: "US", englishName: "United States", nativeName: "United States", regionGroup: "NORTH_AMERICA", isActive: true },
  { code: "GB", englishName: "United Kingdom", nativeName: "United Kingdom", regionGroup: "EUROPE", isActive: true },
  { code: "CA", englishName: "Canada", nativeName: "Canada", regionGroup: "NORTH_AMERICA", isActive: true },
  { code: "AU", englishName: "Australia", nativeName: "Australia", regionGroup: "OCEANIA", isActive: true },
  { code: "JP", englishName: "Japan", nativeName: "日本", regionGroup: "EAST_ASIA", isActive: true },
  { code: "KR", englishName: "South Korea", nativeName: "대한민국", regionGroup: "EAST_ASIA", isActive: true },
  { code: "CN", englishName: "China", nativeName: "中国", regionGroup: "EAST_ASIA", isActive: true },
  { code: "TW", englishName: "Taiwan", nativeName: "台灣", regionGroup: "EAST_ASIA", isActive: true },
  { code: "FR", englishName: "France", nativeName: "France", regionGroup: "EUROPE", isActive: true },
  { code: "DE", englishName: "Germany", nativeName: "Deutschland", regionGroup: "EUROPE", isActive: true },
  { code: "ES", englishName: "Spain", nativeName: "España", regionGroup: "EUROPE", isActive: true },
  { code: "IT", englishName: "Italy", nativeName: "Italia", regionGroup: "EUROPE", isActive: true },
  { code: "PT", englishName: "Portugal", nativeName: "Portugal", regionGroup: "EUROPE", isActive: true },
  { code: "BR", englishName: "Brazil", nativeName: "Brasil", regionGroup: "LATIN_AMERICA", isActive: true },
  { code: "MX", englishName: "Mexico", nativeName: "México", regionGroup: "LATIN_AMERICA", isActive: true },
  { code: "TR", englishName: "Turkey", nativeName: "Türkiye", regionGroup: "MIDDLE_EAST", isActive: true },
  { code: "SA", englishName: "Saudi Arabia", nativeName: "السعودية", regionGroup: "MIDDLE_EAST", isActive: true },
  { code: "AE", englishName: "United Arab Emirates", nativeName: "الإمارات", regionGroup: "MIDDLE_EAST", isActive: true },
  { code: "ID", englishName: "Indonesia", nativeName: "Indonesia", regionGroup: "SOUTHEAST_ASIA", isActive: true },
  { code: "TH", englishName: "Thailand", nativeName: "ประเทศไทย", regionGroup: "SOUTHEAST_ASIA", isActive: true },
  { code: "VN", englishName: "Vietnam", nativeName: "Việt Nam", regionGroup: "SOUTHEAST_ASIA", isActive: true },
  { code: "RU", englishName: "Russia", nativeName: "Россия", regionGroup: "EUROPE", isActive: true },
  { code: "PK", englishName: "Pakistan", nativeName: "پاکستان", regionGroup: "SOUTH_ASIA", isActive: true },
  { code: "BD", englishName: "Bangladesh", nativeName: "বাংলাদেশ", regionGroup: "SOUTH_ASIA", isActive: true },
  { code: "SG", englishName: "Singapore", nativeName: "Singapore", regionGroup: "SOUTHEAST_ASIA", isActive: true },
];

export const REFERENCE_REGIONAL_DEFAULTS: RegionalDefaultDefinition[] = [
  {
    countryCode: "IN",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "hi",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["hi", "en", "mr", "ta", "te", "ml", "kn", "bn", "pa", "gu"],
  },
  {
    countryCode: "US",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "en",
    secondaryAudioLanguageCode: "es",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["en", "es", "ja", "ko", "hi"],
  },
  {
    countryCode: "GB",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "en",
    secondaryAudioLanguageCode: null,
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["en", "fr", "es", "hi", "ja"],
  },
  {
    countryCode: "CA",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "en",
    secondaryAudioLanguageCode: "fr",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["en", "fr", "hi", "pa", "zh"],
  },
  {
    countryCode: "AU",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "en",
    secondaryAudioLanguageCode: null,
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["en", "ja", "ko", "hi", "zh"],
  },
  {
    countryCode: "JP",
    defaultUiLanguageCode: "ja",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ja",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "ja",
    featuredLanguageCodes: ["ja", "en", "ko", "zh"],
  },
  {
    countryCode: "KR",
    defaultUiLanguageCode: "ko",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ko",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "ko",
    featuredLanguageCodes: ["ko", "en", "ja", "zh"],
  },
  {
    countryCode: "CN",
    defaultUiLanguageCode: "zh",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "zh",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "zh",
    featuredLanguageCodes: ["zh", "en", "ja", "ko"],
  },
  {
    countryCode: "TW",
    defaultUiLanguageCode: "zh",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "zh",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "zh",
    featuredLanguageCodes: ["zh", "ja", "ko", "en"],
  },
  {
    countryCode: "FR",
    defaultUiLanguageCode: "fr",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "fr",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "fr",
    featuredLanguageCodes: ["fr", "en", "es", "ar", "ja"],
  },
  {
    countryCode: "DE",
    defaultUiLanguageCode: "de",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "de",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "de",
    featuredLanguageCodes: ["de", "en", "tr", "fr", "ja"],
  },
  {
    countryCode: "ES",
    defaultUiLanguageCode: "es",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "es",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "es",
    featuredLanguageCodes: ["es", "en", "fr", "pt", "ja"],
  },
  {
    countryCode: "IT",
    defaultUiLanguageCode: "it",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "it",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "it",
    featuredLanguageCodes: ["it", "en", "fr", "es", "ja"],
  },
  {
    countryCode: "PT",
    defaultUiLanguageCode: "pt",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "pt",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "pt",
    featuredLanguageCodes: ["pt", "en", "es", "fr"],
  },
  {
    countryCode: "BR",
    defaultUiLanguageCode: "pt",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "pt",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "pt",
    featuredLanguageCodes: ["pt", "en", "es", "ja", "ko"],
  },
  {
    countryCode: "MX",
    defaultUiLanguageCode: "es",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "es",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "es",
    featuredLanguageCodes: ["es", "en", "ja", "ko"],
  },
  {
    countryCode: "TR",
    defaultUiLanguageCode: "tr",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "tr",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "tr",
    featuredLanguageCodes: ["tr", "en", "ar", "de"],
  },
  {
    countryCode: "SA",
    defaultUiLanguageCode: "ar",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ar",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "ar",
    featuredLanguageCodes: ["ar", "en", "hi", "tr", "ja"],
  },
  {
    countryCode: "AE",
    defaultUiLanguageCode: "ar",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ar",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["ar", "en", "hi", "ml", "ur"],
  },
  {
    countryCode: "ID",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "id",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "id",
    featuredLanguageCodes: ["id", "en", "ko", "ja"],
  },
  {
    countryCode: "TH",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "th",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "th",
    featuredLanguageCodes: ["th", "en", "ko", "ja", "zh"],
  },
  {
    countryCode: "VN",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "vi",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "vi",
    featuredLanguageCodes: ["vi", "en", "ko", "zh", "ja"],
  },
  {
    countryCode: "RU",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ru",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "ru",
    featuredLanguageCodes: ["ru", "en", "ja", "ko"],
  },
  {
    countryCode: "PK",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "ur",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["ur", "en", "hi", "pa", "tr"],
  },
  {
    countryCode: "BD",
    defaultUiLanguageCode: "bn",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "bn",
    secondaryAudioLanguageCode: "en",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["bn", "en", "hi"],
  },
  {
    countryCode: "SG",
    defaultUiLanguageCode: "en",
    fallbackUiLanguageCode: "en",
    defaultAudioLanguageCode: "en",
    secondaryAudioLanguageCode: "zh",
    defaultSubtitleLanguageCode: "en",
    featuredLanguageCodes: ["en", "zh", "ta", "ko", "ja"],
  },
];

export const REFERENCE_GENRES: GenreDefinition[] = [
  { slug: "action", name: "Action", tmdbGenreId: 28, localizations: { hi: "एक्शन", ja: "アクション", fr: "Action", de: "Action", es: "Acción" } },
  { slug: "adventure", name: "Adventure", tmdbGenreId: 12, localizations: { hi: "एडवेंचर", ja: "アドベンチャー", fr: "Aventure", de: "Abenteuer", es: "Aventura" } },
  { slug: "animation", name: "Animation", tmdbGenreId: 16, localizations: { hi: "एनीमेशन", ja: "アニメーション", fr: "Animation", de: "Animation", es: "Animación" } },
  { slug: "comedy", name: "Comedy", tmdbGenreId: 35, localizations: { hi: "कॉमेडी", ja: "コメディ", fr: "Comédie", de: "Komödie", es: "Comedia" } },
  { slug: "crime", name: "Crime", tmdbGenreId: 80, localizations: { hi: "क्राइम", ja: "犯罪", fr: "Crime", de: "Krimi", es: "Crimen" } },
  { slug: "documentary", name: "Documentary", tmdbGenreId: 99, localizations: { hi: "डॉक्यूमेंट्री", ja: "ドキュメンタリー", fr: "Documentaire", de: "Dokumentarfilm", es: "Documental" } },
  { slug: "drama", name: "Drama", tmdbGenreId: 18, localizations: { hi: "ड्रामा", ja: "ドラマ", fr: "Drame", de: "Drama", es: "Drama" } },
  { slug: "family", name: "Family", tmdbGenreId: 10751, localizations: { hi: "पारिवारिक", ja: "ファミリー", fr: "Familial", de: "Familie", es: "Familia" } },
  { slug: "fantasy", name: "Fantasy", tmdbGenreId: 14, localizations: { hi: "फैंटेसी", ja: "ファンタジー", fr: "Fantastique", de: "Fantasy", es: "Fantasía" } },
  { slug: "history", name: "History", tmdbGenreId: 36, localizations: { hi: "इतिहास", ja: "歴史", fr: "Histoire", de: "Historie", es: "Historia" } },
  { slug: "horror", name: "Horror", tmdbGenreId: 27, localizations: { hi: "हॉरर", ja: "ホラー", fr: "Horreur", de: "Horror", es: "Terror" } },
  { slug: "music", name: "Music", tmdbGenreId: 10402, localizations: { hi: "संगीत", ja: "音楽", fr: "Musique", de: "Musik", es: "Música" } },
  { slug: "mystery", name: "Mystery", tmdbGenreId: 9648, localizations: { hi: "रहस्य", ja: "ミステリー", fr: "Mystère", de: "Mystery", es: "Misterio" } },
  { slug: "romance", name: "Romance", tmdbGenreId: 10749, localizations: { hi: "रोमांस", ja: "ロマンス", fr: "Romance", de: "Liebesfilm", es: "Romance" } },
  { slug: "sci-fi", name: "Sci-Fi", tmdbGenreId: 878, localizations: { hi: "साइंस फिक्शन", ja: "SF", fr: "Science-Fiction", de: "Science Fiction", es: "Ciencia ficción" } },
  { slug: "thriller", name: "Thriller", tmdbGenreId: 53, localizations: { hi: "थ्रिलर", ja: "スリラー", fr: "Thriller", de: "Thriller", es: "Suspense" } },
  { slug: "war", name: "War", tmdbGenreId: 10752, localizations: { hi: "युद्ध", ja: "戦争", fr: "Guerre", de: "Kriegsfilm", es: "Bélica" } },
  { slug: "western", name: "Western", tmdbGenreId: 37, localizations: { hi: "वेस्टर्न", ja: "西部劇", fr: "Western", de: "Western", es: "Western" } },
  { slug: "biography", name: "Biography", localizations: { hi: "जीवनी", ja: "伝記", fr: "Biographie", de: "Biografie", es: "Biografía" } },
  { slug: "cyberpunk", name: "Cyberpunk", localizations: { hi: "साइबरपंक", ja: "サイバーパンク", fr: "Cyberpunk", de: "Cyberpunk", es: "Cyberpunk" } },
];

// Fast O(1) lookup maps
const LANGUAGE_BY_CODE = new Map(REFERENCE_LANGUAGES.map((l) => [l.code.toLowerCase(), l]));
const LANGUAGE_BY_NAME = new Map(REFERENCE_LANGUAGES.map((l) => [l.englishName.toLowerCase(), l]));
const COUNTRY_BY_CODE = new Map(REFERENCE_COUNTRIES.map((c) => [c.code.toUpperCase(), c]));
const REGIONAL_DEFAULT_BY_COUNTRY = new Map(
  REFERENCE_REGIONAL_DEFAULTS.map((r) => [r.countryCode.toUpperCase(), r])
);

export const GLOBAL_FALLBACK_DEFAULT: RegionalDefaultDefinition = {
  countryCode: "US",
  defaultUiLanguageCode: "en",
  fallbackUiLanguageCode: "en",
  defaultAudioLanguageCode: "en",
  secondaryAudioLanguageCode: null,
  defaultSubtitleLanguageCode: "en",
  featuredLanguageCodes: ["en", "hi", "ja", "ko", "es", "fr"],
};

export function getLanguageByCode(code?: string | null): LanguageDefinition | undefined {
  if (!code) return undefined;
  const base = code.trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_BY_CODE.get(base);
}

export function normalizeLanguageCode(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed === "all") return null;
  const byCode = getLanguageByCode(trimmed);
  if (byCode) return byCode.code;
  const byName = LANGUAGE_BY_NAME.get(trimmed);
  if (byName) return byName.code;
  return null;
}

export function isValidLanguageCode(code?: string | null): boolean {
  return Boolean(getLanguageByCode(code));
}

export function getCountryByCode(code?: string | null): CountryDefinition | undefined {
  if (!code) return undefined;
  return COUNTRY_BY_CODE.get(code.trim().toUpperCase());
}

export function isValidCountryCode(code?: string | null): boolean {
  return Boolean(getCountryByCode(code));
}

export function getRegionalDefault(countryCode?: string | null): RegionalDefaultDefinition {
  if (!countryCode) return GLOBAL_FALLBACK_DEFAULT;
  return REGIONAL_DEFAULT_BY_COUNTRY.get(countryCode.trim().toUpperCase()) || GLOBAL_FALLBACK_DEFAULT;
}
