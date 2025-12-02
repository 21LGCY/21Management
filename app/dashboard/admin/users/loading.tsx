export default function UsersLoading() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Navbar skeleton */}
      <div className="bg-dark-card/95 border-b border-gray-800 h-20" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-800/50 rounded animate-pulse" />
        </div>
        
        {/* Search and filters skeleton */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />
        </div>
        
        {/* User cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-dark-card border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-gray-800/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-full bg-gray-800/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
