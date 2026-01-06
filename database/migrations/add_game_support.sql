-- Migration: Add Multi-Game Support (Valorant & CS2)
-- Date: 2026-01-06
-- Description: Adds game field to profiles and profiles_tryouts tables to support multiple games

-- ============================================
-- 1. ADD GAME COLUMN TO PROFILES TABLE
-- ============================================

-- Add game column with default 'valorant' for backward compatibility
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS game TEXT DEFAULT 'valorant';

-- Add check constraint for valid game values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_game_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_game_check CHECK (game IN ('valorant', 'cs2'));
    END IF;
END $$;

-- ============================================
-- 2. ADD GAME COLUMN TO PROFILES_TRYOUTS TABLE
-- ============================================

-- Add game column with default 'valorant' for backward compatibility
ALTER TABLE profiles_tryouts
ADD COLUMN IF NOT EXISTS game TEXT DEFAULT 'valorant';

-- Add check constraint for valid game values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tryouts_game_check'
    ) THEN
        ALTER TABLE profiles_tryouts 
        ADD CONSTRAINT profiles_tryouts_game_check CHECK (game IN ('valorant', 'cs2'));
    END IF;
END $$;

-- ============================================
-- 3. UPDATE EXISTING TEAMS (ensure game field is set)
-- ============================================

-- Update ALL teams that don't have a valid game value to 'valorant'
-- This includes NULL, empty strings, and any other invalid values
UPDATE teams 
SET game = 'valorant' 
WHERE game IS NULL 
   OR game = '' 
   OR game NOT IN ('valorant', 'cs2');

-- Add check constraint for teams game field if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teams_game_check'
    ) THEN
        ALTER TABLE teams 
        ADD CONSTRAINT teams_game_check CHECK (game IN ('valorant', 'cs2'));
    END IF;
END $$;

-- ============================================
-- 4. UPDATE PROFILES GAME BASED ON TEAM
-- ============================================

-- Set the game field for existing profiles based on their team's game
UPDATE profiles p
SET game = t.game
FROM teams t
WHERE p.team_id = t.id 
  AND t.game IS NOT NULL 
  AND t.game != '';

-- ============================================
-- 5. ADD GENERIC TRACKER_URL COLUMN (optional)
-- ============================================

-- Add a generic tracker_url column while keeping valorant_tracker_url for compatibility
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tracker_url TEXT;

ALTER TABLE profiles_tryouts
ADD COLUMN IF NOT EXISTS tracker_url TEXT;

-- Copy existing valorant_tracker_url to tracker_url
UPDATE profiles 
SET tracker_url = valorant_tracker_url 
WHERE tracker_url IS NULL AND valorant_tracker_url IS NOT NULL;

UPDATE profiles_tryouts 
SET tracker_url = valorant_tracker_url 
WHERE tracker_url IS NULL AND valorant_tracker_url IS NOT NULL;

-- ============================================
-- 6. ADD CHARACTER_POOL COLUMN (optional, for future use)
-- ============================================

-- Add generic character_pool column while keeping champion_pool for compatibility
-- This can be used for Valorant agents or CS2 weapons
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS character_pool TEXT[];

ALTER TABLE profiles_tryouts
ADD COLUMN IF NOT EXISTS character_pool TEXT[];

-- Copy existing champion_pool to character_pool
UPDATE profiles 
SET character_pool = champion_pool 
WHERE character_pool IS NULL AND champion_pool IS NOT NULL;

UPDATE profiles_tryouts 
SET character_pool = champion_pool 
WHERE character_pool IS NULL AND champion_pool IS NOT NULL;

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Create indexes on game columns for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_game ON profiles(game);
CREATE INDEX IF NOT EXISTS idx_profiles_tryouts_game ON profiles_tryouts(game);
CREATE INDEX IF NOT EXISTS idx_teams_game ON teams(game);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_team_game ON profiles(team_id, game);
CREATE INDEX IF NOT EXISTS idx_profiles_tryouts_team_category_game ON profiles_tryouts(team_category, game);

-- ============================================
-- 8. ADD GAME TO MATCH_HISTORY (optional)
-- ============================================

-- Add game column to match_history for game-specific statistics
ALTER TABLE match_history
ADD COLUMN IF NOT EXISTS game TEXT DEFAULT 'valorant';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'match_history_game_check'
    ) THEN
        ALTER TABLE match_history 
        ADD CONSTRAINT match_history_game_check CHECK (game IN ('valorant', 'cs2'));
    END IF;
END $$;

-- Update match_history game based on team
UPDATE match_history mh
SET game = t.game
FROM teams t
WHERE mh.team_id = t.id 
  AND t.game IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_history_game ON match_history(game);

-- ============================================
-- 9. ADD GAME TO TEAM_MESSAGES (optional)
-- ============================================

-- Add game column to team_messages for game-specific communication
ALTER TABLE team_messages
ADD COLUMN IF NOT EXISTS game TEXT DEFAULT 'valorant';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_messages_game_check'
    ) THEN
        ALTER TABLE team_messages 
        ADD CONSTRAINT team_messages_game_check CHECK (game IN ('valorant', 'cs2'));
    END IF;
END $$;

-- Update team_messages game based on team
UPDATE team_messages tm
SET game = t.game
FROM teams t
WHERE tm.team_id = t.id 
  AND t.game IS NOT NULL;

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify the migration:
-- SELECT COUNT(*), game FROM profiles GROUP BY game;
-- SELECT COUNT(*), game FROM profiles_tryouts GROUP BY game;
-- SELECT COUNT(*), game FROM teams GROUP BY game;
-- SELECT COUNT(*), game FROM match_history GROUP BY game;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- To rollback this migration, run:
--
-- ALTER TABLE profiles DROP COLUMN IF EXISTS game;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tracker_url;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS character_pool;
-- ALTER TABLE profiles_tryouts DROP COLUMN IF EXISTS game;
-- ALTER TABLE profiles_tryouts DROP COLUMN IF EXISTS tracker_url;
-- ALTER TABLE profiles_tryouts DROP COLUMN IF EXISTS character_pool;
-- ALTER TABLE match_history DROP COLUMN IF EXISTS game;
-- ALTER TABLE team_messages DROP COLUMN IF EXISTS game;
-- DROP INDEX IF EXISTS idx_profiles_game;
-- DROP INDEX IF EXISTS idx_profiles_tryouts_game;
-- DROP INDEX IF EXISTS idx_teams_game;
-- DROP INDEX IF EXISTS idx_profiles_team_game;
-- DROP INDEX IF EXISTS idx_profiles_tryouts_team_category_game;
-- DROP INDEX IF EXISTS idx_match_history_game;
