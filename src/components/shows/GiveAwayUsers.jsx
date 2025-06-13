// GiveAwayUsers.jsx (User Side)
import React, { useState, useEffect, useCallback } from "react";
import { FaGift } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify"; 

const GiveAwayUsers = ({ streamId, product, signedUrls, socket }) => {
    const { user } = useAuth(); // Get authenticated user from context
    const [hasApplied, setHasApplied] = useState(false);
    const [currentWinner, setCurrentWinner] = useState(null);
    const [applicantsCount, setApplicantsCount] = useState(0);
    const [isGiveawayEnded, setIsGiveawayEnded] = useState(false);
    const [productTitle, setProductTitle] = useState(""); 

    // Initialize state based on the `product` prop (which is now `show.currentGiveaway` or an item from `show.giveawayProducts`)
    useEffect(() => {
        if (product) {
            setCurrentWinner(product.winner || null);
            setApplicantsCount(product.applicants?.length || 0);
            setIsGiveawayEnded(product.isGiveawayEnded);
            setProductTitle(product.productTitle || product.productId?.title || "Unknown Product");

            // Check if the current user has already applied to THIS specific active giveaway
            if (user && product.applicants && product.applicants.some(applicantId => applicantId.toString() === user._id)) {
                setHasApplied(true);
            } else {
                setHasApplied(false);
            }
        } else {
            // If product becomes null (e.g., giveaway ends), reset states
            setApplicantsCount(0);
            setCurrentWinner(null);
            setIsGiveawayEnded(true); // Treat as ended if no product is active
            setHasApplied(false);
            setProductTitle("");
        }
    }, [product, user]); // Depend on product and user to re-evaluate on changes

    // Socket.IO listeners for real-time updates for the active giveaway
    useEffect(() => {
        if (!socket || !streamId || !product || !product.productId) return; 

        const handleGiveawayApplicantsUpdated = (data) => {
            // Check if the update is for the currently displayed active giveaway
            console.log("Giveaway applicants updated data From Socket BE:", data.applicants);   
            if (
                data.streamId === streamId &&
                (data.productId._id || data.productId) === (product.productId._id || product.productId)
            ) {
                setApplicantsCount(data.applicants?.length || 0);
                if (user && data.applicants && data.applicants.some(applicantId => applicantId.toString() === user._id)) {
                    setHasApplied(true);
                } else {
                    setHasApplied(false);
                }
            }
        }; 

        // Listen for changes specific to the active giveaway
        socket.on("giveawayApplicantsUpdated", handleGiveawayApplicantsUpdated);
        // Cleanup listeners on unmount or dependency change
        return () => {
            socket.off("giveawayApplicantsUpdated", handleGiveawayApplicantsUpdated);
        };
    }, [socket, streamId, product, user]); // Re-run if socket, streamId, product, or user changes

    const handleApplyGiveaway = useCallback(() => {
        if (!user) {
            toast.error("Please log in to apply for the giveaway.");
            return;
        }
        if (!product || !product.isActive || product.isGiveawayEnded) {
            toast.warn("This giveaway is not active or has already ended.");
            return;
        }
        if (hasApplied) {
            toast.info("You have already applied for this giveaway.");
            return;
        }
        console.log("Applying for giveaway user clicked socket emited :", {
            streamId,
            productId: product.productId._id,
            user: {
                _id: user._id,
                name: user.name,
                userName: user.userName,
                profileURL: user.profileURL,
            },
        });

        socket.emit("applyGiveaway", {
            streamId,
            productId: product.productId._id,
            user: {
                _id: user._id,
                name: user.name,
                userName: user.userName,
                profileURL: user.profileURL,
            }, // Send necessary user info
        });

        setHasApplied(true); // Optimistic update
        setApplicantsCount((prevCount) => prevCount + 1); // Optimistic update for count
        toast.success("Application submitted!");
    }, [streamId, product, user, hasApplied, socket]); // Depend on relevant states/props and socket

    if (!product || !product.productId) {
        // This component should ideally only render when `product` (currentGiveaway) is valid
        // or for historical view. For the active giveaway slot, this indicates no active giveaway.
        return (
            <div className="text-white text-center p-4">
                No active giveaway product to display.
            </div>
        );
    } 

    // Determine button state and text
    let buttonText = "Apply Now";
    let buttonDisabled = hasApplied || isGiveawayEnded || !product.isActive;

    if (isGiveawayEnded) {
        buttonText = "Giveaway Ended";
    } else if (!product.isActive) {
        buttonText = "Not Yet Active"; // Or some other appropriate text if it's not active
    } else if (hasApplied) {
        buttonText = "Applied";
    }

    return (
        <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-black p-6 rounded-3xl shadow-2xl max-w-xl mx-auto text-white space-y-4">
            <div className="flex items-center gap-4 bg-stone-800 p-4 rounded-xl">
                <img
                    src={signedUrls[product.productId._id] || "/placeholder.svg"}
                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                    alt={productTitle}
                />
                <div>
                    <h3 className="text-xl font-semibold">{productTitle}</h3>
                    {product.productId?.description && ( // Optional chaining for safety
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {product.productId.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="text-center">
                {/* Display Applicants Count for users */}
                {/* <p className="text-sm text-gray-300">
                    <span className="font-semibold">{applicantsCount}</span>{" "}
                    participant(s)
                </p> */}
                <AnimatePresence>
                    {currentWinner && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-center gap-2 mt-2 text-yellow-400"
                        >
                            <Trophy className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                Winner:{" "}
                                {currentWinner.userName || currentWinner.name || currentWinner._id}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {!isGiveawayEnded && product?.isActive && ( // Only show button if giveaway is active and not ended
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleApplyGiveaway}
                        className={`bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-full font-medium transition duration-300 flex items-center gap-2 ${
                            buttonDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={buttonDisabled}
                    >
                        <FaGift size={14} /> {buttonText}
                    </button>
                </div>
            )}
            {isGiveawayEnded && !currentWinner && (
                <p className="text-center text-red-400 text-sm">
                    This giveaway has ended without a winner being selected.
                </p>
            )}
        </div>
    );
};

export default GiveAwayUsers;