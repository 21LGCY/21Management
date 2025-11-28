export default function TeamsLoading() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="h-8 w-32 bg-gray-800 rounded-lg skeleton-shimmer"></div>
          <div className="h-10 w-28 bg-gray-800 rounded-lg skeleton-shimmer"></div>
        </div>
        
        {/* Team cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-dark-card border border-gray-800 rounded-xl p-6 animate-fade-up card-hover"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-800 rounded-lg skeleton-shimmer"></div>
                <div className="flex-1">
                  <div className="h-5 w-24 bg-gray-800 rounded mb-2 skeleton-shimmer"></div>
                  <div className="h-3 w-16 bg-gray-800 rounded skeleton-shimmer"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-800 rounded skeleton-shimmer"></div>
                <div className="h-3 w-3/4 bg-gray-800 rounded skeleton-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
