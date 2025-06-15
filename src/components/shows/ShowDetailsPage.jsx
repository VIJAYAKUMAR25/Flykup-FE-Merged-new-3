// ShowDetailsPage.jsx (User Side)
import { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, Volume2, ArrowLeft, Package, Trophy, LucideWallet } from "lucide-react";
import LikeButton from "./ui/LikeButton";
import AuctionsOverlay from "./AuctionsOverlay";
import LiveComments from "./LiveComments";
import { useNavigate, useParams } from "react-router-dom";
import { socketurl } from "../../../config";
import axios from "axios";
import io from "socket.io-client";
import AuctionsUser from "./AuctionsUser";
import BuyProducts from "./BuyProducts";
import GiveAwayUsers from "./GiveAwayUsers";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiExplosion from "react-confetti-explosion";
import { FiGift, FiShare } from "react-icons/fi"; // Corrected import for Feather Icons
import { RiLiveLine } from "react-icons/ri";
import { MdClose } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { AiOutlineShop } from "react-icons/ai";
import ViewLiveStream from "../reuse/LiveStream/ViewLiveStream";
import { BiNotepad } from "react-icons/bi";
import RollingEffectOverlay from "./RollingEffectOverlay";
import { useFollowApi } from "../ProfileComponents/useFollowApi"; 
// --- HELPER FUNCTION: SAFELY GET PRODUCT ID ---
const getProductIdSafely = (productField) => {
    if (!productField) return null;
    if (typeof productField === 'object' && productField !== null && productField._id) {
        return productField._id.toString();
    }
    return productField.toString();
};

// Global socket connection (consider moving inside useEffect in a parent component if authentication is critical)
const socket = io.connect(socketurl, {
    transports: ['websocket'], // Force WebSocket transport
    // If you need auth for users:
    // auth: {
    //     userId: user?._id, // This `user` would need to be in scope here
    // },
});


const ShowDetailsPage = ({ requireAuth, isAuthenticated, currentUser }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // This is the showId
    const [show, setShow] = useState(null); // Initialize as null for loading
    const [loading, setLoading] = useState(true); // Set to true initially
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [userId] = useState(user?._id);
     const [isRollingGiveaway, setIsRollingGiveaway] = useState(false);
    const [activeTab, setActiveTab] = useState("Auction");
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [signedUrls, setSignedUrls] = useState({});
    const [products, setProducts] = useState([]); // Used for fetching initial signed URLs
    const [viewerCount, setViewerCount] = useState(0);
    const [winner, setWinner] = useState(null); // For confetti display
    const timerRef = useRef(null);
    const [auctionActive, setAuctionActive] = useState(false);
    const [currentAuction, setCurrentAuction] = useState(null);
    const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

const { followUser, unfollowUser } = useFollowApi();
  const [followLoading, setFollowLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const handleFollowClick = async () => {
      requireAuth(async () => {
        if (!show?.host?._id) return;
        try {
          setFollowLoading(true);
          if (isFollowing) {
            await unfollowUser(show.host._id);
            localStorage.removeItem(`isFollowing_${show.host._id}`);
            setIsFollowing(false);
            toast.success("Unfollowed successfully");
          } else {
            await followUser(show.host._id);
            localStorage.setItem(`isFollowing_${show.host._id}`, "true");
            setIsFollowing(true);
            toast.success("Followed successfully");
          }
        } catch (error) {
          console.error("Follow/unfollow error:", error);
          toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
          setFollowLoading(false);
        }
      });
    };

    // This function now only fetches the show data once on initial load.
    // All subsequent updates will happen via WebSocket events.
    const fetchShowInitial = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${socketurl}/api/shows/get/${id}`, {
                withCredentials: true,
            });
            if (response.status === 200) {
                const showData = response.data;
                console.log("Fetched Initial Show Data (User):", showData);
                setShow(showData);
                
                // Collect all products for signed URLs safely
                const allProductsToSign = [
                    ...(showData?.buyNowProducts || []),
                    ...(showData?.auctionProducts || []),
                    ...(showData?.giveawayProducts || []),
                ].filter(p => getProductIdSafely(p.productId)); // Filter out any entries without a valid productId

                // Safely add currentGiveaway product if it exists and has an ID
                if (showData.currentGiveaway && getProductIdSafely(showData.currentGiveaway.productId)) {
                    allProductsToSign.push({ productId: showData.currentGiveaway.productId });
                }

                fetchSignedUrlsForProducts(allProductsToSign);

            } else {
                console.error("Failed to fetch show details.");
        
            }
        } catch (error) {
            console.error("Error fetching show details:", error);
            toast.error("Error fetching show details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchShowInitial(); // Call the initial fetch on component mount
    }, [id, fetchShowInitial]);

    // Update local states when `show` data changes (e.g., from initial fetch or WebSocket updates)
    useEffect(() => {
        if (show) {
            setLikes(show?.likes);
            setLiked(show?.likedBy?.includes(user?._id));
        }
    }, [show, user?._id]);

    const fetchSignedUrlsForProducts = async (productsArray) => {
        const urls = {};
        const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

        for (const product of productsArray) {
            const productId = getProductIdSafely(product.productId); // Use safe getter here
            // Ensure product.productId and its image properties exist before accessing
            if (productId && product.productId && product.productId.images && product.productId.images[0] && product.productId.images[0].key) {
                urls[productId] = cdnURL + product.productId.images[0].key;
            }
        }
        setSignedUrls(urls);
    };

        const handleLike = () => {
        requireAuth(() => {
            // Your like logic here
            alert("Like action triggered! ");
            console.log('Liked!');
            if (!userId || !socket) {
                console.error("Connection not ready, please try again shortly")
                return
            }

            console.log("liked")
            socket.emit("toggleLike", { streamId: id, userId })
        });

    }

    useEffect(() => {
        if (!socket || !id) {
            console.log("Socket or ShowId not ready for listeners on user side.");
            return;
        }

        socket.emit("joinRoom", id);

        // --- MODIFIED GIVEAWAY LISTENERS FOR USER SIDE (FULL WEB SOCKET UPDATE) ---
        const handleGiveawayStarted = (data) => {
            console.log("User: Giveaway started event received", data);
            toast.success(`New Giveaway: ${data.productTitle}!`);

            setShow(prevShow => {
                if (!prevShow) return prevShow;

                const newGiveawayProductId = getProductIdSafely(data.productId); // Safely get incoming product ID

                const updatedGiveawayProducts = prevShow.giveawayProducts.map(gp => {
                    const historicalProductId = getProductIdSafely(gp.productId); // Safely get historical product ID

                    if (historicalProductId && newGiveawayProductId && historicalProductId === newGiveawayProductId) {
                        return {
                            ...gp,
                            isActive: true,
                            isGiveawayEnded: false,
                            isRolling: false, // Ensure this is set based on incoming data
                            applicants: data.applicants || gp.applicants,
                            winner: data.winner || gp.winner, // winner here is already a populated object from backend
                            createdAt: data.createdAt || gp.createdAt,
                            giveawayNumber: data.giveawayNumber || gp.giveawayNumber
                        };
                    }
                    return gp;
                });

                return {
                    ...prevShow,
                    currentGiveaway: data, // Set the current active giveaway object
                    giveawayProducts: updatedGiveawayProducts,
                };
            });
        };

        const handleGiveawayApplicantsUpdated = (data) => {
            console.log("User: Giveaway applicants updated event received", data);
            setShow(prevShow => {
                if (!prevShow || !prevShow.currentGiveaway) return prevShow;

                const incomingProductId = getProductIdSafely(data.productId);
                const currentGiveawayProductId = getProductIdSafely(prevShow.currentGiveaway.productId);

                // Ensure it's for the correct active giveaway using safe comparison
                if (incomingProductId && currentGiveawayProductId && incomingProductId === currentGiveawayProductId) {
                    return {
                        ...prevShow,
                        currentGiveaway: {
                            ...prevShow.currentGiveaway,
                            applicants: data.applicants || [], // Update only the applicants array
                        }
                    };
                }
                return prevShow;
            });
        };
        
        // NEW LISTENER: Handle Giveaway Rolling
        const handleGiveawayRolling = (data) => {
      if (data.streamId === id) {
        setIsRollingGiveaway(true);
        // Set timeout to stop rolling after 5 seconds
        setTimeout(() => setIsRollingGiveaway(false), 5000);
      }
    };


        const handleGiveawayWinner = ({ streamId: winStreamId, productId: winProductId, winner: newWinner, productTitle }) => {
            if (winStreamId === id) {
                setWinner(newWinner); // Trigger confetti and winner display
                // toast.success(`🎉 ${newWinner?.userName || newWinner?.name || 'A user'} won the giveaway: ${productTitle}!`);

                setShow(prevShow => {
                    if (!prevShow) return prevShow;

                    const incomingWinProductId = getProductIdSafely(winProductId);

                    const updatedHistoricalGiveawayProducts = prevShow.giveawayProducts.map(gp => {
                        const historicalProductId = getProductIdSafely(gp.productId);
                        
                        // Find the correct historical entry using safe comparison
                        if (historicalProductId && incomingWinProductId && historicalProductId === incomingWinProductId) {
                            return {
                                ...gp,
                                isActive: false,
                                isGiveawayEnded: true,
                                isRolling: false, // Rolling ends here
                                winner: newWinner, // Store the full newWinner object
                                applicants: prevShow.currentGiveaway?.applicants || gp.applicants // Preserve actual applicants from current giveaway or existing
                            };
                        }
                        return gp;
                    });

                    return {
                        ...prevShow,
                        currentGiveaway: null, // Clear the active giveaway
                        giveawayProducts: updatedHistoricalGiveawayProducts, // Update the historical list
                    };
                });
                setIsGiveawayModalOpen(false); // Close modal when winner is announced
            }
        };

        const handleGiveawayEndedManually = ({ streamId: endStreamId, productId: endProductId, productTitle, message }) => {
            console.log("User: Giveaway ended manually event received", message);
            if (endStreamId === id) {
                // toast.info(message);

                setShow(prevShow => {
                    if (!prevShow) return prevShow;

                    const incomingEndProductId = getProductIdSafely(endProductId); // Safely get incoming product ID from event

                    const updatedHistoricalGiveawayProducts = prevShow.giveawayProducts.map(gp => {
                        const historicalProductId = getProductIdSafely(gp.productId); // Safely get historical product ID from state
                        
                        // Find the correct historical entry using safe comparison
                        if (historicalProductId && incomingEndProductId && historicalProductId === incomingEndProductId) {
                            return {
                                ...gp,
                                isActive: false,
                                isGiveawayEnded: true,
                                isRolling: false, // Ensure rolling is stopped
                                winner: null, // No winner on manual end
                                applicants: prevShow.currentGiveaway?.applicants || gp.applicants // Preserve applicants for historical record
                            };
                        }
                        return gp;
                    });

                    return {
                        ...prevShow,
                        currentGiveaway: null, // Clear the active giveaway
                        giveawayProducts: updatedHistoricalGiveawayProducts, // Update the historical list
                    };
                });
                setIsGiveawayModalOpen(false); // Close modal
            }
        };

         
        // Existing listeners (already granular)
        socket.on(`likesUpdated-${id}`, ({ likes, likedBy }) => {
            setLikes(likes);
            setLiked(likedBy?.includes(userId));
        });
        socket.on("auctionStarted", (data) => {
            setAuctionActive(true);
            setCurrentAuction(data);
            setShow((prev) => ({ ...prev, currentAuction: data }));
        });
        socket.on("auctionEnded", (data) => {
            setAuctionActive(false);
            setCurrentAuction(null);
            setShow((prev) => ({ ...prev, currentAuction: null })); // Fix: Changed '=' to ':' here
        });
        socket.on("bidUpdated", (data) => {
            setCurrentAuction(prev => ({
                ...prev,
                currentHighestBid: data.highestBid,
                highestBidder: data.highestBidder,
                nextBids: data.nextBids,
            }));
        });
        socket.on("timerUpdate", (data) => {
             // Update timer or other dynamic auction info. This might be better handled in AuctionsOverlay
        });

        socket.on('giveawayStarted', handleGiveawayStarted);
        socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
        socket.on('giveawayRolling', handleGiveawayRolling); // New listener
        socket.on('giveawayWinner', handleGiveawayWinner);
        socket.on('giveawayEndedManually', handleGiveawayEndedManually);

        return () => {
            if (socket) {
                socket.off("giveawayStarted", handleGiveawayStarted);
                socket.off("giveawayApplicantsUpdated", handleGiveawayApplicantsUpdated);
                socket.off("giveawayRolling", handleGiveawayRolling); // Clean up new listener
                socket.off("giveawayWinner", handleGiveawayWinner);
                socket.off("giveawayEndedManually", handleGiveawayEndedManually);
                socket.off(`likesUpdated-${id}`);
                socket.off("auctionStarted");
                socket.off("auctionEnded");
                socket.off("bidUpdated");
                socket.off("timerUpdate");
            }
        };
    }, [socket, id, userId]); // Dependencies

    useEffect(() => {
        if (winner) {
            const timer = setTimeout(() => {
                setWinner(null);
            }, 7000); // Confetti duration longer than rolling
            return () => clearTimeout(timer);
        }
    }, [winner]);

    const handleMouseEnter = () => {
        // ... existing functionality ...
    }

    const handleMouseLeave = () => {
        // ... existing functionality ...
    }

    const handleClick = () => {
        // ... existing functionality ...
    }

    const handleShare = async () => {
        const shareUrl = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: show?.title || "Check out this show!",
                    text: "Hey, check out this live show on our platform!",
                    url: shareUrl,
                })
                console.log("Shared successfully")
            } catch (error) {
                console.error("Error sharing", error)
            }
        } else {
            navigator.clipboard
                .writeText(shareUrl)
                .then(() => {
                    toast.success("Link copied to clipboard!")
                })
                .catch((err) => console.error("Error copying link:", err))
        }
    }

    const currentAuctionProduct = show?.auctionProducts?.find(
    p => getProductIdSafely(p.productId) === getProductIdSafely(currentAuction?.product)
);

    const handleProfileView = (profileId) => {
  requireAuth(() => {
    navigate(`/profile/seller/${profileId}`)
  });
}

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    if (loading || !show) {
        return <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white">Loading Show...</div>;
    }
return(
    <div className="flex min-h-screen bg-stone-950 text-white font-montserrat">
            {/* Left Sidebar - Auction Details */}
            <div className="w-[25%] hidden lg:block border-r border-stone-800 bg-stone-950 text-white shadow-xl">
                <div className="p-6 space-y-6">
                    {/* Back Button */}
                    {/* <button
                        onClick={() => navigate(`/profile/`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button> */}

                    {/* Seller Info */}
                         <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-stone-900 rounded-xl sm:rounded-2xl shadow-lg border border-stone-800">
                                    <div className="avatar">
                                    {show?.host?.userInfo?.profileURL ? (
                                        <div
                                        className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden cursor-pointer"
                                        onClick={() => handleProfileView(show?.host?._id)}
                                        >
                                        <img
                                    src={`${import.meta.env.VITE_AWS_CDN_URL}${show?.host?.userInfo?.profileURL?.key}` || "/placeholder.svg"}

                                            alt={
                                            show?.host?.userInfo?.userName ||
                                            show?.host?.userInfo?.name
                                            }
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                            e.target.parentElement.innerHTML = `<div class="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                                        <span class="text-sm sm:text-base md:text-lg font-bold capitalize">${show?.host?.userInfo?.userName.charAt(
                                                                        0
                                                                        )}</span>
                                                                    </div>`;
                                            }}
                                        />
                                        </div>
                                    ) : (
                                        <div className="bg-stone-800 text-yellow-500 rounded-full w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                                        <span className="text-sm sm:text-base md:text-lg font-bold capitalize">
                                            {show?.host?.userInfo?.userName?.charAt(0)}
                                        </span>
                                        </div>
                                    )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <h2
                                        className="font-semibold text-sm sm:text-base md:text-lg cursor-pointer hover:text-yellow-500 transition-colors truncate"
                                        onClick={() => handleProfileView(show?.host?._id)}
                                    >
                                        {show?.host?.companyName || show?.host?.businessName}
                                    </h2>
                                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-stone-400">
                                        <span className="flex items-center gap-0.5 sm:gap-1">
                                        <span className="text-yellow-500">★</span> <span>5.0</span>
                                        </span>
                                        <span>•</span>
                                    <button 
                        onClick={handleFollowClick}
                        disabled={followLoading}
                        className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
                        >
                        {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                    </div>
                </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* Navigation Tabs */}
                     <div className="flex bg-stone-900  p-1 sm:p-1.5 lg:p-1 rounded-lg sm:rounded-xl shadow-md border border-stone-800">
                        <button
                            className={`flex-1 py-2 sm:py-2.5 lg:py-2 px-2 sm:px-4 lg:px-2 rounded-md sm:rounded-lg 
                            text-[11px] sm:text-xs lg:text-[13px] font-medium transition-all ${
                            activeTab === "Auction"
                                ? "bg-yellow-400 text-stone-900 font-semibold"
                                : "text-stone-300 hover:bg-stone-800"
                            }`}
                            onClick={() => setActiveTab("Auction")}
                        >
                            Auction
                        </button>
                        <button
                            className={`flex-1 py-2 sm:py-2.5 lg:py-2 px-2 sm:px-4 lg:px-2 rounded-md sm:rounded-lg 
                            text-[11px] sm:text-xs lg:text-[13px] font-medium transition-all ${
                            activeTab === "Buy Now"
                                ? "bg-yellow-400 text-stone-900 font-semibold"
                                : "text-stone-300 hover:bg-stone-800"
                            }`}
                            onClick={() => setActiveTab("Buy Now")}
                        >
                            Buy Now
                        </button>
                        <button
                            className={`flex-1 py-2 sm:py-2.5 lg:py-2 px-2 sm:px-4 lg:px-2 rounded-md sm:rounded-lg 
                            text-[11px] sm:text-xs lg:text-[13px] font-medium transition-all ${
                            activeTab === "Give away"
                                ? "bg-yellow-400 text-stone-900 font-semibold"
                                : "text-stone-300 hover:bg-stone-800"
                            }`}
                            onClick={() => setActiveTab("Give away")}
                        >
                            Giveaway
                        </button>
                        </div>

                    {/* Tab Content */}
                    <div
                        className="space-y-4 overflow-y-auto pr-2"
                        style={{ maxHeight: "calc(100vh - 320px)", scrollbarWidth: "thin" }}
                    >
                        {activeTab === "Auction" && (
                            <div className="space-y-4">
                                {show?.auctionProducts?.length ? (
                                    show?.auctionProducts?.map((taggedProduct) => (
                                        <div
                                            key={getProductIdSafely(taggedProduct.productId)}
                                            className="overflow-hidden"
                                        >
                                            <AuctionsUser showId={id} streamId={id} product={taggedProduct} signedUrls={signedUrls} socket={socket} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No auction products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "Buy Now" && (
                            <div className="space-y-4">
                                {show?.buyNowProducts?.length ? (
                                    show?.buyNowProducts?.map((taggedProduct) => (
                                        <div
                                            key={getProductIdSafely(taggedProduct.productId)}
                                            className="overflow-hidden"
                                        >
                                            <BuyProducts showId={id} streamId={id} product={taggedProduct} signedUrls={signedUrls} socket={socket} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No buy now products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "Giveaway" && (
                            <div className="space-y-4">
                                {show?.currentGiveaway && show.currentGiveaway.isActive && !show.currentGiveaway.isGiveawayEnded ? (
                                    <GiveAwayUsers
                                        streamId={id}
                                        product={show.currentGiveaway} // Pass the active giveaway object directly
                                        signedUrls={signedUrls}
                                        socket={socket}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <FiGift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No active giveaway at the moment.</p>
                                    </div>
                                )}
                                {/* List all historical giveaways that are ended */}
                                {show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-stone-800">
                                        <h4 className="text-lg font-semibold text-stone-300 mb-4">Completed Giveaways</h4>
                                        {show.giveawayProducts
                                            .filter(p => p.isGiveawayEnded)
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .map(completedProduct => (
                                                <div key={getProductIdSafely(completedProduct.productId)} className="flex items-center gap-3 p-3 bg-stone-900 rounded-lg mb-2">
                                                    <img
                                                        src={signedUrls[getProductIdSafely(completedProduct.productId)] || "/placeholder.svg"}
                                                        className="w-12 h-12 object-contain rounded-lg border border-stone-700"
                                                        alt={completedProduct.productTitle}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm">{completedProduct.productTitle}</p>
                                                        {completedProduct.winner ? (
                                                            <p className="text-xs text-green-400 flex items-center gap-1">
                                                                <Trophy size={12} /> Winner: {completedProduct.winner.userName || completedProduct.winner.name || "Unknown"}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-red-400">Ended without winner</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar for Auction Details */}
            <AnimatePresence>
                {showMobileSidebar && (
                    <motion.div
                        className="fixed inset-0 z-50 flex lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black"
                            onClick={() => setShowMobileSidebar(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        ></motion.div>

                        {/* Sidebar */}
                        <motion.div
                            className="relative w-full bg-stone-950 p-6 space-y-6 border-r border-stone-800 shadow-xl overflow-y-auto"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setShowMobileSidebar(false)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={() => setShowMobileSidebar(false)}
                                    className="p-2 rounded-full bg-stone-800 text-stone-400 hover:bg-stone-700"
                                >
                                    <MdClose size={20} />
                                </button>
                            </div>

                            {/* Seller Info */}
                                  <div className="max-w-sm w-full bg-stone-900 p-4 rounded-2xl shadow-lg border border-stone-800 flex items-center space-x-4">
  {/* Avatar */}
  <div className="avatar">
    {show?.host?.userInfo?.profileURL ? (
      <div
        className="w-14 h-14 rounded-full ring-2 ring-yellow-500/20 overflow-hidden cursor-pointer"
        onClick={() => handleProfileView(show?.host?._id)}
      >
        <img
          src={`${import.meta.env.VITE_AWS_CDN_URL}${show?.host?.userInfo?.profileURL?.key}` || "/placeholder.svg"}
          alt={
            show?.host?.userInfo?.userName ||
            show?.host?.userInfo?.name
          }
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.parentElement.innerHTML = `
              <div class='w-14 h-14 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center'>
                <span class='text-lg font-bold capitalize'>${show?.host?.userInfo?.userName.charAt(0)}</span>
              </div>`;
          }}
        />
      </div>
    ) : (
      <div className="w-14 h-14 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center ring-2 ring-yellow-500/20">
        <span className="text-lg font-bold capitalize">
          {show?.host?.userInfo?.userName?.charAt(0)}
        </span>
      </div>
    )}
  </div>

  {/* Details */}
  <div className="flex-1">
    <h2
      className="font-semibold text-lg text-white cursor-pointer hover:text-yellow-500 transition-colors"
      onClick={() => handleProfileView(show?.host?._id)}
    >
      {show?.host?.companyName || show?.host?.businessName}
    </h2>
    <div className="flex items-center space-x-2 text-sm text-stone-400 mt-1">
      <span className="flex items-center gap-1">
        <span className="text-yellow-500">★</span>
        <span>5.0</span>
      </span>
      <span>•</span>
      <button
        onClick={handleFollowClick}
        disabled={followLoading}
        className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
      >
        {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  </div>
</div>

                            {/* Navigation Tabs */}
                            <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800">
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Auction" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Auction")}
                                >
                                    Auction
                                </button>
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Buy Now" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Buy Now")}
                                >
                                    Buy Now
                                </button>
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Giveaway" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Giveaway")}
                                >
                                    Giveaway
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div
                                className="space-y-4 overflow-y-auto pr-2"
                                style={{ maxHeight: "calc(100vh - 320px)", scrollbarWidth: "thin" }}
                            >
                                {activeTab === "Auction" && (
                                    <div className="space-y-4">
                                        {show?.auctionProducts?.length ? (
                                            show?.auctionProducts?.map((taggedProduct) => (
                                                <div
                                                    key={getProductIdSafely(taggedProduct.productId)}
                                                    className="overflow-hidden"
                                                >
                                                    <AuctionsUser showId={id} streamId={id} product={taggedProduct} signedUrls={signedUrls} socket={socket}/>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No auction products available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "Buy Now" && (
                                    <div className="space-y-4">
                                        {show?.buyNowProducts?.length ? (
                                            show?.buyNowProducts?.map((taggedProduct) => (
                                                <div
                                                    key={getProductIdSafely(taggedProduct.productId)}
                                                    className="overflow-hidden"
                                                >
                                                    <BuyProducts showId={id} streamId={id} product={taggedProduct} signedUrls={signedUrls} socket={socket} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No buy now products available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "Giveaway" && (
                                    <div className="space-y-4">
                                        {show?.currentGiveaway && show.currentGiveaway.isActive && !show.currentGiveaway.isGiveawayEnded ? (
                                            <GiveAwayUsers
                                                streamId={id}
                                                product={show.currentGiveaway} // Pass the active giveaway object directly
                                                signedUrls={signedUrls}
                                                socket={socket}
                                            />
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <FiGift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No active giveaway at the moment.</p>
                                            </div>
                                        )}
                                        {/* List all historical giveaways that are ended */}
                                        {show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length > 0 && (
                                            <div className="mt-8 pt-4 border-t border-stone-800">
                                                <h4 className="text-lg font-semibold text-stone-300 mb-4">Completed Giveaways</h4>
                                                {show.giveawayProducts
                                                    .filter(p => p.isGiveawayEnded)
                                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                    .map(completedProduct => (
                                                        <div key={getProductIdSafely(completedProduct.productId)} className="flex items-center gap-3 p-3 bg-stone-900 rounded-lg mb-2">
                                                            <img
                                                                src={signedUrls[getProductIdSafely(completedProduct.productId)] || "/placeholder.svg"}
                                                                className="w-12 h-12 object-contain rounded-lg border border-stone-700"
                                                                alt={completedProduct.productTitle}
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-sm">{completedProduct.productTitle}</p>
                                                                {completedProduct.winner ? (
                                                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                                                        <Trophy size={12} /> Winner: {completedProduct.winner.userName || completedProduct.winner.name || "Unknown"}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-red-400">Ended without winner</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center - Live Stream */}
            <div className="flex-1 flex flex-col min-h-screen items-center relative">
                <div className="w-full max-w-[500px] h-screen aspect-[9/22] bg-stone-900 relative shadow-xl rounded-xl overflow-hidden">
                    {show?.liveStreamId ? (
                        <ViewLiveStream liveStreamId={show.liveStreamId} />
                        ) : (
                        <div>Loading stream...</div>
                        )}

                    <div
                        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent"
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Seller Info */}
                <div className="flex items-center space-x-3 rounded-2xl py-2">
  <div className="avatar">
    {show?.host?.userInfo?.profileURL?.key ? (
      <div
        className="w-10 h-10 rounded-full ring-2 ring-yellow-500/30 overflow-hidden"
        onClick={() => handleProfileView(show?.sellerId?._id)}
      >
        <img
          src={
            `${import.meta.env.VITE_AWS_CDN_URL}${show?.host?.userInfo?.profileURL?.key}` ||
            "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"
          }
          alt={
            show?.host?.userInfo?.userName ||
            show?.host?.userInfo?.name
          }
          className="w-full h-full object-cover"
          onError={(e) => {
            const firstLetter = show?.host?.userInfo?.userName?.charAt(0) || "U";
            e.target.parentElement.innerHTML = `<div class='w-10 h-10 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center'>
                <span class='text-sm font-bold capitalize'>${firstLetter}</span>
              </div>`;
          }}
        />
      </div>
    ) : (
      <div className="bg-stone-800 text-yellow-500 rounded-full w-10 h-10 flex items-center justify-center ring-2 ring-yellow-500/30">
        <span className="text-sm font-bold capitalize">
          {show?.host?.userInfo?.userName?.charAt(0)}
        </span>
      </div>
    )}
  </div>


              <div>
                <h2
                  className="font-semibold text-lg cursor-pointer hover:text-yellow-500 transition-colors"
                  onClick={() => handleProfileView(show?.host?._id)}
                >
                  {show?.host?.companyName || show?.host?.businessName}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-stone-200">
                  <span className="flex items-center gap-1 text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.5)]">
                    <span className="text-yellow-500">★</span> <span>5.0</span>
                  </span>
                  <span>•</span>
                         <button 
  onClick={handleFollowClick}
  disabled={followLoading}
  className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
>
  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
</button> 
                </div>
              </div>
            </div>
                    </div>

                    <div className="absolute top-24 left-2 p-4 text-center">
                        <AnimatePresence>
                            {winner && (
                                <>
                                    <motion.div
                                        className="flex items-center justify-center gap-2 mt-2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center justify-center gap-2 bg-white rounded-xl p-3 shadow-lg">
                                            <Trophy className="w-5 h-5 text-stone-900" />
                                            <p className="text-sm text-stone-900 font-bold">
                                                Giveaway Winner: {winner?.name || winner?.userName} 🎉
                                            </p>
                                        </div>
                                    </motion.div>
                                    <div className="absolute z-50 top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                                        <ConfettiExplosion force={0.7} duration={5000} particleCount={61} width={1600} />
                                    </div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Giveaway button on video overlay */}
                    <div
                        onClick={() => requireAuth(() => setIsGiveawayModalOpen(true))}
                        className="absolute top-24 right-4 p-3 text-center bg-stone-900/80 backdrop-blur-sm border border-stone-700/30 rounded-xl cursor-pointer hover:bg-stone-800 transition shadow-lg"
                    >
                        <p className="mb-1 font-semibold text-sm">Giveaway</p>
                        <span className="flex items-center justify-center gap-1.5 text-xs text-yellow-500">
                            <motion.span
                                animate={{
                                    x: [0, -4, 3, -4, 3, 0],
                                }}
                                transition={{
                                    x: {
                                        duration: 0.6,
                                        ease: "easeInOut",
                                        repeat: Number.POSITIVE_INFINITY,
                                        repeatType: "loop",
                                        repeatDelay: 1,
                                    },
                                }}
                            >
                                <FiGift size={16} />
                            </motion.span>
                            {show?.giveawayProducts?.length || 0}{" "}
                            {(show?.giveawayProducts?.length || 0) === 1 ? "Product" : "Products"}
                        </span>
                    </div>

                    <AnimatePresence>
                        {isGiveawayModalOpen && (
                            <motion.div
                                className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="bg-stone-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative border border-stone-700"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                >
                                    <button
                                        className="absolute top-4 right-4 text-white bg-stone-800 hover:bg-stone-700 rounded-full p-2 transition-colors"
                                        onClick={() => setIsGiveawayModalOpen(false)}
                                    >
                                        <MdClose size={18} />
                                    </button>
                                    <h2 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                                        <FiGift className="text-yellow-500" size={20} /> Giveaway Products
                                    </h2>
                                    <div className="space-y-4">
                                        {show?.giveawayProducts?.length ? (
                                            show?.giveawayProducts.map((taggedProduct) => (
                                                <div
                                                    key={getProductIdSafely(taggedProduct.productId)}
                                                    className=" rounded-xl overflow-hidden hover:border-yellow-500/50 transition-colors"
                                                >
                                                    {/* Condition to pass the 'currentGiveaway' object if it's the currently active one */}
                                                    {show.currentGiveaway && getProductIdSafely(show.currentGiveaway.productId) === getProductIdSafely(taggedProduct.productId) &&
                                                    show.currentGiveaway.isActive && !show.currentGiveaway.isGiveawayEnded ? (
                                                        <GiveAwayUsers streamId={id} product={show.currentGiveaway} signedUrls={signedUrls} socket={socket} />
                                                    ) : (
                                                        // For historical or non-active giveaways in the list, pass the taggedProduct directly.
                                                        // GiveAwayUsers component handles its internal state based on this 'product' prop.
                                                        <GiveAwayUsers streamId={id} product={taggedProduct} signedUrls={signedUrls} socket={socket} />
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-stone-400">
                                                <FiGift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No giveaway products available.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute bottom-6 left-0 right-0 p-3 flex flex-col space-y-3 z-30 mb-4">
                <div className="flex flex-row justify-between items-end gap-4">
                    <div
                        className="flex-1 text-white max-w-[calc(100%-80px)] md:max-w-[calc(100%-100px)]"
                        style={{
                            WebkitMaskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 100%)",
                            maskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 100%)",
                        }}
                    >
                        <div className="block md:block lg:hidden">
                            <LiveComments
                                streamId={id}
                                prevComments={show?.comments}
                                socket={socket}
                            />
                        </div>
                    </div>

                    {/* Floating Action Buttons */}
                    <div className="flex flex-col space-y-2 items-center flex-shrink-0">
                        <LikeButton
                            initialLikes={likes}
                            onLike={handleLike}
                            isLiked={liked}
                            setIsLiked={setLiked}
                            setLikes={setLikes}
                            connectionReady={!!socket}
                        />

                        <button
                             onClick={() => requireAuth(() => setIsNotesModalOpen(true))}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700/90 active:bg-stone-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <BiNotepad className="h-5 w-5" /> 
                        </button>

                        {/* Notes Modal */}
                        <AnimatePresence>
                            {isNotesModalOpen && (
                                <motion.div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsNotesModalOpen(false)}
                                >
                                    <motion.div
                                        className="bg-stone-900 rounded-2xl shadow-2xl p-6 max-w-md w-full relative border border-stone-700/50"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Close button in top right */}
                                        <button
                                            onClick={() => setIsNotesModalOpen(false)}
                                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 transition-colors rounded-full p-1 hover:bg-stone-800"
                                            aria-label="Close"
                                        >
                                            <MdClose size={20} />
                                        </button>

                                        <h2 className="text-2xl font-bold mb-6 text-white pr-8">
                                            Notes
                                        </h2>

                                        <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-700/40 backdrop-blur-sm">
                                            <p className="text-yellow-400 font-medium flex items-center gap-3">
                                                <span className="text-xl flex-shrink-0">⚠️</span> 
                                                <span>No returns for any products in Auction</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleShare}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700/90 active:bg-stone-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <FiShare className="h-5 w-5" />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border-stone-700/30 text-white hover:bg-stone-700/90 active:bg-stone-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                            <LucideWallet className="h-5 w-5" />
                        </button>

                        {/* Mobile Toggle Button for Auction Details */}
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="relative lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400 text-stone-900 hover:bg-yellow-500 active:bg-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <AiOutlineShop className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-stone-900 shadow-md">
                                {(show?.auctionProducts?.length || 0) +
                                    (show?.buyNowProducts?.length || 0) +
                                    (show?.giveawayProducts?.length || 0)}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Bottom row: Auction Overlay */}
                <AnimatePresence>
                    {auctionActive && currentAuction ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full text-white flex flex-col p-4 rounded-xl backdrop-blur-sm shadow-lg bg-stone-900/20 border border-stone-700/20"
                        >
                           <AuctionsOverlay
                            streamId={id}
                            show={show}
                            currentAuction={currentAuction}
                            product={currentAuctionProduct}
                            signedUrls={signedUrls}
                            socket={socket}
                        />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full text-white flex flex-col p-2 rounded-xl"
                        >
                            <h3 className="text-md font-bold">{/* {show?.title} */}</h3>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1/4 z-10">
                    <div className="h-full bg-gradient-to-t from-stone-950/90 to-transparent"></div>
                </div>
            </div>

            {/* Right Sidebar - Chat */}
           <div className="md:w-[25%] border-l border-stone-800 min-h-screen hidden lg:flex flex-col justify-between bg-stone-950">
                <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <h3 className="font-semibold text-lg">Live Chat</h3>
                <MessageCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <LiveComments
                streamId={id}
                prevComments={show?.comments}
                height={show?.comments?.length > 10 ? "90vh" : "90vh"}
                socket={socket}
                />
            </div>
             <RollingEffectOverlay isRolling={isRollingGiveaway} />
        </div>
    )
}

export default ShowDetailsPage;