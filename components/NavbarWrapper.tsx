import Navbar from './Navbar'
import type { UserRole } from '@/lib/types/database'

interface NavbarWrapperProps {
  role: UserRole
  username: string
  userId: string
  avatarUrl?: string | null
}

export default function NavbarWrapper({ role, username, userId, avatarUrl }: NavbarWrapperProps) {
  return <Navbar role={role} username={username} avatarUrl={avatarUrl || null} userId={userId} />
}
