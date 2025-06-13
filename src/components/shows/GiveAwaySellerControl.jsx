// GiveAwaySellerControl.jsx (Seller Side)
import React, { useState, useEffect, useCallback } from 'react';
import { FaGift } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
// import socket from '../api/socket'; // Remove this as socket is passed as prop
import { toast } from 'react-toastify'; 

const GiveAwaySellerControl = ({
    streamId,
    product, // This `product` prop will now be the `currentLiveGiveaway` object from ShowDetailsSeller
    signedUrls,
    socket, // Receive socket as a prop
    setCurrentLiveGiveaway, // Function to update the parent's currentLiveGiveaway state
    fetchShow, // Function to refetch the main show data
}) => {
    // Local states initialized from props for immediate UI rendering
    const [applicants, setApplicants] = useState(product.applicants || []);
    const [currentWinner, setCurrentWinner] = useState(product.winner || null);
    const [isGiveawayActive, setIsGiveawayActive] = useState(product.isActive);
    const [isGiveawayEnded, setIsGiveawayEnded] = useState(product.isGiveawayEnded);
    const [productTitle, setProductTitle] = useState(product.productTitle || product.productId?.title || 'Unknown Product');

    // Update local states when `product` prop changes from the parent
    // This is vital as the parent `ShowDetailsSeller` will update `currentLiveGiveaway`
    // which in turn updates these `product` props.
    useEffect(() => {
        if (product) {
            setApplicants(product.applicants || []);
            setCurrentWinner(product.winner || null);
            setIsGiveawayActive(product.isActive);
            setIsGiveawayEnded(product.isGiveawayEnded);
            setProductTitle(product.productTitle || product.productId?.title || 'Unknown Product');
        } else {
            // If product becomes null (giveaway ended and currentGiveaway cleared in parent)
            setApplicants([]);
            setCurrentWinner(null);
            setIsGiveawayActive(false);
            setIsGiveawayEnded(true);
            setProductTitle('No Active Giveaway');
        }
    }, [product]);

    // Socket.IO event listeners for real-time updates for THIS active giveaway
    useEffect(() => {
        if (!socket || !streamId || !product || !product.productId) return;

        const handleGiveawayApplicantsUpdated = (data) => {
            console.log("Giveaway applicants updated data seller side From Socket BE:", data.applicants);
            // Ensure this update is for the currently displayed active giveaway
            if (data.streamId === streamId && (data.productId._id || data.productId) === (product.productId._id || product.productId)) {
                setApplicants(data.applicants || []);
                // Also update the parent's state for consistency
                setCurrentLiveGiveaway(prev => ({
                    ...prev,
                    applicants: data.applicants || [],
                }));
            }
        };

        const handleGiveawayWinner = (data) => {
            if (data.streamId === streamId && (data.productId._id || data.productId) === (product.productId._id || product.productId)) {
                setCurrentWinner(data.winner);
                setIsGiveawayActive(false);
                setIsGiveawayEnded(true);
                // The parent's `fetchShow` will handle setting currentLiveGiveaway to null
                // and updating the overall `show.giveawayProducts` array.
                fetchShow(); 
            }
        };

        const handleGiveawayEndedManually = (data) => {
            if (data.streamId === streamId && (data.productId._id || data.productId) === (product.productId._id || product.productId)) {
                setIsGiveawayActive(false);
                setIsGiveawayEnded(true);
                setCurrentWinner(null);
                // The parent's `fetchShow` will handle setting currentLiveGiveaway to null.
                fetchShow(); 
            }
        };

        const handleNoApplicants = ({ productId: noApplicantsProductId }) => {
            if (noApplicantsProductId === (product.productId._id || product.productId)) {
                toast.warn("No applicants for this giveaway yet.");
            }
        };

        socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
        socket.on('giveawayWinner', handleGiveawayWinner);
        socket.on('giveawayEndedManually', handleGiveawayEndedManually); 
        socket.on('noApplicants', handleNoApplicants);

        // Cleanup listeners
        return () => {
            socket.off('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
            socket.off('giveawayWinner', handleGiveawayWinner);
            socket.off('giveawayEndedManually', handleGiveawayEndedManually);
            socket.off('noApplicants', handleNoApplicants);
        };
    }, [socket, streamId, product, fetchShow, setCurrentLiveGiveaway]); 

    const handleRollAndSelect = useCallback(() => {
        if (!isGiveawayActive || isGiveawayEnded || applicants.length === 0) {
            toast.warn('Cannot roll: Giveaway not active, already ended, or no applicants.');
            return;
        }
        console.log("Roll giveAway",streamId,product )
        socket.emit('rollGiveaway', {
            streamId,
            productId: product.productId._id, // Use the product ID from the active giveaway
        });
    }, [streamId, product, isGiveawayActive, isGiveawayEnded, applicants.length, socket]);

    const handleEndGiveawayManual = useCallback(() => {
        if (!isGiveawayActive || isGiveawayEnded) {
            toast.warn('Cannot end: Giveaway not active or already ended.');
            return;
        }
        if (window.confirm('Are you sure you want to end this giveaway manually without selecting a winner?')) {
            socket.emit('endGiveawayManual', {
                streamId,
                productId: product.productId._id,
            });
        }
    }, [streamId, product, isGiveawayActive, isGiveawayEnded, socket]);


    if (!product || !product.productId) {
        // This should not happen if ShowDetailsSeller correctly passes currentLiveGiveaway
        // but as a fallback for robustness.
        return <div className="text-white text-center p-4">Waiting for active giveaway...</div>;
    }

    // Determine button state and text
    const rollButtonDisabled = !isGiveawayActive || applicants.length === 0 || isGiveawayEnded;
    const rollButtonText = isGiveawayEnded
        ? (currentWinner ? 'Giveaway Ended (Winner)' : 'Giveaway Ended')
        : (applicants.length === 0 ? 'No Applicants' : 'Roll & Select');

    const endButtonDisabled = !isGiveawayActive || isGiveawayEnded;

    return (
        <div className="w-full max-w-lg mx-auto bg-stone-950 border border-stone-800 shadow-lg rounded-2xl p-6 space-y-6 transition-all">
            {/* Product Card */}
            <div className="flex items-center gap-4 bg-stone-900 p-5 rounded-xl shadow-inner">
                <img
                    src={signedUrls[product.productId._id] || "/placeholder.svg"}
                    className="w-20 h-20 object-contain rounded-lg border border-stone-700"
                    alt={productTitle}
                />
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-1">{productTitle}</h2>
                    {product.productId.description && (
                           <p className="text-sm text-gray-400 line-clamp-2">{product.productId.description}</p>
                    )}
                    {product.giveawayNumber && (
                        <p className="text-sm text-stone-400 mt-1">Giveaway #{product.giveawayNumber}</p>
                    )}
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
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-center gap-2 bg-stone-800 px-4 py-2 rounded-full mt-2 shadow"
                        >
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <p className="text-sm font-medium text-yellow-400">
                                Winner: <span className="font-semibold">{currentWinner.userName || currentWinner.name || currentWinner._id}</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
                {isGiveawayEnded && !currentWinner && (
                    <p className="text-red-400 text-sm mt-2">No winner selected. This giveaway has ended.</p>
                )}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-around gap-4 pt-4">
                <button
                    onClick={handleRollAndSelect}
                    className={`flex items-center gap-2 px-4 py-2 text-black font-semibold text-sm rounded-full shadow-md transition-all
                        ${rollButtonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'}
                    `}
                    disabled={rollButtonDisabled}
                >
                    <FaGift size={14} /> {rollButtonText}
                </button>
                <button
                    onClick={handleEndGiveawayManual}
                    className={`flex items-center gap-2 px-4 py-2 text-white font-semibold text-sm rounded-full shadow-md transition-all
                        ${endButtonDisabled ? 'bg-stone-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
                    `}
                    disabled={endButtonDisabled}
                >
                    End Giveaway
                </button>
            </div>
        </div>
    );
};

export default GiveAwaySellerControl;