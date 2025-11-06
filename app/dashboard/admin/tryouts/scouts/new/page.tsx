import NewScoutForm from './NewScoutForm'

export default function NewScoutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Add New Scout Profile</h1>
        <p className="text-gray-400">Add a potential player to the scouting database</p>
      </div>
      <NewScoutForm />
    </div>
  )
}
