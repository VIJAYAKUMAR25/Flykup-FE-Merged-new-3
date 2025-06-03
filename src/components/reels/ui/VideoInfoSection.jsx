"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Star, Clock, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

const VideoInfoSection = ({ video, onViewProducts }) => {
  const navigate = useNavigate()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [formattedDate, setFormattedDate] = useState("")

  const handleScroll = (e) => {
    e.stopPropagation()
  }

  useEffect(() => {
    // Format the timestamp when component mounts or video changes
    if (video?.createdAt) {
      const date = new Date(video.createdAt)
      setFormattedDate(formatTimeAgo(date))
    }
  }, [video])

  useEffect(() => {
    if (showFullDescription) {
      const container = document.querySelector(".description-scroll")

      const preventTouchScroll = (e) => {
        e.stopPropagation()
      }

      if (container) {
        container.addEventListener("touchstart", preventTouchScroll, { passive: false })
        container.addEventListener("touchmove", preventTouchScroll, { passive: false })
        container.addEventListener("touchend", preventTouchScroll, { passive: false })
      }

      return () => {
        if (container) {
          container.removeEventListener("touchstart", preventTouchScroll)
          container.removeEventListener("touchmove", preventTouchScroll)
          container.removeEventListener("touchend", preventTouchScroll)
        }
      }
    }
  }, [showFullDescription])

  // Function to format timestamp as "time ago"
  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} days ago`

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} months ago`

    return `${Math.floor(diffInMonths / 12)} years ago`
  }

  const handleProfileView = (id) => {
    navigate(`/profile/seller/${id}`)
  }

  // Extract hashtags from the video object
  const renderHashtags = () => {
    if (!video?.hashTags || video.hashTags.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {video.hashTags.map((tag, index) => (
          <span key={index} className="text-amber-400 text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className=" p-4 pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        {/* Profile Picture */}
        <motion.div whileHover={{ scale: 1.05 }} className="relative">
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500 cursor-pointer shadow-md"
            onClick={() => handleProfileView(video?.sellerId?._id)}
          >
            {video?.profilePic ? (
              <img
                src="https://png.pngtree.com/png-vector/20240601/ourmid/pngtree-casual-man-flat-design-avatar-profile-picture-vector-png-image_12593008.png"
                alt={video?.sellerId?.companyName}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="bg-gradient-to-br from-stone-800 to-stone-700 flex items-center justify-center w-full h-full">
                <img
                  src="https://png.pngtree.com/png-vector/20240601/ourmid/pngtree-casual-man-flat-design-avatar-profile-picture-vector-png-image_12593008.png"
                  alt={video?.sellerId?.companyName}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
            <Star size={12} className="text-stone-900" />
          </div>
        </motion.div>

        {/* User Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-col items-start">
            <div className="flex items-center justify-start w-full">
              <motion.h3
                whileHover={{ scale: 1.02 }}
                className="text-base font-bold text-white tracking-wide cursor-pointer group flex items-center"
                onClick={() => handleProfileView(video?.sellerId?._id)}
              >
                {video?.sellerId?.companyName}
                <ExternalLink
                  size={14}
                  className="ml-1.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.h3>

              <div className="flex items-center text-stone-400 text-xs bg-stone-800/70 px-2 py-0.5 rounded-full">
                <Clock size={10} className="mr-1" />
                {formattedDate}
              </div>
            </div>

            <div className="mt-1.5" onWheel={handleScroll}>
              <h3 className="text-sm font-medium text-stone-200 mb-1">{video?.title}</h3>
              <div className="text-xs text-stone-300 description-scroll">
                {showFullDescription ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="leading-relaxed">
                    {video?.description}
                  </motion.p>
                ) : (
                  <p className="leading-relaxed">
                    {video?.description?.slice(0, 25)}
                    {video?.description?.length > 100 && "..."}
                  </p>
                )}
                {video?.description?.length > 100 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-amber-400 font-medium hover:text-amber-300 transition-colors ml-1"
                  >
                    {showFullDescription ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>

            {/* Hashtags */}
            {renderHashtags()}

            <div className="flex items-center gap-2 mt-3">
              {video?.category && (
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
                  {video.category}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500 text-stone-900 flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow-md"
                onClick={() => onViewProducts(video)}
              >
                <ShoppingCart size={12} />
                Shop Now
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default VideoInfoSection

