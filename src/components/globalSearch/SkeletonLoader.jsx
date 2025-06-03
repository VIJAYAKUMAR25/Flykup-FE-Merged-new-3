import React from "react";

// SkeletonLoader component with shimmer effect
const SkeletonLoader = ({ type, count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'show':
        return (
          // Mimics ShowCard structure: Header + Image + Title + Footer
          <div className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {/* Header Placeholder */}
            <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-white shadow-sm">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-shimmer mr-2"></div>
              <div className="flex flex-col space-y-1 flex-grow">
                <div className="h-3 w-1/2 rounded bg-gray-200 animate-shimmer"></div>
                <div className="h-2 w-1/3 rounded bg-gray-200 animate-shimmer"></div>
              </div>
            </div>
            {/* Thumbnail Placeholder (aspect-[9/12] equivalent height for a common width) */}
             {/* Approx height for aspect-[9/12] on a typical grid item width */}
            <div className="h-64 w-full bg-gray-200 animate-shimmer"></div>
            {/* Title/Footer Placeholder */}
            <div className="p-3 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 animate-shimmer"></div>
              <div className="h-3 w-3/4 rounded bg-gray-200 animate-shimmer"></div>
              <div className="flex justify-between items-center mt-1">
                 <div className="h-3 w-1/4 rounded bg-gray-200 animate-shimmer"></div>
                 <div className="h-3 w-1/3 rounded bg-gray-200 animate-shimmer"></div>
              </div>
            </div>
          </div>
        );
      case 'video':
         return (
          // Mimics VideoCard structure: Image with Overlay Header + Title + Footer
          <div className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {/* Thumbnail Placeholder with simulated overlay space */}
            <div className="relative aspect-[9/12] bg-gray-200 animate-shimmer">
               {/* Simulate space potentially taken by overlay header */}
               <div className="absolute top-0 left-0 right-0 p-3">
                 <div className="flex items-center">
                   <div className="h-8 w-8 rounded-full bg-gray-300 mr-2"></div> {/* Slightly darker for contrast */}
                   <div className="flex flex-col space-y-1 flex-grow">
                     <div className="h-3 w-1/2 rounded bg-gray-300"></div>
                     <div className="h-2 w-1/3 rounded bg-gray-300"></div>
                   </div>
                 </div>
               </div>
            </div>
             {/* Title/Footer Placeholder */}
            <div className="p-3 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 animate-shimmer"></div>
              <div className="h-3 w-3/4 rounded bg-gray-200 animate-shimmer"></div>
              <div className="flex justify-between items-center mt-1">
                 <div className="h-3 w-1/4 rounded bg-gray-200 animate-shimmer"></div>
                 <div className="h-3 w-1/3 rounded bg-gray-200 animate-shimmer"></div>
              </div>
            </div>
          </div>
        );
      case 'product': // Kept original structure
        return (
          <div className="flex flex-col space-y-2 w-full">
            <div className="h-36 w-full rounded-md bg-gray-200 animate-shimmer"></div>
            <div className="h-4 w-3/4 rounded-md bg-gray-200 animate-shimmer"></div>
            <div className="h-4 w-1/3 rounded-md bg-gray-200 animate-shimmer font-bold"></div>
            <div className="h-3 w-1/2 rounded-md bg-gray-200 animate-shimmer"></div>
          </div>
        );
      case 'user': // Kept original structure
        return (
          <div className="flex items-center space-x-4 w-full">
            <div className="h-12 w-12 rounded-full bg-gray-200 animate-shimmer"></div>
            <div className="flex flex-col space-y-2 flex-grow">
              <div className="h-4 w-1/3 rounded-md bg-gray-200 animate-shimmer"></div>
              <div className="h-3 w-1/2 rounded-md bg-gray-200 animate-shimmer"></div>
            </div>
          </div>
        );
      case 'tab-item': // Kept original structure
        return (
          <div className="flex items-center justify-between w-full py-2">
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-md bg-gray-200 animate-shimmer mr-3"></div>
              <div className="h-4 w-16 rounded-md bg-gray-200 animate-shimmer"></div>
            </div>
            <div className="h-4 w-6 rounded-md bg-gray-200 animate-shimmer"></div>
          </div>
        );
      default: // Kept original structure
        return (
          <div className="h-16 w-full rounded-md bg-gray-200 animate-shimmer"></div>
        );
    }
  };

  // If count prop was used (like in LoadingGrid), this logic would repeat the skeleton.
  // In our direct usage within ShowResults/VideoResults, we map outside this component.
  // So, the `count` prop and the outer map here are only relevant if using SkeletonLoader directly with a count > 1.
  if (count > 1) {
     return (
       <>
         {Array(count).fill().map((_, i) => (
           <div key={i} className="mb-4"> {/* Or remove mb-4 if gap is handled by parent grid */}
             {renderSkeleton()}
           </div>
         ))}
       </>
     );
  }

  // Default: render single skeleton
   return renderSkeleton();
};

// LoadingGrid component (Unused in ShowResults/VideoResults implementation)
const LoadingGrid = ({ type, count = 6, columns = 3 }) => {
  return (
    // Note: This grid doesn't match the target lg/xl columns
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-4`}>
      {/* This assumes SkeletonLoader handles its own count internally */}
      <SkeletonLoader type={type} count={count} />
    </div>
  );
};

export { SkeletonLoader, LoadingGrid };