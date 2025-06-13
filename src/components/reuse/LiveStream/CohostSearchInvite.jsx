import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosInstance';
import useDebounce from '../../../customHooks/useDebounce.js';
import { motion, AnimatePresence } from 'framer-motion';
import { COHOST_SEARCH, ACTIVE_COHOST, ACTIVE_COHOST_REMOVE } from '../../api/apiDetails.js';

const CohostSearchInvite = ({ onInvite, onClose, showId }) => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCohost, setActiveCohost] = useState(null);
  const debouncedSearchText = useDebounce(searchText, 500);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedSearchText) return;
      
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(COHOST_SEARCH, {
          params: { search: debouncedSearchText }
        });
        console.log('API Response Data:', response.data);
        const receivedData = response.data?.data || [];
        const filteredUsers = receivedData.filter(user => 
          !activeCohost || user.userId !== activeCohost.cohost.userId
        );
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearchText, activeCohost]);

  // Fetch active cohost information
  const fetchActiveInvites = async () => {
    try {
      const response = await axiosInstance.get(
        ACTIVE_COHOST.replace(":showId", showId.showId)
      );
      
      // Handle both array and object response formats
      const receivedData = Array.isArray(response.data?.data) ? 
        response.data.data : 
        response.data?.data?.data || [];

      // Find the first valid invite (pending or accepted)
      const currentInvite = receivedData.find(invite => 
        ['pending', 'accepted'].includes(invite.status)
      );
      
      setActiveCohost(currentInvite || null);
    } catch (err) {
      console.error('Error fetching invites:', err);
      setActiveCohost(null);
    }
  };

  useEffect(() => {
    fetchActiveInvites();
  }, [showId]);

  // Remove cohost functionality
  const handleRemoveCohost = async (inviteId) => {
    try {
      await axiosInstance.patch(
        ACTIVE_COHOST_REMOVE.replace(":inviteId", inviteId)
      );
      await fetchActiveInvites(); // Refresh after removal
    } catch (error) {
      console.error('Error removing co-host:', error);
    }
  };

  // Helper functions
  const getUserInitials = (userName) => {
    const cleanName = (userName || '').replace(/[^a-zA-Z0-9]/g, '');
    return cleanName.slice(0, 2).toUpperCase() || '??';
  };

  const getProfileImage = (profileURL) => {
    return profileURL?.jpgURL || profileURL?.azureUrl || null;
  };

  // Skeleton loading component
  const UserSkeleton = () => (
    <div className="flex items-center justify-between p-2 animate-pulse">
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="w-16 h-8 bg-gray-200 rounded-md"></div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Active Cohost Display */}
      <AnimatePresence>
        {activeCohost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-newYellow flex-shrink-0 overflow-hidden">
                  {getProfileImage(activeCohost.cohost.profileURL) ? (
                    <img
                      src={getProfileImage(activeCohost.cohost.profileURL)}
                      alt={activeCohost.cohost.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-newBlack flex items-center justify-center text-newYellow font-medium">
                      {getUserInitials(activeCohost.cohost.userName)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-newBlack">
                    {activeCohost.cohost.companyName}
                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {activeCohost.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    @{activeCohost.cohost.userName}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemoveCohost(activeCohost.inviteId)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium shadow-sm hover:bg-red-600 transition-colors"
              >
                {activeCohost.status === 'pending' ? 'Cancel' : 'Remove'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Section */}
      <div className="relative">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search co-hosts by name or company..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-newYellow bg-white text-newBlack"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <span className="loading loading-spinner loading-sm text-newYellow"></span>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-100 shadow-sm">
        <AnimatePresence>
          {isLoading ? (
            Array(3).fill(0).map((_, index) => (
              <UserSkeleton key={`skeleton-${index}`} />
            ))
          ) : users?.length > 0 ? (
            users.map((user) => (
              <motion.div 
                key={user.userId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 z-0 rounded-full border-2 border-newYellow flex-shrink-0 overflow-hidden">
                    {getProfileImage(user.profileURL) ? (
                      <img
                        src={getProfileImage(user.profileURL)}
                        alt={user.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-newBlack flex items-center justify-center text-newYellow font-medium">
                        {getUserInitials(user.userName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-newBlack truncate">
                        {user.companyName}
                      </p>
                      {user.sellerType && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {user.sellerType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{user.userName}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvite(user.userId);
                    fetchActiveInvites(); // Refresh active cohost after invite
                  }}
                  className="px-3 py-1.5 bg-newYellow text-newBlack rounded-md hover:bg-yellow-400 text-sm font-medium shadow-sm"
                >
                  Invite
                </motion.button>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-gray-500"
            >
              {debouncedSearchText ? (
                <>
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No users found matching "{debouncedSearchText}"</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">👋</div>
                  <p>Start typing to search for co-hosts</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CohostSearchInvite;