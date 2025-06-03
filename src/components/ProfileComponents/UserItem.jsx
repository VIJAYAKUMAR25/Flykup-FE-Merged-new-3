"use client"

import { useState } from "react"
import { UserPlus, UserMinus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MdVerified } from "react-icons/md"

const UserItem = ({ user, onFollow, onUnfollow }) => {
  const navigate = useNavigate()
  const [followStatus, setFollowStatus] = useState(user.followStatus)
  
  const handleProfileClick = () => {
    navigate(`/user/${user.userName}`)
  }
  
  const handleFollow = (userId) => {
    setFollowStatus(followStatus === "Followback" ? "Following" : "Following")
    onFollow(userId)
  }
  
  const handleUnfollow = (userId) => {
    setFollowStatus("Follow")
    onUnfollow(userId)
  }
  
  const getUserInitials = (userName) => {
    if (!userName) return "??";
    
    // Filter out special characters, keeping only letters and numbers
    const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, '');
    
    // If no alphanumeric characters were found, return default
    if (!alphanumericChars) return "??";
    
    return alphanumericChars.substring(0, 2).toUpperCase();
  };
  
  // Usage
  const userInitials = getUserInitials(user.userName);

  return (
    <div className="flex items-center p-1 border-b hover:bg-slate-200 rounded-full transition-colors">
      <div className="avatar min-w-10 cursor-pointer" onClick={handleProfileClick}>
        <div className="w-10 h-10 z-0 rounded-full border-2 border-newYellow">
          {user.profileURL?.jpgURL ? (
            <img
              src={user.profileURL.jpgURL}
              alt={user.userName}
            />
          ) : (
            <div className="w-full h-full bg-newBlack flex items-center justify-center text-newYellow font-medium">
              {userInitials}
            </div>
          )}
        </div>
      </div>
      <div className="ml-1 flex-1 min-w-0 cursor-pointer" onClick={handleProfileClick}>
        <div className="flex items-center gap-1">
          <h4 className="font-medium text-newBlack truncate">
            {user.name || user.userName}
          </h4>
          {/* Verified tick for sellers */}
          {user.role === "seller" && (
            <MdVerified size={18} className="text-blue-600 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">@{user.userName}</p>
      </div>
      <div className="ml-2 flex-shrink-0">
        {followStatus ? (
          followStatus === "Following" ? (
            <button 
              onClick={() => handleUnfollow(user.userId)}
              className="btn btn-sm btn-outline bg-slate-200 text-newBlack gap-1 px-2 sm:px-3 sm:gap-2"
            >
              <UserMinus size={16} className="hidden sm:inline" />
              <span className="truncate">Following</span>
            </button>
          ) : followStatus === "Followback" ? (
            <button 
              onClick={() => handleFollow(user.userId)}
              className="btn btn-sm btn-ghost text-newBlack hover:bg-newBlack hover:text-newYellow bg-newYellow gap-1 px-2 sm:px-3 sm:gap-2"
            >
              <UserPlus size={16} className="hidden sm:inline" />
              <span className="truncate">Follow Back</span>
            </button>
          ) : (
            <button 
              onClick={() => handleFollow(user.userId)}
              className="btn btn-sm btn-ghost text-newBlack hover:bg-newBlack hover:text-newYellow bg-newYellow gap-1 px-2 sm:px-3 sm:gap-2"
            >
              <UserPlus size={16} className="hidden sm:inline" />
              <span className="truncate">Follow</span>
            </button>
          )
        ) : null}
      </div>
    </div>
  )
}

export default UserItem