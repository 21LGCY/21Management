export default function ManagerLoading() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="space-y-2">
            <div className="h-10 w-72 bg-gray-800 rounded-lg skeleton-shimmer"></div>
            <div className="h-4 w-48 bg-gray-800/50 rounded skeleton-shimmer"></div>
          </div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-gray-800 rounded-lg skeleton-shimmer"></div>
              </div>
              <div className="h-3 w-20 bg-gray-800 rounded mb-2 skeleton-shimmer"></div>
              <div className="h-7 w-24 bg-gray-800 rounded skeleton-shimmer"></div>
            </div>
          ))}
        </div>
        
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="bg-dark-card border border-gray-800 rounded-xl p-4 animate-fade-up"
              style={{ animationDelay: `${200 + i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-800 rounded-lg skeleton-shimmer"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-800 rounded mb-1 skeleton-shimmer"></div>
                  <div className="h-3 w-16 bg-gray-800/50 rounded skeleton-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up stagger-5">
            <div className="h-6 w-40 bg-gray-800 rounded mb-4 skeleton-shimmer"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full skeleton-shimmer"></div>
                  <div className="flex-1 h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                  <div className="w-16 h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up stagger-6">
            <div className="h-6 w-40 bg-gray-800 rounded mb-4 skeleton-shimmer"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full skeleton-shimmer"></div>
                  <div className="flex-1 h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
