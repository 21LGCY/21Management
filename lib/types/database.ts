export type UserRole = 'admin' | 'manager' | 'player'
export type ValorantRole = 'Duelist' | 'Initiator' | 'Controller' | 'Flex' | 'Sentinel'
export type StaffRole = 'Coach' | 'Manager' | 'Analyst'
export type ValorantRank = 
  | 'Ascendant 1' | 'Ascendant 2' | 'Ascendant 3'
  | 'Immortal 1' | 'Immortal 2' | 'Immortal 3'
  | 'Radiant'
export type TeamCategory = '21L' | '21GC' | '21ACA'
export type TryoutWeekStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type HourSlot = 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23

export type TryoutStatus = 
  | 'not_contacted'
  | 'contacted'
  | 'in_tryouts'
  | 'accepted'
  | 'substitute'
  | 'rejected'
  | 'left'
  | 'player'

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
  
  // Player-specific fields (only populated when role = 'player')
  in_game_name?: string
  position?: ValorantRole
  is_igl?: boolean
  is_substitute?: boolean
  nationality?: string // ISO country code
  champion_pool?: string[] // Array of agent names
  rank?: ValorantRank
  valorant_tracker_url?: string
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
  game: string
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
  full_name?: string
  in_game_name?: string
  position?: ValorantRole
  is_igl?: boolean
  nationality?: string // ISO country code
  champion_pool?: string[] // Array of agent names
  rank?: ValorantRank
  valorant_tracker_url?: string
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
  created_by: string
  created_at: string
  updated_at: string
}
