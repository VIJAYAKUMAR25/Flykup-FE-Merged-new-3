import React, { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';

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

const LikeButton = ({ initialLikes = 0, onLike }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [hearts, setHearts] = useState([]);

  const handleLike = useCallback(() => {
    setLiked(!liked);
    setLikes(prev => prev + (liked ? -1 : 1));
    onLike();
    
    if (!liked) {
      // Create 5 hearts with random positions
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 30 - 15, // Random spread from -15px to 15px
        delay: i * 100 // Stagger the animation
      }));
      
      setHearts(prev => [...prev, ...newHearts]);
      
      // Remove hearts after animation
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => 
          !newHearts.find(newHeart => newHeart.id === heart.id)
        ));
      }, 1000);
    }
  }, [liked]);

  return (
    <div className="flex flex-col items-center relative">
      <button
        onClick={handleLike}
        className={`btn btn-circle btn-ghost bg-gray-900/20 shadow-sm ${
          liked ? "text-error" : "text-white"
        }`}
        aria-label="Like"
      >
        <Heart
          size={25}
          fill={liked ? "currentColor" : "none"}
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
      {/* <div className="text-sm text-center">{likes}</div> */}
    </div>
  );
};

// Add required animation to Tailwind styles
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