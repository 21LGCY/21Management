// FACEIT API Client for 21Management
import {
  FaceitPlayer,
  FaceitPlayerStats,
  FaceitMatchHistory,
  FaceitMatchStats,
  FormattedFaceitStats,
  FaceitApiError
} from '@/lib/types/faceit'

const FACEIT_API_KEY = process.env.FACEIT_API_KEY
const FACEIT_API_BASE_URL = process.env.FACEIT_API_BASE_URL || 'https://open.faceit.com/data/v4'

// Game ID for CS2 on FACEIT
export const CS2_GAME_ID = 'cs2'

class FaceitApiClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    if (!FACEIT_API_KEY) {
      throw new Error('FACEIT_API_KEY is not configured')
    }
    this.apiKey = FACEIT_API_KEY
    this.baseUrl = FACEIT_API_BASE_URL
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as FaceitApiError | null
      const errorMessage = errorData?.errors?.[0]?.message || `FACEIT API Error: ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Search for a player by nickname
   */
  async searchPlayerByNickname(nickname: string): Promise<FaceitPlayer> {
    return this.fetch<FaceitPlayer>(`/players?nickname=${encodeURIComponent(nickname)}`)
  }

  /**
   * Get player details by FACEIT player ID
   */
  async getPlayerById(playerId: string): Promise<FaceitPlayer> {
    return this.fetch<FaceitPlayer>(`/players/${playerId}`)
  }

  /**
   * Get player's lifetime stats for a specific game
   */
  async getPlayerStats(playerId: string, gameId: string = CS2_GAME_ID): Promise<FaceitPlayerStats> {
    return this.fetch<FaceitPlayerStats>(`/players/${playerId}/stats/${gameId}`)
  }

  /**
   * Get player's match history
   */
  async getPlayerMatchHistory(
    playerId: string,
    gameId: string = CS2_GAME_ID,
    options: { offset?: number; limit?: number; from?: number; to?: number } = {}
  ): Promise<FaceitMatchHistory> {
    const params = new URLSearchParams()
    params.append('game', gameId)
    if (options.offset !== undefined) params.append('offset', options.offset.toString())
    if (options.limit !== undefined) params.append('limit', options.limit.toString())
    if (options.from !== undefined) params.append('from', options.from.toString())
    if (options.to !== undefined) params.append('to', options.to.toString())

    return this.fetch<FaceitMatchHistory>(`/players/${playerId}/history?${params.toString()}`)
  }

  /**
   * Get stats for a specific match
   */
  async getMatchStats(matchId: string): Promise<FaceitMatchStats> {
    return this.fetch<FaceitMatchStats>(`/matches/${matchId}/stats`)
  }

  /**
   * Format raw FACEIT data into display-friendly format
   */
  formatPlayerStats(player: FaceitPlayer, stats?: FaceitPlayerStats): FormattedFaceitStats {
    const cs2Game = player.games?.[CS2_GAME_ID]
    const lifetime = stats?.lifetime || {}

    return {
      playerId: player.player_id,
      nickname: player.nickname,
      avatar: player.avatar,
      country: player.country,
      faceitUrl: player.faceit_url,
      level: cs2Game?.skill_level || 0,
      elo: cs2Game?.faceit_elo || 0,
      region: cs2Game?.region || '',
      verified: player.verified,
      membershipType: player.membership_type || 'free',
      // Lifetime stats
      matches: parseInt(lifetime['Matches'] || '0', 10),
      wins: parseInt(lifetime['Wins'] || '0', 10),
      winRate: parseFloat(lifetime['Win Rate %'] || '0'),
      kdRatio: parseFloat(lifetime['K/D Ratio'] || '0'),
      avgKdRatio: parseFloat(lifetime['Average K/D Ratio'] || '0'),
      headshotPercentage: parseFloat(lifetime['Average Headshots %'] || lifetime['Total Headshots %'] || '0'),
      totalKills: parseInt(lifetime['Total Kills'] || lifetime['Kills'] || '0', 10),
      totalDeaths: parseInt(lifetime['Total Deaths'] || lifetime['Deaths'] || '0', 10),
      longestWinStreak: parseInt(lifetime['Longest Win Streak'] || '0', 10),
      currentStreak: parseInt(lifetime['Current Win Streak'] || '0', 10),
      segments: stats?.segments || [],
    }
  }

  /**
   * Get complete player data with stats
   */
  async getCompletePlayerData(nickname: string): Promise<FormattedFaceitStats> {
    // First, search for the player
    const player = await this.searchPlayerByNickname(nickname)
    
    // Check if player has CS2 game
    if (!player.games?.[CS2_GAME_ID]) {
      throw new Error('Player does not have CS2 on their FACEIT account')
    }

    // Get player stats
    let stats: FaceitPlayerStats | undefined
    try {
      stats = await this.getPlayerStats(player.player_id)
    } catch (error) {
      // Stats might not be available, continue without them
      console.warn('Could not fetch player stats:', error)
    }

    return this.formatPlayerStats(player, stats)
  }

  /**
   * Sync existing player data
   */
  async syncPlayerData(faceitPlayerId: string): Promise<FormattedFaceitStats> {
    // Get player details
    const player = await this.getPlayerById(faceitPlayerId)
    
    // Get player stats
    let stats: FaceitPlayerStats | undefined
    try {
      stats = await this.getPlayerStats(faceitPlayerId)
    } catch (error) {
      console.warn('Could not fetch player stats:', error)
    }

    return this.formatPlayerStats(player, stats)
  }
}

// Export singleton instance
export const faceitClient = new FaceitApiClient()

// Export class for testing
export { FaceitApiClient }
