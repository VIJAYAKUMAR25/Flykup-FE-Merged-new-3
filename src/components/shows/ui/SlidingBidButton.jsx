import { useState, useEffect } from 'react';
import { IndianRupee, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SlidingBidButton = ({ amount, onBid, disabled }) => {
  const [bidPlaced, setBidPlaced] = useState(false);
  const [bgColor, setBgColor] = useState('bg-amber-400');

  // Reset state when the bid amount changes
  useEffect(() => {
    setBidPlaced(false);
    setBgColor('bg-amber-400');
  }, [amount]);

  // Handle swipe right action: change background to white and bid
  const handleSwipeRight = () => {
    if (!disabled && !bidPlaced) {
      setBidPlaced(true);
      // setBgColor('bg-white');
      onBid(amount);
      console.log('Bid placed:', amount);
    }
  };

  return (
    <div className="relative w-full max-w-xs h-12 overflow-hidden">
      <div className="rounded-full h-12 w-full overflow-hidden relative border border-amber-400 flex items-center justify-center p-1">
        <motion.button
          type="button"
          className={`${disabled ? 'bg-yellow-500/60 text-gray-900' : bgColor} w-full h-full flex items-center justify-center rounded-full text-black font-medium shadow-md cursor-pointer`}
          // Enable dragging only when not disabled
          drag={!disabled ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            // If swiped right beyond 80px, trigger the bid action
            if (info.offset.x > 80) {
              handleSwipeRight();
            }
          }}
          // Always keep the button at x=0 (i.e. no visible movement)
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          Bid <IndianRupee size={14} className="mx-1" /> {amount?.toLocaleString()}
          <ChevronRight size={24} className={`${disabled ? 'text-gray-900' : 'text-black ml-2'}`} />
          <ChevronRight size={24} className={`${disabled ? 'text-gray-900' : 'text-black ml-2'}`} />
        </motion.button>
      </div>
    </div>
  );
};

export default SlidingBidButton;
