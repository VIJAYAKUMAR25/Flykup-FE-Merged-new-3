import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const FlykupLoader = ({ text = "Loading Flykup..." }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 1
      })
    }, 30)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F] bg-opacity-95 z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-repeat" />

      {/* Logo and loader ring */}
      <div className="w-40 h-40 mb-10 relative">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          <svg width="120" height="120" viewBox="0 0 100 100">
            <motion.path
              d="M25 20 H75 V35 H40 V50 H70 V65 H40 V80 H25 V20 Z"
              fill="none"
              stroke="#FACC15"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="80"
              cy="30"
              r="12"
              fill="#FACC15"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 blur-xl"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#3F3F46" strokeWidth="6" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#FACC15"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={283}
              strokeDashoffset={283 - (283 * progress) / 100}
            />
          </svg>
        </div>
      </div>

      {/* Loading text and message */}
      <div className="text-center relative z-10">
        <div className="text-2xl font-bold text-yellow-400 tracking-wide">{text}</div>
        <div className="text-lg text-stone-300 mt-2 font-light">Preparing your Shopping experience</div>
        <div className="mt-4 text-sm text-yellow-400 font-mono">
          {progress < 100 ? `${progress}% complete` : "Ready to fly!"}
        </div>
      </div>

      {/* Bouncing loader dots */}
      <div className="mt-10 flex space-x-5">
        {[1, 2, 3].map((item) => (
          <motion.div
            key={item}
            className="w-3 h-3 rounded-full bg-stone-600"
            animate={{
              y: [-8, 0, -8],
              backgroundColor: ["#FACC15", "#FEF3C7", "#FACC15"],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: item * 0.2,
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-stone-500 font-light">
        © Flykup {new Date().getFullYear()} • Premium Shopping Experience
      </div>
    </div>
  )
}

export default FlykupLoader
