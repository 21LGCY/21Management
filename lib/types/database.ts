export type UserRole = 'admin' | 'manager' | 'player'
export type ValorantRole = 'Duelist' | 'Initiator' | 'Controller' | 'Flex' | 'Sentinel'
export type StaffRole = 'Coach' | 'Manager' | 'Analyst'
export type ValorantRank = 
  | 'Ascendant 1' | 'Ascendant 2' | 'Ascendant 3'
  | 'Immortal 1' | 'Immortal 2' | 'Immortal 3'
  | 'Radiant'
export type TryoutStatus = 
  | 'Not Contacted'
  | 'Contacted/Pending'
  | 'In Tryouts'
  | 'Player'
  | 'Substitute'
  | 'Rejected'
  | 'Left'

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
  full_name?: string
  in_game_name?: string
  position?: ValorantRole
  is_igl?: boolean
  nationality?: string // ISO country code
  champion_pool?: string[] // Array of agent names
  rank?: ValorantRank
  valorant_tracker_url?: string
  twitter_url?: string
  contact_status: TryoutStatus
  last_contact_date?: string
  managed_by?: string
  contacted_by?: string
  notes?: string
  links?: string
  created_at: string
  updated_at: string
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
