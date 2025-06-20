"use client"

import { useState } from "react"
import { UserPlus, UserMinus, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MdVerified } from "react-icons/md"

const UserItem = ({ user, onFollow, onUnfollow }) => {
  const navigate = useNavigate()
  const [followStatus, setFollowStatus] = useState(user.followStatus)
  const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

  const handleProfileClick = () => {
    // Navigate to the user's profile page
    navigate(`/user/user/${user.userName}`)
  }

  const handleFollow = (e, userId) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    setFollowStatus("Following");
    onFollow(userId);
  }

  const handleUnfollow = (e, userId) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    setFollowStatus("Follow");
    onUnfollow(userId);
  }

  const getUserInitials = (userName) => {
    if (!userName) return "?";
    const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, '');
    if (!alphanumericChars) return "?";
    return alphanumericChars.substring(0, 2).toUpperCase();
  };

  const userInitials = getUserInitials(user.userName);

  // Button definitions for clarity
  const followButton = (
    <button
      onClick={(e) => handleFollow(e, user.userId)}
      className="btn btn-sm bg-white text-black font-semibold hover:bg-gray-200 rounded-full gap-1 px-4 transition-transform duration-200 ease-out hover:scale-105"
    >
      <UserPlus size={16} />
      <span>Follow</span>
    </button>
  );
  
  const followBackButton = (
     <button
      onClick={(e) => handleFollow(e, user.userId)}
      className="btn btn-sm bg-white text-black font-semibold hover:bg-gray-200 rounded-full gap-1 px-4 transition-transform duration-200 ease-out hover:scale-105"
    >
      <UserPlus size={16} />
      <span>Follow Back</span>
    </button>
  );

  const followingButton = (
    <button
      onClick={(e) => handleUnfollow(e, user.userId)}
      className="btn btn-sm bg-transparent border border-gray-600 text-gray-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 rounded-full gap-1 px-4 group transition-all duration-200 ease-out"
    >
      <Check size={16} className="text-green-400 group-hover:hidden" />
      <UserMinus size={16} className="hidden group-hover:inline" />
      <span className="group-hover:hidden">Following</span>
      <span className="hidden group-hover:inline">Unfollow</span>
    </button>
  );

  return (
    <div
      className="flex items-center p-2 border-b border-gray-700/50 hover:bg-gray-800/50 rounded-lg transition-colors duration-200 cursor-pointer"
      onClick={handleProfileClick}
    >
      <div className="avatar">
        <div className="w-11 h-11 rounded-full ring-2 ring-amber-400/50">
          {user.profileURL?.key ? (
            <img
              src={user.profileURL.key ? `${CDNURL}${user.profileURL.key}` : "/placeholder.png"}
              alt={user.userName}
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-amber-400 font-bold text-lg">
              {userInitials}
            </div>
          )}
        </div>
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-bold text-gray-100 truncate">
            {user.name || user.userName}
          </h4>
          {user.role === "seller" && (
            <MdVerified title="Verified Seller" size={16} className="text-blue-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-400 truncate">@{user.userName}</p>
      </div>

      <div className="ml-2 flex-shrink-0">
        {followStatus === "Following" 
            ? followingButton 
            : followStatus === "Followback" 
            ? followBackButton 
            : followButton}
      </div>
    </div>
  )
}

export default UserItem;