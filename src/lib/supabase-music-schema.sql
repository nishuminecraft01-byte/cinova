-- =========================================================================
-- CINOVA OTT PLATFORM - SUPABASE MUSIC PERSISTENCE SCHEMA
-- Full Row Level Security (RLS) enabled for User Liked Songs, Custom Playlists,
-- Recently Played History, and Audio Playback Preferences.
-- =========================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER LIKED / FAVORITE SONGS TABLE
CREATE TABLE IF NOT EXISTS public.music_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- 2. USER CUSTOM PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.music_playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  songs JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER RECENTLY PLAYED HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.music_recently_played (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- 4. USER PLAYBACK PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.music_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  volume NUMERIC DEFAULT 0.85,
  repeat_mode TEXT DEFAULT 'off' CHECK (repeat_mode IN ('off', 'all', 'one')),
  is_shuffle BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_music_favorites_user_id ON public.music_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_music_playlists_user_id ON public.music_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_music_recently_played_user_id ON public.music_recently_played(user_id, played_at DESC);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.music_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_preferences ENABLE ROW LEVEL SECURITY;

-- 7. SCHEMA PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_playlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_recently_played TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_preferences TO authenticated;

-- 8. STRICT ROW LEVEL SECURITY POLICIES (Users can only access their own music data)
DROP POLICY IF EXISTS "Users manage own music favorites" ON public.music_favorites;
CREATE POLICY "Users manage own music favorites"
  ON public.music_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own music playlists" ON public.music_playlists;
CREATE POLICY "Users manage own music playlists"
  ON public.music_playlists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own recently played" ON public.music_recently_played;
CREATE POLICY "Users manage own recently played"
  ON public.music_recently_played FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own music preferences" ON public.music_preferences;
CREATE POLICY "Users manage own music preferences"
  ON public.music_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 9. AUTOMATIC DAILY MUSIC DISCOVERY CATALOGUE TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.music_discovered_catalogue (
  id TEXT PRIMARY KEY,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artist_id TEXT,
  album TEXT DEFAULT 'Single',
  cover_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  duration_text TEXT,
  genre TEXT DEFAULT 'Worldwide Discovery',
  category TEXT DEFAULT 'trending',
  language TEXT NOT NULL,
  native_title TEXT,
  aliases JSONB NOT NULL DEFAULT '[]'::JSONB,
  first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_embeddable BOOLEAN NOT NULL DEFAULT TRUE,
  region TEXT DEFAULT 'GLOBAL',
  plays BIGINT DEFAULT 0,
  view_count_text TEXT,
  trending BOOLEAN DEFAULT TRUE,
  license JSONB NOT NULL DEFAULT '{"provider":"YouTube Music Video (Official Embed)","type":"Standard YouTube License","canStream":true,"commercialUse":false,"requiresAttribution":true}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DAILY DISCOVERY BACKGROUND SYNC LOGS TABLE
CREATE TABLE IF NOT EXISTS public.music_discovery_sync_logs (
  id TEXT PRIMARY KEY,
  triggered_by TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  discovered_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  regions_scanned JSONB DEFAULT '[]'::JSONB,
  languages_scanned JSONB DEFAULT '[]'::JSONB,
  quota_used_approx INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_discovered_music_first_discovered ON public.music_discovered_catalogue(first_discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_music_language ON public.music_discovered_catalogue(language);
CREATE INDEX IF NOT EXISTS idx_discovered_music_region ON public.music_discovered_catalogue(region);
CREATE INDEX IF NOT EXISTS idx_discovered_music_active ON public.music_discovered_catalogue(is_active, is_embeddable);
CREATE INDEX IF NOT EXISTS idx_discovery_sync_logs_started ON public.music_discovery_sync_logs(started_at DESC);

-- Public read access for discovered music
ALTER TABLE public.music_discovered_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_discovery_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active discovered music" ON public.music_discovered_catalogue;
CREATE POLICY "Public can view active discovered music"
  ON public.music_discovered_catalogue FOR SELECT
  USING (is_active = TRUE AND is_embeddable = TRUE);

DROP POLICY IF EXISTS "Public can view sync logs" ON public.music_discovery_sync_logs;
CREATE POLICY "Public can view sync logs"
  ON public.music_discovery_sync_logs FOR SELECT
  USING (TRUE);

