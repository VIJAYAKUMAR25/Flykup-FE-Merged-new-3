import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiArrowRight, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { FaBell } from "react-icons/fa6";
import axiosInstance from '../../../utils/axiosInstance'; 
import {  COHOST_RECIVE } from '../../api/apiDetails'; 
import { useNavigate } from 'react-router-dom';  
const InviteCard = ({ invite, formatDateTime, handleJoin, handleReject, isPast }) => {
  // Determine status based on API response - corrected 'cancelled' spelling
  const isPending = invite.status === "pending";
  const isLeft = invite.status === "left";
  const isCancelled = invite.status === "cancelled"; // Corrected spelling based on example JSON

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Status indicator bar */}
      <div className={`w-full h-1 ${
        isPending ? 'bg-blue-500' :
        isLeft ? 'bg-gray-500' :
        isCancelled ? 'bg-red-500' : // Use corrected variable
        'bg-gray-300' // Default fallback
      }`}></div>

      <div className="p-4">
        {/* Host info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={invite.host.profileURL || '/default-avatar.png'} // Added fallback image
            alt={invite.host.userName || 'Host'}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
            onError={(e) => e.target.src = '/default-avatar.png'} // Handle broken image links
          />
          <div>
            <p className="font-semibold">{invite.host.userName || 'Unknown Host'}</p>
            <p className="text-xs text-gray-500">{invite.host.companyName || 'No Company'}</p>
          </div>

          {/* Status badge */}
          <div className="ml-auto">
            {isPending && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Active
              </span>
            )}
            {isLeft && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Ended
              </span>
            )}
            {/* Use corrected variable */}
            {isCancelled && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Show Title and Time */}
        <div className="mb-3">
          <h4 className="font-medium">{invite.show.title || 'Untitled Show'}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {invite.show.scheduledAt ? formatDateTime(invite.show.scheduledAt) : 'Date not specified'}
          </p>
        </div>

        {/* Card content in flex container */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Thumbnail with 9:16 aspect ratio */}
          <div className="w-full sm:w-1/3">
             {/* Ensure thumbnail URL exists */}
            {invite.show.thumbnailImageURL ? (
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-200">
                    <img
                        src={invite.show.thumbnailImageURL}
                        alt={invite.show.title || 'Show Thumbnail'}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display='none'} // Hide if image fails to load
                    />
                </div>
             ) : (
                 <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500">
                     No Image
                 </div>
             )}
          </div>

          {/* Status message and actions */}
          <div className="w-full sm:w-2/3 flex flex-col justify-between">
            {/* Status based message */}
            <div> {/* Wrap text in a div for better spacing control */}
                {isPending && (
                <p className="text-sm text-gray-600 mb-4">
                    You've been invited to co-host this live stream. Accept to join or decline to reject.
                </p>
                )}
                {isLeft && (
                <p className="text-sm text-gray-600 mb-4">
                    This livestream has ended.
                </p>
                )}
                {/* Use corrected variable */}
                {isCancelled && (
                <p className="text-sm text-gray-600 mb-4">
                    The host has cancelled this invitation or the show.
                </p>
                )}
            </div>

            {/* Action buttons - Show only for pending invites on the active tab */}
            {isPending && handleJoin && handleReject && !isPast && (
              <div className="flex gap-2 mt-auto pt-2"> {/* Added pt-2 for spacing */}
                <button
                  onClick={() => handleJoin(invite.inviteId)}
                  className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none flex-1"
                >
                  <FiCheck size={16} className="mr-1" /> Accept {/* Added icon margin */}
                </button>
                <button
                  onClick={() => handleReject(invite.inviteId)}
                  className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 border-none flex-1"
                >
                  <FiX size={16} className="mr-1" /> Decline {/* Added icon margin */}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const CohostModal = ({ onProfileUpdate }) => { 
  const [isOpen, setIsOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Added error state
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate(); 
  const openModal = () => {
    setIsOpen(true);
    fetchInvites(); // Fetch invites when modal is opened
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null); // Clear error on close
  }

  const fetchInvites = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axiosInstance.get(COHOST_RECIVE);
      console.log('API Response Data:', response.data); // Log raw response

      // Handle potential structures: direct array or nested in { data: [...] }
      const receivedData = Array.isArray(response.data)
                             ? response.data
                             : (response.data && Array.isArray(response.data.data))
                               ? response.data.data
                               : []; // Default to empty array if structure is unexpected

      // Basic validation: check if items look like invites
      if (receivedData.length > 0 && typeof receivedData[0] === 'object' && receivedData[0] !== null && 'inviteId' in receivedData[0]) {
         console.log('Processed invites:', receivedData);
         setInvites(receivedData);
      } else if (receivedData.length === 0) {
          console.log('Processed invites: API returned empty array or expected data not found.');
          setInvites([]); // Ensure state is empty array
      }
       else {
           console.error('Error: Unexpected data format received.', receivedData);
           setError('Received unexpected data format from the server.');
           setInvites([]); // Set empty on format error
      }

    } catch (err) {
      console.error('Error fetching invites:', err);
      setError(err.response?.data?.message || 'Failed to fetch invitations. Please try again.'); // Set error message
      setInvites([]); // Clear invites on error
    } finally {
      setLoading(false);
    }
  };


  // Optional: If you need to refetch periodically or on some other trigger
  // useEffect(() => {
  //   if (isOpen) {
  //     // fetchInvites(); // Decide if you need refetching while modal is open
  //   }
  // }, [isOpen]); // Dependency array

  const handleJoin = (inviteId) => {
    // Find the corresponding invite
    const invite = invites.find(inv => inv.inviteId === inviteId);
    
    if (invite?.show?.liveStreamId) {
      // Navigate to cohost stream route with liveStreamId
      navigate(`/seller/cohost/${invite.show.liveStreamId}`);
    } else {
      console.error("Invalid invite or missing liveStreamId");
      setError('Could not join stream - invalid invitation');
    }
  };

  const handleReject = (inviteId) => {
    // Implement reject logic here (e.g., call another API endpoint)
    console.log("Rejecting invite:", inviteId);
    // Example: Update state or refetch after rejecting
    // setInvites(prev => prev.filter(inv => inv.inviteId !== inviteId)); // Optimistic update example
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use AM/PM
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
  };

  // Filter invites based on tab - Use corrected 'cancelled' spelling
  const activeInvites = invites.filter(invite => invite && invite.status === "pending");
  const pastInvites = invites.filter(invite => invite && (invite.status === "left" || invite.status === "cancelled")); // Corrected spelling

  // Count of pending invites for notification badge
  const pendingCount = activeInvites.length;

  return (
    <>
      {/* Button to open modal */}
      <button
        onClick={openModal}
        // Applied consistent styling from example if needed
        className="btn btn-sm btn-ghost hover:bg-gradient-to-r hover:from-amber-600 hover:to-yellow-500 text-white border-none shadow-md relative"
        aria-label="Show invitations" // Accessibility
      >
        <FaBell size={20} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"> {/* Added simple fade-in */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="modal-box bg-gray-50 rounded-lg max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col" // Adjusted max-width and layout
            role="dialog" // Accessibility
            aria-modal="true" // Accessibility
            aria-labelledby="modal-title" // Accessibility
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                 <h3 id="modal-title" className="font-bold text-lg">Show Invitations</h3>
                 <button
                    className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:bg-gray-200"
                    onClick={closeModal}
                    aria-label="Close modal" // Accessibility
                >
                    <FiX size={20} />
                 </button>
            </div>


            {/* Tabs */}
            <div className="flex border-b shrink-0"> {/* Tabs should not shrink */}
              <button
                className={`flex-1 py-2 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('active')}
                role="tab" // Accessibility
                aria-selected={activeTab === 'active'} // Accessibility
              >
                Active
                {pendingCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 py-2 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${activeTab === 'past' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('past')}
                 role="tab" // Accessibility
                 aria-selected={activeTab === 'past'} // Accessibility
              >
                Past
                {pastInvites.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {pastInvites.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-grow overflow-y-auto"> {/* This part scrolls */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loading loading-spinner loading-lg text-blue-600"></div>
                </div>
              ) : error ? ( // Display error message
                 <div className="text-center py-16 text-red-600">
                     <FiAlertTriangle className="mx-auto text-red-400" size={40} />
                     <p className="mt-4 font-medium">Error</p>
                     <p className="mt-1 text-sm text-red-500">{error}</p>
                 </div>
              ) :(
                <div className="space-y-4"> {/* Use space-y for spacing between cards */}
                  {activeTab === 'active' ? (
                    // Active Tab Content
                    activeInvites.length === 0 ? (
                      <div className="text-center py-16">
                        <FiClock className="mx-auto text-gray-400" size={40} />
                        <p className="mt-4 text-gray-500">No active invitations found.</p>
                      </div>
                    ) : (
                      // Map through active invites
                      activeInvites.map((invite) => (
                        <InviteCard
                          key={invite.inviteId}
                          invite={invite}
                          formatDateTime={formatDateTime}
                          handleJoin={handleJoin}
                          handleReject={handleReject}
                          isPast={false} // Explicitly pass false for active tab
                        />
                      ))
                    )
                  ) : (
                    // Past Tab Content
                    pastInvites.length === 0 ? (
                      <div className="text-center py-16">
                        <FiAlertTriangle className="mx-auto text-gray-400" size={40} />
                        <p className="mt-4 text-gray-500">No past invitations found.</p>
                      </div>
                    ) : (
                      // Map through past invites
                      pastInvites.map((invite) => (
                        <InviteCard
                          key={invite.inviteId}
                          invite={invite}
                          formatDateTime={formatDateTime}
                          // No join/reject handlers for past invites
                          isPast={true} // Explicitly pass true for past tab
                        />
                      ))
                    )
                  )}
                </div>
              )}
            </div> {/* End Content Area */}

          </motion.div>
        </div>
      )}
    </>
  );
};

export default CohostModal;