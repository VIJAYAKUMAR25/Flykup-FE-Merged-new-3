import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFollowApi } from "./useFollowApi"; 
import { useAlert } from "../Alerts/useAlert"; 
import UserItem from "./UserItem"; 


const SkeletonUserItem = () => (
  <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 animate-pulse border-b border-gray-300">
    {/* Left section - Avatar and placeholder text */}
    <div className="flex items-center flex-1 min-w-0 mr-3 sm:mr-4">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-300 rounded-full border-2 border-yellow-400 flex-shrink-0" />
      
      {/* Text skeleton */}
      <div className="ml-3 sm:ml-4 flex-1 space-y-2">
        <div className="h-3 sm:h-4 bg-gray-300 rounded w-1/3 max-w-[120px]" />
        <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2 max-w-[100px]" />
        <div className="h-2 bg-gray-100 rounded w-1/4 max-w-[60px] hidden sm:block" />
      </div>
    </div>
    
    {/* Button skeleton */}
    <div className="flex-shrink-0">
      <div className="h-8 sm:h-10 bg-gray-300 rounded-full w-16 sm:w-20 md:w-24" />
    </div>
  </div>
);

const FollowingList = ({ userId }) => {
  // Hooks
  const { getFollowing, followUser, unfollowUser } = useFollowApi();
  const { positive, negative } = useAlert();

  // State
  const [following, setFollowing] = useState([]);
  const [page, setPage] = useState(1); 
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");

  const pageLimit = 20;

  const scrollableContainerRef = useRef(null); 
  const debounceTimeoutRef = useRef(null); 
  const isApiCallLocked = useRef(false); 
  const throttleTimeoutRef = useRef(null); 
  const pageRef = useRef(page); 
  const hasMoreRef = useRef(hasMore); 
  const loadFollowingRef = useRef(null);

  const loadFollowing = useCallback(
    async (currentPage, isSearchReset = false) => {
      if (!isSearchReset && (loadingMore || !hasMore)) {
        return;
      }
      if (isSearchReset) {
        setLoadingInitial(true);
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      } // Skeleton ON

      try {
       
        const response = await getFollowing(userId, searchTerm, currentPage); 

        if (response?.error) {
             console.error(
            "API Error:",
            response.error
          );
          negative("Failed load");
          setHasMore(false);
          return;
        }

        const newFollowing = response?.data?.following || [];
        const filteredCount = response?.data?.filteredFollowingCount || 0;
        const calculatedTotalPages = Math.ceil(filteredCount / pageLimit);
        const moreDataExists = currentPage < calculatedTotalPages;
        setHasMore(moreDataExists);
        // Append Data correctly
        setFollowing((prev) =>
          isSearchReset ? newFollowing : [...prev, ...newFollowing]
        );
        if (moreDataExists) {
          setPage(currentPage + 1);
        } 
      } catch (error) {
 console.error("Catch Error:", error);
        negative("Failed load");
        setHasMore(false);
      } finally {
        if (isSearchReset) {
          setLoadingInitial(false);
        } else {
          setLoadingMore(false);

          isApiCallLocked.current = false;
        }
      }

    },
    [
      userId,
      searchTerm,
      getFollowing,
      negative,
      loadingMore,
      hasMore,
      page,
      pageLimit,
    ]
  );

  useEffect(() => {
    loadFollowingRef.current = loadFollowing;
  }, [loadFollowing]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(
      () => {
        setFollowing([]);
        setPage(1);
        setHasMore(true);
        isApiCallLocked.current = false;
        if (loadFollowingRef.current) {
          loadFollowingRef.current(1, true);
        }
      },
      searchTerm ? 400 : 200
    );
    return () => clearTimeout(debounceTimeoutRef.current);
   
  }, [searchTerm]);


  const handleScroll = useCallback(() => {
    if (throttleTimeoutRef.current) return; 

    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null; 

      const container = scrollableContainerRef.current;
      if (!container) return;

      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const scrollThreshold = 150;
      const nearBottom =
        scrollHeight - scrollTop - clientHeight < scrollThreshold;

      const currentPage = pageRef.current;
      const currentHasMore = hasMoreRef.current;

      if (nearBottom && currentHasMore && !isApiCallLocked.current) {
     
        isApiCallLocked.current = true; 
      
        if (loadFollowingRef.current) {
          loadFollowingRef.current(currentPage, false); 
        }
      } else if (nearBottom && currentHasMore && isApiCallLocked.current) {
       
      }
    }, 150); 
  }, []); 

  useEffect(() => {
    const container = scrollableContainerRef.current;
    let listenerAttached = false;
    if (container) {
      listenerAttached = true;
      container.addEventListener("scroll", handleScroll);
    
    }
    return () => {
      if (listenerAttached && container) {
        container.removeEventListener("scroll", handleScroll);
       
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [handleScroll]); // Depends only on stable handleScroll

  // --- Follow/Unfollow Handlers (Stable) ---
  const handleFollow = useCallback(
    async (targetUserId) => {
      /* ... */
      const updateFollowingState = (status, countChange) =>
        setFollowing((prev) =>
          prev.map((user) =>
            user.userId === targetUserId
              ? {
                  ...user,
                  followStatus: status,
                  followersCount: (user.followersCount || 0) + countChange,
                }
              : user
          )
        );
      updateFollowingState("Following", 1);
      try {
        await followUser(targetUserId);
        positive("Followed");
      } catch (error) {
        updateFollowingState("Follow", -1);
        negative("Failed follow");
      }
    },
    [followUser, positive, negative]
  );

  const handleUnfollow = useCallback(
    async (targetUserId) => {
      /* ... */
      const updateFollowingState = (status, countChange) =>
        setFollowing((prev) =>
          prev.map((user) =>
            user.userId === targetUserId
              ? {
                  ...user,
                  followStatus: status,
                  followersCount: Math.max(
                    0,
                    (user.followersCount || 0) + countChange
                  ),
                }
              : user
          )
        );
      updateFollowingState("Follow", -1);
      try {
        await unfollowUser(targetUserId);
        positive("Unfollowed");
      } catch (error) {
        updateFollowingState("Following", 1);
        negative("Failed unfollow");
      }
    },
    [unfollowUser, positive, negative]
  );

  // --- Component Rendering ---
  return (
    // <<< Attach ref to the scrollable div >>>
    <div 
      ref={scrollableContainerRef} 
      className="w-full max-w-none sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] overflow-y-auto  rounded-lg sm:rounded-xl  border border-blackLight/40"
    >
   
   {/* Search Input */}
      <div className="sticky top-0 border-b border-gray-700/50 z-10 backdrop-blur-sm">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 md:py-2.5 bg-blackLight border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="min-h-[200px]">
        {/* Initial Loading */}
        {loadingInitial &&
          Array.from({ length: 5 }).map((_, i) => (
            <SkeletonUserItem key={`skel-init-following-${i}`} />
          ))}

        {/* === Following List === */}
        {!loadingInitial &&
          following.map((user) => (
            <UserItem
              key={`following-${user.userId}`} // Key specific to following
              user={user}
              onFollow={() => handleFollow(user.userId)}
              onUnfollow={() => handleUnfollow(user.userId)}
            />
          ))}

        {/* Pagination Skeleton */}
        {loadingMore &&
          Array.from({ length: 2 }).map((_, i) => (
            <SkeletonUserItem key={`skel-more-following-${i}`} />
          ))}

        {/* Empty State Messages */}
        {!loadingInitial &&
          !loadingMore &&
          following.length === 0 &&
          !hasMore && (
            <div className="p-6 sm:p-8 md:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blackLight rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-whiteHalf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-whiteLight text-lg sm:text-xl font-bold mb-2">
                  {searchTerm ? "No users found" : "No following yet"}
                </h3>
                <p className="text-whiteHalf text-sm sm:text-base leading-relaxed">
                  {searchTerm
                    ? `No users found matching "${searchTerm}". Try a different search term.`
                    : "You haven't followed anyone yet. Start exploring to find interesting people to follow!"}
                </p>
              </div>
            </div>
          )}

        {/* End of List Message */}
        {!loadingInitial && !loadingMore && following.length > 0 && !hasMore && (
          <div className="p-4 sm:p-6 text-center border-t border-blackLight/30 bg-blackLight/20">
            <div className="flex items-center justify-center gap-2 text-whiteHalf text-xs sm:text-sm">
              <div className="w-8 sm:w-12 h-px bg-whiteHalf/30"></div>
              <span className="px-2 sm:px-3 whitespace-nowrap">You've reached the end</span>
              <div className="w-8 sm:w-12 h-px bg-whiteHalf/30"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingList;