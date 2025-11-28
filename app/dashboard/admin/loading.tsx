export default function AdminLoading() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="h-8 w-48 bg-gray-800 rounded-lg skeleton-shimmer"></div>
          <div className="h-10 w-32 bg-gray-800 rounded-lg skeleton-shimmer"></div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-4 w-20 bg-gray-800 rounded mb-3 skeleton-shimmer"></div>
              <div className="h-8 w-16 bg-gray-800 rounded skeleton-shimmer"></div>
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up stagger-5">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="flex items-center gap-4"
                style={{ animationDelay: `${250 + i * 50}ms` }}
              >
                <div className="w-10 h-10 bg-gray-800 rounded-full skeleton-shimmer"></div>
                <div className="flex-1 h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                <div className="w-20 h-4 bg-gray-800 rounded skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
