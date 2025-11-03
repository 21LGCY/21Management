import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import UserManagementClient from './UserManagementClient'

export default async function UserManagementPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-400">Manage all user accounts</p>
        </div>
        
        <UserManagementClient />
      </main>
    </div>
  )
}
