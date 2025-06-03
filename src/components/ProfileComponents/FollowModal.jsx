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
        className="fixed inset-0 z-50 pt-20 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="w-full max-w-xl bg-white rounded-lg shadow-xl overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-1 border-b">
            <motion.h3 
              className="text-xl font-semibold text-newBlack"
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "followers" ? "Followers" : "Following"}
            </motion.h3>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b relative">
            <button
              className={`relative py-3 px-4 text-center w-1/2 font-medium transition-all ${
                activeTab === "followers" 
                  ? "text-newBlack" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => switchTab("followers")}
            >
              Followers
            </button>
            <button
              className={`relative py-3 px-4 text-center w-1/2 font-medium transition-all ${
                activeTab === "following" 
                  ? "text-newBlack" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => switchTab("following")}
            >
              Following
            </button>
            {/* Animated tab indicator */}
            <motion.div 
              className="absolute bottom-0 h-1 bg-newYellow rounded-t-md"
              initial={false}
              animate={{ 
                left: activeTab === "followers" ? "0%" : "50%",
                width: "50%" 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Content with fixed height */}
          <div className="h-96 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4"
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