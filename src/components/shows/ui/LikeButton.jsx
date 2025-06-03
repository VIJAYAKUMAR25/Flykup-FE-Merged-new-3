import React, { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';

const FloatingHeart = ({ style }) => (
  <div
    className="absolute animate-float-up pointer-events-none"
    style={style}
  >
    <Heart
      size={16}
      className="text-error"
      fill="currentColor"
    />
  </div>
);

const LikeButton = ({ initialLikes, onLike, isLiked, setIsLiked, setLikes, connectionReady }) => {
  const [hearts, setHearts] = useState([]);

  const handleLike = useCallback(() => {
    if (!connectionReady) {
      toast.error("Connection not ready, please try again shortly");
      return; // Do not update UI if connection isn't ready.
    }

    // Call the parent onLike function (which may perform a socket emit)
    onLike();

    // Update local UI state.
    setIsLiked(!isLiked);
    setLikes(prev => prev + (isLiked ? -1 : 1));

    if (!isLiked) {
      // Create 5 hearts with random positions.
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 30 - 15, // Random spread from -15px to 15px.
        delay: i * 100 // Stagger the animation.
      }));

      setHearts(prev => [...prev, ...newHearts]);

      // Remove hearts after animation.
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => !newHearts.find(newHeart => newHeart.id === heart.id)));
      }, 1000);
    }
  }, [isLiked, onLike, setIsLiked, setLikes, connectionReady]);

  return (
    <div className="flex flex-col items-center relative">
      <button
        onClick={handleLike}
        className={`w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30  hover:bg-stone-700 transition-colors shadow-lg ${isLiked ? "text-error" : "text-white"
          }`}
        aria-label="Like"
      >
        <Heart
          size={20}
          fill={isLiked ? "currentColor" : "none"}
          className="transform hover:scale-110 transition-transform duration-200"
        />

        {hearts.map(heart => (
          <FloatingHeart
            key={heart.id}
            style={{
              left: `${heart.left}px`,
              animationDelay: `${heart.delay}ms`
            }}
          />
        ))}
      </button>
      <div className="text-xs [text-shadow:2px_2px_3px_rgba(0,0,0,0.7)] text-center">
        {initialLikes}
      </div>
    </div>
  );
};

// Append keyframes for heart animation.
const style = document.createElement('style');
style.textContent = `
  @keyframes float-up {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) scale(0.5);
      opacity: 0;
    }
  }
  .animate-float-up {
    animation: float-up 1s ease-out forwards;
  }
`;
document.head.appendChild(style);

export default LikeButton;
