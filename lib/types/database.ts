import { GameType } from './games'

export type UserRole = 'admin' | 'manager' | 'player'
export type TimezoneOffset = 'UTC+0' | 'UTC+1' | 'UTC+2' | 'UTC+3'
export type Locale = 'en' | 'fr'
// Legacy Valorant types - kept for backward compatibility
// For new code, use GameType and game-specific configs from './games'
export type ValorantRole = 'Duelist' | 'Initiator' | 'Controller' | 'Flex' | 'Sentinel' | 'Staff'
export type StaffRole = 'Coach' | 'Manager' | 'Analyst'
export type ValorantRank = 
  | 'Ascendant 1' | 'Ascendant 2' | 'Ascendant 3'
  | 'Immortal 1' | 'Immortal 2' | 'Immortal 3'
  | 'Radiant'
export type TeamCategory = '21L' | '21GC' | '21ACA' | '21CS2'
export type TryoutWeekStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type HourSlot = 0 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23
export type CommunicationSection = 'strat_map' | 'review_praccs'
export type MessageType = 'text' | 'image'
export type StratType = 'attack' | 'defense'
export type ValorantMap = 
  | 'Ascent' 
  | 'Bind' 
  | 'Haven' 
  | 'Split' 
  | 'Icebox' 
  | 'Breeze' 
  | 'Fracture' 
  | 'Pearl' 
  | 'Lotus' 
  | 'Sunset' 
  | 'Abyss' 
  | 'Corrode'

export type TryoutStatus = 
  | 'not_contacted'
  | 'contacted'
  | 'in_tryouts'
  | 'accepted'
  | 'substitute'
  | 'rejected'
  | 'left'

// Time slots structure for player availability
export type TimeSlots = {
  [day in DayOfWeek]?: {
    [hour: number]: boolean
  }
}

export interface UserProfile {
  id: string
  username: string
  role: UserRole
  full_name: string
  avatar_url?: string
  team_id?: string
  game?: GameType // NEW: Player's game (valorant or cs2)
  timezone?: TimezoneOffset // User's timezone for schedule display (default: UTC+1)
  locale?: Locale // User's preferred language (default: 'en')
  
  // Player-specific fields (only populated when role = 'player')
  in_game_name?: string
  position?: string // Changed from ValorantRole to string for multi-game support
  is_igl?: boolean
  is_substitute?: boolean
  nationality?: string // ISO country code
  champion_pool?: string[] // Legacy: Array of agent names (Valorant)
  character_pool?: string[] // NEW: Generic pool (agents for Valorant, weapons for CS2)
  rank?: string // Changed from ValorantRank to string for multi-game support
  faceit_level?: number // CS2: Faceit level (1-10)
  valorant_tracker_url?: string // Legacy: kept for backward compatibility
  tracker_url?: string // NEW: Generic tracker URL
  steam_url?: string // CS2: Steam profile URL
  faceit_url?: string // CS2: Faceit profile URL
  twitter_url?: string
  stats?: Record<string, any>
  
  // Manager-specific fields (only populated when role = 'manager')
  staff_role?: StaffRole
  
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  tag?: string
  game: GameType // Changed from string to GameType
  logo_url?: string
  created_at: string
  updated_at: string
}

// Player interface removed - player data is now in UserProfile
// Use UserProfile with role='player' instead

export interface ProfileTryout {
  id: string
  username: string
  team_category: TeamCategory
  game?: GameType // NEW: Tryout's game
  full_name?: string
  in_game_name?: string
  position?: string // Changed from ValorantRole to string for multi-game support
  is_igl?: boolean
  nationality?: string // ISO country code
  champion_pool?: string[] // Legacy: Array of agent names
  character_pool?: string[] // NEW: Generic pool
  rank?: string // Changed from ValorantRank to string for multi-game support
  faceit_level?: number // CS2: Faceit level (1-10)
  valorant_tracker_url?: string // Legacy: kept for backward compatibility
  tracker_url?: string // NEW: Generic tracker URL
  steam_url?: string // CS2: Steam profile URL
  faceit_url?: string // CS2: Faceit profile URL
  twitter_url?: string
  discord?: string
  status: TryoutStatus // Keep as 'status' to match database column name
  last_contact_date?: string
  managed_by?: string
  contacted_by?: string
  notes?: string
  links?: string
  created_at: string
  updated_at: string
}

// Tryout Week - Represents a full week of tryouts for a specific team
export interface TryoutWeek {
  id: string
  team_category: TeamCategory
  week_start: string // ISO date string (Monday)
  week_end: string // ISO date string (Sunday)
  week_label: string // e.g., "Week 1", "January Tryouts"
  status: TryoutWeekStatus
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// Player Availability - Links tryout profiles to tryout weeks with their response
export interface PlayerAvailability {
  id: string
  tryout_week_id: string
  player_id: string
  token: string // Unique token for player access
  time_slots: TimeSlots // Hourly availability per day
  submitted_at?: string
  created_at: string
  updated_at: string
  // Joined data
  player?: ProfileTryout
  tryout_week?: TryoutWeek
}

export interface Tournament {
  id: string
  name: string
  game: string
  start_date: string
  end_date?: string
  prize_pool?: number
  status: 'upcoming' | 'ongoing' | 'completed'
  created_at: string
}

export interface Match {
  id: string
  tournament_id: string
  team_id: string
  opponent: string
  scheduled_at: string
  result?: 'win' | 'loss' | 'draw'
  score?: string
  created_at: string
}

export type MatchType = 'Scrim' | 'Tournament' | 'Qualifier' | 'League' | 'Other'

export interface MatchHistory {
  id: string
  team_id: string
  opponent_name: string
  match_date: string
  map_name?: string
  our_score: number
  opponent_score: number
  result: 'win' | 'loss' | 'draw'
  match_type?: MatchType
  notes?: string
  created_at: string
  created_by?: string
}

export interface PlayerMatchStats {
  id: string
  match_id: string
  player_id: string
  kills: number
  deaths: number
  assists: number
  acs: number // Average Combat Score
  econ_rating?: number // Economy Rating
  headshot_percentage?: number
  first_kills: number
  first_deaths: number
  plants: number
  defuses: number
  agent_played?: string
  created_at: string
}

export interface MatchHistoryWithStats extends MatchHistory {
  player_stats?: PlayerMatchStats[]
  team?: { name: string }
}

export type ActivityType = 
  | 'practice'
  | 'individual_training'
  | 'group_training'
  | 'official_match'
  | 'tournament'
  | 'meeting'

export interface ScheduleActivity {
  id: string
  team_id: string
  type: ActivityType
  title: string
  description?: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  time_slot: string // e.g., "1:00 PM"
  duration: number // in hours
  activity_date?: string // Specific date (YYYY-MM-DD) - if set, activity is for this date only
  created_by: string
  created_at: string
  updated_at: string
}

// Player Weekly Availability - For tracking player availability each week
export interface PlayerWeeklyAvailability {
  id: string
  player_id: string
  team_id: string
  week_start: string // ISO date string (Monday)
  week_end: string // ISO date string (Sunday)
  time_slots: TimeSlots // Hourly availability per day
  notes?: string
  submitted_at?: string
  created_at: string
  updated_at: string
  // Joined data
  player?: UserProfile
}

// Schedule Activity Response - Player responses to scheduled activities
export interface ScheduleActivityResponse {
  id: string
  activity_id: string
  player_id: string
  status: 'available' | 'unavailable' | 'maybe'
  notes?: string
  created_at: string
  updated_at: string
  // Joined data
  player?: UserProfile
  activity?: ScheduleActivity
}

export interface TeamMessage {
  id: string
  team_id: string
  section: CommunicationSection
  message_type: MessageType
  content: string
  image_url?: string | null
  map_name?: ValorantMap | null
  match_id?: string | null
  strat_type?: StratType | null
  composition?: string | null
  author_id: string
  author_name: string
  author_role: UserRole
  created_at: string
  updated_at: string
}
