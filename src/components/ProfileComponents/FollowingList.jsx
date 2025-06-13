import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFollowApi } from "./useFollowApi"; 
import { useAlert } from "../Alerts/useAlert"; 
import UserItem from "./UserItem"; 


const SkeletonUserItem = () => (
  <div className="flex items-center p-4 animate-pulse">
    <div className="w-10 h-10 bg-gray-300 rounded-full" />
    <div className="ml-4 flex-1 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-1/3" />
      <div className="h-3 bg-gray-300 rounded w-1/2" />
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

        console.log("API following Response:", response);
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
    <div ref={scrollableContainerRef} className="max-h-[60vh] overflow-y-auto">
   
      {/* Search Input */}
      <div className="sticky top-0 bg-white p-4 border-b z-10">
        <input
          type="text"
          placeholder="Search following..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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

      {/* Messages */}
      {!loadingInitial &&
        !loadingMore &&
        following.length === 0 &&
        !hasMore && (
          <div className="p-4 text-center text-gray-500">
            {searchTerm
              ? `No users found matching "${searchTerm}"`
              : "You are not following anyone yet."}
          </div>
        )}
      {!loadingInitial && !loadingMore && following.length > 0 && !hasMore && (
        <div className="p-4 text-center text-gray-500">
          You've reached the end of the list.
        </div>
      )}
    </div>
  );
};

export default FollowingList;
