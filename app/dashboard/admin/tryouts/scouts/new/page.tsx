import NewScoutForm from './NewScoutForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewScoutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard/admin/tryouts?tab=scouting"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scouting Database
      </Link>
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-white">Add New Scout Profile</h1>
            <p className="text-gray-400 text-sm mt-1">Add a potential player to the scouting database for evaluation</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <NewScoutForm />
      </div>
    </main>
  )
}
