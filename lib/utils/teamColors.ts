// Team color coding system
export type TeamTag = '21L' | '21GC' | '21ACA' | string

export const getTeamColors = (teamTag: string | null | undefined) => {
  if (!teamTag) {
    return {
      border: 'border-gray-800',
      hoverBorder: 'hover:border-primary/50',
      gradient: 'from-dark-card via-dark-card to-primary/5',
      shadow: 'hover:shadow-primary/10',
      style: {},
      badgeColors: '',
      badgeStyle: {
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        color: 'rgb(209, 213, 219)',
        borderColor: 'rgba(107, 114, 128, 0.5)',
      },
      hoverShadow: 'rgba(139, 92, 246, 0.2)',
    }
  }

  switch (teamTag) {
    case '21L':
      return {
        border: '',
        hoverBorder: '',
        gradient: 'from-dark-card via-dark-card',
        shadow: '',
        style: {
          border: '1.5px solid transparent',
          borderRadius: '0.75rem',
          backgroundImage: 'linear-gradient(#141414, #141414), linear-gradient(135deg, rgba(155, 0, 255, 0.5), rgba(236, 141, 255, 0.3))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          '--tw-shadow-color': 'rgba(155, 0, 255, 0.1)',
        } as React.CSSProperties,
        badgeColors: '',
        badgeStyle: {
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          color: 'rgb(216, 180, 254)',
          borderColor: 'rgba(168, 85, 247, 0.5)',
        },
        hoverShadow: 'rgba(155, 0, 255, 0.25)',
      }
    case '21GC':
      return {
        border: '',
        hoverBorder: '',
        gradient: 'from-dark-card via-dark-card',
        shadow: '',
        style: {
          border: '1.5px solid transparent',
          borderRadius: '0.75rem',
          backgroundImage: 'linear-gradient(#141414, #141414), linear-gradient(135deg, rgba(255, 59, 182, 0.5), rgba(255, 187, 238, 0.3))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          '--tw-shadow-color': 'rgba(255, 59, 182, 0.1)',
        } as React.CSSProperties,
        badgeColors: '',
        badgeStyle: {
          backgroundColor: 'rgba(255, 59, 182, 0.2)',
          color: 'rgb(251, 207, 232)',
          borderColor: 'rgba(255, 59, 182, 0.5)',
        },
        hoverShadow: 'rgba(255, 59, 182, 0.25)',
      }
    case '21ACA':
      return {
        border: '',
        hoverBorder: '',
        gradient: 'from-dark-card via-dark-card',
        shadow: '',
        style: {
          border: '1.5px solid transparent',
          borderRadius: '0.75rem',
          backgroundImage: 'linear-gradient(#141414, #141414), linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(147, 197, 253, 0.3))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          '--tw-shadow-color': 'rgba(59, 130, 246, 0.1)',
        } as React.CSSProperties,
        badgeColors: '',
        badgeStyle: {
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          color: 'rgb(147, 197, 253)',
          borderColor: 'rgba(59, 130, 246, 0.5)',
        },
        hoverShadow: 'rgba(59, 130, 246, 0.25)',
      }
    default:
      return {
        border: 'border-gray-800',
        hoverBorder: 'hover:border-primary/50',
        gradient: 'from-dark-card via-dark-card to-primary/5',
        shadow: 'hover:shadow-primary/10',
        style: {},
        badgeColors: '',
        badgeStyle: {
          backgroundColor: 'rgba(107, 114, 128, 0.2)',
          color: 'rgb(209, 213, 219)',
          borderColor: 'rgba(107, 114, 128, 0.5)',
        },
        hoverShadow: 'rgba(139, 92, 246, 0.2)',
      }
  }
}

export const getTeamColorClasses = (teamTag: string | null | undefined) => {
  const colors = getTeamColors(teamTag)
  return `${colors.border} ${colors.hoverBorder} bg-gradient-to-br ${colors.gradient} ${colors.shadow}`
}
