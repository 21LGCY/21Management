import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ActionButtonProps {
  icon?: LucideIcon
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
}

export default function ActionButton({ 
  icon: Icon, 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = ''
}: ActionButtonProps) {
  const baseStyles = "group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 ease-out whitespace-nowrap"
  
  const variants = {
    primary: `
      bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20
      border border-primary/75
      text-white
      hover:border-primary/50
      hover:bg-gradient-to-br hover:from-primary/30 hover:via-primary/20 hover:to-primary/30
      hover:shadow-lg hover:shadow-primary/20
      before:absolute before:inset-0 
      before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-primary/10
      before:opacity-0 before:transition-opacity before:duration-500
      hover:before:opacity-100
      after:absolute after:inset-0 after:rounded-xl
      after:bg-gradient-to-t after:from-white/0 after:via-white/0 after:to-white/5
      after:opacity-0 after:transition-opacity after:duration-300
      hover:after:opacity-100
    `,
    secondary: `
      bg-gradient-to-br from-dark-card/80 to-dark-card
      border border-gray-800/80
      text-gray-300
      hover:border-gray-700
      hover:text-white
      hover:bg-gradient-to-br hover:from-dark-card hover:to-gray-900/50
    `
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {Icon && (
        <Icon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
      )}
      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </button>
  )
}
