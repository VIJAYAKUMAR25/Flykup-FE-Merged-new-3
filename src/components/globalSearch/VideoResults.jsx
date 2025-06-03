import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react'; // Icon library
// Import SkeletonLoader from its file
import { SkeletonLoader } from './SkeletonLoader'; // Adjust path if needed

const PLACEHOLDER_IMAGE = "/placeholder.svg"; // Example placeholder

// --- Helper Functions ---
const getInitials = (username) => {
  if (!username) return "U";
  return username.substring(0, 2).toUpperCase();
};

const truncateText = (text = '', maxLength) => { // Added default empty string
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// --- Reusable Profile Avatar (can be imported from a shared file) ---
const ProfileAvatar = ({ profileURL, username, onClick }) => {
  return (
    <div
      onClick={onClick}
      // Applied styles directly for simplicity, consider abstracting if used elsewhere extensively
       className="cursor-pointer border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center w-8 h-8 z-40" // Added z-index from original
    >
      {profileURL ? (
        <img
          src={profileURL}
          alt={username || "User"}
          className="w-full h-full object-cover border border-gray-200 group-hover:border-blue-400 transition-colors" // Ensure parent group hover works if needed
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER_IMAGE;
          }}
        />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center bg-black text-white text-xs font-bold border border-white group-hover:border-blue-400 transition-colors"> {/* Assuming newBlack maps to black */}
          {getInitials(username)}
        </div>
      )}
    </div>
  );
};


// --- Video Card Component ---
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" }
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const VideoCard = ({ video, index }) => {
  const navigate = useNavigate();

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Stop card click event
    if (video.sellerUserName) {
       navigate(`/user/user/${video.sellerUserName}`);
    }
  };

  const handleCardClick = () => {
    console.log("Card clicked",video._id);
     if(video._id) {
        navigate(`/user/reel/${video._id}`);
     }
  };

  return (
    <motion.div
      className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer group"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      onClick={handleCardClick}
    >
      {/* Thumbnail Image with Header Overlay */}
      <div className="aspect-[9/12] bg-gray-100 relative overflow-hidden">
        {/* Image */}
        <img
          src={video.thumbnailURL || PLACEHOLDER_IMAGE}
          alt={video.title || 'Video thumbnail'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.src = PLACEHOLDER_IMAGE }}
        />

        {/* Header with profile info - positioned absolutely */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-3 py-2 bg-gradient-to-b from-black/60 to-transparent z-30"> {/* Adjusted gradient */}
          <ProfileAvatar
            profileURL={video.sellerProfileURL}
            username={video.sellerUserName}
            onClick={handleProfileClick}
          />
          <div
            className="ml-2 overflow-hidden cursor-pointer z-40" // Added z-index from original
            onClick={handleProfileClick}
          >
            <p className="text-sm font-medium truncate text-white hover:text-blue-300 transition-colors">{video.sellerUserName || "User"}</p>
            <p className="text-xs text-gray-300 truncate">{video.sellerCompanyName || "Creator"}</p>
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 z-20">
          <PlayCircle
            className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300"
            size={48}
            strokeWidth={1.5} // Adjust stroke for better visibility if needed
          />
        </div>
      </div>

      {/* Title and Footer Info */}
      <div className="p-3">
         <h3 className="font-medium text-sm line-clamp-2 h-10"> {/* Fixed height for 2 lines */}
          {truncateText(video.title, 50)}
        </h3>

        {/* Category and Date info */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span className="truncate max-w-[50%] text-blue-500 font-medium">{video.category?.split(' & ')[0] || 'General'}</span>

          {video.createdAt && ( // Check if createdAt exists
            <span className="text-right whitespace-nowrap">
              {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Video Results Component ---
const VideoResults = ({ videos = [], isLoading, error, loadMore, hasMore }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
    triggerOnce: false
  });

   React.useEffect(() => {
    // Trigger loadMore only if observer is in view, hasMore is true, not currently loading, and loadMore function exists
    if (inView && hasMore && !isLoading && loadMore) {
        console.log("Load More Triggered - Videos"); // Debug log
        loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  // Define how many skeletons to show initially
  const initialSkeletonCount = 8; // Adjust as needed

  if (error) {
    return <div className="text-center text-red-500 p-4">Error loading videos: {error.message || String(error)}</div>;
  }

  // Show Skeletons only on initial load (isLoading is true AND no videos data yet)
  if (isLoading && videos.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4"> {/* Added padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: initialSkeletonCount }).map((_, index) => (
            <SkeletonLoader key={index} type="video" />
          ))}
        </div>
      </div>
    );
  }

  // Render actual videos if not loading initially or if data exists
  return (
    <div className="w-full max-w-7xl mx-auto md:px-4"> {/* Added padding */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video, index) => (
           // Ensure video object and _id are valid before rendering
          video && video._id ? <VideoCard key={video._id} video={video} index={index} /> : null
        ))}
      </div>

      {/* Show spinner only when loading *more* items (infinite scroll) */}
      {isLoading && videos.length > 0 && (
        <div className="col-span-full flex justify-center py-4 mt-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Observer element for triggering infinite scroll */}
       {/* Render the observer div only if there are more items to load and not currently loading */}
      {hasMore && !isLoading && <div ref={ref} className="h-16" />}

      {/* Message when no videos are found (and not loading) */}
      {!isLoading && videos.length === 0 && (
         <div className="col-span-full text-center text-gray-500 py-10">
            No videos found matching your criteria.
         </div>
      )}
    </div>
  );
};

export default VideoResults;