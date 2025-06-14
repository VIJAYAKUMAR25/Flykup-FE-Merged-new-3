import { useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useNavigate } from "react-router-dom"
import { SkeletonLoader } from "./skeleton-loader.jsx"
import { formatDateForDisplay, formatTimeForDisplay } from "../../utils/dateUtils.js"

const getInitials = (username) => {
  if (!username) return "U"
  return username.substring(0, 2).toUpperCase()
}

const truncateText = (text = "", maxLength) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder.svg"
  if (imagePath.startsWith('http')) return imagePath
  const cdnUrl = import.meta.env.VITE_AWS_CDN_URL || "https://d2jp9e7w3mhbvf.cloudfront.net/"
  return `${cdnUrl}${imagePath}`
}
const ProfileAvatar = ({ profileURL, username, onClick }) => {
  const fullProfileUrl = getFullImageUrl(profileURL)
  
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-full overflow-hidden flex items-center justify-center w-10 h-10 ring-2 ring-amber-400 ring-offset-1"
    >
      {profileURL ? (
        <img
          src={fullProfileUrl}
          alt={username || "User"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
          }}
        />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white text-xs font-bold">
          {getInitials(username)}
        </div>
      )}
    </div>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
}

const ShowCard = ({ show, index }) => {
  const navigate = useNavigate()
  const viewerCount = useMemo(() => Math.floor(Math.random() * 200) + 50, [])
  const isLive = show.showStatus === "live" || show.isLive
  const fullThumbnailUrl = getFullImageUrl(show.thumbnailImage)

  const handleProfileClick = (e) => {
    e.stopPropagation()
    if (show.sellerUserName) {
      navigate(`/user/user/${show.sellerUserName}`)
    }
  }

  const handleCardClick = () => {
    if (isLive && show._id) {
      navigate(`/user/show/${show._id}`)
    }
  }

  return (
    <motion.div
      className={`rounded-xl overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 ${isLive ? "cursor-pointer" : "cursor-default"}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={isLive ? "hover" : ""}
      custom={index}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <ProfileAvatar profileURL={show.sellerProfileURL} username={show.sellerUserName} onClick={handleProfileClick} />
        <div className="overflow-hidden cursor-pointer" onClick={handleProfileClick}>
          <p className="text-sm font-semibold truncate hover:text-amber-600 transition-colors">
            {show.sellerUserName || "User"}
          </p>
          <p className="text-xs text-gray-500 truncate">{show.sellerCompanyName || "Creator"}</p>
        </div>
      </div>

      <div className="aspect-[9/12] bg-gray-100 relative overflow-hidden group">
        <img
          src={fullThumbnailUrl}
          alt={show.title || "Show thumbnail"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=400&width=300"
          }}
        />

        {isLive ? (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1.5 z-10 shadow-md">
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="font-medium">Live · {viewerCount}</span>
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full z-10 shadow-md font-medium">
            Upcoming
          </div>
        )}

        {isLive && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <button
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 transform scale-90 group-hover:scale-100 transition-transform duration-300"
              aria-label="Watch Now"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Watch Now</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 h-10">{truncateText(show.title || "", 50)}</h3>
          <span className="truncate max-w-[50%] text-amber-600 font-medium bg-amber-50 rounded-full text-xs">
            {show.category?.split(" & ")[0] || "General"}
          </span>
        {
          show?.scheduledAt && 
          <div className="text-xs flex flex-col">
            <p><span className="text-amber-600">Date</span>: {formatDateForDisplay(show.scheduledAt)} </p>
            <p><span className="text-amber-600">Time</span>: { formatTimeForDisplay(show.scheduledAt)} </p>
          </div>
        }
      </div>
    </motion.div>
  )
}

const ShowResults = ({ shows = [], isLoading, error, loadMore, hasMore }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px 0px",
    triggerOnce: false,
  })

  useEffect(() => {
    if (inView && hasMore && !isLoading && loadMore) {
      console.log("Load More Triggered - Shows")
      loadMore()
    }
  }, [inView, hasMore, isLoading, loadMore])

  const initialSkeletonCount = 8

  if (error) {
    return (
      <div className="text-center p-8 rounded-lg bg-red-50 text-red-600 max-w-7xl mx-auto my-4 border border-red-100">
        <div className="font-semibold mb-1">Error loading shows</div>
        <div className="text-sm">{error.message || String(error)}</div>
      </div>
    )
  }

  if (isLoading && shows.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: initialSkeletonCount }).map((_, index) => (
            <SkeletonLoader key={index} type="show" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto md:px-4 md:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shows.map((show, index) => (show && show._id ? <ShowCard key={show._id} show={show} index={index} /> : null))}
      </div>

      {isLoading && shows.length > 0 && (
        <div className="flex justify-center py-8 mt-4">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      )}

      {hasMore && !isLoading && <div ref={ref} className="h-16" />}

      {!isLoading && shows.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No shows found matching your criteria.</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  )
}

export default ShowResults