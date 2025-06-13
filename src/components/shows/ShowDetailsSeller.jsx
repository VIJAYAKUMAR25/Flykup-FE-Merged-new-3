// ShowDetailsSeller.jsx (Seller Side)
import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { MessageCircle, Volume2, ArrowLeft,Clock,X, LucideWallet, Package, Gavel, Users, Trophy } from "lucide-react";
import LikeButton from "./ui/LikeButton";
import { useNavigate, useParams, UNSAFE_NavigationContext } from "react-router-dom";
import { socketurl } from "../../../config"; // Ensure correct path
import axios from "axios";
import LiveComments from "./LiveComments";
import io from "socket.io-client";
import Auctions from "./Auctions";
import BuyProductsSellers from "./BuyProductsSeller";
import { BiNotepad } from "react-icons/bi";
import { FiShare } from "react-icons/fi";
import { AiOutlineShop } from "react-icons/ai";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import StartStream from "../reuse/LiveStream/StartStream";

import GiveAwaySellerControl from "./GiveAway"; // Make sure this path is correct

const ShowDetailsSeller = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showId } = useParams();
    const [show, setShow] = useState(null); // Initialize as null to clearly indicate loading
    const [loading, setLoading] = useState(true); // Track loading state for show data
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [userId] = useState(user?._id);

    const [signedUrls, setSignedUrls] = useState({});
    const [activeTab, setActiveTab] = useState("Auction");
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);

    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const pendingNavigation = useRef(null);

    const navigator = useContext(UNSAFE_NavigationContext).navigator;

    // --- STATE FOR GIVEAWAY MANAGEMENT ---
    // `currentLiveGiveaway` will hold the details of the active giveaway if any.
    // This state is crucial for the `GiveAwaySellerControl` component.
    const [currentLiveGiveaway, setCurrentLiveGiveaway] = useState(null); 

    // Initialize socket inside useEffect to ensure 'user' is defined
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const newSocket = io.connect(socketurl, {
                transports: ['websocket'], // Force WebSocket transport
                auth: {
                    userId: user._id, // 'user._id' is now available
                },
            });
            setSocket(newSocket);

            // Clean up socket connection on component unmount
            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]); // The effect runs when the 'user' object changes


    // Fetch show data initially and on relevant updates
    const fetchShow = useCallback(async () => {
        setLoading(true); // Start loading
        try {
            const response = await axios.get(`${socketurl}/api/shows/get/${showId}`, {
                withCredentials: true,
            });
            if (response.status === 200) {
                const showData = response.data;
                console.log("Fetched Show Data (Seller):", showData);
                setShow(showData);
                
                // Update currentLiveGiveaway from fetched show data
                // Ensure product.productId is populated for proper identification later
                if (showData.currentGiveaway && showData.currentGiveaway.isActive && !showData.currentGiveaway.isGiveawayEnded) {
                    setCurrentLiveGiveaway(showData.currentGiveaway);
                } else {
                    setCurrentLiveGiveaway(null); // Clear if no active giveaway
                }

                // Combine all product types into a single array for signed URLs
                const allProductsToSign = [
                    ...(showData?.buyNowProducts || []),
                    ...(showData?.auctionProducts || []),
                    ...(showData?.giveawayProducts || []),
                    // Include currentGiveaway's product if it's not null, for signed URL generation
                    // Ensure product.productId is populated before accessing its properties
                    ...(showData.currentGiveaway && showData.currentGiveaway.productId ? [{ productId: showData.currentGiveaway.productId }] : []),
                ];

                const validProductsForUrls = allProductsToSign.filter(
                    (p) => p.productId && p.productId.images && p.productId.images[0] && p.productId.images[0].key
                );
                fetchSignedUrlsForProducts(validProductsForUrls);

            } else {
                console.error("Failed to fetch show details.");
                toast.error("Failed to fetch show details.");
            }
        } catch (error) {
            console.error("Error fetching show details:", error);
            toast.error("Error fetching show details.");
        } finally {
            setLoading(false); // End loading
        }
    }, [showId]); // Only dependent on showId

    useEffect(() => {
        fetchShow();
    }, [showId, fetchShow]); // Re-fetch when showId or fetchShow (memoized) changes

    // Update local states when show data changes (e.g., from fetchShow)
    useEffect(() => {
        if (show) {
            setLikes(show?.likes);
            setLiked(show?.likedBy?.includes(user?._id));
            setViewerCount(show?.viewerCount || 0);
            // currentLiveGiveaway is already updated inside fetchShow
        }
    }, [show, user?._id]); 


    const fetchSignedUrlsForProducts = async (productsArray) => {
        const urls = {};
        const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

        for (const product of productsArray) {
            if (product.productId && product.productId.images && product.productId.images[0] && product.productId.images[0].key) {
                urls[product.productId._id] = cdnURL + product.productId.images[0].key;
            }
        }
        setSignedUrls(urls);
    };

    const handleLike = () => {
        if (!userId) {
            toast.error("Please log in to like a show.");
            return;
        }
        if (socket) { // Ensure socket is connected before emitting
            socket.emit("toggleLike", { streamId: showId, userId });
        } else {
            console.warn("Socket not connected, cannot toggle like.");
        }
    };

    // Socket.IO listeners for real-time updates (likes, viewer count, and NOW GIVEAWAY)
    useEffect(() => {
        // Only proceed if socket is connected and showId is available
        if (!socket || !showId) {
            console.log("Socket or ShowId not ready for listeners.");
            return;
        }

        socket.emit("joinRoom", showId);

        const handleLikesUpdate = ({ likes, likedBy }) => {
            setLikes(likes);
            setLiked(likedBy?.includes(userId));
        };

        // Note: Millicast SDK handles viewer count in StartStream.
        // If you have a separate server-side viewer count, this listener would be used.
        const handleViewerCountUpdate = (count) => {
            setViewerCount(count);
        };

        // --- NEW/MODIFIED GIVEAWAY LISTENERS FOR SELLER SIDE ---
        const handleGiveawayStarted = (data) => {
            if (data.streamId === showId) {
                setCurrentLiveGiveaway(data); // Update currentLiveGiveaway immediately from socket data
            }
        };

        const handleGiveawayApplicantsUpdated = (data) => {
            // console.log("Seller: Giveaway applicants updated event received", data);
            if (data.streamId === showId && currentLiveGiveaway && (data.productId._id || data.productId) === (currentLiveGiveaway.productId._id || currentLiveGiveaway.productId)) {
                // Update only the applicants count in currentLiveGiveaway state locally
                setCurrentLiveGiveaway(prev => {
                    if (prev) {
                        return {
                            ...prev,
                            applicants: data.applicants || [],
                        };
                    }
                    return prev;
                });
            }
        };

        const handleGiveawayWinner = (data) => {
            console.log("Seller: Giveaway winner event received", data);
            if (data.streamId === showId) {
                // Update currentLiveGiveaway to reflect winner and ended status locally
                setCurrentLiveGiveaway(prev => {
                    if (prev) {
                        return {
                            ...prev,
                            winner: data.winner,
                            isActive: false,
                            isGiveawayEnded: true,
                        };
                    }
                    return prev;
                });
                toast.success(`Winner selected for: ${data.productTitle || data.productId?.title}!`);
                // IMPORTANT: Refetch show to update the main giveawayProducts array and properly reset currentGiveaway.
                // This ensures the "Available Giveaways" list is correctly updated.
         
            }
        };

        const handleGiveawayEndedManually = (data) => {
            console.log("Seller: Giveaway ended manually event received", data);
            if (data.streamId === showId) {
                setCurrentLiveGiveaway(prev => {
                    if (prev) {
                        return {
                            ...prev,
                            isActive: false,
                            isGiveawayEnded: true,
                            winner: null, // Clear winner if manually ended without one
                        };
                    }
                    return prev;
                });
                // toast.info(`Giveaway manually ended for: ${data.productTitle || data.productId?.title}.`);
                // IMPORTANT: Refetch show to update the main giveawayProducts array and properly reset currentGiveaway.
     
            }
        };

        const handleGiveawayAlreadyActive = (data) => {
            toast.warn(data.message);
        };

        socket.on(`likesUpdated-${showId}`, handleLikesUpdate);
        socket.on(`viewerCountUpdate-${showId}`, handleViewerCountUpdate); // Listen for viewer count from backend if applicable
        socket.on('giveawayStarted', handleGiveawayStarted);
        socket.on('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
        socket.on('giveawayWinner', handleGiveawayWinner);
        socket.on('giveawayEndedManually', handleGiveawayEndedManually);
        socket.on('giveawayAlreadyActive', handleGiveawayAlreadyActive);


        return () => {
            // Clean up all listeners when component unmounts or dependencies change
            if (socket) {
                socket.off(`likesUpdated-${showId}`, handleLikesUpdate);
                socket.off(`viewerCountUpdate-${showId}`, handleViewerCountUpdate);
                socket.off('giveawayStarted', handleGiveawayStarted);
                socket.off('giveawayApplicantsUpdated', handleGiveawayApplicantsUpdated);
                socket.off('giveawayWinner', handleGiveawayWinner);
                socket.off('giveawayEndedManually', handleGiveawayEndedManually);
                socket.off('giveawayAlreadyActive', handleGiveawayAlreadyActive);
            }
        };
    }, [socket, showId, userId, currentLiveGiveaway]); // Added currentLiveGiveaway and fetchShow

    // Placeholder, adjust if you have a real-time stream timer
    const streamTime = 0; 
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Navigation blocking (no change from previous code)
    // useEffect(() => {
    //     if (show?.isLive) {
    //         const handleBlockedNavigation = (event) => {
    //             if (!showExitConfirm) {
    //                 event.preventDefault();
    //                 pendingNavigation.current = event.destination;
    //                 setShowExitConfirm(true);
    //             }
    //         };
    //         const unblock = navigator.block(handleBlockedNavigation);

    //         return () => {
    //             unblock();
    //         };
    //     }
    // }, [navigator, showExitConfirm, show?.isLive]);

    const confirmExit = () => {
        setShowExitConfirm(false);
        if (pendingNavigation.current) {
            // Allow the navigation to proceed
            pendingNavigation.current.retry();
            pendingNavigation.current = null;
        }
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
        pendingNavigation.current = null;
    };

    // Share handler (no change from previous code)
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/home/show/${showId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: show?.title || "Check out this show!",
                    text: "Hey, check out this live show on our platform!",
                    url: shareUrl,
                });
                console.log("Shared successfully");
            } catch (error) {
                console.error("Error sharing", error);
            }
        } else {
            navigator.clipboard
                .writeText(shareUrl)
                .then(() => {
                    toast.success("Link copied to clipboard!");
                })
                .catch((err) => console.error("Error copying link:", err));
        }
    };


    if (loading || !show) { // Show loading state
        return <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white">Loading Show...</div>;
    }

    return (
        <div className="flex min-h-screen bg-stone-950 text-white font-montserrat">
            {/* Left Sidebar - Product Details (Auctions, Buy Now, Giveaways) */}
            <div className="w-[25%] hidden lg:block border-r border-stone-800 bg-stone-950 text-white shadow-xl">
                <div className="p-6">
                    {/* Navigation Tabs */}
                    <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800 mb-6">
                        <button
                            className={`flex-1 py-1 px-2 rounded-lg text-sm font-medium transition-all ${activeTab === "Auction" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Auction")}
                        >
                            Auction
                        </button>
                        <button
                            className={`flex-1 py-1 px-2 rounded-lg text-sm font-medium transition-all ${activeTab === "Buy Now" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Buy Now")}
                        >
                            Buy Now
                        </button>
                        <button
                            className={`flex-1 py-1 px-2 rounded-lg text-sm font-medium transition-all ${activeTab === "Giveaway" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Giveaway")}
                        >
                            Giveaway
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
                        {activeTab === "Auction" && (
                            <div className="space-y-4">
                                {show?.auctionProducts?.length ? (
                                    show.auctionProducts.map((taggedProduct) => (
                                        <div key={taggedProduct._id || taggedProduct.productId?._id} className="overflow-hidden">
                                            <Auctions showId={showId} streamId={showId} product={taggedProduct} signedUrls={signedUrls} socket={socket} /> {/* Pass socket here */}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No auction products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "Buy Now" && (
                            <div className="space-y-4">
                                {show?.buyNowProducts?.length ? (
                                    show.buyNowProducts.map((taggedProduct) => (
                                        <div key={taggedProduct._id || taggedProduct.productId?._id} className="overflow-hidden">
                                            <BuyProductsSellers showId={showId} streamId={showId} product={taggedProduct} signedUrls={signedUrls} socket={socket} /> {/* Pass socket here */}
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

                        {/* --- MODIFIED: Giveaway Tab Content for Seller --- */}
                        {activeTab === "Giveaway" && (
                            <div className="space-y-4">
                                {/* Display currently active giveaway if it exists */}
                                {currentLiveGiveaway && currentLiveGiveaway.isActive && !currentLiveGiveaway.isGiveawayEnded ? (
                                    <>
                                        <div className="bg-yellow-400 text-stone-900 p-3 rounded-lg text-center font-semibold text-sm mb-4 animate-pulse">
                                            Active Giveaway Live!
                                        </div>
                                        {/* Render the active giveaway control */}
                                        <GiveAwaySellerControl
                                            streamId={showId}
                                            product={currentLiveGiveaway}
                                            signedUrls={signedUrls}
                                            socket={socket} // Pass socket
                                            // No need to pass initial states separately as `product` is the source of truth
                                            setCurrentLiveGiveaway={setCurrentLiveGiveaway} // Pass setter for local updates
                                            fetchShow={fetchShow} // Pass fetchShow to re-fetch on winner/end
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <p>No active giveaway at the moment.</p>
                                    </div>
                                )}

                                {/* List all other (non-active, non-ended) giveaway products to be started */}
                                {show?.giveawayProducts?.filter(p => !p.isActive && !p.isGiveawayEnded).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-stone-800">
                                        <h4 className="text-lg font-semibold text-stone-300 mb-4">Available Giveaways</h4>
                                        {show.giveawayProducts
                                            .filter(p => !p.isActive && !p.isGiveawayEnded) // Filter out active and ended ones
                                            .sort((a, b) => (a.giveawayNumber || 0) - (b.giveawayNumber || 0)) // Sort by giveawayNumber
                                            .map((taggedProduct) => {
                                                const anyGiveawayActive = currentLiveGiveaway && currentLiveGiveaway.isActive && !currentLiveGiveaway.isGiveawayEnded;
                                                return (
                                                    <div key={taggedProduct.productId._id} className="border border-stone-800 rounded-xl p-4 bg-stone-900 shadow-md">
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <img
                                                                src={signedUrls[taggedProduct.productId._id] || "/placeholder.svg"}
                                                                className="w-16 h-16 object-contain rounded-lg border border-stone-700"
                                                                alt={taggedProduct.productId.title}
                                                            />
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold">{taggedProduct.productId.title}</h3>
                                                                {taggedProduct.giveawayNumber && (
                                                                    <p className="text-sm text-stone-400">Giveaway #{taggedProduct.giveawayNumber}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button
                                                           onClick={() => {
                                                            if (socket) {
                                                                const giveawayData = {
                                                                    streamId: showId,
                                                                    productId: taggedProduct.productId._id,
                                                                    productTitle: taggedProduct.productId.title,
                                                                    followersOnly: taggedProduct.followersOnly || false,
                                                                    productOwnerSellerId: taggedProduct.productOwnerSellerId,
                                                                };
                                                                console.log("Giveaway data Show ID Check by vijay", showId); // This console.log is very important!
                                                                console.log("Attempting to start giveaway with data:", giveawayData); // This console.log is very important!
                                                                socket.emit('startGiveaway', giveawayData);
                                                            } else {
                                                                toast.error("Socket not connected. Please refresh.");
                                                            }
                                                        }}
                                                            className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${anyGiveawayActive || !socket ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                                            disabled={anyGiveawayActive || !socket}
                                                        >
                                                            {anyGiveawayActive ? 'Another Giveaway Active' : 'Start This Giveaway'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}

                                {/* Section to show completed giveaways */}
                                {show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-stone-800">
                                        <h4 className="text-lg font-semibold text-stone-300 mb-4">Completed Giveaways</h4>
                                        {show.giveawayProducts
                                            .filter(p => p.isGiveawayEnded)
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by most recent
                                            .map(completedProduct => (
                                                <div key={completedProduct.productId._id} className="flex items-center gap-3 p-3 bg-stone-900 rounded-lg mb-2">
                                                    <img
                                                        src={signedUrls[completedProduct.productId._id] || "/placeholder.svg"}
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

                                {/* Message if no giveaways at all */}
                                {!currentLiveGiveaway &&
                                    show?.giveawayProducts?.filter(p => !p.isActive && !p.isGiveawayEnded).length === 0 &&
                                    show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length === 0 && (
                                    <div className="text-center py-8 text-stone-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No giveaway products added yet.</p>
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
                            className="relative w-full max-w-sm bg-stone-950 p-6 space-y-6 border-r border-stone-800 shadow-xl overflow-y-auto"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => navigate(`/seller/allshows`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={() => setShowMobileSidebar(false)}
                                    className="p-2 rounded-full bg-stone-800 text-stone-400 hover:bg-stone-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Seller Info */}
                            <div className="flex items-center space-x-3 p-4 bg-stone-900 rounded-2xl shadow-lg border border-stone-800">
                                <div className="avatar">
                                    {show?.host?.userInfo?.profileURL ? (
                                        <div className="w-12 h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden">
                                            <img
                                                src={show?.host?.userInfo?.profileURL || "/placeholder.svg"}
                                                alt={show?.host?.userInfo?.userName || show?.host?.userInfo?.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                        <span class="text-lg font-bold capitalize">${show?.host?.userInfo?.userName?.charAt(0) || show?.host?.userInfo?.name?.charAt(0)}</span>
                                                    </div>`;
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-stone-800 text-yellow-500 rounded-full w-12 h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                                            <span className="text-lg font-bold capitalize">
                                                {show?.host?.userInfo?.userName?.charAt(0) || show?.host?.userInfo?.name?.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">{show?.host?.companyName || show?.host?.businessName}</h2>
                                    <div className="flex items-center space-x-2 text-sm text-stone-400">
                                        <span className="flex items-center gap-1">
                                            <span className="text-yellow-500">★</span> <span>5.0</span>
                                        </span>
                                        <span>•</span>
                                        <button className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors">
                                            Follow
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
                                                    key={taggedProduct._id || taggedProduct.productId?._id}
                                                    className="overflow-hidden"
                                                >
                                                    <Auctions showId={showId} streamId={showId} product={taggedProduct} signedUrls={signedUrls} socket={socket}/>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
                                                    key={taggedProduct._id || taggedProduct.productId?._id}
                                                    className="overflow-hidden"
                                                >
                                                    <BuyProductsSellers
                                                        showId={showId}
                                                        streamId={showId}
                                                        product={taggedProduct}
                                                        signedUrls={signedUrls}
                                                        socket={socket}
                                                    />
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
                                        {currentLiveGiveaway && currentLiveGiveaway.isActive && !currentLiveGiveaway.isGiveawayEnded ? (
                                            <>
                                                <div className="bg-yellow-400 text-stone-900 p-3 rounded-lg text-center font-semibold text-sm mb-4 animate-pulse">
                                                    Active Giveaway Live!
                                                </div>
                                                <GiveAwaySellerControl
                                                    streamId={showId}
                                                    product={currentLiveGiveaway}
                                                    signedUrls={signedUrls}
                                                    socket={socket}
                                                    setCurrentLiveGiveaway={setCurrentLiveGiveaway}
                                                    fetchShow={fetchShow}
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <p>No active giveaway at the moment.</p>
                                            </div>
                                        )}

                                        {show?.giveawayProducts?.filter(p => !p.isActive && !p.isGiveawayEnded).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-stone-800">
                                                <h4 className="text-lg font-semibold text-stone-300 mb-4">Available Giveaways</h4>
                                                {show.giveawayProducts
                                                    .filter(p => !p.isActive && !p.isGiveawayEnded)
                                                    .sort((a, b) => (a.giveawayNumber || 0) - (b.giveawayNumber || 0))
                                                    .map((taggedProduct) => {
                                                        const anyGiveawayActive = currentLiveGiveaway && currentLiveGiveaway.isActive && !currentLiveGiveaway.isGiveawayEnded;
                                                        return (
                                                            <div key={taggedProduct.productId._id} className="border border-stone-800 rounded-xl p-4 bg-stone-900 shadow-md">
                                                                <div className="flex items-center gap-4 mb-3">
                                                                    <img
                                                                        src={signedUrls[taggedProduct.productId._id] || "/placeholder.svg"}
                                                                        className="w-16 h-16 object-contain rounded-lg border border-stone-700"
                                                                        alt={taggedProduct.productId.title}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <h3 className="text-lg font-semibold">{taggedProduct.productId.title}</h3>
                                                                        {taggedProduct.giveawayNumber && (
                                                                            <p className="text-sm text-stone-400">Giveaway #{taggedProduct.giveawayNumber}</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                   onClick={() => {
                                                                    if (socket) {
                                                                        const giveawayData = {
                                                                            streamId: showId,
                                                                            productId: taggedProduct.productId._id, // Ensure this is a string ObjectId
                                                                            productTitle: taggedProduct.productId.title,
                                                                            followersOnly: taggedProduct.followersOnly || false,
                                                                            productOwnerSellerId: taggedProduct.productOwnerSellerId,
                                                                        };
                                                                        console.log("Attempting to start giveaway with data:", giveawayData); // Add this line
                                                                        socket.emit('startGiveaway', giveawayData);
                                                                    } else {
                                                                        toast.error("Socket not connected. Please refresh.");
                                                                    }
                                                                }}
                                                                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${anyGiveawayActive || !socket ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                                                    disabled={anyGiveawayActive || !socket}
                                                                >
                                                                    {anyGiveawayActive ? 'Another Giveaway Active' : 'Start This Giveaway'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length > 0 && (
                                            <div className="mt-8 pt-4 border-t border-stone-800">
                                                <h4 className="text-lg font-semibold text-stone-300 mb-4">Completed Giveaways</h4>
                                                {show.giveawayProducts
                                                    .filter(p => p.isGiveawayEnded)
                                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                    .map(completedProduct => (
                                                        <div key={completedProduct.productId._id} className="flex items-center gap-3 p-3 bg-stone-900 rounded-lg mb-2">
                                                            <img
                                                                src={signedUrls[completedProduct.productId._id] || "/placeholder.svg"}
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

                                        {!currentLiveGiveaway &&
                                            show?.giveawayProducts?.filter(p => !p.isActive && !p.isGiveawayEnded).length === 0 &&
                                            show?.giveawayProducts?.filter(p => p.isGiveawayEnded).length === 0 && (
                                            <div className="text-center py-8 text-stone-400">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No giveaway products added yet.</p>
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
                    <div className="relative bg-black w-full h-full">
                        <StartStream showId={showId} showDetails={show} />
                    </div>

                    {/* <div className="absolute top-12 left-4 right-16 p-4">
                        <h1 className="text-xl font-bold text-white">{show?.title || "Untitled Stream"}</h1>
                    </div> */}

                    {/* Floating Action Buttons */}
                    <div className="absolute right-4 bottom-28 flex flex-col space-y-3">
                        <LikeButton
                            initialLikes={likes}
                            onLike={handleLike}
                            isLiked={liked}
                            setIsLiked={setLiked}
                            setLikes={setLikes}
                            connectionReady={!!socket}
                        />

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <BiNotepad className="h-5 w-5" />
                        </button>

                        <button
                            onClick={handleShare}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg"
                        >
                            <FiShare className="h-5 w-5" />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <Volume2 className="h-5 w-5" />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <LucideWallet className="h-5 w-5" />
                        </button>

                        {/* Mobile Toggle Button for Auction Details */}
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="relative lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400 text-stone-900 hover:bg-yellow-500 transition-colors shadow-lg"
                        >
                            <AiOutlineShop className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-stone-900">
                                {(show?.auctionProducts?.length || 0) +
                                    (show?.buyNowProducts?.length || 0) +
                                    (show?.giveawayProducts?.length || 0)}
                            </span>
                        </button>
                    </div>

                    {/* Overlay Chat/Comments */}
                    <div className="absolute bottom-5 left-1 right-16 text-white flex flex-col lg:hidden lg:flex">
                        <LiveComments streamId={showId} prevComments={show?.comments} />
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Chat and Stream Controls (Simplified) */}
            <div className="w-[25%] hidden lg:flex flex-col justify-between border-l border-stone-800 min-h-screen bg-stone-950">
                {/* Stream Controls */}
                {/* <div className="p-6 border-b border-stone-800 text-center flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-white">Stream Controls</h3>

                    <div className="flex flex-col gap-3">
                        {!isStreaming ? (
                            <button
                                onClick={startStreaming}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-stone-900 rounded-xl font-medium hover:bg-yellow-400 transition-colors shadow-lg"
                            >
                                <Video className="h-5 w-5" />
                                Start Live Stream
                            </button>
                        ) : (
                            <button
                                onClick={stopStreaming}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg"
                            >
                                <X className="h-5 w-5" />
                                End Live Stream
                            </button>
                        )}

                        <div className="flex justify-center gap-4 mt-2">
                            <button
                                onClick={toggleCamera}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isCameraEnabled ? "bg-stone-800 text-white" : "bg-red-500/20 text-red-500 border border-red-500/30"}`}
                            >
                                {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                                {isCameraEnabled ? "Camera On" : "Camera Off"}
                            </button>

                            <button
                                onClick={toggleMic}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isMicEnabled ? "bg-stone-800 text-white" : "bg-red-500/20 text-red-500 border border-red-500/30"}`}
                            >
                                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                {isMicEnabled ? "Mic On" : "Mic Off"}
                            </button>
                        </div>
                    </div>

                    {isStreaming && (
                        <div className="flex justify-between items-center mt-2 p-3 bg-stone-900 rounded-lg border border-stone-800">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <span className="font-mono">{formatTime(streamTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-yellow-500" />
                                <span>{viewerCount || 0}</span>
                            </div>
                        </div>
                    )}
                </div> */}

             <div className="flex-1 flex flex-col justify-between text-white">
                <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Live Chat</h3>
                    <MessageCircle className="h-5 w-5 text-yellow-500" />
                </div>

                <div className="mt-auto ">
                    <LiveComments
                    streamId={showId}
                    prevComments={show?.comments}
                    height={show?.comments?.length > 10 ? "90vh" : "92vh"}
                    />
                </div>
                </div>

            </div>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={cancelExit}
                        ></motion.div>
                        <motion.div
                            className="relative bg-stone-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-stone-700"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">Exit Live Stream?</h2>
                            <p className="text-stone-300 mb-6">
                                Are you sure you want to exit the live stream? Your stream will end.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={confirmExit}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
                                >
                                    Yes, End Stream
                                </button>
                                <button
                                    onClick={cancelExit}
                                    className="px-6 py-3 bg-stone-700 text-white rounded-lg font-semibold hover:bg-stone-600 transition-colors shadow-md"
                                >
                                    No, Stay Live
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShowDetailsSeller;