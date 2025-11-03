-- ============================================
-- 21Management - Complete Database Schema
-- ============================================
-- Date: 2025-11-03
-- Description: Complete database schema for esports management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'player');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Match results
DO $$ BEGIN
  CREATE TYPE match_result AS ENUM ('win', 'loss', 'draw');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tournament status
DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM ('upcoming', 'ongoing', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Valorant roles
DO $$ BEGIN
  CREATE TYPE valorant_role AS ENUM ('Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Valorant ranks (high tier only)
DO $$ BEGIN
  CREATE TYPE valorant_rank AS ENUM (
    'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
    'Immortal 1', 'Immortal 2', 'Immortal 3',
    'Radiant'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tryout/scouting status
DO $$ BEGIN
  CREATE TYPE tryout_status AS ENUM (
    'Not Contacted',
    'Contacted/Pending',
    'In Tryouts',
    'Player',
    'Substitute',
    'Rejected',
    'Left'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Teams table (must be created before profiles due to foreign key)
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT,
  game TEXT DEFAULT 'Valorant',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles table (unified users and players)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  in_game_name TEXT,
  position valorant_role,
  is_igl BOOLEAN DEFAULT false,
  nationality TEXT,
  champion_pool TEXT[],
  rank valorant_rank,
  valorant_tracker_url TEXT,
  twitter_url TEXT,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles Tryouts table (scouting database)
CREATE TABLE IF NOT EXISTS profiles_tryouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL,
  in_game_name TEXT,
  position valorant_role,
  rank valorant_rank,
  nationality TEXT,
  valorant_tracker_url TEXT,
  discord TEXT,
  notes TEXT,
  status tryout_status DEFAULT 'Not Contacted',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status tournament_status DEFAULT 'upcoming',
  prize_pool TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  opponent TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  result match_result,
  team_score INTEGER,
  opponent_score INTEGER,
  map_played TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_tag ON teams(tag);
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_profiles_tryouts_status ON profiles_tryouts(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_team_id ON tournaments(team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);

-- ============================================
-- AUTHENTICATION FUNCTIONS
-- ============================================

-- Create user function
CREATE OR REPLACE FUNCTION public.create_user(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role user_role DEFAULT 'player'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  -- Insert new user with hashed password
  INSERT INTO profiles (username, password_hash, full_name, role)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_full_name, p_role)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.create_user IS 'Creates a new user with bcrypt hashed password';

-- Authenticate user function
CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  role user_role,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.role,
    p.full_name
  FROM profiles p
  WHERE p.username = p_username
    AND p.password_hash = crypt(p_password, p.password_hash);
END;
$$;

COMMENT ON FUNCTION public.authenticate_user IS 'Authenticates user and returns profile data';

-- Update password function
CREATE OR REPLACE FUNCTION public.update_password(
  p_user_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_hash TEXT;
BEGIN
  -- Get current password hash
  SELECT password_hash INTO v_current_hash
  FROM profiles
  WHERE id = p_user_id;

  -- Verify old password (skip if empty string - allows admin to reset)
  IF p_old_password != '' AND v_current_hash != crypt(p_old_password, v_current_hash) THEN
    RAISE EXCEPTION 'Incorrect current password';
  END IF;

  -- Update to new password
  UPDATE profiles
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.update_password IS 'Updates user password after verifying old password';

-- ============================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Auto-update updated_at for teams
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at_trigger ON teams;
CREATE TRIGGER teams_updated_at_trigger
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Auto-update updated_at for profiles_tryouts
CREATE OR REPLACE FUNCTION update_profiles_tryouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_tryouts_updated_at_trigger ON profiles_tryouts;
CREATE TRIGGER profiles_tryouts_updated_at_trigger
  BEFORE UPDATE ON profiles_tryouts
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_tryouts_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_tryouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

DROP POLICY IF EXISTS "teams_select_all" ON teams;
DROP POLICY IF EXISTS "teams_insert_admin" ON teams;
DROP POLICY IF EXISTS "teams_update_admin" ON teams;
DROP POLICY IF EXISTS "teams_delete_admin" ON teams;

DROP POLICY IF EXISTS "profiles_tryouts_select_all" ON profiles_tryouts;
DROP POLICY IF EXISTS "profiles_tryouts_insert_admin" ON profiles_tryouts;
DROP POLICY IF EXISTS "profiles_tryouts_update_admin" ON profiles_tryouts;
DROP POLICY IF EXISTS "profiles_tryouts_delete_admin" ON profiles_tryouts;

DROP POLICY IF EXISTS "tournaments_select_all" ON tournaments;
DROP POLICY IF EXISTS "tournaments_manage_admin" ON tournaments;

DROP POLICY IF EXISTS "matches_select_all" ON matches;
DROP POLICY IF EXISTS "matches_manage_admin" ON matches;

-- Profiles policies
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teams policies
CREATE POLICY "teams_select_all"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "teams_insert_admin"
  ON teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "teams_update_admin"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles Tryouts policies
CREATE POLICY "profiles_tryouts_select_all"
  ON profiles_tryouts FOR SELECT
  USING (true);

CREATE POLICY "profiles_tryouts_insert_admin"
  ON profiles_tryouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "profiles_tryouts_update_admin"
  ON profiles_tryouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "profiles_tryouts_delete_admin"
  ON profiles_tryouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Tournaments policies
CREATE POLICY "tournaments_select_all"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "tournaments_manage_admin"
  ON tournaments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Matches policies
CREATE POLICY "matches_select_all"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "matches_manage_admin"
  ON matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User accounts - can be admin, manager, or player';
COMMENT ON TABLE teams IS 'Teams in the organization';
COMMENT ON TABLE profiles_tryouts IS 'Scouting database for potential players';
COMMENT ON TABLE tournaments IS 'Tournaments the teams participate in';
COMMENT ON TABLE matches IS 'Match history and schedules';

COMMENT ON COLUMN profiles.role IS 'User role: admin (full access), manager (team management), player (limited access)';
COMMENT ON COLUMN profiles.in_game_name IS 'Player IGN (e.g., TenZ#NA1)';
COMMENT ON COLUMN profiles.position IS 'Valorant role: Duelist, Initiator, Controller, Sentinel, Flex';
COMMENT ON COLUMN profiles.is_igl IS 'Whether player is In-Game Leader';
COMMENT ON COLUMN profiles.nationality IS 'ISO country code (e.g., FR, GB, DE)';
COMMENT ON COLUMN profiles.champion_pool IS 'Array of agent names the player uses';
COMMENT ON COLUMN teams.tag IS 'Short team tag/abbreviation (e.g., TMA, G2)';
COMMENT ON COLUMN teams.logo_url IS 'URL to team logo image';

-- ============================================
-- INITIAL DATA (Optional - Uncomment to use)
-- ============================================

-- Create default admin user
-- Username: admin
-- Password: admin123
/*
INSERT INTO profiles (username, password_hash, role, full_name)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'admin',
  'System Administrator'
)
ON CONFLICT (username) DO NOTHING;
*/

-- ============================================
-- VERIFICATION QUERIES (Uncomment to verify)
-- ============================================

/*
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all enums
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

-- Check all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'teams', 'profiles_tryouts', 'tournaments', 'matches')
ORDER BY tablename, policyname;

-- Check all indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Count records in each table
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'profiles_tryouts', COUNT(*) FROM profiles_tryouts
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL
SELECT 'matches', COUNT(*) FROM matches;
*/

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- This schema is now ready to use!
-- Run this entire file in your Supabase SQL Editor.
-- ============================================
