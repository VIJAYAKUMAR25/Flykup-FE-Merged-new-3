// GiveAwaySellerControl.jsx (Seller Side)
import React, { useState, useEffect, useCallback } from 'react';
import { FaGift } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { toast } from 'react-toastify'; 

// --- HELPER FUNCTION: SAFELY GET PRODUCT ID ---
// Ensure this helper function is available. If it's not imported globally,
// define it here (or ideally, import it from a shared utils file).
const getProductIdSafely = (productField) => {
    if (!productField) return null;
    if (typeof productField === 'object' && productField !== null && productField._id) {
        return productField._id.toString();
    }
    return productField.toString();
};


const GiveAwaySellerControl = ({
    streamId,
    product, // This `product` prop will now be the `currentLiveGiveaway` object from ShowDetailsSeller
    signedUrls,
    socket, // Receive socket as a prop
    setCurrentLiveGiveaway, // Function to update the parent's currentLiveGiveaway state
}) => {
    // Local states initialized from props for immediate UI rendering
    const [applicants, setApplicants] = useState(product.applicants || []);
    const [currentWinner, setCurrentWinner] = useState(product.winner || null);
    const [isGiveawayActive, setIsGiveawayActive] = useState(product.isActive);
    const [isGiveawayEnded, setIsGiveawayEnded] = useState(product.isGiveawayEnded);
    const [productTitle, setProductTitle] = useState(product.productTitle || product.productId?.title || 'Unknown Product');

    // Update local states when `product` prop changes from the parent
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
            setIsGiveawayEnded(true); // Treat as ended if no product is active
            setProductTitle('No Active Giveaway');
        }
    }, [product]);

    // Socket.IO event listeners for real-time updates for THIS active giveaway
    useEffect(() => {
        const currentProductId = getProductIdSafely(product?.productId);
        if (!socket || !streamId || !currentProductId) return;

        const handleGiveawayApplicantsUpdated = (data) => {
            console.log("Giveaway applicants updated data seller side From Socket BE:", data.applicants);
            const incomingProductId = getProductIdSafely(data.productId);

            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setApplicants(data.applicants || []);
                setCurrentLiveGiveaway(prev => ({
                    ...prev,
                    applicants: data.applicants || [],
                }));
            }
        };

        const handleGiveawayWinner = (data) => {
            const incomingProductId = getProductIdSafely(data.productId);
            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setCurrentWinner(data.winner);
                setIsGiveawayActive(false);
                setIsGiveawayEnded(true);
            }
        };

        const handleGiveawayEndedManually = (data) => {
            const incomingProductId = getProductIdSafely(data.productId);
            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setIsGiveawayActive(false);
                setIsGiveawayEnded(true);
                setCurrentWinner(null); // Explicitly set winner to null for manual end
            }
        };

        const handleNoApplicants = ({ productId: noApplicantsProductId }) => {
            if (getProductIdSafely(noApplicantsProductId) === currentProductId) {
                toast.warn("No applicants for this giveaway yet.");
            }
        };

        socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
        socket.on('giveawayWinner', handleGiveawayWinner);
        socket.on('giveawayEndedManually', handleGiveawayEndedManually); 
        socket.on('noApplicants', handleNoApplicants);

        return () => {
            socket.off('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
            socket.off('giveawayWinner', handleGiveawayWinner);
            socket.off('giveawayEndedManually', handleGiveawayEndedManually);
            socket.off('noApplicants', handleNoApplicants);
        };
    }, [socket, streamId, product, setCurrentLiveGiveaway]);

    const handleRollAndSelect = useCallback(() => {
        if (!isGiveawayActive || isGiveawayEnded || applicants.length === 0) {
            toast.warn('Cannot roll: Giveaway not active, already ended, or no applicants.');
            return;
        }
        const productIdToEmit = getProductIdSafely(product.productId);
        if (!productIdToEmit) {
            console.error("Critical: Product ID missing for rollGiveaway emission.", product);
            toast.error("Error rolling winner: Product ID missing.");
            return;
        }

        console.log("Roll giveAway", streamId, productIdToEmit);
        socket.emit('rollGiveaway', {
            streamId,
            productId: productIdToEmit, // Use safely obtained ID
        });
    }, [streamId, product, isGiveawayActive, isGiveawayEnded, applicants.length, socket]);

    const handleEndGiveawayManual = useCallback(() => {
        if (!isGiveawayActive || isGiveawayEnded) {
            toast.warn('Cannot end: Giveaway not active or already ended.');
            return;
        }
        const productIdToEmit = getProductIdSafely(product.productId);
        if (!productIdToEmit) {
            console.error("Critical: Product ID missing for endGiveawayManual emission.", product);
            toast.error("Error cancelling giveaway: Product ID missing.");
            return;
        }

        if (window.confirm('Are you sure you want to end this giveaway manually without selecting a winner?')) {
            socket.emit('endGiveawayManual', {
                streamId,
                productId: productIdToEmit, // Use safely obtained ID
            });
        }
    }, [streamId, product, isGiveawayActive, isGiveawayEnded, socket]);


    const productDisplayId = getProductIdSafely(product?.productId);
    if (!product || !productDisplayId) {
        return <div className="text-white text-center p-4">Waiting for active giveaway...</div>;
    }

    const rollButtonDisabled = !isGiveawayActive || applicants.length === 0 || isGiveawayEnded;
    const endButtonDisabled = !isGiveawayActive || isGiveawayEnded;

    let statusMessage = null;
    let statusClass = "";

    if (isGiveawayEnded) {
        if (currentWinner) {
            statusMessage = `Winner: ${currentWinner.userName || currentWinner.name || "Unknown"}! 🎉`;
            statusClass = "bg-green-700/30 text-green-300";
        } else {
            statusMessage = "Giveaway Cancelled by Host.";
            statusClass = "bg-red-700/30 text-red-300";
        }
    } else if (!isGiveawayActive) {
        statusMessage = "Giveaway not yet active.";
        statusClass = "bg-yellow-700/30 text-yellow-300";
    }

    return (
        <div className="w-full max-w-lg mx-auto bg-stone-950 border border-stone-800 shadow-lg rounded-2xl p-6 space-y-6 transition-all">
            {statusMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-lg text-center font-semibold text-sm mb-4 ${statusClass}`}
                >
                    {statusMessage}
                </motion.div>
            )}

            {/* Product Card */}
            <div className="flex items-center gap-4 bg-stone-900 p-5 rounded-xl shadow-inner">
                <img
                    src={signedUrls[productDisplayId] || "/placeholder.svg"}
                    className="w-20 h-20 object-contain rounded-lg border border-stone-700"
                    alt={productTitle}
                />
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-1">{productTitle}</h2>
                    {product.productId?.description && (
                               <p className="text-sm text-gray-400 line-clamp-2">{product.productId.description}</p>
                    )}
                    {product.giveawayNumber && (
                        <p className="text-sm text-stone-400 mt-1">Giveaway #{product.giveawayNumber}</p>
                    )}
                </div>
            </div>

            {/* Applicants Section */}
            {isGiveawayActive && !isGiveawayEnded && ( // Only show if active and not ended
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-stone-300">Applicants {applicants.length}</h4>
                   
                </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-around gap-4 pt-4">
                <button
                    onClick={handleRollAndSelect}
                    className={`flex items-center gap-2 px-4 py-2 text-black font-semibold text-sm rounded-full shadow-md transition-all
                        ${rollButtonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'}
                    `}
                    disabled={rollButtonDisabled}
                >
                    <FaGift size={14} /> {rollButtonDisabled ? (applicants.length === 0 ? 'No Applicants' : 'Giveaway Ended') : 'Roll & Select'}
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


// // GiveAwaySellerControl.jsx (Seller Side)
// import React, { useState, useEffect, useCallback } from 'react';
// import { FaGift } from 'react-icons/fa';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Trophy } from 'lucide-react';
// import { toast } from 'react-toastify'; 

// const GiveAwaySellerControl = ({
//     streamId,
//     product, // This `product` prop will now be the `currentLiveGiveaway` object from ShowDetailsSeller
//     signedUrls,
//     socket, // Receive socket as a prop
//     setCurrentLiveGiveaway, // Function to update the parent's currentLiveGiveaway state - only used for immediate local reaction
//     // fetchShow is removed as a prop
// }) => {
//     // Local states initialized from props for immediate UI rendering
//     const [applicants, setApplicants] = useState(product.applicants || []);
//     const [currentWinner, setCurrentWinner] = useState(product.winner || null);
//     const [isGiveawayActive, setIsGiveawayActive] = useState(product.isActive);
//     const [isGiveawayEnded, setIsGiveawayEnded] = useState(product.isGiveawayEnded);
//     const [productTitle, setProductTitle] = useState(product.productTitle || product.productId?.title || 'Unknown Product');

//     // Update local states when `product` prop changes from the parent
//     // This is vital as the parent `ShowDetailsSeller` will update `currentLiveGiveaway`
//     // which in turn updates these `product` props.
//     useEffect(() => {
//         if (product) {
//             setApplicants(product.applicants || []);
//             setCurrentWinner(product.winner || null);
//             setIsGiveawayActive(product.isActive);
//             setIsGiveawayEnded(product.isGiveawayEnded);
//             setProductTitle(product.productTitle || product.productId?.title || 'Unknown Product');
//         } else {
//             // If product becomes null (giveaway ended and currentGiveaway cleared in parent)
//             setApplicants([]);
//             setCurrentWinner(null);
//             setIsGiveawayActive(false);
//             setIsGiveawayEnded(true);
//             setProductTitle('No Active Giveaway');
//         }
//     }, [product]);

//     // Socket.IO event listeners for real-time updates for THIS active giveaway
//     useEffect(() => {
//         if (!socket || !streamId || !product || !product.productId) return;

//         const handleGiveawayApplicantsUpdated = (data) => {
//             console.log("Giveaway applicants updated data seller side From Socket BE:", data.applicants);
//             // Ensure this update is for the currently displayed active giveaway
//             if (data.streamId === streamId && (data.productId._id || data.productId).toString() === (product.productId._id || product.productId).toString()) {
//                 setApplicants(data.applicants || []);
//                 // Also update the parent's currentLiveGiveaway for consistency (optional, but good)
//                 setCurrentLiveGiveaway(prev => ({
//                     ...prev,
//                     applicants: data.applicants || [],
//                 }));
//             }
//         };

//         const handleGiveawayWinner = (data) => {
//             if (data.streamId === streamId && (data.productId._id || data.productId).toString() === (product.productId._id || product.productId).toString()) {
//                 setCurrentWinner(data.winner);
//                 setIsGiveawayActive(false);
//                 setIsGiveawayEnded(true);
//                 // No need to call fetchShow here, parent ShowDetailsSeller handles that.
//             }
//         };

//         const handleGiveawayEndedManually = (data) => {
//             if (data.streamId === streamId && (data.productId._id || data.productId).toString() === (product.productId._id || product.productId).toString()) {
//                 setIsGiveawayActive(false);
//                 setIsGiveawayEnded(true);
//                 setCurrentWinner(null);
//                 // No need to call fetchShow here, parent ShowDetailsSeller handles that.
//             }
//         };

//         const handleNoApplicants = ({ productId: noApplicantsProductId }) => {
//             if (noApplicantsProductId === (product.productId._id || product.productId).toString()) {
//                 toast.warn("No applicants for this giveaway yet.");
//             }
//         };

//         socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
//         socket.on('giveawayWinner', handleGiveawayWinner);
//         socket.on('giveawayEndedManually', handleGiveawayEndedManually); 
//         socket.on('noApplicants', handleNoApplicants);

//         // Cleanup listeners
//         return () => {
//             socket.off('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
//             socket.off('giveawayWinner', handleGiveawayWinner);
//             socket.off('giveawayEndedManually', handleGiveawayEndedManually);
//             socket.off('noApplicants', handleNoApplicants);
//         };
//     }, [socket, streamId, product, setCurrentLiveGiveaway]); // Dependencies

//     const handleRollAndSelect = useCallback(() => {
//         if (!isGiveawayActive || isGiveawayEnded || applicants.length === 0) {
//             toast.warn('Cannot roll: Giveaway not active, already ended, or no applicants.');
//             return;
//         }
//         console.log("Roll giveAway",streamId,product )
//         socket.emit('rollGiveaway', {
//             streamId,
//             productId: product.productId._id, // Use the product ID from the active giveaway
//         });
//     }, [streamId, product, isGiveawayActive, isGiveawayEnded, applicants.length, socket]);

//     const handleEndGiveawayManual = useCallback(() => {
//         if (!isGiveawayActive || isGiveawayEnded) {
//             toast.warn('Cannot end: Giveaway not active or already ended.');
//             return;
//         }
//         if (window.confirm('Are you sure you want to end this giveaway manually without selecting a winner?')) {
//             socket.emit('endGiveawayManual', {
//                 streamId,
//                 productId: product.productId._id,
//             });
//         }
//     }, [streamId, product, isGiveawayActive, isGiveawayEnded, socket]);


//     if (!product || !product.productId) {
//         return <div className="text-white text-center p-4">Waiting for active giveaway...</div>;
//     }

//     // Determine button state and text
//     const rollButtonDisabled = !isGiveawayActive || applicants.length === 0 || isGiveawayEnded;
//     const rollButtonText = isGiveawayEnded
//         ? (currentWinner ? 'Giveaway Ended (Winner)' : 'Giveaway Ended')
//         : (applicants.length === 0 ? 'No Applicants' : 'Roll & Select');

//     const endButtonDisabled = !isGiveawayActive || isGiveawayEnded;

//     return (
//         <div className="w-full max-w-lg mx-auto bg-stone-950 border border-stone-800 shadow-lg rounded-2xl p-6 space-y-6 transition-all">
//             {/* Product Card */}
//             <div className="flex items-center gap-4 bg-stone-900 p-5 rounded-xl shadow-inner">
//                 <img
//                     src={signedUrls[product.productId._id] || "/placeholder.svg"}
//                     className="w-20 h-20 object-contain rounded-lg border border-stone-700"
//                     alt={productTitle}
//                 />
//                 <div className="flex-1">
//                     <h2 className="text-lg md:text-xl font-semibold text-white mb-1">{productTitle}</h2>
//                     {product.productId.description && (
//                                <p className="text-sm text-gray-400 line-clamp-2">{product.productId.description}</p>
//                     )}
//                     {product.giveawayNumber && (
//                         <p className="text-sm text-stone-400 mt-1">Giveaway #{product.giveawayNumber}</p>
//                     )}
//                 </div>
//             </div>

//             {/* Applicants Section */}
//             <div className="space-y-1">
//                 <h4 className="text-sm font-semibold text-stone-300">Applicants</h4>
//                 <p className="text-sm text-gray-400">
//                     <span className="font-bold text-lg">{applicants.length}</span> user(s) applied for this giveaway.
//                 </p>
//             </div>

//             {/* Winner Section */}
//             <div className="text-center">
//                 <AnimatePresence>
//                     {currentWinner && (
//                         <motion.div
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -10 }}
//                             className="flex items-center justify-center gap-2 bg-stone-800 px-4 py-2 rounded-full mt-2 shadow"
//                         >
//                             <Trophy className="w-4 h-4 text-yellow-500" />
//                             <p className="text-sm font-medium text-yellow-400">
//                                 Winner: <span className="font-semibold">{currentWinner.userName || currentWinner.name || currentWinner._id}</span>
//                             </p>
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//                 {isGiveawayEnded && !currentWinner && (
//                     <p className="text-red-400 text-sm mt-2">No winner selected. This giveaway has ended.</p>
//                 )}
//             </div>

//             {/* Control Buttons */}
//             <div className="flex justify-around gap-4 pt-4">
//                 <button
//                     onClick={handleRollAndSelect}
//                     className={`flex items-center gap-2 px-4 py-2 text-black font-semibold text-sm rounded-full shadow-md transition-all
//                         ${rollButtonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'}
//                     `}
//                     disabled={rollButtonDisabled}
//                 >
//                     <FaGift size={14} /> {rollButtonText}
//                 </button>
//                 <button
//                     onClick={handleEndGiveawayManual}
//                     className={`flex items-center gap-2 px-4 py-2 text-white font-semibold text-sm rounded-full shadow-md transition-all
//                         ${endButtonDisabled ? 'bg-stone-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
//                     `}
//                     disabled={endButtonDisabled}
//                 >
//                     End Giveaway
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default GiveAwaySellerControl;