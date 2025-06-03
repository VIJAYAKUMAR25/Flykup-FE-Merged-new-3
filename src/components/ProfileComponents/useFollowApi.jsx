import { useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { PAGINATED_FOLLOWERS, PAGINATED_FOLLOWINGS } from "../api/apiDetails";

export const useFollowApi = () => {
  
  const getFollowers = useCallback(async (userId, searchTerm, page) => {
    try {
      const response = await axiosInstance.get(PAGINATED_FOLLOWERS, {
        params: { userId, userName: searchTerm, page },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching followers:", error);
      return { error: "Failed to fetch followers" };
    }
  }, []);

  const getFollowing = useCallback(async (userId, searchTerm, page) => {
    try {
      const response = await axiosInstance.get(PAGINATED_FOLLOWINGS, {
        params: { userId, userName: searchTerm, page },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching following:", error);
      return { error: "Failed to fetch following" };
    }
  }, []);

  const followUser = useCallback(async (userId) => {
    return await axiosInstance.post("follow", { targetUserId: userId });
  }, []);

  const unfollowUser = useCallback(async (userId) => {
    return await axiosInstance.delete("follow", {
      data: { targetUserId: userId },
    });
  }, []);

  return { getFollowers, getFollowing, followUser, unfollowUser };
};
