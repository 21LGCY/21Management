import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  redirect(`/dashboard/${user.role}`)
}
