// FACEIT API Types for 21Management

// ===== FACEIT PLAYER TYPES =====
export interface FaceitPlayer {
  player_id: string
  nickname: string
  avatar: string
  country: string
  cover_image?: string
  faceit_url: string
  membership_type: string
  memberships: string[]
  games: Record<string, FaceitGameDetails>
  settings?: {
    language: string
  }
  friends_ids?: string[]
  new_steam_id?: string
  steam_id_64?: string
  steam_nickname?: string
  verified: boolean
}

export interface FaceitGameDetails {
  region: string
  game_player_id: string
  skill_level: number
  faceit_elo: number
  game_player_name: string
  skill_level_label?: string
  regions?: Record<string, unknown>
  game_profile_id?: string
}

// ===== FACEIT STATS TYPES =====
export interface FaceitPlayerStats {
  player_id: string
  game_id: string
  lifetime: FaceitLifetimeStats
  segments?: FaceitSegmentStats[]
}

export interface FaceitLifetimeStats {
  // CS2 specific stats
  'Average K/D Ratio'?: string
  'Average Headshots %'?: string
  'Win Rate %'?: string
  'Wins'?: string
  'Matches'?: string
  'Total Headshots %'?: string
  'K/D Ratio'?: string
  'Longest Win Streak'?: string
  'Current Win Streak'?: string
  // Allow additional stats
  [key: string]: string | undefined
}

export interface FaceitSegmentStats {
  type: string
  mode: string
  label: string
  img_small: string
  img_regular: string
  stats: Record<string, string>
}

// ===== FACEIT MATCH HISTORY =====
export interface FaceitMatchHistory {
  items: FaceitMatch[]
  start: number
  end: number
  from: number
  to: number
}

export interface FaceitMatch {
  match_id: string
  game_id: string
  region: string
  match_type: string
  game_mode: string
  max_players: number
  teams_size: number
  teams: Record<string, FaceitMatchTeam>
  playing_players: string[]
  competition_id: string
  competition_name: string
  competition_type: string
  organizer_id: string
  status: string
  started_at: number
  finished_at: number
  results: {
    winner: string
    score: Record<string, number>
  }
  faceit_url: string
}

export interface FaceitMatchTeam {
  team_id: string
  nickname: string
  avatar: string
  type: string
  players: FaceitMatchPlayer[]
}

export interface FaceitMatchPlayer {
  player_id: string
  nickname: string
  avatar: string
  skill_level: number
  game_player_id: string
  game_player_name: string
  faceit_url: string
}

// ===== FACEIT MATCH STATS =====
export interface FaceitMatchStats {
  rounds: FaceitRoundStats[]
}

export interface FaceitRoundStats {
  best_of: string
  competition_id: string
  game_id: string
  game_mode: string
  match_id: string
  match_round: string
  played: string
  round_stats: Record<string, string>
  teams: FaceitTeamStats[]
}

export interface FaceitTeamStats {
  team_id: string
  premade: boolean
  team_stats: Record<string, string>
  players: FaceitPlayerMatchStats[]
}

export interface FaceitPlayerMatchStats {
  player_id: string
  nickname: string
  player_stats: Record<string, string>
}

// ===== API RESPONSE TYPES =====
export interface FaceitApiError {
  errors: Array<{
    message: string
    code: string
    http_status: number
  }>
}

// ===== FORMATTED STATS FOR DISPLAY =====
export interface FormattedFaceitStats {
  playerId: string
  nickname: string
  avatar: string
  country: string
  faceitUrl: string
  level: number
  elo: number
  region: string
  verified: boolean
  membershipType: string
  // Lifetime stats
  matches: number
  wins: number
  winRate: number
  kdRatio: number
  avgKdRatio: number
  headshotPercentage: number
  totalKills: number
  totalDeaths: number
  longestWinStreak: number
  currentStreak: number
  segments?: FaceitSegmentStats[]
  // Timestamps
  linkedAt?: string
  lastSync?: string
}

// ===== DATABASE FACEIT FIELDS =====
export interface FaceitProfileFields {
  faceit_player_id: string | null
  faceit_nickname: string | null
  faceit_elo: number | null
  faceit_level: number | null
  faceit_avatar: string | null
  faceit_country: string | null
  faceit_region: string | null
  faceit_stats: FormattedFaceitStats | null
  faceit_linked_at: string | null
  faceit_last_sync: string | null
}

// ===== LINK REQUEST/RESPONSE =====
export interface LinkFaceitRequest {
  nickname: string
}

export interface LinkFaceitResponse {
  success: boolean
  message: string
  player?: FaceitPlayer
  stats?: FormattedFaceitStats
}

export interface UnlinkFaceitResponse {
  success: boolean
  message: string
}

export interface SyncFaceitResponse {
  success: boolean
  message: string
  stats?: FormattedFaceitStats
  lastSync?: string
}
