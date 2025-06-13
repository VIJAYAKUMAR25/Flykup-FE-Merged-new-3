// CoHostSearchModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiAlertCircle,
  FiSearch,
  FiUser,
} from 'react-icons/fi';
import { Loader2 } from 'lucide-react';

import axiosInstance from '../../../utils/axiosInstance';
import useDebounce from '../../../customHooks/useDebounce.js';
import { COHOST_SEARCH } from '../../api/apiDetails.js';

const CoHostSearchModal = ({ isOpen, onClose, onSelectCoHost, isSubmitting, isUploading }) => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearchText = useDebounce(searchText, 500);
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  useEffect(() => {
    if (!debouncedSearchText || debouncedSearchText.length < 3) {
      setUsers([]);
      if (error && debouncedSearchText.length < 3) setError(null);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(COHOST_SEARCH, {
          params: { search: debouncedSearchText }
        });
        console.log('Search response:', response.data);
        const receivedData = response.data?.data || [];
        // Store the original profileURL (key) for submission
        // Create a displayProfileURL for rendering
        setUsers(receivedData.map(user => ({
          ...user,
          _id: user.userId, // Using userId as _id for consistency with your schema
          displayProfileURL: user.profileURL ? getProfileImage(user.profileURL) : null // For display
        })));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to search for users.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearchText, error, cdnURL]);

  useEffect(() => {
    if (!isOpen) {
      setSearchText('');
      setUsers([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  const getUserInitials = (userName) => (userName || '').slice(0, 2).toUpperCase() || '??';

  // This function is purely for constructing the *display* URL
  const getProfileImage = (profileURLKey) => {
    if (profileURLKey) {
      return `${cdnURL}${profileURLKey}`;
    }
    return null;
  };

  const handleSelect = (user) => {
    onSelectCoHost({
      userId: user.userId,
      userName: user.userName,
      role: user.role,
      profileURL: user.profileURL,
      companyName: user.companyName,
      sellerType: user.sellerType,
    });
    onClose();
  };

  const UserSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center p-4 space-x-3"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-2/3 animate-pulse"></div>
      </div>
    </motion.div>
  );

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } },
    exit: { y: "100vh", opacity: 0, transition: { duration: 0.3 } }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-blackDark rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-newYellow">Select a Co-host</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full bg-amber-200 hover:bg-whiteHalf  transition-colors"
          >
            <FiX className="w-6 h-6 text-blackDark" />
          </motion.button>
        </div>

        <div className="p-3 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'transform scale-[1.02]' : ''}`}>
              <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${isSearchFocused ? 'text-whiteLight' : 'text-whiteLight'}`} />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search by username or company (min 3 characters)..."
                className={`w-full pl-12 pr-12 py-2 border-2 rounded-full bg-blackDark focus:bg-blackDark text-whiteLight focus:text-newYellow transition-all duration-200 placeholder-gray-500 ${isSearchFocused
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                disabled={isSubmitting || isUploading}
              />
              {isLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
              )}
            </div>
          </div>
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
              >
                <FiAlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Container */}
          <div className="bg-yellowHalf rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="divide-y divide-gray-100">
                  {Array(3).fill(0).map((_, i) => (
                    <UserSkeleton key={i} />
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {users.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(user)}
                      className="bg-white rounded-lg border border-gray-200 p-2 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200 group"
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        {user.displayProfileURL ? ( // Use displayProfileURL for rendering
                          <img
                            src={user.displayProfileURL}
                            alt={user.userName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blackDark rounded-full flex items-center justify-center font-bold text-newYellow text-xl border-2 border-newYellow group-hover:border-blue-400 transition-all duration-200">
                            {getUserInitials(user.userName)}
                          </div>
                        )}

                        <div className="w-full">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                            {user.companyName || user.userName}
                          </h4>
                          <p className="text-gray-500 text-sm">@{user.userName}</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {user.role}
                          </span>
                          {user.sellerType && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              {user.sellerType}
                            </span>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          className="w-full px-4 py-2 text-sm bg-blackDark hover:bg-newYellow hover:text-blackDark text-newYellow rounded-full font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          Select
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                debouncedSearchText.length > 2 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-gray-500"
                  >
                    <FiUser className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </motion.div>
                )
              )}
              {/* Message for when search text is too short */}
              {debouncedSearchText.length < 3 && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FiSearch className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Start typing to search for co-hosts</p>
                  <p className="text-sm">Enter at least 3 characters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CoHostSearchModal;