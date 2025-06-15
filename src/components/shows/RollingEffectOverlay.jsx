// components/common/RollingEffectOverlay.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const getRandomTamilName = () => {
  const firstNames = [
    "Kumar", "Raja", "Murugan", "Chandran", "Arun", 
    "Vijay", "Karthik", "Mani", "Balaji", "Dinesh",
    "Priya", "Malathi", "Sarita", "Lakshmi", "Gayathri",
    "Vani", "Swetha", "Puja", "Anitha", "Janaki"
  ];
  
  const lastNames = [
    "Subramaniam", "Velu", "Ganesan", "Sekar", "Ramnathan",
    "Kannan", "Pande", "Singh", "Ayyar", "Nayudu",
    "Iyer", "Menon", "Nair", "Reddy", "Sharma"
  ];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
    lastNames[Math.floor(Math.random() * lastNames.length)]
  }`;
};

const RollingEffectOverlay = ({ isRolling, duration = 5000 }) => {
  const [displayName, setDisplayName] = useState("");
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (isRolling) {
      // Start rolling with fast name changes
      intervalRef.current = setInterval(() => {
        setDisplayName(getRandomTamilName());
      }, 100);
      
      // Stop after duration
      const timeoutId = setTimeout(() => {
        clearInterval(intervalRef.current);
      }, duration);
      
      return () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutId);
      };
    } else {
      clearInterval(intervalRef.current);
      setDisplayName("");
    }
  }, [isRolling, duration]);

  if (!isRolling) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(250, 250, 250, 0.42)',
          width: '320px'
        }}
        className="rounded-lg shadow-lg p-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ color: '#22C55E' }}
            className="text-lg"
          >
            🎁
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div 
              style={{ color: 'rgba(250, 250, 250, 1)' }}
              className="text-xs font-medium mb-1"
            >
              Rolling...
            </div>
            
            <motion.div
              key={displayName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              style={{ 
                color: 'rgba(250, 250, 250, .62)',
                backgroundColor: 'rgba(48, 45, 35, 1)'
              }}
              className="text-xs font-semibold px-2 py-1 rounded truncate"
            >
             @ {displayName}
            </motion.div>
          </div>
        </div>
        
        <div className="mt-2">
          <div 
            style={{ backgroundColor: 'rgba(250, 250, 250, 0.42)' }}
            className="h-1 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              style={{ backgroundColor: '#22C55E' }}
              className="h-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RollingEffectOverlay;