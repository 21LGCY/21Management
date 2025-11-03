import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ValorantRank } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'Jamais';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'not_contacted':
      return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
    case 'contacted':
      return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
    case 'tryout':
      return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
    case 'accepted':
      return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30';
    case 'subs':
      return 'text-purple-300 bg-purple-500/20 border-purple-500/30';
    case 'rejected':
      return 'text-red-300 bg-red-500/20 border-red-500/30';
    case 'left':
      return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    default:
      return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'not_contacted':
      return 'Non Contacté';
    case 'contacted':
      return 'Contacté / En Attente';
    case 'tryout':
      return 'En Tryouts';
    case 'accepted':
      return 'Joueur';
    case 'subs':
      return 'Remplaçant';
    case 'rejected':
      return 'Refusé';
    case 'left':
      return 'Quitté';
    default:
      return status;
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getRankImage(rank: ValorantRank | null): string {
  if (!rank) return '';
  
  // Map rank values to actual image filenames
  const rankImageMap: Record<ValorantRank, string> = {
    'ascendant_1': '/asc_1_rank.webp',
    'ascendant_2': '/asc_2_rank.webp',
    'ascendant_3': '/asc_3_rank.webp',
    'immortal_1': '/immo_1_rank.webp',
    'immortal_2': '/immo_2_rank.webp',
    'immortal_3': '/immo_3_rank.webp',
    'radiant': '/rad_rank.webp'
  };
  
  return rankImageMap[rank] || '';
}

export function getRankLabel(rank: ValorantRank | null): string {
  if (!rank) return 'Non classé';
  
  const rankMap: Record<ValorantRank, string> = {
    'ascendant_1': 'Ascendant 1',
    'ascendant_2': 'Ascendant 2',
    'ascendant_3': 'Ascendant 3',
    'immortal_1': 'Immortal 1',
    'immortal_2': 'Immortal 2',
    'immortal_3': 'Immortal 3',
    'radiant': 'Radiant'
  };
  
  return rankMap[rank];
}

export function getTeamLabel(category: string): string {
  const labels: Record<string, string> = {
    'mens': '21L',
    'gc': '21GC',
    'academy': '21 ACA'
  };
  return labels[category] || category.toUpperCase();
}