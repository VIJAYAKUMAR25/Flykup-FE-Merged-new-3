// CohostSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUserPlus,
  FiCheck,
  FiUsers
} from 'react-icons/fi';
import CoHostSearchModal from './CoHostSearchModal';

const CohostSelector = ({
  onCoHostSelect = () => {},
  onClearCoHost = () => {},
  isSubmitting = false,
  isUploading = false,
  initialHasCoHost = false,
  initialCoHost = null
}) => {
  const [hasCoHost, setHasCoHost] = useState(initialHasCoHost);
  // selectedCoHost will now store the original key, but getProfileImage will be used for display
  const [selectedCoHost, setSelectedCoHost] = useState(initialCoHost);
  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Effect to sync state with props from edit page
  useEffect(() => {
    setHasCoHost(initialHasCoHost);
    if (initialCoHost) {
      setSelectedCoHost({
        ...initialCoHost,
        // When initializing, ensure profileURL is the key, and getProfileImage is used for display
        profileURL: initialCoHost.profileURL, // Keep this as the key
        displayProfileURL: initialCoHost.profileURL ? getProfileImage(initialCoHost.profileURL) : null, // For display
      });
    } else {
      setSelectedCoHost(null);
    }
  }, [initialHasCoHost, initialCoHost, cdnURL]);

  const handleToggle = (e) => {
    const isChecked = e.target.checked;
    setHasCoHost(isChecked);
    if (isChecked) {
      setIsModalOpen(true);
    } else {
      setSelectedCoHost(null);
      onClearCoHost();
      setIsModalOpen(false);
    }
  };

  const handleSelectCoHostFromModal = (user) => {
    // 'user' received from modal now has profileURL as the key and displayProfileURL as the CDN link.
    // Store the key in selectedCoHost, but use displayProfileURL for immediate rendering.
    const coHostDetails = {
      userId: user.userId,
      userName: user.userName,
      role: user.role || 'seller',
      profileURL: user.profileURL, // This is the S3 key, which you want to submit
      companyName: user.companyName,
      sellerType: user.sellerType,
      displayProfileURL: user.displayProfileURL, // Use for local display
    };
    setSelectedCoHost(coHostDetails);
    onCoHostSelect(coHostDetails); // Notify parent component with the key in profileURL
    setIsModalOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedCoHost(null);
    onClearCoHost();
  };

  const getUserInitials = (userName) => (userName || '').slice(0, 2).toUpperCase() || '??';

  // This function is purely for constructing the *display* URL
  const getProfileImage = (profileURLKey) => {
    if (profileURLKey) {
      return `${cdnURL}${profileURLKey}`;
    }
    return null;
  };

  const toggleVariants = {
    checked: {
      backgroundColor: '#3B82F6',
      transition: { duration: 0.2 }
    },
    unchecked: {
      backgroundColor: '#E5E7EB',
      transition: { duration: 0.2 }
    }
  };

  const switchVariants = {
    checked: { x: 24 },
    unchecked: { x: 2 }
  };

  return (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blackDark p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-newYellow">Co-host Settings</h3>
                <p className="text-sm text-whiteHalf">Add a co-host to collaborate on your show</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-whiteLight">
                {hasCoHost ? 'Enabled' : 'Disabled'}
              </span>
              <motion.div
                className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${hasCoHost ? 'bg-yellow-400' : 'bg-yellow-200'}`}
                variants={toggleVariants}
                animate={hasCoHost ? 'checked' : 'unchecked'}
                onClick={(e) => {
                  if (!isSubmitting && !isUploading) {
                    handleToggle({ target: { checked: !hasCoHost } });
                  }
                }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-newYellow rounded-full shadow-md"
                  variants={switchVariants}
                  animate={hasCoHost ? 'checked' : 'unchecked'}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hasCoHost && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-2">
                {selectedCoHost ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-yellowHalf rounded-xl p-6 border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {/* Use selectedCoHost.displayProfileURL for rendering */}
                          {selectedCoHost.displayProfileURL ? (
                            <img
                              src={selectedCoHost.displayProfileURL}
                              alt={selectedCoHost.userName}
                              className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
                              {getUserInitials(selectedCoHost.userName)}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <FiCheck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-whiteLight text-lg">
                            {selectedCoHost.companyName || selectedCoHost.userName}
                          </h4>
                          <p className="text-newYellow font-medium">@{selectedCoHost.userName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-1 bg-blackLight text-whiteLight text-xs rounded-full font-medium">
                              {selectedCoHost.role}
                            </span>
                            {selectedCoHost.sellerType && (
                              <span className="px-2 py-1 bg-blackLight text-whiteLight text-xs rounded-full font-medium">
                                {selectedCoHost.sellerType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleClearSelection}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors duration-200"
                        disabled={isSubmitting || isUploading}
                      >
                        <FiX className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <FiUserPlus className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-md font-medium text-center">
                      Click the toggle to select a co-host.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CoHostSearchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelectCoHost={handleSelectCoHostFromModal}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CohostSelector;