import React, { useState, useEffect, useCallback } from 'react';
import { FaGift } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import socket from '../api/socket';

const GiveAway = ({ streamId, product, signedUrls }) => {
  const [applicants, setApplicants] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [isGiveawayActive, setIsGiveawayActive] = useState(false); // Track if giveaway is active
  const [isGiveawayEnded, setIsGiveawayEnded] = useState(false); // Track if giveaway is ended

  // Initialize state based on initial product prop
  useEffect(() => {
    if (product) {
      setApplicants(product.applicants || []);
      setCurrentWinner(product.winner || null);
      setIsGiveawayActive(product.isActive); // Use isActive from product prop
      setIsGiveawayEnded(product.isGiveawayEnded); // Use isGiveawayEnded from product prop
    }
  }, [product]);

  // Socket.IO event emissions and listeners
  useEffect(() => {
    // Ensure socket is connected to the room
    if (streamId) {
      socket.emit('joinRoom', streamId);
      socket.connect(); // Ensure socket is connected
    }

    // Host proactively starts the giveaway when the component mounts/product changes
    // This will send the state to the backend, which will then broadcast it.
    // Make sure this doesn't restart the giveaway if it's already active/ended.
    if (product && !isGiveawayActive && !isGiveawayEnded) {
      socket.emit('startGiveaway', {
        streamId,
        productId: product.productId._id,
        productTitle: product.productId.title,
        followersOnly: false, // As per your current implementation
      });
      // Optimistically set to active on host side
      setIsGiveawayActive(true);
    }


    const handleGiveawayStarted = (data) => {
      // This is for new connections or re-sync if the giveaway is already active
      if (data.streamId === streamId && data.productId === product.productId._id) {
        setApplicants(data.applicants || []);
        setCurrentWinner(data.winner || null);
        setIsGiveawayActive(data.isActive);
        setIsGiveawayEnded(data.isGiveawayEnded);
      }
    };

    const handleGiveawayApplicantsUpdated = ({ giveawayKey, applicants: updatedApplicants }) => {
      if (giveawayKey === `${streamId}_${product.productId._id}`) {
        setApplicants(updatedApplicants);
      }
    };

    const handleGiveawayWinner = ({ giveawayKey, winner: newWinner }) => {
      if (giveawayKey === `${streamId}_${product.productId._id}`) {
        setCurrentWinner(newWinner);
        setIsGiveawayActive(false); // No longer active once a winner is chosen
        setIsGiveawayEnded(true); // Mark as ended
      }
    };

    // Listen for socket events
    socket.on('giveawayStarted', handleGiveawayStarted);
    socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
    socket.on('giveawayWinner', handleGiveawayWinner);
    socket.on('noApplicants', ({ productId: noApplicantsProductId }) => {
        if (noApplicantsProductId === product.productId._id) {
            console.log("No applicants for this giveaway.");
            alert("No one applied for this giveaway yet!");
            // You might want to update state to reflect this, e.g., disable roll button permanently
        }
    });

    // Cleanup listeners
    return () => {
      socket.off('giveawayStarted', handleGiveawayStarted);
      socket.off('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
      socket.off('giveawayWinner', handleGiveawayWinner);
      socket.off('noApplicants');
      // socket.emit('leaveRoom', streamId); // Consider leaving room if host navigates away
    };
  }, [streamId, product, isGiveawayActive, isGiveawayEnded]); // Re-run if streamId or product changes

  const handleRollAndSelect = useCallback(() => {
    if (isGiveawayEnded || !isGiveawayActive) {
      console.warn('Cannot roll: Giveaway not active or already ended.');
      return;
    }
    socket.emit('rollGiveaway', {
      streamId,
      productId: product.productId._id,
    });
  }, [streamId, product, isGiveawayEnded, isGiveawayActive]);

  if (!product || !product.productId) {
    return <div className="text-white text-center p-4">Loading giveaway product...</div>;
  }

  // Determine button state and text
  const rollButtonDisabled = !isGiveawayActive || applicants.length === 0 || isGiveawayEnded;
  const rollButtonText = isGiveawayEnded
    ? 'Giveaway Ended'
    : applicants.length === 0
      ? 'No Applicants'
      : 'Roll & Select';

  return (
    <div className="w-full max-w-lg mx-auto bg-stone-950 border border-stone-800 shadow-lg rounded-2xl p-6 space-y-6 transition-all">
      {/* Product Card */}
      <div className="flex items-center gap-4 bg-stone-900 p-5 rounded-xl shadow-inner">
        <img
          src={signedUrls[product.productId._id] || "/placeholder.svg"}
          className="w-20 h-20 object-contain rounded-lg border border-stone-700"
          alt={product.productId.title}
        />
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-1">{product.productId.title}</h2>
          <p className="text-sm text-gray-400 line-clamp-2">{product.productId.description}</p>
        </div>
      </div>

      {/* Applicants Section */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-stone-300">Applicants</h4>
        <p className="text-sm text-gray-400">
          <span className="font-bold text-lg">{applicants.length}</span> user(s) applied for this giveaway.
        </p>
      </div>

      {/* Winner Section */}
      <div className="text-center">
        <AnimatePresence>
          {currentWinner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} // Exit animation
              className="flex items-center justify-center gap-2 bg-stone-800 px-4 py-2 rounded-full mt-2 shadow"
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              <p className="text-sm font-medium text-yellow-400">
                Winner: <span className="font-semibold">{currentWinner.name || currentWinner._id}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {isGiveawayEnded && !currentWinner && (
            <p className="text-red-400 text-sm mt-2">No winner selected. This giveaway has ended.</p>
        )}
      </div>

      {/* Roll Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRollAndSelect}
          className={`flex items-center gap-2 px-4 py-2 text-black font-semibold text-sm rounded-full shadow-md transition-all
            ${rollButtonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'}
          `}
          disabled={rollButtonDisabled}
        >
          <FaGift size={14} /> {rollButtonText}
        </button>
      </div>
    </div>
  );
};

export default GiveAway;