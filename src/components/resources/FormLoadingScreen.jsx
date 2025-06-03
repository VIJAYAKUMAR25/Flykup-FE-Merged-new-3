import { motion } from 'framer-motion';

const LoadingOverlay = ({ message = "Processing your request...", subMessage = "Please wait while we process your information" }) => {
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    },
    exit: { opacity: 0 }
  };

  // Animation variants for children
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Custom spinner animation
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="fixed inset-0 bg-newBlack bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        variants={pulseVariants}
        animate="pulse"
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className="bg-newYellow  rounded-xl p-8 flex flex-col items-center shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 relative overflow-hidden"
      >
        {/* Background decoration elements */}
        
        <div className="w-full flex flex-col items-center justify-center gap-6 relative z-10">
          {/* Custom spinner */}
          <div className="relative">
            <motion.div 
              variants={spinnerVariants}
              animate="animate"
              className="w-16 h-16 border-4 border-newWhite border-t-newBlack  rounded-full"
            />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-newWhite rounded-full" />
            </motion.div>
          </div>
          
          <div className="space-y-3 text-center w-full">
            <motion.h2 
              variants={itemVariants}
              className="text-xl font-bold text-gray-800 dark:text-white"
            >
              {message}
            </motion.h2>
            
            <motion.p
              variants={itemVariants}
              className="text-newBlack text-sm font-semibold"
            >
              {subMessage}
            </motion.p>
            
            {/* Progress bar */}
            <motion.div
              className="w-full bg-gray-200  rounded-full h-1.5 mt-6"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 8, ease: "easeInOut" }}
                className="bg-newBlack h-1.5 rounded-full"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;