-- =========================================================================
-- CINOVA AUTH FIX: Grant Table Permissions to Authenticated Users
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cokkdjkdudeedknjwmzh/sql
-- =========================================================================

-- 1. Ensure public schema usage is granted
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant table-level SELECT, INSERT, UPDATE on profiles to authenticated users
-- NOTE: Row Level Security (RLS) remains 100% active and enforced.
-- Authenticated users can still strictly only view their own profile (auth.uid() = id).
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 3. Grant table-level SELECT on movies & video sources
GRANT SELECT ON public.movies TO anon, authenticated;
GRANT SELECT ON public.video_sources TO anon, authenticated;
GRANT SELECT ON public.video_tracks TO anon, authenticated;

-- 4. Create Security-Definer RPC function for instant fallback
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'id', id,
    'email', email,
    'name', name,
    'role', role,
    'avatar', avatar,
    'tier', tier,
    'plan_expiry', plan_expiry
  )
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 5. Grant execute on is_admin() function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
  END IF;
END $$;

-- 6. Verification query: Confirm role is admin
SELECT id, email, role, tier FROM public.profiles WHERE email = 'nishantsaraf04@gmail.com';
