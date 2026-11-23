import { supabase } from "@/lib/supabase";
import { Song, Playlist } from "@/types/music";

export interface UserMusicPreferences {
  volume: number;
  repeatMode: "off" | "all" | "one";
  isShuffle: boolean;
}

/**
 * Fetch all persistent music data for the logged-in user from Supabase.
 */
export async function fetchUserMusicData(userId: string): Promise<{
  favorites: string[];
  playlists: Playlist[];
  recentlyPlayed: Song[];
  preferences: UserMusicPreferences | null;
}> {
  if (!userId) {
    return { favorites: [], playlists: [], recentlyPlayed: [], preferences: null };
  }

  try {
    const [favsRes, playRes, recentRes, prefRes] = await Promise.all([
      supabase
        .from("music_favorites")
        .select("song_id")
        .eq("user_id", userId),
      supabase
        .from("music_playlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("music_recently_played")
        .select("song_data")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(25),
      supabase
        .from("music_preferences")
        .select("volume, repeat_mode, is_shuffle")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const favorites = Array.isArray(favsRes.data)
      ? favsRes.data.map((r: { song_id: string }) => r.song_id)
      : [];

    const playlists: Playlist[] = Array.isArray(playRes.data)
      ? playRes.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          coverUrl: p.cover_url,
          curator: "You",
          songs: Array.isArray(p.songs) ? p.songs : [],
        }))
      : [];

    const recentlyPlayed: Song[] = Array.isArray(recentRes.data)
      ? recentRes.data
          .map((r: any) => r.song_data)
          .filter((s: any) => s && s.id)
      : [];

    const preferences: UserMusicPreferences | null = prefRes.data
      ? {
          volume: Number(prefRes.data.volume) || 0.85,
          repeatMode: prefRes.data.repeat_mode || "off",
          isShuffle: Boolean(prefRes.data.is_shuffle),
        }
      : null;

    return { favorites, playlists, recentlyPlayed, preferences };
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Failed to fetch user music data:", err);
    return { favorites: [], playlists: [], recentlyPlayed: [], preferences: null };
  }
}

/**
 * Toggle like/favorite on Supabase.
 */
export async function syncUserFavorite(
  userId: string,
  song: Song,
  isFav: boolean
): Promise<void> {
  if (!userId || !song?.id) return;
  try {
    if (isFav) {
      await supabase.from("music_favorites").upsert(
        {
          user_id: userId,
          song_id: song.id,
          song_data: song,
        },
        { onConflict: "user_id,song_id" }
      );
    } else {
      await supabase
        .from("music_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("song_id", song.id);
    }
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Error syncing favorite:", err);
  }
}

/**
 * Sync user playlist creation or update to Supabase.
 */
export async function syncUserPlaylist(userId: string, playlist: Playlist): Promise<void> {
  if (!userId || !playlist?.id) return;
  try {
    await supabase.from("music_playlists").upsert({
      id: playlist.id,
      user_id: userId,
      title: playlist.title,
      description: playlist.description || "",
      cover_url: playlist.coverUrl,
      songs: playlist.songs || [],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Error syncing playlist:", err);
  }
}

/**
 * Delete a user playlist from Supabase.
 */
export async function deleteUserPlaylist(userId: string, playlistId: string): Promise<void> {
  if (!userId || !playlistId) return;
  try {
    await supabase
      .from("music_playlists")
      .delete()
      .eq("user_id", userId)
      .eq("id", playlistId);
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Error deleting playlist:", err);
  }
}

/**
 * Record recently played track to Supabase.
 */
export async function recordRecentlyPlayedTrack(userId: string, song: Song): Promise<void> {
  if (!userId || !song?.id) return;
  try {
    await supabase.from("music_recently_played").upsert(
      {
        user_id: userId,
        song_id: song.id,
        song_data: song,
        played_at: new Date().toISOString(),
      },
      { onConflict: "user_id,song_id" }
    );
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Error recording recently played track:", err);
  }
}

/**
 * Save user playback preferences (volume, repeat, shuffle) to Supabase.
 */
export async function syncUserPreferences(
  userId: string,
  prefs: UserMusicPreferences
): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from("music_preferences").upsert({
      user_id: userId,
      volume: prefs.volume,
      repeat_mode: prefs.repeatMode,
      is_shuffle: prefs.isShuffle,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[CINOVA Music Supabase] Error syncing preferences:", err);
  }
}
