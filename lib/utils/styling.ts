import { UserRole, ValorantRole, TryoutStatus, TryoutWeekStatus } from '@/lib/types/database'

// ===== Rank Images =====
const RANK_IMAGES: Record<string, string> = {
  'Ascendant 1': '/images/asc_1_rank.webp',
  'Ascendant 2': '/images/asc_2_rank.webp',
  'Ascendant 3': '/images/asc_3_rank.webp',
  'Immortal 1': '/images/immo_1_rank.webp',
  'Immortal 2': '/images/immo_2_rank.webp',
  'Immortal 3': '/images/immo_3_rank.webp',
  'Radiant': '/images/rad_rank.webp'
}

export function getRankImage(rank: string | undefined | null): string | null {
  if (!rank) return null
  return RANK_IMAGES[rank] || null
}

// ===== User Role Styling =====
export function getUserRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'manager': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'player': return 'bg-green-500/20 text-green-300 border-green-500/30'
  }
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'manager': return 'Manager'
    case 'player': return 'Player'
  }
}

// ===== Valorant Role/Position Styling =====
export function getValorantRoleColor(role: ValorantRole | string | undefined): string {
  switch (role) {
    case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'Staff': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

// ===== Tryout Status Styling =====
export function getTryoutStatusColor(status: TryoutStatus | string): string {
  switch (status) {
    case 'not_contacted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    case 'contacted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'left': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

export function getTryoutStatusLabel(status: TryoutStatus | string): string {
  switch (status) {
    case 'not_contacted': return 'Not Contacted'
    case 'contacted': return 'Contacted'
    case 'in_tryouts': return 'In Tryouts'
    case 'accepted': return 'Accepted'
    case 'substitute': return 'Substitute'
    case 'rejected': return 'Rejected'
    case 'left': return 'Left'
    default: return status
  }
}

// ===== Tryout Week Status Styling =====
export function getTryoutWeekStatusColor(status: TryoutWeekStatus | string): string {
  switch (status) {
    case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

export function getTryoutWeekStatusLabel(status: TryoutWeekStatus | string): string {
  switch (status) {
    case 'scheduled': return 'Scheduled'
    case 'in_progress': return 'In Progress'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    default: return status
  }
}

// ===== Activity Response Status Styling =====
export function getResponseStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'unavailable': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'maybe': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getResponseStatusLabel(status: string): string {
  switch (status) {
    case 'available': return 'Available'
    case 'unavailable': return 'Unavailable'
    case 'maybe': return 'Maybe'
    default: return status
  }
}

// ===== Match Result Styling =====
export function getMatchResultColor(result: 'win' | 'loss' | 'draw' | string | undefined): string {
  switch (result) {
    case 'win': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'loss': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'draw': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}
