export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Navbar skeleton */}
      <div className="bg-dark-card/95 border-b border-gray-800 h-20" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8 animate-fade-up">
          <div className="h-8 w-48 bg-gray-800 rounded-lg skeleton-shimmer mb-2" />
          <div className="h-4 w-72 bg-gray-800/50 rounded skeleton-shimmer" />
        </div>

        {/* Settings card skeleton */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up stagger-1">
          {/* Profile section */}
          <div className="mb-8">
            <div className="h-6 w-32 bg-gray-800 rounded mb-4 skeleton-shimmer" />
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-800 rounded-full skeleton-shimmer" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-800 rounded skeleton-shimmer" />
                <div className="h-3 w-32 bg-gray-800/50 rounded skeleton-shimmer" />
              </div>
            </div>
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-800 rounded skeleton-shimmer" />
                <div className="h-10 w-full bg-gray-800/50 rounded-lg skeleton-shimmer" />
              </div>
            ))}
          </div>

          {/* Password section */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="h-6 w-40 bg-gray-800 rounded mb-4 skeleton-shimmer" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-gray-800 rounded skeleton-shimmer" />
                  <div className="h-10 w-full bg-gray-800/50 rounded-lg skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* Button skeleton */}
          <div className="mt-8 flex justify-end">
            <div className="h-10 w-32 bg-gray-800 rounded-lg skeleton-shimmer" />
          </div>
        </div>
      </main>
    </div>
  )
}
