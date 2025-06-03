import React, { useState, useEffect, useCallback, useRef } from 'react';
// === Unga project ku correct imports ===
import { useFollowApi } from './useFollowApi'; // getFollowers irukkanum
import { useAlert } from '../Alerts/useAlert';
import UserItem from './UserItem';
// =====================================

const SkeletonUserItem = () => ( /* ... Skeleton JSX ... */
    <div className="flex items-center p-4 animate-pulse">
        <div className="w-10 h-10 bg-gray-300 rounded-full" />
        <div className="ml-4 flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/3" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
        </div>
    </div>
);


// === FollowersList Component (Optimized) ===
const FollowersList = ({ userId }) => {
    // API Hooks (Ensure getFollowers is available)
    const { getFollowers, followUser, unfollowUser } = useFollowApi();
    const { positive, negative } = useAlert();

    // State (Adapted for Followers)
    const [followers, setFollowers] = useState([]); // <- followers state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const pageLimit = 20;

    // Refs
    const scrollableContainerRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const isApiCallLocked = useRef(false); // Ref lock
    const throttleTimeoutRef = useRef(null); // Scroll throttle ref
    const pageRef = useRef(page);
    const hasMoreRef = useRef(hasMore);
    // Ref for the fetch function
    const loadFollowersRef = useRef(null); // Initialize with null

    // --- Data Fetching Function (loadFollowers) ---
    // *** Define loadFollowers BEFORE loadFollowersRef initialization ***
    const loadFollowers = useCallback(async (currentPage, isSearchReset = false) => {
        if (!isSearchReset && (loadingMore || !hasMore)) {
            
             return;
        }
        if (isSearchReset) { setLoadingInitial(true); setLoadingMore(false); }
        else { setLoadingMore(true); } // Skeleton ON for pagination

        try {
           
            const response = await getFollowers(userId, searchTerm, currentPage);

            if (response?.error) { console.error("API Error (Followers):", response.error); negative('Failed load followers'); setHasMore(false); return; }

            // *** Use correct response keys for followers ***
            const newFollowers = response?.data?.followers || [];
            const filteredCount = response?.data?.filteredFollowersCount || 0;
            // =========================================
            const calculatedTotalPages = Math.ceil(filteredCount / pageLimit);
            const moreDataExists = currentPage < calculatedTotalPages;
            setHasMore(moreDataExists);

            // *** Update followers state ***
            setFollowers(prev => isSearchReset ? newFollowers : [...prev, ...newFollowers]); // Append

            if (moreDataExists) { setPage(currentPage + 1); } // Increment page state

        } catch (error) { console.error("Catch Error (Followers):", error); negative('Failed load followers'); setHasMore(false); }
        finally {
            if (isSearchReset) { setLoadingInitial(false); }
            else {
                setLoadingMore(false); // Skeleton OFF
              
                isApiCallLocked.current = false;
            }
        }
    // Dependencies for fetch logic
    }, [userId, searchTerm, getFollowers, negative, loadingMore, hasMore, page, pageLimit]); // Added page dependency

    // *** Initialize loadFollowersRef AFTER loadFollowers is defined ***
    loadFollowersRef.current = loadFollowers; // Keep ref updated with the latest memoized function
    // ============================================================


    // Effects to sync state refs
    useEffect(() => { pageRef.current = page; }, [page]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);


    // --- Effect for Search Debounce ---
    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            setFollowers([]); setPage(1); setHasMore(true); // <- Use setFollowers
            isApiCallLocked.current = false; // Reset lock
            // *** Call via ref ***
            if (loadFollowersRef.current) { // Ensure ref is set
                 loadFollowersRef.current(1, true);
            }
        }, searchTerm ? 400 : 200);
        return () => clearTimeout(debounceTimeoutRef.current);
    // Only depends on searchTerm
    }, [searchTerm]);


    // --- Scroll Handler (Stable - Uses Refs Internally) ---
    // *** Exactly same logic as FollowingList, uses refs ***
    const handleScroll = useCallback(() => {
        if (throttleTimeoutRef.current) return; // Throttle active

        throttleTimeoutRef.current = setTimeout(() => {
            throttleTimeoutRef.current = null; // Clear throttle timeout ref

            const container = scrollableContainerRef.current;
            if (!container) return;

            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;
            const scrollThreshold = 150;
            const nearBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;

            // Read latest values from refs
            const currentPage = pageRef.current;
            const currentHasMore = hasMoreRef.current;

           
            // Condition Check uses REFs and LOCK
            if (nearBottom && currentHasMore && !isApiCallLocked.current) {

                isApiCallLocked.current = true; // Lock
                // *** Call function via REF ***
                 if (loadFollowersRef.current) { // Ensure ref is set
                     loadFollowersRef.current(currentPage, false);
                 }
            } else if (nearBottom && currentHasMore && isApiCallLocked.current) {
              
            }
        }, 150); // Throttle delay
    }, []); // <<< NO DEPENDENCIES HERE! handleScroll is stable


    // --- Effect to Add/Remove Scroll Listener (Stable) ---
    // *** Exactly same logic as FollowingList ***
    useEffect(() => {
        const container = scrollableContainerRef.current;
        let listenerAttached = false;
        if (container) {
            listenerAttached = true;
            container.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (listenerAttached && container) {
                container.removeEventListener('scroll', handleScroll);
               
            }
            if (throttleTimeoutRef.current) { clearTimeout(throttleTimeoutRef.current); }
        };
    }, [handleScroll]); // Depends only on stable handleScroll


    // --- Follow/Unfollow Handlers (Update followers state) ---
    const handleFollow = useCallback(async (targetUserId) => {
        const updateFollowersState = (status, countChange) =>
            setFollowers(prev => prev.map(user => user.userId === targetUserId ? { ...user, followStatus: status /*, followersCount: ... */ } : user )); // <- Use setFollowers
        updateFollowersState('Following', 1); try { await followUser(targetUserId); positive('Followed'); } catch (error) { updateFollowersState('Follow', -1); negative('Failed follow');}
    }, [followUser, positive, negative]);

    const handleUnfollow = useCallback(async (targetUserId) => {
         const updateFollowersState = (status, countChange) =>
            setFollowers(prev => prev.map(user => user.userId === targetUserId ? { ...user, followStatus: status /*, followersCount: ... */ } : user )); // <- Use setFollowers
        updateFollowersState('Follow', -1); try { await unfollowUser(targetUserId); positive('Unfollowed'); } catch (error) { updateFollowersState('Following', 1); negative('Failed unfollow');}
    }, [unfollowUser, positive, negative]);


    // --- Component Rendering ---
    return (
        // <<< Attach ref to the scrollable div >>>
        <div ref={scrollableContainerRef} className="max-h-[60vh] overflow-y-auto">

            {/* Search Input */}
            <div className="sticky top-0 bg-white p-4 border-b z-10">
                <input type="text" placeholder="Search followers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Initial Loading */}
            {loadingInitial && ( Array.from({ length: 5 }).map((_, i) => ( <SkeletonUserItem key={`skel-init-follower-${i}`} /> )) )}

            {/* === Followers List === */}
            {!loadingInitial && followers.map((user) => (
                <UserItem
                    key={`follower-${user.userId}`} // <- Updated key
                    user={user}
                    onFollow={() => handleFollow(user.userId)}
                    onUnfollow={() => handleUnfollow(user.userId)} />
            ))}

            {/* Pagination Skeleton */}
            {loadingMore && ( Array.from({ length: 2 }).map((_, i) => ( <SkeletonUserItem key={`skel-more-follower-${i}`} /> )) )}

            {/* Messages */}
            {!loadingInitial && !loadingMore && followers.length === 0 && !hasMore && ( <div className="p-4 text-center text-gray-500">{searchTerm ? `No followers found matching "${searchTerm}"` : 'No followers yet.'}</div> )}
            {!loadingInitial && !loadingMore && followers.length > 0 && !hasMore && ( <div className="p-4 text-center text-gray-500">You've reached the end of the list.</div> )}
        </div>
    );
};

export default FollowersList;