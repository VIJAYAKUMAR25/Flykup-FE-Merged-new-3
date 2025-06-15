// GiveAwayUsers.jsx (User Side)
import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { FaGift } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify"; 

// --- HELPER FUNCTION: SAFELY GET PRODUCT ID ---
const getProductIdSafely = (productField) => {
    if (!productField) return null;
    if (typeof productField === 'object' && productField !== null && productField._id) {
        return productField._id.toString();
    }
    return productField.toString();
};


const GiveAwayUsers = ({ streamId, product, signedUrls, socket }) => {

    // console.log("GiveAwayUsers component rendered with product:", product);
    // console.log("GiveAwayUsers component rendered with streamId:", streamId);
    // console.log("GiveAwayUsers component rendered with signedUrls:", signedUrls);
    // console.log("GiveAwayUsers component rendered with socket:", socket);

    const { user } = useAuth(); // Get authenticated user from context
    const [hasApplied, setHasApplied] = useState(false);
    const [currentWinner, setCurrentWinner] = useState(null);
    const [applicants, setApplicants] = useState([]); // Store actual applicant list for rolling
    const [applicantsCount, setApplicantsCount] = useState(0);
    const [isGiveawayEnded, setIsGiveawayEnded] = useState(false);
    const [isRolling, setIsRolling] = useState(false); // New: Track rolling state
    const [productTitle, setProductTitle] = useState(""); 

    // New states for rolling effect
    const [displayApplicant, setDisplayApplicant] = useState(null);
    const rollingIntervalRef = useRef(null);




const getRandomTamilName = () => {
  const firstNames = [
    "Kumar", "Raja", "Murugan", "Chandran", "Arun", 
    "Vijay", "Karthik", "Mani", "Balaji", "Dinesh",
    "Priya", "Malathi", "Sarita", "Lakshmi", "Gayathri",
    "Vani", "Swetha", "Puja", "Anitha", "Janaki"
  ];
  
  const lastNames = [
    "Subramaniam", "Velu", "Ganesan", "Sekar", "Ramnathan",
    "Kannan", "Pande", "Singh", "Ayyar", "Nayudu",
    "Iyer", "Menon", "Nair", "Reddy", "Sharma"
  ];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
    lastNames[Math.floor(Math.random() * lastNames.length)]
  }`;
};


    // Function to start the rolling effect animation
   const startRollingEffect = useCallback((allApplicants) => {
  if (!allApplicants || allApplicants.length === 0) return;
  
  stopRollingEffect(); // Clear any existing interval

  rollingIntervalRef.current = setInterval(() => {
    // Generate a random Tamil name for display
    const randomName = getRandomTamilName();
    setDisplayApplicant({
      _id: Date.now().toString(), // Unique ID for animation
      userName: randomName,
      name: randomName
    });
  }, 100); // Update every 100ms for a fast roll
}, []);

    // Function to stop the rolling effect animation
    const stopRollingEffect = useCallback(() => {
        if (rollingIntervalRef.current) {
            clearInterval(rollingIntervalRef.current);
            rollingIntervalRef.current = null;
        }
    }, []);

    // Initialize state based on the `product` prop
    useEffect(() => {
        if (product) {
            setApplicants(product.applicants || []); // Ensure applicants list is set
            setCurrentWinner(product.winner || null);
            setApplicantsCount(product.applicants?.length || 0);
            setIsGiveawayEnded(product.isGiveawayEnded);
            setIsRolling(product.isRolling || false); // Update rolling state from product prop
            setProductTitle(product.productTitle || product.productId?.title || "Unknown Product");

            if (user && product.applicants && product.applicants.some(applicantId => applicantId.toString() === user._id)) {
                setHasApplied(true);
            } else {
                setHasApplied(false);
            }

            // Start or stop rolling effect based on product's isRolling state
            if (product.isRolling && product.applicants && product.applicants.length > 0) {
                startRollingEffect(product.applicants);
            } else {
                stopRollingEffect();
                if (!product.isGiveawayEnded) { // Only clear if not ended, winner might still be displayed
                    setDisplayApplicant(null); 
                }
            }

        } else {
            // If product becomes null (e.g., giveaway ends), reset states
            setApplicants([]);
            setApplicantsCount(0);
            setCurrentWinner(null);
            setIsGiveawayEnded(true); // Treat as ended if no product is active
            setIsRolling(false); // Stop rolling
            setHasApplied(false);
            setProductTitle("");
            stopRollingEffect(); // Ensure interval is cleared
            setDisplayApplicant(null);
        }
    }, [product, user, startRollingEffect, stopRollingEffect]); // Depend on product and user, and effect functions

    // Socket.IO listeners for real-time updates for the active giveaway
    useEffect(() => {
        const currentProductId = getProductIdSafely(product?.productId);
        if (!socket || !streamId || !currentProductId) return; 

        const handleGiveawayApplicantsUpdated = (data) => {
            // Check if the update is for the currently displayed active giveaway
            console.log("Giveaway applicants updated data From Socket BE:", data.applicants); 
            const incomingProductId = getProductIdSafely(data.productId);

            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setApplicants(data.applicants || []); // Update applicants array
                setApplicantsCount(data.applicants?.length || 0);
                if (user && data.applicants && data.applicants.some(applicantId => applicantId.toString() === user._id)) {
                    setHasApplied(true);
                } else {
                    setHasApplied(false);
                }
            }
        }; 
        
        // NEW LISTENER: Handle Giveaway Rolling
        const handleGiveawayRolling = (data) => {
            const incomingProductId = getProductIdSafely(data.productId);
            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setIsRolling(true);
                setCurrentWinner(null); // Clear previous winner display
                startRollingEffect(data.applicants); // Start the visual roll with current applicants
            }
        };

        const handleGiveawayWinner = (data) => {
            const incomingProductId = getProductIdSafely(data.productId);
            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setCurrentWinner(data.winner);
                setIsGiveawayEnded(true); // This also implies isActive = false
                setIsRolling(false); // Stop rolling state
                stopRollingEffect(); // Stop the visual roll
                setDisplayApplicant(null); // Clear temporary display
            }
        };

        const handleGiveawayEndedManually = (data) => {
            const incomingProductId = getProductIdSafely(data.productId);
            if (data.streamId === streamId && incomingProductId === currentProductId) {
                setIsGiveawayEnded(true); // This implies isActive = false
                setIsRolling(false); // Stop rolling state
                setCurrentWinner(null); // Explicitly set winner to null for manual end
                stopRollingEffect(); // Stop the visual roll
                setDisplayApplicant(null);
            }
        };


        socket.on("giveawayApplicantsUpdated", handleGiveawayApplicantsUpdated);
        socket.on("giveawayRolling", handleGiveawayRolling); // New listener
        socket.on("giveawayWinner", handleGiveawayWinner);
        socket.on("giveawayEndedManually", handleGiveawayEndedManually);
        
        return () => {
            socket.off("giveawayApplicantsUpdated", handleGiveawayApplicantsUpdated);
            socket.off("giveawayRolling", handleGiveawayRolling); // Clean up new listener
            socket.off("giveawayWinner", handleGiveawayWinner);
            socket.off("giveawayEndedManually", handleGiveawayEndedManually);
            stopRollingEffect(); // Ensure cleanup on unmount
        };
    }, [socket, streamId, product, user, startRollingEffect, stopRollingEffect]); // Re-run if dependencies change

    const handleApplyGiveaway = useCallback(() => {
        if (!user) {
            toast.error("Please log in to apply for the giveaway.");
            return;
        }
        if (!product || !product.isActive || product.isGiveawayEnded || isRolling) { // Prevent applying if rolling
            toast.warn("This giveaway is not active, has already ended, or is currently rolling.");
            return;
        }
        if (hasApplied) {
            toast.info("You have already applied for this giveaway.");
            return;
        }
        
        const productIdToSend = getProductIdSafely(product.productId); 

        if (!productIdToSend) {
            console.error("Critical: Product ID could not be safely extracted in GiveAwayUsers for application.", product);
            toast.error("Error preparing giveaway application: Product ID missing.");
            return;
        }

        console.log("Applying for giveaway user clicked socket emitted :", {
            streamId,
            productId: productIdToSend,
            user: {
                _id: user._id,
                name: user.name,
                userName: user.userName,
                profileURL: user.profileURL,
            },
        });

        socket.emit("applyGiveaway", {
            streamId,
            productId: productIdToSend,
            user: {
                _id: user._id,
                name: user.name,
                userName: user.userName,
                profileURL: user.profileURL,
            },
        });

        setHasApplied(true); // Optimistic update
        setApplicantsCount((prevCount) => prevCount + 1); // Optimistic update for count
        toast.success("Application submitted!");
    }, [streamId, product, user, hasApplied, isRolling, socket]); // Depend on relevant states/props and socket

    const productDisplayId = getProductIdSafely(product?.productId);
    if (!product || !productDisplayId) {
        return (
            <div className="text-white text-center p-4">
                No active giveaway product to display.
            </div>
        );
    } 

    let buttonText = "Apply Now";
    let buttonDisabled = hasApplied || isGiveawayEnded || !product.isActive || isRolling; // Disable if rolling

    if (isGiveawayEnded) {
        buttonText = "Giveaway Ended";
    } else if (isRolling) {
        buttonText = "Rolling..."
    } else if (!product.isActive) {
        buttonText = "Not Yet Active";
    } else if (hasApplied) {
        buttonText = "Applied";
    }

    return (
        <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-black p-6 rounded-3xl shadow-2xl max-w-xl mx-auto text-white space-y-4">
            <div className="flex items-center gap-4 bg-stone-800 p-4 rounded-xl">
                <img
                    src={signedUrls[productDisplayId] || "/placeholder.svg"}
                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                    alt={productTitle}
                />
                <div>
                    <h3 className="text-xl font-semibold">{productTitle}</h3>
                    {product.productId?.description && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {product.productId.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="text-center">
                <AnimatePresence mode="wait"> {/* Use mode="wait" to ensure exit animation completes before new enter */}
                    {isRolling && applicants.length > 0 && displayApplicant ? (
                         <motion.div
                            key={displayApplicant._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.1 }}
                            className="flex items-center justify-center gap-2 mt-2 text-yellow-400"
                        >
                            <Trophy className="w-5 h-5" />
                            <span className="text-sm font-medium">
                            Rolling: {displayApplicant.userName}
                            </span>
                        </motion.div>
                    ) : (currentWinner && (
                        <motion.div
                            key="winner-final-user"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center gap-2 mt-2 text-green-400"
                        >
                            <Trophy className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                Winner:{" "}
                                {currentWinner.userName || currentWinner.name || currentWinner._id}
                            </span>
                        </motion.div>
                    ))}
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