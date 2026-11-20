-- =========================================================================
-- CINOVA OTT PLATFORM - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase Project SQL Editor
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  tier TEXT DEFAULT 'Free' CHECK (tier IN ('Free', 'Standard', 'Ultra')),
  plan_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MOVIES & SERIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  tagline TEXT,
  description TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  trailer_url TEXT,
  duration INT NOT NULL, -- minutes
  release_year INT NOT NULL,
  rating TEXT NOT NULL,
  imdb_score NUMERIC(3, 1) DEFAULT 8.0,
  match_percentage INT DEFAULT 95,
  genre TEXT[] NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series', 'short')),
  language TEXT NOT NULL,
  available_languages TEXT[] DEFAULT ARRAY['English'],
  subtitles TEXT[] DEFAULT ARRAY['English [CC]'],
  quality TEXT DEFAULT '4K UHD',
  audio_specs TEXT DEFAULT 'Dolby Atmos 5.1',
  directors TEXT[] DEFAULT ARRAY[]::TEXT[],
  cast_members JSONB DEFAULT '[]'::JSONB,
  is_trending BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_recently_added BOOLEAN DEFAULT TRUE,
  views BIGINT DEFAULT 0,
  seasons JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- 4. CONTINUE WATCHING / WATCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.watch_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  progress_seconds INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- 5. CREATOR SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.creator_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT[] NOT NULL,
  type TEXT NOT NULL,
  language TEXT NOT NULL,
  duration INT NOT NULL,
  release_year INT NOT NULL,
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT,
  rights_statement TEXT NOT NULL,
  license_type TEXT NOT NULL,
  has_distribution_rights BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VIDEO SOURCES TABLE (Centralized HLS, DASH, MP4 & CDN Stream Registry)
CREATE TABLE IF NOT EXISTS public.video_sources (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL,
  title TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('hls', 'dash', 'mp4', 'webm')),
  provider TEXT NOT NULL CHECK (provider IN ('cinova', 'cloudflare', 'bunny', 'mux', 'direct_cdn', 'custom')),
  stream_url TEXT NOT NULL,
  quality TEXT DEFAULT '1080p FHD',
  badge TEXT DEFAULT 'HD',
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Source Missing', 'Processing', 'Temporarily Unavailable')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VIDEO TRACKS TABLE (Subtitles & Alternate Audio Tracks)
CREATE TABLE IF NOT EXISTS public.video_tracks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES public.video_sources(id) ON DELETE CASCADE,
  track_type TEXT NOT NULL CHECK (track_type IN ('subtitle', 'audio')),
  language_code TEXT NOT NULL,
  label TEXT NOT NULL,
  track_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_sources_movie_id ON public.video_sources(movie_id);
CREATE INDEX IF NOT EXISTS idx_video_tracks_source_id ON public.video_tracks(source_id);

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tracks ENABLE ROW LEVEL SECURITY;

-- 7. SECURITY DEFINER HELPER & AUTH PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Automatically create a least-privileged Free viewer profile on new Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'member'), '@', 1)),
    'user',
    'Free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. SCHEMA PERMISSIONS & GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.movies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_progress TO authenticated;
GRANT SELECT, INSERT ON public.creator_submissions TO authenticated;
GRANT SELECT ON public.video_sources TO anon, authenticated;
GRANT ALL ON public.video_sources TO authenticated;
GRANT SELECT ON public.video_tracks TO anon, authenticated;
GRANT ALL ON public.video_tracks TO authenticated;

-- 9. RLS POLICIES
-- Profiles: Strictly private. Users can only view/edit their own profile and CANNOT escalate role or tier.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'user' AND tier = 'Free');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (
    (auth.uid() = id OR lower(email) = lower(auth.jwt() ->> 'email'))
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = profiles.id)
    AND tier = (SELECT p.tier FROM public.profiles p WHERE p.id = profiles.id)
    AND plan_expiry IS NOT DISTINCT FROM (SELECT p.plan_expiry FROM public.profiles p WHERE p.id = profiles.id)
  );

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Movies: Anyone can read, only Admins can insert/update/delete
DROP POLICY IF EXISTS "Movies viewable by all" ON public.movies;
DROP POLICY IF EXISTS "Admins can manage movies" ON public.movies;
CREATE POLICY "Movies viewable by all" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (public.is_admin());

-- Watchlist: Users can view & manage only their own
DROP POLICY IF EXISTS "Users manage own watchlist" ON public.watchlist;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- Watch Progress: Users manage own watch progress; Admins can read for analytics
DROP POLICY IF EXISTS "Users manage own watch progress" ON public.watch_progress;
DROP POLICY IF EXISTS "Admins view watch progress" ON public.watch_progress;
CREATE POLICY "Users manage own watch progress" ON public.watch_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view watch progress" ON public.watch_progress FOR SELECT USING (public.is_admin());

-- Submissions: Creators see own, Admins see all
DROP POLICY IF EXISTS "Creators view own submissions" ON public.creator_submissions;
DROP POLICY IF EXISTS "Creators insert submissions" ON public.creator_submissions;
DROP POLICY IF EXISTS "Admins update submissions" ON public.creator_submissions;
CREATE POLICY "Creators view own submissions" ON public.creator_submissions FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin()
);
CREATE POLICY "Creators insert submissions" ON public.creator_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update submissions" ON public.creator_submissions FOR UPDATE USING (public.is_admin());

-- Video Sources: Anyone can view streams, only Admins can manage
DROP POLICY IF EXISTS "Video sources viewable by all" ON public.video_sources;
DROP POLICY IF EXISTS "Admins can manage video sources" ON public.video_sources;
CREATE POLICY "Video sources viewable by all" ON public.video_sources FOR SELECT USING (true);
CREATE POLICY "Admins can manage video sources" ON public.video_sources FOR ALL USING (public.is_admin());

-- Video Tracks: Anyone can view tracks, only Admins can manage
DROP POLICY IF EXISTS "Video tracks viewable by all" ON public.video_tracks;
DROP POLICY IF EXISTS "Admins can manage video tracks" ON public.video_tracks;
CREATE POLICY "Video tracks viewable by all" ON public.video_tracks FOR SELECT USING (true);
CREATE POLICY "Admins can manage video tracks" ON public.video_tracks FOR ALL USING (public.is_admin());

-- =========================================================================
-- USEFUL QUERIES FOR OWNER / ADMINISTRATOR VERIFICATION:
-- =========================================================================
-- 1. Check if auth.users.id matches public.profiles.id for your email:
-- SELECT
--   u.id AS auth_user_id,
--   p.id AS profile_id,
--   u.email AS auth_email,
--   p.email AS profile_email,
--   p.role,
--   p.tier
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON lower(u.email) = lower(p.email)
-- WHERE lower(u.email) = 'nishantsaraf04@gmail.com';
--
-- 2. Promote account to admin safely:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE lower(email) = 'nishantsaraf04@gmail.com';
--
-- 3. In case profiles.id does not match auth.users.id:
-- UPDATE public.profiles p
-- SET id = u.id
-- FROM auth.users u
-- WHERE lower(p.email) = lower(u.email)
--   AND lower(u.email) = 'nishantsaraf04@gmail.com'
--   AND p.id <> u.id;
-- =========================================================================
