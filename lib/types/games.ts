// Multi-Game Configuration for 21Management
// Supports Valorant and CS2

// ===== GAME TYPES =====
export type GameType = 'valorant' | 'cs2'

// ===== VALORANT TYPES =====
export type ValorantRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel' | 'Flex'

export type ValorantRank = 
  | 'Ascendant 1' | 'Ascendant 2' | 'Ascendant 3'
  | 'Immortal 1' | 'Immortal 2' | 'Immortal 3'
  | 'Radiant'

export type ValorantMap = 
  | 'Ascent' | 'Bind' | 'Haven' | 'Split' | 'Icebox' 
  | 'Breeze' | 'Fracture' | 'Pearl' | 'Lotus' 
  | 'Sunset' | 'Abyss' | 'Corrode'

export const VALORANT_AGENTS = [
  // Duelists
  'Jett', 'Phoenix', 'Reyna', 'Raze', 'Yoru', 'Neon', 'Iso', 'Waylay',
  // Initiators
  'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko',
  // Controllers
  'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove',
  // Sentinels
  'Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse',
] as const

export const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex']

export const VALORANT_RANKS: ValorantRank[] = [
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant'
]

export const VALORANT_MAPS: ValorantMap[] = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Icebox',
  'Breeze', 'Fracture', 'Pearl', 'Lotus',
  'Sunset', 'Abyss', 'Corrode'
]

// ===== CS2 TYPES =====
export type CS2Role = 'Entry Fragger' | 'Second Entry' | 'AWPer' | 'Support' | 'Lurker' | 'IGL'

export type CS2Rank = 
  | 'Legendary Eagle Master'
  | 'Supreme Master First Class' 
  | 'Global Elite'

export type FaceitLevel = 8 | 9 | 10

export type CS2Map = 
  | 'Dust2' | 'Mirage' | 'Inferno' | 'Nuke' | 'Overpass' 
  | 'Vertigo' | 'Ancient' | 'Anubis'

export const CS2_FACEIT_LEVELS: FaceitLevel[] = [8, 9, 10]

// Main weapons/loadouts for CS2 player preferences
export const CS2_WEAPONS = [
  // Rifles
  'AK-47', 'M4A4', 'M4A1-S', 'AUG', 'SG 553', 'Galil AR', 'FAMAS',
  // Snipers
  'AWP', 'SSG 08',
  // SMGs
  'MAC-10', 'MP9', 'MP7', 'UMP-45', 'P90', 'PP-Bizon',
  // Pistols
  'Desert Eagle', 'USP-S', 'P2000', 'Glock-18', 'P250', 'Five-SeveN', 'Tec-9', 'CZ75-Auto',
  // Heavy
  'Nova', 'XM1014', 'MAG-7', 'Negev', 'M249'
] as const

export const CS2_ROLES: CS2Role[] = ['Entry Fragger', 'Second Entry', 'AWPer', 'Support', 'Lurker', 'IGL']

export const CS2_RANKS: CS2Rank[] = [
  'Legendary Eagle Master',
  'Supreme Master First Class', 
  'Global Elite'
]

export const CS2_MAPS: CS2Map[] = [
  'Dust2', 'Mirage', 'Inferno', 'Nuke', 'Overpass',
  'Vertigo', 'Ancient', 'Anubis'
]

// ===== GENERIC TYPES =====
export type GameRole = ValorantRole | CS2Role
export type GameRank = ValorantRank | CS2Rank
export type GameMap = ValorantMap | CS2Map

// ===== GAME CONFIGURATION =====
export interface GameConfig {
  id: GameType
  name: string
  shortName: string
  roles: readonly string[]
  ranks: readonly string[]
  maps: readonly string[]
  characters: readonly string[] // Agents for Valorant, Weapons for CS2
  characterLabel: string // "Agent" or "Weapon"
  characterLabelPlural: string // "Agents" or "Weapons"
  trackerUrlLabel: string
  trackerUrlPlaceholder: string
  trackerBaseUrl: string
  rankImagePath: string // Path to rank images
  primaryColor: string // Theme color for UI
  icon: string // Icon identifier
  hasCharacterPool: boolean // Whether to show character/weapon pool
  usernameLabel: string // Label for in-game name field
  usernamePlaceholder: string // Placeholder for in-game name
  faceitLevels?: readonly number[] // Faceit levels for CS2
  steamUrlLabel?: string // Steam profile URL label
  faceitUrlLabel?: string // Faceit profile URL label
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    shortName: 'VAL',
    roles: VALORANT_ROLES,
    ranks: VALORANT_RANKS,
    maps: VALORANT_MAPS,
    characters: VALORANT_AGENTS,
    characterLabel: 'Agent',
    characterLabelPlural: 'Agents',
    trackerUrlLabel: 'Valorant Tracker URL',
    trackerUrlPlaceholder: 'https://tracker.gg/valorant/profile/riot/...',
    trackerBaseUrl: 'https://tracker.gg/valorant',
    rankImagePath: '/images/ranks/valorant',
    primaryColor: '#ff4655', // Valorant red
    icon: 'valorant',
    hasCharacterPool: true,
    usernameLabel: 'Riot ID',
    usernamePlaceholder: 'Username#TAG'
  },
  cs2: {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    roles: CS2_ROLES,
    ranks: CS2_RANKS,
    maps: CS2_MAPS,
    characters: CS2_WEAPONS,
    characterLabel: 'Weapon',
    characterLabelPlural: 'Weapons',
    trackerUrlLabel: 'Faceit URL',
    trackerUrlPlaceholder: 'https://www.faceit.com/en/players/...',
    trackerBaseUrl: 'https://www.faceit.com',
    rankImagePath: '/images/ranks/cs2',
    primaryColor: '#de9b35', // CS2 orange/gold
    icon: 'cs2',
    hasCharacterPool: false, // No weapon pool needed
    usernameLabel: 'Steam / Faceit',
    usernamePlaceholder: 'Steam or Faceit username',
    faceitLevels: CS2_FACEIT_LEVELS,
    steamUrlLabel: 'Steam Profile URL',
    faceitUrlLabel: 'Faceit Profile URL'
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get the configuration for a specific game
 */
export const getGameConfig = (game: GameType): GameConfig => {
  return GAME_CONFIGS[game]
}

/**
 * Get all available games
 */
export const getAllGames = (): GameType[] => {
  return Object.keys(GAME_CONFIGS) as GameType[]
}

/**
 * Check if a role is valid for a given game
 */
export const isValidRole = (role: string, game: GameType): boolean => {
  return GAME_CONFIGS[game].roles.includes(role)
}

/**
 * Check if a rank is valid for a given game
 */
export const isValidRank = (rank: string, game: GameType): boolean => {
  return GAME_CONFIGS[game].ranks.includes(rank)
}

/**
 * Check if a character/weapon is valid for a given game
 */
export const isValidCharacter = (character: string, game: GameType): boolean => {
  return GAME_CONFIGS[game].characters.includes(character)
}

/**
 * Check if a map is valid for a given game
 */
export const isValidMap = (map: string, game: GameType): boolean => {
  return GAME_CONFIGS[game].maps.includes(map)
}

/**
 * Get roles for a specific game
 */
export const getRolesForGame = (game: GameType): readonly string[] => {
  return GAME_CONFIGS[game].roles
}

/**
 * Get ranks for a specific game
 */
export const getRanksForGame = (game: GameType): readonly string[] => {
  return GAME_CONFIGS[game].ranks
}

/**
 * Get Faceit level image path
 */
export const getFaceitLevelImage = (level: number): string => {
  return `/images/cs2/faceit_${level}.svg`
}

/**
 * Get maps for a specific game
 */
export const getMapsForGame = (game: GameType): readonly string[] => {
  return GAME_CONFIGS[game].maps
}

/**
 * Get characters/weapons for a specific game
 */
export const getCharactersForGame = (game: GameType): readonly string[] => {
  return GAME_CONFIGS[game].characters
}

/**
 * Validate player data against game configuration
 */
export const validatePlayerDataForGame = (
  data: { position?: string; rank?: string; character_pool?: string[] },
  game: GameType
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const config = GAME_CONFIGS[game]

  if (data.position && !config.roles.includes(data.position)) {
    errors.push(`Invalid role "${data.position}" for ${config.name}`)
  }

  if (data.rank && !config.ranks.includes(data.rank)) {
    errors.push(`Invalid rank "${data.rank}" for ${config.name}`)
  }

  if (data.character_pool) {
    const invalidChars = data.character_pool.filter(c => !config.characters.includes(c))
    if (invalidChars.length > 0) {
      errors.push(`Invalid ${config.characterLabelPlural.toLowerCase()}: ${invalidChars.join(', ')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get rank image URL for a specific rank and game
 */
export const getRankImageUrl = (rank: string, game: GameType): string | null => {
  const config = GAME_CONFIGS[game]
  if (!config.ranks.includes(rank)) return null
  
  // Convert rank to filename format (e.g., "Immortal 1" -> "immortal_1")
  const filename = rank.toLowerCase().replace(/\s+/g, '_')
  return `${config.rankImagePath}/${filename}.webp`
}

/**
 * Default game for new entries
 */
export const DEFAULT_GAME: GameType = 'valorant'
