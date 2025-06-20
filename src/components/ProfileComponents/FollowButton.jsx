import React, { useState, useCallback, useEffect } from 'react';

const FollowButton = ({ targetUserId, initialFollowStatus, onFollow, onUnfollow, size = 'md' }) => {
  // Internal state for the current follow status of the user represented by this button
  // This allows for optimistic updates.
  const [currentFollowStatus, setCurrentFollowStatus] = useState(initialFollowStatus);
  const [isUpdating, setIsUpdating] = useState(false); // To prevent multiple clicks during update

  // Effect to update internal status if initialFollowStatus prop changes
  // This is important if the parent component (e.g., FollowersList) re-fetches data
  // and provides an updated status for a user already in the list.
  useEffect(() => {
    setCurrentFollowStatus(initialFollowStatus);
  }, [initialFollowStatus]);

  // Determine button text and styling based on the current follow status
  const getButtonProps = useCallback(() => {
    switch (currentFollowStatus) {
      case 'Following':
        return {
          text: 'Following',
          className: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-yellow-500',
        };
      case 'Follow Back':
        return {
          text: 'Follow Back',
          className: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
        };
      case 'Follow':
      default: // Default to 'Follow' if status is not explicitly Following/Follow Back
        return {
          text: 'Follow',
          className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
        };
    }
  }, [currentFollowStatus]);

  // Determine sizing classes based on the 'size' prop
  const getButtonSizeClasses = useCallback(() => {
    switch (size) {
      case 'sm':
        return {
          paddingClass: 'px-3 py-1.5',
          fontSizeClass: 'text-xs',
          roundedClass: 'rounded-md',
        };
      case 'lg':
        return {
          paddingClass: 'px-6 py-3',
          fontSizeClass: 'text-lg',
          roundedClass: 'rounded-xl',
        };
      case 'md':
      default:
        return {
          paddingClass: 'px-4 py-2',
          fontSizeClass: 'text-sm',
          roundedClass: 'rounded-lg',
        };
    }
  }, [size]);


  const { text, className: colorClasses } = getButtonProps();
  const { paddingClass, fontSizeClass, roundedClass } = getButtonSizeClasses();

  // Handler for button click
  const handleClick = async () => {
    if (isUpdating || initialFollowStatus === null) {
      // Prevent multiple clicks or clicks on the current user's button
      return;
    }

    setIsUpdating(true); // Set updating lock

    const previousStatus = currentFollowStatus; // Store current status for potential rollback

    try {
      if (currentFollowStatus === 'Following') {
        // If currently following, attempt to unfollow
        setCurrentFollowStatus('Follow'); // Optimistic update
        await onUnfollow(targetUserId);
      } else {
        // If currently 'Follow' or 'Follow Back', attempt to follow
        setCurrentFollowStatus('Following'); // Optimistic update
        await onFollow(targetUserId);
      }
    } catch (error) {
      console.error(`Error updating follow status for ${targetUserId}:`, error);
      // Rollback on error
      setCurrentFollowStatus(previousStatus);
      // You might want to show an error message here using your alert system
    } finally {
      setIsUpdating(false); // Release updating lock
    }
  };

  // If initialFollowStatus is null, it means this is the current logged-in user
  // In such cases, render nothing or a disabled state.
  if (initialFollowStatus === null) {
    return (
      <span className={`inline-flex items-center ${paddingClass} ${fontSizeClass} ${roundedClass} shadow-sm cursor-not-allowed bg-gray-700 text-gray-400 opacity-75 font-semibold`}>
        You
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating} // Disable button during API call
      className={`
        font-semibold shadow-sm
        transition-colors duration-200 ease-in-out
        border border-transparent
        ${paddingClass}
        ${fontSizeClass}
        ${roundedClass}
        ${colorClasses}
        ${isUpdating ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {text}
    </button>
  );
};

export default FollowButton;