import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { GiShoppingCart } from 'react-icons/gi';
import { TiShoppingCart } from 'react-icons/ti';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { BsCart4, BsCartPlus } from 'react-icons/bs';
import { RiShoppingCartLine } from 'react-icons/ri';

const AnimatedCartButton = ({ onViewProducts }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onViewProducts();
    
    // Reset click animation after it completes
    setTimeout(() => setIsClicked(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        btn btn-ghost text-white hover:bg-transparent
        relative overflow-hidden
        transition-all duration-300 ease-in-out
        hover:scale-110
        ${isClicked ? 'animate-bounce-once' : ''}
      `}
      aria-label="View Products"
    >
      <RiShoppingCartLine 
        size={25} 
        className={`
          mr-1 transform
          animate-pattern-wiggle
          hover:scale-110
          ${isClicked ? 'animate-wiggle' : ''}
        `}
      />
    </button>
  );
};

// Add required animations to Tailwind styles
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce-once {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-12deg); }
    75% { transform: rotate(12deg); }
  }

  @keyframes pattern-wiggle {
    0%, 15% { transform: rotate(0deg); }
    5% { transform: rotate(-8deg); }
    10% { transform: rotate(8deg); }
    
    50%, 65% { transform: rotate(0deg); }
    55% { transform: rotate(-8deg); }
    60% { transform: rotate(8deg); }
    
    100% { transform: rotate(0deg); }
  }

  .animate-bounce-once {
    animation: bounce-once 0.6s ease-in-out;
  }

  .animate-wiggle {
    animation: wiggle 0.6s ease-in-out;
  }

  .animate-pattern-wiggle {
    animation: pattern-wiggle 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default AnimatedCartButton;