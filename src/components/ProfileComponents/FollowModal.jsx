"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import FollowersList from "./FollowersList"
import FollowingList from "./FollowingList"
import { motion, AnimatePresence } from "framer-motion"

const FollowModal = ({ userId, initialTab = "followers", onClose }) => {
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const switchTab = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="w-[90vw] max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[90vh] bg-blackLight rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl overflow-hidden m-4"
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-newYellow/20">
            <motion.h3 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white"
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "followers" ? "Followers" : "Following"}
            </motion.h3>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-newYellow/10 active:bg-newYellow/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-newYellow focus:ring-opacity-50"
              aria-label="Close"
            >
              <X size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-newYellow/20 relative bg-blackLight">
            <button
              className={`relative py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 text-center w-1/2 font-medium text-xs sm:text-sm md:text-base transition-all duration-200 ${
                activeTab === "followers" 
                  ? "text-white" 
                  : "text-white/60 hover:text-white active:text-white"
              }`}
              onClick={() => switchTab("followers")}
            >
              Followers
            </button>
            <button
              className={`relative py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 text-center w-1/2 font-medium text-xs sm:text-sm md:text-base transition-all duration-200 ${
                activeTab === "following" 
                  ? "text-white" 
                  : "text-white/60 hover:text-white active:text-white"
              }`}
              onClick={() => switchTab("following")}
            >
              Following
            </button>
            {/* Animated tab indicator */}
            <motion.div 
              className="absolute bottom-0 h-0.5 sm:h-1 bg-newYellow rounded-t-md"
              initial={false}
              animate={{ 
                left: activeTab === "followers" ? "0%" : "50%",
                width: "50%" 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Content with responsive height */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-blackLight" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-3 sm:p-4 md:p-6 lg:p-8"
              >
                {activeTab === "followers" ? 
                  <FollowersList userId={userId} /> : 
                  <FollowingList userId={userId} />
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FollowModal;