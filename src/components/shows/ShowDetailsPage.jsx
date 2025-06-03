import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Volume2,
  ArrowLeft,
  Package,
  Trophy,
  LucideWallet,
} from "lucide-react";
import LikeButton from "./ui/LikeButton";
import AuctionsOverlay from "./AuctionsOverlay";
import LiveComments from "./LiveComments";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socketurl } from "../../../config";
import { BiNotepad } from "react-icons/bi";
import axios from "axios";
import io from "socket.io-client";
import AuctionsUser from "./AuctionsUser";
import { generateSignedUrl } from "../../utils/aws";
import BuyProducts from "./BuyProducts";
import { SOCKET_URL } from "../api/apiDetails";
import GiveAwayUsers from "./GiveAwayUsers";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiExplosion from "react-confetti-explosion";
import { FiGift, FiShare } from "react-icons/fi";
import { RiLiveLine } from "react-icons/ri";
import { MdClose } from "react-icons/md";
import { View, Director } from "@millicast/sdk";
import { useAuth } from "../../context/AuthContext";
import { AiOutlineShop } from "react-icons/ai";
import ViewLiveStream from "../reuse/LiveStream/ViewLiveStream";
const socket = io.connect(socketurl, {
  transports: ["websocket"],
});

const ShowDetailsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState();
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [userId, setUserId] = useState(user?._id);
  const [activeTab, setActiveTab] = useState("Auction");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [signedUrls, setSignedUrls] = useState({});
  const [products, setProducts] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const timerRef = useRef(null);
  const [auctionActive, setAuctionActive] = useState(false);
  const [currentAuction, setCurrentAuction] = useState(null);
  // const [socket, setSocket] = useState(null)

  // useEffect(() => {
  //     if (user) {
  //         const newSocket = io.connect(socketurl, {
  //             auth: {
  //                 userId: user._id,
  //             },
  //             transports: ["websocket"], // Force WebSockets
  //         })
  //         setSocket(newSocket)

  //         // Optionally, cleanup on unmount:
  //         return () => newSocket.disconnect()
  //     }
  // }, [user])

  // Ref to hold initial streaming config
  const initialStreamConfig = useRef(null);

  // Fetch show details when mobile sidebar or giveaway modal changes
  useEffect(() => {
    fetchShow();
  }, [showMobileSidebar, isGiveawayModalOpen]);

  // Update likes when show updates
  useEffect(() => {
    if (show) {
      setLikes(show?.likes);
      setLiked(show?.likedBy?.includes(user?._id));
    }
  }, [show]);

  const fetchShow = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${socketurl}/api/shows/get/${id}`, {
        withCredentials: true,
      });
      if (response.status === 200) {
        const showData = response.data;
        console.log("Show data:", showData);
        setShow(showData);
        // Combine all product types into a single array
        const allProducts = [
          ...(showData?.buyNowProducts || []),
          ...(showData?.auctionProducts || []),
          ...(showData?.giveawayProducts || []),
        ];

        console.log("All products:", allProducts);
        setProducts(allProducts);
      } else {
        console.error("Failed to fetch products.");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Like
  const handleLike = () => {
    if (!userId || !socket) {
      console.error("Connection not ready, please try again shortly");
      return;
    }
    console.log("liked");
    socket.emit("toggleLike", { streamId: id, userId });
  };

  // Join room & listen for events (wrapped in check for socket)
  useEffect(() => {
    if (socket && id) {
      socket.emit("joinRoom", id);
      socket.on("giveawayWinner", ({ giveawayKey, winner }) => {
        setWinner(winner);
      });
      socket.on(`likesUpdated-${id}`, ({ likes, likedBy }) => {
        console.log("Likes updated:", likes, "Liked by:", likedBy);
        setLikes(likes);
        setLiked(likedBy?.includes(userId));
      });
    }
    return () => {
      if (socket) {
        socket.off("giveawayWinner");
        socket.off(`likesUpdated-${id}`);
      }
    };
  }, [socket, id, userId]);

  // Remove winner after 7 seconds
  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        setWinner(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const urls = {};
      for (const product of products) {
        if (product.productId.images[0]) {
          urls[product.productId._id] = await generateSignedUrl(
            product.productId.images[0]
          );
        }
      }
      setSignedUrls(urls);
    };

    fetchSignedUrls();
  }, [products]);

  // Listen for auction start events
  useEffect(() => {
    if (socket && id) {
      socket.emit("joinRoom", id);
      socket.on("auctionStarted", (data) => {
        setAuctionActive(true);
        setCurrentAuction(data);
        setShow((prev) => ({ ...prev, currentAuction: data }));
      });
    }
    return () => {
      if (socket) {
        socket.off("auctionStarted");
      }
    };
  }, [socket, id]);

  const handleMouseEnter = () => {
    // Show the element
    setIsVisible(true);
    // Start a timer to hide it after 5 seconds (5000 ms)
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const handleMouseLeave = () => {
    // Clear the timer and hide the element immediately
    clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  const handleClick = () => {
    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Show the content on click
    setIsVisible(true);

    // Hide the content after 5 seconds
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  // Share handler for the show page
  const handleShare = async () => {
    // Use the current location as the shareable link
    const shareUrl = window.location.href;
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
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast.success("Link copied to clipboard!");
        })
        .catch((err) => console.error("Error copying link:", err));
    }
  };

  const handleProfileView = (id) => {
    navigate(`/profile/seller/${id}`);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="flex min-h-screen bg-stone-950 text-white font-montserrat">
      {/* Left Sidebar - Auction Details */}
      <div className="w-[25%] hidden lg:block border-r border-stone-800 bg-stone-950 text-white shadow-xl">
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/profile/`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Seller Info */}
          <div className="flex items-center space-x-3 p-4 bg-stone-900 rounded-2xl shadow-lg border border-stone-800">
            <div className="avatar">
              {show?.host?.userInfo?.profileURL ? (
                <div
                  className="w-12 h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden"
                  onClick={() => handleProfileView(show?.host?._id)}
                >
                  <img
                    src={show?.host?.userInfo?.profileURL || "/placeholder.svg"}
                    alt={
                      show?.host?.userInfo?.userName ||
                      show?.host?.userInfo?.name
                    }
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                <span class="text-lg font-bold capitalize">${show?.host?.userInfo?.userName.charAt(
                                                  0
                                                )}</span>
                                            </div>`;
                    }}
                  />
                </div>
              ) : (
                <div className="bg-stone-800 text-yellow-500 rounded-full w-12 h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                  <span className="text-lg font-bold capitalize">
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
        </div>
        <div className="p-6 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800">
            <button
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "Auction"
                  ? "bg-yellow-400 text-stone-900 font-semibold"
                  : "text-stone-300 hover:bg-stone-800"
              }`}
              onClick={() => setActiveTab("Auction")}
            >
              Auction
            </button>
            <button
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "Buy Now"
                  ? "bg-yellow-400 text-stone-900 font-semibold"
                  : "text-stone-300 hover:bg-stone-800"
              }`}
              onClick={() => setActiveTab("Buy Now")}
            >
              Buy Now
            </button>
            <button
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
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
                    <div key={taggedProduct._id} className="overflow-hidden">
                      <AuctionsUser
                        showId={id}
                        streamId={id}
                        product={taggedProduct}
                        signedUrls={signedUrls}
                        socket={socket}
                      />
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
                    <div key={taggedProduct._id} className="overflow-hidden">
                      <BuyProducts
                        showId={id}
                        streamId={id}
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
            {activeTab === "Give away" && (
              <div className="space-y-4">
                {show?.giveawayProducts?.length ? (
                  show?.giveawayProducts?.map((taggedProduct) => (
                    <div key={taggedProduct._id} className="overflow-hidden">
                      <GiveAwayUsers
                        streamId={id}
                        product={taggedProduct}
                        signedUrls={signedUrls}
                        socket={socket}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400">
                    <FiGift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No giveaway products available</p>
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
              <div className="flex items-center space-x-3 p-4 bg-stone-900 rounded-2xl shadow-lg border border-stone-800">
                <div className="avatar">
                  {show?.host?.userInfo?.profileURL ? (
                    <div
                      className="w-12 h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden"
                      onClick={() => handleProfileView(show?.host?._id)}
                    >
                      <img
                        src={
                          show?.host?.userInfo?.profileURL || "/placeholder.svg"
                        }
                        alt={
                          show?.host?.userInfo?.userName ||
                          show?.host?.userInfo?.name
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                        <span class="text-lg font-bold capitalize">${show?.host?.userInfo?.userName.charAt(
                                                          0
                                                        )}</span>
                                                    </div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-stone-800 text-yellow-500 rounded-full w-12 h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                      <span className="text-lg font-bold capitalize">
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
                  <div className="flex items-center space-x-2 text-sm text-stone-400">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>{" "}
                      <span>5.0</span>
                    </span>
                    <span>•</span>
                    <button className="px-3 py-1 bg-yellow-500 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-400 transition-colors">
                      Follow
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800">
                <button
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "Auction"
                      ? "bg-yellow-400 text-stone-900 font-semibold"
                      : "text-stone-300 hover:bg-stone-800"
                  }`}
                  onClick={() => setActiveTab("Auction")}
                >
                  Auction
                </button>
                <button
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "Buy Now"
                      ? "bg-yellow-400 text-stone-900 font-semibold"
                      : "text-stone-300 hover:bg-stone-800"
                  }`}
                  onClick={() => setActiveTab("Buy Now")}
                >
                  Buy Now
                </button>
                <button
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
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
                style={{
                  maxHeight: "calc(100vh - 320px)",
                  scrollbarWidth: "thin",
                }}
              >
                {activeTab === "Auction" && (
                  <div className="space-y-4">
                    {show?.auctionProducts?.length ? (
                      show?.auctionProducts?.map((taggedProduct) => (
                        <div
                          key={taggedProduct._id}
                          className="overflow-hidden"
                        >
                          <AuctionsUser
                            showId={id}
                            streamId={id}
                            product={taggedProduct}
                            signedUrls={signedUrls}
                            socket={socket}
                          />
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
                          key={taggedProduct._id}
                          className="overflow-hidden"
                        >
                          <BuyProducts
                            showId={id}
                            streamId={id}
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
                {activeTab === "Give away" && (
                  <div className="space-y-4">
                    {show?.giveawayProducts?.length ? (
                      show?.giveawayProducts?.map((taggedProduct) => (
                        <div
                          key={taggedProduct._id}
                          className="overflow-hidden"
                        >
                          <GiveAwayUsers
                            streamId={id}
                            product={taggedProduct}
                            signedUrls={signedUrls}
                            socket={socket}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-stone-400">
                        <FiGift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No giveaway products available</p>
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
          {/* <div
            ref={videoRef}
            className="w-full h-full bg-black"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          /> */}
       {show?.liveStreamId ? (
          <ViewLiveStream liveStreamId={show.liveStreamId} />
        ) : (
          <div>Loading stream...</div>
        )}

          


          {/* Viewer count display */}
          <div className="absolute top-8 right-4 flex items-center space-x-2 bg-black/60 text-white px-3 py-1.5 rounded-full z-30 backdrop-blur-sm border border-stone-700/30">
            <RiLiveLine className="text-red-500" size={18} />
            <p className="font-medium text-sm">{viewerCount}</p>
          </div>

          <div
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          >
            {/* Seller Info */}
            <div className="flex items-center space-x-3 rounded-2xl py-2">
              <div className="avatar">
                {show?.host?.userInfo?.profileURL ? (
                  <div
                    className="w-10 h-10 rounded-full ring-2 ring-yellow-500/30 overflow-hidden"
                    onClick={() => handleProfileView(show?.sellerId?._id)}
                  >
                    <img
                      src={
                        show?.host?.userInfo?.profileURL ||
                        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"
                      }
                      alt={
                        show?.host?.userInfo?.userName ||
                        show?.host?.userInfo?.name
                      }
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<div class="w-10 h-10 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                          <span class="text-sm font-bold capitalize">${show?.host?.userInfo?.userName.charAt(
                            0
                          )}</span>
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
                  <button className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-400 transition-colors">
                    Follow
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
                  >
                    <div className="flex items-center justify-center gap-2 bg-white rounded-xl p-3 shadow-lg">
                      <Trophy className="w-5 h-5 text-stone-900" />
                      <p className="text-sm text-stone-900 font-bold">
                        Giveaway Winner: {winner?.name || winner?.userName} 🎉
                      </p>
                    </div>
                  </motion.div>
                  <div className="absolute z-50 top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <ConfettiExplosion
                      force={0.7}
                      duration={5000}
                      particleCount={61}
                      width={1600}
                    />
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Giveaway */}
          <div
            onClick={() => setIsGiveawayModalOpen(true)}
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
              {(show?.giveawayProducts?.length || 0) === 1
                ? "Product"
                : "Products"}
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
                    <FiGift className="text-yellow-500" size={20} /> Giveaway
                    Products
                  </h2>
                  <div className="space-y-4">
                    {show?.giveawayProducts?.length ? (
                      show?.giveawayProducts.map((taggedProduct) => (
                        <div
                          key={taggedProduct._id}
                          className=" rounded-xl overflow-hidden hover:border-yellow-500/50 transition-colors"
                        >
                          <GiveAwayUsers
                            streamId={id}
                            product={taggedProduct}
                            signedUrls={signedUrls}
                            socket={socket}
                          />
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

          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col space-y-2 z-30">
            {/* Top row: Chat/Comments and Floating Action Buttons */}
            <div className="flex flex-row justify-between items-end">
              {/* Overlay Chat/Comments */}
              <div
                className="flex-1 text-white"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 100%)",
                  maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 100%)",
                }}
              >
                <LiveComments
                  streamId={id}
                  prevComments={show?.comments}
                  socket={socket}
                />
              </div>

              {/* Floating Action Buttons */}
              <div className="flex flex-col space-y-3 mt-4 mx-2">
                <LikeButton
                  initialLikes={likes}
                  onLike={handleLike}
                  isLiked={liked}
                  setIsLiked={setLiked}
                  setLikes={setLikes}
                  connectionReady={!!socket}
                />

                <button
                  onClick={() => setIsNotesModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg"
                >
                  <BiNotepad className="h-5 w-5" />
                </button>

                {/* Notes Modal */}
                <AnimatePresence>
                  {isNotesModalOpen && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-stone-900 rounded-2xl shadow-xl p-6 max-w-md w-full relative border border-stone-700"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                      >
                        {/* Close button in top right */}
                        <button
                          onClick={() => setIsNotesModalOpen(false)}
                          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 transition-colors"
                          aria-label="Close"
                        >
                          <MdClose size={20} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-white">
                          Notes
                        </h2>

                        <div className="bg-stone-800 p-5 rounded-xl border border-stone-700">
                          <p className="text-yellow-500 font-medium flex items-center gap-2">
                            <span className="text-xl">⚠️</span> No returns for
                            any products in Auction
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                  className="relative lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400 text-stone-900 hover:bg-yellow-600 transition-colors shadow-lg"
                >
                  <AiOutlineShop className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-stone-900">
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
                  transition={{ duration: 0.3 }}
                  className="w-full text-white flex flex-col p-4 rounded-xl backdrop-blur-sm  shadow-lg"
                >
                  <AuctionsOverlay
                    streamId={id}
                    show={show}
                    currentAuction={show?.currentAuction}
                    socket={socket}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
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
          height={show?.comments?.length > 10 ? "77vh" : "36vh"}
          socket={socket}
        />
      </div>
    </div>
  );
};

export default ShowDetailsPage;
