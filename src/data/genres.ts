export const GENRES = [
  "All",
  "Action",
  "Sci-Fi",
  "Thriller",
  "Drama",
  "Adventure",
  "Cyberpunk",
  "Fantasy",
  "Mystery",
  "Animation",
  "Documentary",
  "Horror",
  "Romance",
] as const;

export const LANGUAGES = [
  "All",
  "English",
  "Spanish",
  "French",
  "Japanese",
  "Korean",
  "Hindi",
  "German",
] as const;

export const CONTENT_TYPES = [
  { label: "All Formats", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "TV Series", value: "series" },
  { label: "Anime", value: "anime" },
  { label: "Short Films", value: "short" },
] as const;

export const COUNTRIES = [
  "All",
  "United States",
  "India",
  "Japan",
  "South Korea",
  "United Kingdom",
  "France",
  "Germany",
] as const;

export const RATING_OPTIONS = [
  { label: "All Ratings", value: "all" },
  { label: "★ 8.5+ Masterpiece", value: "8.5" },
  { label: "★ 8.0+ Highly Rated", value: "8.0" },
  { label: "★ 7.0+ Recommended", value: "7.0" },
] as const;

export const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest Releases", value: "newest" },
  { label: "Highest Rated (IMDb)", value: "rating" },
  { label: "Alphabetical (A-Z)", value: "title" },
] as const;

export const CATEGORIES_SHOWCASE = [
  {
    id: "hollywood",
    name: "Hollywood Blockbusters",
    tagline: "Worldwide box-office champions, superhero epics, and Nolan spectacles",
    image: "https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    count: 45,
  },
  {
    id: "bollywood",
    name: "Bollywood & Indian Cinema",
    tagline: "High-octane mass action, emotional pan-India dramas, and unforgettable music",
    image: "https://image.tmdb.org/t/p/w780/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg",
    count: 36,
  },
  {
    id: "anime",
    name: "Anime & Manga Adaptations",
    tagline: "Supernatural battles, dark fantasy sagas, and stunning Japanese animation",
    image: "https://image.tmdb.org/t/p/w780/qjGrUmKW78MCFG8PTLDBp67S27p.jpg",
    count: 28,
  },
  {
    id: "series",
    name: "Prestige Global Web Series",
    tagline: "Award-winning binge-worthy serial narratives and dark crime syndicates",
    image: "https://image.tmdb.org/t/p/w780/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    count: 32,
  },
  {
    id: "sci-fi",
    name: "Sci-Fi & Future Worlds",
    tagline: "Explore breathtaking cosmic odysseys and cyberpunk frontiers",
    image: "https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    count: 24,
  },
  {
    id: "action",
    name: "High-Octane Action",
    tagline: "Heart-pounding chases, martial arts, and epic battlefields",
    image: "https://image.tmdb.org/t/p/w780/cKvDv2LpwVEqbdXWoQl4XgGN6le.jpg",
    count: 38,
  },
  {
    id: "thriller",
    name: "Psychological Thrillers",
    tagline: "Mind-bending twists and tense edge-of-seat mysteries",
    image: "https://image.tmdb.org/t/p/w780/2meX1nMdScFOoV4370rqHWKmXhY.jpg",
    count: 19,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk & Neon Noir",
    tagline: "Dystopian cityscapes, synthetic minds, and retro-futurism",
    image: "https://image.tmdb.org/t/p/w780/seAIZLEq2Il2psjMUREDbSdRmbu.jpg",
    count: 15,
  },
  {
    id: "animation",
    name: "Animation & CG Masterpieces",
    tagline: "Visually stunning animated epics for story lovers",
    image: "https://image.tmdb.org/t/p/w780/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg",
    count: 22,
  },
  {
    id: "drama",
    name: "Cinematic Dramas",
    tagline: "Deep emotional journeys and character-driven masterpieces",
    image: "https://image.tmdb.org/t/p/w780/6RV2o8PBCEyw9ylOWViV1CtULIF.jpg",
    count: 31,
  },
];
