"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Hls from 'hls.js'
import { ChevronLeft, Send, ShoppingCart, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { BsVolumeMute, BsVolumeUp } from "react-icons/bs"
import LikeButton from "../ui/LikeButton"
import VideoInfoSection from "../ui/VideoInfoSection"
import { LuMessageSquareText } from "react-icons/lu"
import { FiShare } from "react-icons/fi"
import { AiOutlineShop } from "react-icons/ai"
import { LiaCommentSolid } from "react-icons/lia"
import { GET_ALL_SHOPPABLE_VIDEOS } from "../../api/apiDetails"
import axiosInstance from "../../../utils/axiosInstance"
import ProductsDetailsPage from "./ProductDetails"
import { toast } from "react-toastify"
import { useAuth } from "../../../context/AuthContext"

const ReelCard = ({
  onWheel,
  video,
  onLike,
  isActive,
  onViewProducts,
  showProducts,
  currentProducts,
  closeProductModal,
  selectedProduct,
  onSelectProduct,
}) => {
  const [liked, setLiked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const hlsRef = useRef(null);
const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
 useEffect(() => {
  const videoElement = videoRef.current;
  
  // Construct the full HLS URL using CDN base and masterPlaylistKey
  const hlsUrl = video?.masterPlaylistKey ? `${cdnURL}${video.masterPlaylistKey}` : null;

  if (hlsUrl && videoElement) {
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls();
      hlsRef.current = hls;

      // Use the constructed URL
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isActive && videoElement.muted) {
          videoElement.play().catch(() => {});
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Use the constructed URL for native HLS support
      videoElement.src = hlsUrl;
      videoElement.muted = true;  
      videoElement.play();
    }
  }
  videoElement.muted = true;
  setIsMuted(true);

  return () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };
// Change dependency to masterPlaylistKey
}, [video?.masterPlaylistKey, isActive]); 
  const handleLoadedData = () => {
    setIsLoading(false)
  }

  const handleLike = () => {
    setLiked(!liked)
    // onLike(video?._id || video?.id);
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

const handleMute = () => {
  setIsMuted(!isMuted);
  if (videoRef.current) {
    videoRef.current.muted = !isMuted;
    // After first user interaction, allow audio
    if (!isMuted) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }
};

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progressPercent)
    }
  }

  const handleVideoEnd = () => {
    setProgress(0)
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/reel/${video._id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this reel!",
          text: "Hey, check out this amazing video reel!",
          url: shareUrl,
        })
        console.log("Shared successfully")
      } catch (error) {
        console.error("Error sharing", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          // Optionally, use your toast library for feedback:
          toast.success("Link copied to clipboard!")
        })
        .catch((err) => console.error("Error copying link:", err))
    }
  }

  // Prevent touch scroll when modals are open
  useEffect(() => {
    if (showProducts || showComments) {
      // If modals are open, prevent touch scroll within the parent container
      const container = document.querySelector(".pointer-events-auto.overflow-hidden")

      const preventTouchScroll = (e) => {
        e.stopPropagation()
        // e.preventDefault();
      }

      if (container) {
        container.addEventListener("touchstart", preventTouchScroll, { passive: false })
        container.addEventListener("touchmove", preventTouchScroll, { passive: false })
        container.addEventListener("touchend", preventTouchScroll, { passive: false })
      }

      return () => {
        if (container) {
          container.removeEventListener("touchstart", preventTouchScroll)
          container.removeEventListener("touchmove", preventTouchScroll)
          container.removeEventListener("touchend", preventTouchScroll)
        }
      }
    }
  }, [showProducts, showComments])

 useEffect(() => {
  const videoElement = videoRef.current
  if (videoElement) {
    if (isActive) {
      videoElement.play().catch((error) => {
        console.log("Autoplay was prevented:", error)
      })
      setIsPlaying(true)
    } else {
      videoElement.pause()
      setIsPlaying(false)
    }
  }
}, [isActive, video?.masterPlaylistKey, videoRef]) // Changed dependency here

  return (
    <div className="fixed inset-0 flex justify-center bg-stone-950 items-center">
      <div
        className="relative w-full lg:max-w-[450px] lg:min-w-[100px] md:max-w-[250px] md:h-[90vh] h-[100vh] md:rounded-xl overflow-hidden shadow-2xl"
        onWheel={(e) => onWheel(e)}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="h-1 bg-stone-700/30 w-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                opacity: progress > 0 ? 1 : 0,
              }}
            ></div>
          </div>
        </div>

        {/* Video with Play/Pause Overlay */}
        <div className="relative w-full h-full" onClick={togglePlayPause}>
        <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onLoadedData={handleLoadedData}
            autoPlay  // Add this
            playsInline // Add this for iOS
          />
          {isLoading && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-900/80 z-20">
              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            </div>
          )}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 z-10 pointer-events-none backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent pointer-events-none"></div>

        <div className="absolute inset-0 flex flex-col justify-end text-white z-10 p-2 pointer-events-none">
          <div className="absolute right-4 bottom-36 flex flex-col space-y-4 pointer-events-auto">
            <div className="flex flex-col items-center">
              <LikeButton initialLikes={video?.likes} onLike={handleLike} />
            </div>
            <button
              className="w-12 h-12 rounded-full bg-stone-800/60 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-stone-700/50 hover:bg-stone-700/80 transition-all duration-300"
              onClick={() => setShowComments(true)}
            >
              <LiaCommentSolid className="h-6 w-6" />
            </button>
            <button
              className="w-12 h-12 rounded-full bg-stone-800/60 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-stone-700/50 hover:bg-stone-700/80 transition-all duration-300"
              onClick={handleShare}
            >
              <FiShare className="h-5 w-5" />
            </button>

            <button
              className="w-12 h-12 rounded-full bg-stone-800/60 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-stone-700/50 hover:bg-stone-700/80 transition-all duration-300"
              onClick={handleMute}
            >
              {isMuted ? <BsVolumeMute size={22} /> : <BsVolumeUp size={22} />}
            </button>
            <button
              className="relative w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-stone-900 shadow-lg hover:bg-amber-400 transition-all duration-300"
              onClick={() => onViewProducts(video.productsListed)}
            >
              <AiOutlineShop className="w-6 h-6" />
              <motion.span
                animate={{
                  x: [0, -5, 5, -5, 5, 0],
                  y: [0, -3, 3, -3, 3, 0],
                  rotate: [0, 30, 0, 30, 0],
                }}
                transition={{
                  x: {
                    duration: 0.6,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    repeatDelay: 1,
                  },
                  y: {
                    duration: 0.6,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    repeatDelay: 1,
                  },
                  rotate: {
                    duration: 0.6,
                    ease: [0.6, -0.05, 0.01, 0.99],
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    repeatDelay: 1,
                  },
                }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-amber-500"
              >
                {video?.productsListed?.length || 0}
              </motion.span>
            </button>
          </div>

          <div className="mb-4">
            <VideoInfoSection video={video} onViewProducts={() => onViewProducts(video.productsListed)} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
          <div className="h-full bg-gradient-to-t from-stone-900/90 via-stone-900/60 to-transparent"></div>
        </div>
      </div>

      <div className="pointer-events-auto overflow-hidden">
        <ProductModal
          showProducts={showProducts}
          currentProducts={currentProducts}
          closeProductModal={closeProductModal}
          onSelectProduct={onSelectProduct}
          product={video}
        />

        <CommentsModal
          showComments={showComments}
          currentComments={comments}
          closeCommentsModal={() => setShowComments(false)}
          product={video}
        />
      </div>
    </div>
  )
}

const ProductModal = ({ showProducts, currentProducts, closeProductModal, onSelectProduct, product }) => {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (product) => {
    if (!cartItems.some((item) => item.id === product.id)) {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const handleScroll = (e) => {
    e.stopPropagation()
  }

  return (
    <AnimatePresence>
      {showProducts && (
        <motion.div
          initial={{ opacity: 0, y: "25%" }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              damping: 15,
              stiffness: 150,
            },
          }}
          exit={{
            opacity: 0,
            y: "100%",
            transition: { duration: 0.3 },
          }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div
            className="bg-stone-900 w-full lg:max-w-[450px] lg:min-w-[100px] md:max-w-[250px] md:h-[90vh] h-[100vh] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-none flex flex-col border border-stone-700/50"
            style={{ scrollbarWidth: "none" }}
            onWheel={(e) => handleScroll(e)}
          >
            <div className="px-6 py-5 flex justify-between items-center border-b border-stone-700/50">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="text-amber-500" size={18} />
                <h2 className="text-lg font-semibold text-white tracking-tight">Shop Now</h2>
              </div>
              <button
                onClick={closeProductModal}
                className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center hover:bg-stone-700 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="flex flex-col space-y-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              <ProductsDetailsPage products={product.productsListed} onClose={closeProductModal} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const CommentsModal = ({ showComments, currentComments, closeCommentsModal }) => {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(currentComments || [])
  const { user } = useAuth()

  const handleAddComment = () => {
    if (newComment.trim()) {
      const commentToAdd = {
        id: Date.now(),
        user: {
          name: user.name,
          avatar: user.profileURL,
        },
        text: newComment,
        timestamp: new Date().toISOString(),
      }
      setComments([...comments, commentToAdd])
      setNewComment("")
    }
  }

  return (
    <AnimatePresence>
      {showComments && (
        <motion.div
          initial={{ opacity: 0, y: "25%" }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              damping: 15,
              stiffness: 150,
            },
          }}
          exit={{
            opacity: 0,
            y: "100%",
            transition: { duration: 0.3 },
          }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div className="bg-stone-800 w-full max-w-md rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col border border-stone-700/50">
            <div className="px-6 py-5 flex justify-between items-center border-b border-stone-700/50">
              <div className="flex items-center space-x-3">
                <LuMessageSquareText className="text-amber-500" size={20} />
                <h2 className="text-lg font-semibold text-white tracking-tight">Comments</h2>
              </div>
              <button
                onClick={closeCommentsModal}
                className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center hover:bg-stone-600 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: "none" }}>
              {comments.length === 0 ? (
                <div className="text-center text-stone-400 py-12 flex flex-col items-center">
                  <LuMessageSquareText className="text-stone-500 mb-3" size={32} />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex space-x-3 p-3 rounded-2xl bg-stone-700/30"
                  >
                    <img
                      src={comment.user.avatar || "/placeholder.svg"}
                      alt={comment.user.name}
                      className="w-10 h-10 rounded-full object-cover border border-stone-600"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-white">{comment.user.name}</h4>
                        <span className="text-xs text-stone-400">
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-stone-200 text-sm mt-1">{comment.text}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            <div className="p-4 bg-stone-800 border-t border-stone-700">
              <div className="flex space-x-2">
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-full text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-stone-900 disabled:opacity-50 disabled:bg-stone-700 disabled:text-stone-500 hover:bg-amber-400 transition-colors"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Feed = () => {
  const navigate = useNavigate()
  const { reelId } = useParams()
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videos, setVideos] = useState([])
  const [showProducts, setShowProducts] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [currentProducts, setCurrentProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)

const [isMuted, setIsMuted] = useState(true);
  const touchStartYRef = useRef(0);    // ✅ Correct
  const touchEndYRef = useRef(0);      // ✅ Correct
  const isScrollingRef = useRef(false); // ✅ Correct
  const swipeDirectionRef = useRef(1);  // ✅ Correct
  const isSwipingRef = useRef(false);   // ✅ Correct
  const preloadedVideosRef = useRef(new Map()); // ✅ Correct


  // Create a ref to control the active video's playback via keyboard events
  const activeVideoRef = useRef(null)
  // Enhanced touch and scroll tracking refs

  const PRELOAD_COUNT = 10

  // Ref to always have the latest videos array
  const videosRef = useRef([])
  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  // Variants for smooth video transition
  const pageVariants = {
    initial: (direction) => ({
      y: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    in: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    out: (direction) => ({
      y: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    }),
  }

const cdnURL = import.meta.env.VITE_AWS_CDN_URL;

  // Preload videos function
 // Modified preload function for Azure HLS
const preloadVideos = useCallback((startIndex) => {
  const currentVideos = videosRef.current;
  const endIndex = Math.min(startIndex + PRELOAD_COUNT, currentVideos.length);

  for (let i = startIndex + 1; i < endIndex; i++) {
    const video = currentVideos[i];
    if (!video || !video.masterPlaylistKey || preloadedVideosRef.current.has(video._id)) continue;

    // Construct full URL using CDN base and master playlist key
    const preloadUrl = `${cdnURL}${video.masterPlaylistKey}`;
    
    // Preload HLS manifest
    fetch(preloadUrl)
      .then(() => {
        preloadedVideosRef.current.set(video._id, true);
      })
      .catch(console.error);
  }
}, [PRELOAD_COUNT, cdnURL]); // Add cdnURL to dependencies

  // API call to fetch videos
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get(GET_ALL_SHOPPABLE_VIDEOS)
      if (Array.isArray(res.data.data)) {
        setVideos(res.data.data) // Directly use Azure URLs from response
        console.log("Fetched videos:", res.data.data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    preloadVideos(currentVideoIndex)
  }, [currentVideoIndex, preloadVideos])

  // Wrap navigateVideos in useCallback so it can be used in the keydown handler
  const navigateVideos = useCallback(
    (direction) => {
      const currentVideos = videosRef.current
      if (currentVideos.length === 0 || showProducts || showComments) return
      if (isScrollingRef.current) return
      isScrollingRef.current = true

      setCurrentVideoIndex((prevIndex) => {
        let newIndex
        if (direction > 0) {
          newIndex = (prevIndex + 1) % currentVideos.length
        } else {
          newIndex = prevIndex > 0 ? prevIndex - 1 : currentVideos.length - 1
        }
        preloadVideos(newIndex)
        console.log("New Index", newIndex)
        return newIndex
      })

      setTimeout(() => {
        isScrollingRef.current = false
      }, 500)
    },
    [showProducts, showComments, preloadVideos],
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid interfering when typing or editing
      const activeTag = document.activeElement.tagName
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement.isContentEditable) {
        return
      }
      if (e.code === "Space") {
        if (activeVideoRef.current) {
          if (activeVideoRef.current.paused) {
            activeVideoRef.current.play()
          } else {
            activeVideoRef.current.pause()
          }
        }
        e.preventDefault() // prevent page scrolling
      } else if (e.key === "ArrowUp") {
        // Set swipeDirectionRef to -1 when ArrowUp is pressed
        swipeDirectionRef.current = -1
        navigateVideos(-1)
        e.preventDefault()
      } else if (e.key === "ArrowDown") {
        // Set swipeDirectionRef to 1 when ArrowDown is pressed
        swipeDirectionRef.current = 1
        navigateVideos(1)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigateVideos])

  const handleTouchStart = (event) => {
    if (showProducts || showComments) return
    touchStartYRef.current = event.touches[0].clientY
    touchEndYRef.current = event.touches[0].clientY
    isSwipingRef.current = false
  }

  const handleTouchMove = (event) => {
    if (showProducts || showComments) return
    if (isScrollingRef.current) return
    touchEndYRef.current = event.touches[0].clientY
    const deltaY = touchStartYRef.current - touchEndYRef.current
    if (Math.abs(deltaY) > 10) {
      isSwipingRef.current = true
      event.preventDefault()
    }
  }

  const handleTouchEnd = (event) => {
    if (showProducts || showComments) return
    const deltaY = touchStartYRef.current - touchEndYRef.current
    const SWIPE_THRESHOLD = 50
    if (isSwipingRef.current && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      const direction = deltaY > 0 ? 1 : -1
      swipeDirectionRef.current = direction
      navigateVideos(direction)
    }
    touchStartYRef.current = 0
    touchEndYRef.current = 0
    isSwipingRef.current = false
  }

  const handleWheel = (event) => {
    if (showProducts || showComments) return
    event.preventDefault()
    if (isScrollingRef.current) return
    const direction = event.deltaY > 0 ? 1 : -1
    swipeDirectionRef.current = direction
    navigateVideos(direction)
  }

  const handleLike = (videoId) => {
    setVideos(
      videos.map((video) =>
        video._id === videoId ? { ...video, likes: video.likes + (video.liked ? -1 : 1), liked: !video.liked } : video,
      ),
    )
  }

  const handleViewProducts = (products) => {
    setCurrentProducts(products)
    setShowProducts(true)
  }

  const closeProductModal = () => {
    setShowProducts(false)
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    navigate(`/product/${product._id || product.id}`)
  }

  // Add event listeners for touch events
  useEffect(() => {
    // Prevent touch events if a modal is open
    const container = document.getElementById("reels-container")
    if (container) {
      // Use passive: false to allow preventDefault()
      container.addEventListener("touchstart", handleTouchStart, { passive: false })
      container.addEventListener("touchmove", handleTouchMove, { passive: false })
      container.addEventListener("touchend", handleTouchEnd, { passive: false })
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart)
        container.removeEventListener("touchmove", handleTouchMove)
        container.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [])

  // Update currentVideoIndex if reelId is provided
  useEffect(() => {
    if (reelId && videosRef.current.length > 0) {
      const index = videosRef.current.findIndex((v) => v._id === reelId)
      if (index >= 0) {
        setCurrentVideoIndex(index)
      }
    }
  }, [reelId, videos])

  return (
    <motion.div
      className="h-screen flex justify-center items-center overflow-hidden relative bg-stone-950 font-display"
      id="reels-container"
    >
      {/* Back button with improved styling */}
      <div className="absolute top-5 left-5 z-50">
        <button
          onClick={() => navigate("/profile")}
          className="md:flex hidden bg-stone-800/80 backdrop-blur-sm rounded-full py-2 px-4 items-center gap-1.5 text-white hover:bg-amber-500 hover:text-stone-900 transition-all duration-300 shadow-lg border border-stone-700/50"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden md:block text-sm font-medium">Back</span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        <motion.div
          key={currentVideoIndex}
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          custom={swipeDirectionRef.current}
          className="absolute inset-0"
        >
          {loading ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-900 z-20">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            </div>
          ) : (
            videos.length > 0 &&
            videos[currentVideoIndex] && (
              <ReelCard
                video={videos[currentVideoIndex]}
                isActive={true}
                onLike={handleLike}
                onViewProducts={handleViewProducts}
                currentProducts={currentProducts}
                closeProductModal={closeProductModal}
                selectedProduct={selectedProduct}
                onSelectProduct={handleSelectProduct}
                showProducts={showProducts}
                onWheel={handleWheel}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default Feed

