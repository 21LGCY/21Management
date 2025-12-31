export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/30 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading..</p>
      </div>
    </div>
  )
}
