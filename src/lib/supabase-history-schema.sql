-- =========================================================================
-- CINOVA OTT PLATFORM - USER WATCH HISTORY SCHEMA
-- Full Row Level Security (RLS) enabled for persistent viewing history
-- supporting Movies, Series, Anime, Season/Episode tracking, and Multi-Device Sync.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER WATCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.user_watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie' CHECK (content_type IN ('movie', 'series', 'anime', 'short')),
  title TEXT NOT NULL,
  poster_url TEXT,
  backdrop_url TEXT,
  season_number INT DEFAULT NULL,
  episode_number INT DEFAULT NULL,
  episode_title TEXT DEFAULT NULL,
  progress_seconds INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  progress_percentage INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_watched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UNIQUE COMPOSITE INDEX TO PREVENT DUPLICATE RECORDS
-- Treats NULL season/episode as 0 so every movie or specific episode has strictly 1 record per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_watch_history_item
  ON public.user_watch_history (
    user_id,
    content_id,
    COALESCE(season_number, 0),
    COALESCE(episode_number, 0)
  );

-- 3. HIGH PERFORMANCE QUERY INDEXES
CREATE INDEX IF NOT EXISTS idx_user_watch_history_user_last_watched
  ON public.user_watch_history (user_id, last_watched DESC);

CREATE INDEX IF NOT EXISTS idx_user_watch_history_user_type
  ON public.user_watch_history (user_id, content_type);

CREATE INDEX IF NOT EXISTS idx_user_watch_history_continue_watching
  ON public.user_watch_history (user_id, completed, last_watched DESC);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_watch_history ENABLE ROW LEVEL SECURITY;

-- 5. PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_watch_history TO authenticated;

-- 6. STRICT ROW LEVEL SECURITY POLICIES
-- Users can strictly ONLY view, insert, update, and delete their own watch history
DROP POLICY IF EXISTS "Users manage own watch history" ON public.user_watch_history;
CREATE POLICY "Users manage own watch history"
  ON public.user_watch_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view analytics on watch history
DROP POLICY IF EXISTS "Admins view all watch history" ON public.user_watch_history;
CREATE POLICY "Admins view all watch history"
  ON public.user_watch_history FOR SELECT
  TO authenticated
  USING (public.is_admin());
