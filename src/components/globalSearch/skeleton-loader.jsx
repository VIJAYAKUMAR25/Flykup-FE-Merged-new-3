export const SkeletonLoader = ({ type }) => {
    if (type === "show") {
      return (
        <div className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
  
          {/* Thumbnail skeleton */}
          <div className="aspect-[9/12] bg-gray-200"></div>
  
          {/* Content skeleton */}
          <div className="p-4">
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-4"></div>
  
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      )
    }
  
    // Default fallback skeleton
    return (
      <div className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow animate-pulse p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }
  