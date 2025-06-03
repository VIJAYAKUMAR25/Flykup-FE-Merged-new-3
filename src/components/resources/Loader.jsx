import React from 'react';

const LoadingSpinner = ({ type = 'spinner', size = 'medium', color = 'blue' }) => {
  // Size mappings
  const sizes = {
    small: {
      spinner: 'w-6 h-6',
      dots: 'w-2 h-2',
      bars: 'w-1 h-4'
    },
    medium: {
      spinner: 'w-8 h-8',
      dots: 'w-3 h-3',
      bars: 'w-1.5 h-6'
    },
    large: {
      spinner: 'w-12 h-12',
      dots: 'w-4 h-4',
      bars: 'w-2 h-8'
    }
  };

  // Color mappings
  const colors = {
    blue: 'bg-blue-500 border-blue-500',
    red: 'bg-red-500 border-red-500',
    green: 'bg-green-500 border-green-500',
    purple: 'bg-purple-500 border-purple-500',
    white: 'bg-white border-white'
  };

  // Spinner animation
  const renderSpinner = () => (
    <div className="flex justify-center items-center">
      <div 
        className={`
          ${sizes[size].spinner}
          border-4 
          border-t-transparent 
          rounded-full 
          animate-spin
          ${colors[color].split(' ')[1]}
        `}
      />
    </div>
  );

  // Dots animation
  const renderDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizes[size].dots}
            rounded-full
            ${colors[color].split(' ')[0]}
            animate-bounce
          `}
          style={{
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  );

  // Bars animation
  const renderBars = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`
            ${sizes[size].bars}
            ${colors[color].split(' ')[0]}
            animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  );

  // Ripple animation
  const renderRipple = () => (
    <div className="relative">
      <div 
        className={`
          ${sizes[size].spinner}
          border-2
          rounded-full
          absolute
          animate-ping
          ${colors[color].split(' ')[1]}
        `}
      />
      <div 
        className={`
          ${sizes[size].spinner}
          border-2
          rounded-full
          relative
          ${colors[color].split(' ')[1]}
        `}
      />
    </div>
  );

  const animations = {
    spinner: renderSpinner,
    dots: renderDots,
    bars: renderBars,
    ripple: renderRipple
  };

  return (
    <div className="flex justify-center items-center">
      {animations[type]?.()}
    </div>
  );
};

export default LoadingSpinner;