import { Song, Album, Artist, Playlist, MusicGenre } from "@/types/music";

export const MUSIC_GENRES: MusicGenre[] = [
  { id: "all", name: "All", bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80" },
  { id: "bollywood", name: "Bollywood", bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80" },
  { id: "punjabi", name: "Punjabi", bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80" },
  { id: "hindi", name: "Hindi", bannerUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80" },
  { id: "english", name: "English", bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80" },
  { id: "marathi", name: "Marathi", bannerUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80" },
  { id: "pop", name: "Pop", bannerUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80" },
  { id: "hip-hop", name: "Hip-Hop", bannerUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80" },
  { id: "rock", name: "Rock", bannerUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80" },
  { id: "edm", name: "EDM", bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80" },
  { id: "classical", name: "Classical", bannerUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=1200&q=80" },
  { id: "indie", name: "Indie", bannerUrl: "https://images.unsplash.com/photo-1445985543469-433ecdd62977?auto=format&fit=crop&w=1200&q=80" },
  { id: "devotional", name: "Devotional", bannerUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80" },
  { id: "hollywood", name: "Hollywood", bannerUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80" },
  { id: "tamil", name: "Tamil", bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80" },
  { id: "telugu", name: "Telugu", bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80" },
];

/**
 * Curated CINOVA Playlists (Matching the Reference Dashboard)
 */
export const PLAYLISTS: Playlist[] = [
  {
    id: "workout-beats",
    title: "Workout Beats",
    description: "High-energy beats to power up your workout and keep the adrenaline flowing.",
    subtitle: "High Energy & Cardio",
    curator: "CINOVA Editorial",
    coverUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    songs: [],
  },
  {
    id: "chill-hits",
    title: "Chill Hits",
    description: "Kick back and unwind with the finest selection of relaxing and laid-back tunes.",
    subtitle: "Relax & Unwind",
    curator: "CINOVA Editorial",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    songs: [],
  },
  {
    id: "party-mix",
    title: "Party Mix",
    description: "The ultimate club & party bangers to turn up the bass all night long.",
    subtitle: "EDM, Dance & Club",
    curator: "CINOVA Editorial",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    songs: [],
  },
  {
    id: "study-vibes",
    title: "Study Vibes",
    description: "Deep concentration, ambient melodies and focus sounds for work and study.",
    subtitle: "Deep Focus & Ambient",
    curator: "CINOVA Editorial",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    songs: [],
  },
];

/**
 * Production Music Catalog
 * All fake/random demo songs have been removed.
 * Real tracks are loaded dynamically from Jamendo API v3.0 and YouTube Data API.
 */
export const SONGS: Song[] = [];
export const ALBUMS: Album[] = [];
export const ARTISTS: Artist[] = [];

// Helper functions for data access
export function getSongById(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}

export function getAlbumById(id: string): Album | undefined {
  return ALBUMS.find((a) => a.id === id);
}

export function getArtistById(id: string): Artist | undefined {
  return ARTISTS.find((a) => a.id === id);
}

export function getPlaylistById(id: string): Playlist | undefined {
  return PLAYLISTS.find((p) => p.id === id);
}

export function getSongsByGenre(genreId: string): Song[] {
  if (genreId === "all") return SONGS;
  return SONGS.filter((s) => s.genre.toLowerCase().includes(genreId.toLowerCase()));
}

export function searchMusic(query: string): { songs: Song[]; albums: Album[]; artists: Artist[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { songs: [], albums: [], artists: [] };

  return {
    songs: SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q))
    ),
    albums: ALBUMS.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
    artists: ARTISTS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.genres.some((g) => g.toLowerCase().includes(q))
    ),
  };
}
