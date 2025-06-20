import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { GET_SHOPPABLE_VIDEO_BY_ID } from "../../api/apiDetails.js";
import { generateSignedVideoUrl } from "../../../utils/aws.js";
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  Calendar,
  Play,
  Pause,
  Package,
  AlertCircle,
  RefreshCw,
  Heart,
  Share2,
  Star,
  Video,
  Lock,
  CheckCircle2, // Added for in-stock status
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Animation Variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const ShoppableVideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [videoUrl, setVideoUrl] = useState("");
  const [useHlsPlayer, setUseHlsPlayer] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());

  const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

  const fetchVideoDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        GET_SHOPPABLE_VIDEO_BY_ID.replace(":id", id)
      );
      if (!res.data || !res.data.data) {
        throw new Error("Invalid response data");
      }
      const videoData = res.data.data;
      setVideo(videoData);

      const initialImageIndices = {};
      if (videoData.productsListed) {
        videoData.productsListed.forEach((product) => {
          initialImageIndices[product._id] = 0;
        });
      }
      setSelectedImageIndex(initialImageIndices);
    } catch (error) {
      console.error("Error fetching video details:", error);
      setVideo(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideoDetails();
  }, [fetchVideoDetails]);

  useEffect(() => {
    const currentVideoRef = videoRef.current;
    if (!currentVideoRef) return;

    const onPlay = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);
    const onEnded = () => setIsVideoPlaying(false);

    const setupVideoSource = async () => {
      if (hlsRef.current) hlsRef.current.destroy();
      currentVideoRef.removeAttribute("src");
      currentVideoRef.load();
      
      setVideoUrl("");
      setUseHlsPlayer(false);
      setIsVideoPlaying(false);

      if (!video) return;

      let sourceToPlay = "";
      let isHls = false;

      if (video.masterPlaylistKey) {
        sourceToPlay = `${CDNURL}${video.masterPlaylistKey}`;
        isHls = true;
      } else if (video.originalVideoBlobName) {
        try {
          sourceToPlay = await generateSignedVideoUrl(video.originalVideoBlobName);
        } catch (err) {
          console.error("Error generating signed URL:", err);
        }
      }
      
      setVideoUrl(sourceToPlay);

      if (sourceToPlay) {
        if (isHls && Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(sourceToPlay);
          hls.attachMedia(currentVideoRef);
          setUseHlsPlayer(true);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              else {
                hls.destroy();
                setUseHlsPlayer(false);
              }
            }
          });
        } else {
          currentVideoRef.src = sourceToPlay;
        }
      }
    };

    setupVideoSource();
    
    currentVideoRef.addEventListener("play", onPlay);
    currentVideoRef.addEventListener("pause", onPause);
    currentVideoRef.addEventListener("ended", onEnded);

    return () => {
      currentVideoRef.removeEventListener("play", onPlay);
      currentVideoRef.removeEventListener("pause", onPause);
      currentVideoRef.removeEventListener("ended", onEnded);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [video, CDNURL]);

  const handleVideoPlayPause = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      if (videoElement.paused) {
        if (!videoElement.src && videoUrl) {
          if (useHlsPlayer && hlsRef.current) {
            hlsRef.current.attachMedia(videoElement);
          } else {
            videoElement.src = videoUrl;
          }
        }
        await videoElement.play();
      } else {
        videoElement.pause();
      }
    } catch (error) {
      console.error("Play/Pause Error:", error);
      setIsVideoPlaying(false);
    }
  }, [videoUrl, useHlsPlayer]);

  const handleImageRotation = useCallback((productId) => {
    if (hoveredProduct === productId && video?.productsListed) {
      const product = video.productsListed.find((p) => p._id === productId);
      if (product?.images?.length > 1) {
        setSelectedImageIndex((prev) => ({
          ...prev,
          [productId]: ((prev[productId] || 0) + 1) % product.images.length,
        }));
      }
    }
  }, [hoveredProduct, video?.productsListed]);

  useEffect(() => {
    let intervalId;
    if (hoveredProduct) {
      intervalId = setInterval(() => handleImageRotation(hoveredProduct), 2000);
    }
    return () => clearInterval(intervalId);
  }, [hoveredProduct, handleImageRotation]);

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(productId)) {
        newLikes.delete(productId);
      } else {
        newLikes.add(productId);
      }
      return newLikes;
    });
  };
  
  const handleProfileClick = () => {
    if (hostInfo?.userName) {
      // navigate(`/user/user/${hostInfo.userName}`);
      console.log("hostInfo")
    }
  };

  // Loading Screen
  if (loading && !video) {
    return (
      <div className="flex justify-center items-center h-screen bg-blackDark">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-whiteHalf animate-spin"/>
          <p className="mt-3 text-whiteHalf">Loading Experience...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (!loading && !video) {
    return (
      <motion.div 
        variants={pageVariants} 
        initial="initial" 
        animate="animate" 
        className="flex justify-center items-center h-screen bg-blackDark p-4"
      >
        <div className="text-center p-8 bg-blackLight rounded-2xl shadow-lg border border-greyLight">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-whiteHalf">Could not load the video details.</p>
          <button 
            onClick={fetchVideoDetails} 
            className="mt-6 px-5 py-2 bg-whiteLight text-blackDark font-semibold rounded-lg hover:bg-opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const products = video?.productsListed || [];
  const hostInfo = video?.host?.userInfo;
  
  const getUserInitials = (userName) => {
    if (!userName) return "?";
    const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, "");
    if (!alphanumericChars) return "?";
    return alphanumericChars.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div 
      className="min-h-screen bg-blackDark text-whiteLight"
      variants={pageVariants} 
      initial="initial" 
      animate="animate"
    >
      {/* Header */}
      <header className="bg-blackDark/80 backdrop-blur-md border-b border-greyLight sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 hover:bg-greyDark rounded-full transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold truncate">
                {video?.title || "Untitled Video"}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-whiteSecondary">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-newYellow" />
                  <span className="text-whiteHalf">{video?.createdAt ? new Date(video.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag size={14} className="text-newYellow" />
                  <span  className="text-whiteHalf">{video?.category || "N/A"}</span>
                </div>
              </div>
            </div>
            {/* <button className="p-2 hover:bg-greyDark rounded-full transition-colors">
              <Share2 size={20} />
            </button> */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* Left Column: Video & Details */}
          <motion.div 
            className="lg:col-span-3"
            variants={fadeInUp}
          >
            <div className="sticky top-24">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[9/16] max-w-md mx-auto shadow-2xl shadow-black/30 border border-greyLight">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-contain bg-black" // Added object-contain and bg-black
                  poster={video?.thumbnailBlobName ? `${CDNURL}${video.thumbnailBlobName}` : undefined}
                  playsInline 
                  preload="metadata"
                  onClick={handleVideoPlayPause}
                />
                <AnimatePresence>
                  {!isVideoPlaying && videoUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                      onClick={handleVideoPlayPause}
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Play size={32} className="text-whiteLight ml-1" fill="currentColor"/>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Host & Video Info Section */}
              <div className="mt-6 space-y-6 max-w-md mx-auto">
                {hostInfo && (
                  <div 
                    className="p-4 bg-greyDark rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-greyLight transition-colors"
                    onClick={handleProfileClick}
                  >
                    <div className="w-14 h-14 bg-blackDark rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xl">
                      {hostInfo.profileURL?.key ? (
                        <img 
                          src={`${CDNURL}${hostInfo.profileURL.key}`} 
                          alt={hostInfo.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-newYellow ">{getUserInitials(hostInfo.userName)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-whiteLight text-lg">{hostInfo.name}</p>
                      <p className="text-sm text-whiteHalf">@{hostInfo.userName}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-greyDark rounded-2xl">
                    <p className="text-whiteHalf text-sm leading-relaxed">
                        {video?.description || "No description available."}
                    </p>
                    {video?.hashTags && video.hashTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                        {video.hashTags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-newYellow text-blackLight text-xs font-medium rounded-full">
                            {tag}
                            </span>
                        ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Products */}
          <motion.div 
            className="lg:col-span-2"
            variants={staggerContainer} 
            initial="hidden" 
            animate="show"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag size={24} className="text-greenLight" />
              <h2 className="text-2xl font-bold">
                Featured Products ({products.length})
              </h2>
            </div>

            {products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => {
                  const hasOffer = product.MRP && product.productPrice && product.MRP > product.productPrice;
                  const discount = hasOffer ? Math.round(((product.MRP - product.productPrice) / product.MRP) * 100) : 0;
                  const isOutOfStock = product.quantity === 0;
                  const isLiked = likedProducts.has(product._id);

                  return (
                    <motion.div
                      key={product._id}
                      className={`bg-blackLight rounded-2xl border border-greyLight overflow-hidden hover:border-grey-500 transition-all duration-300 ${isOutOfStock ? 'opacity-60' : ''}`}
                      variants={fadeInUp}
                      onMouseEnter={() => setHoveredProduct(product._id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-1/3 aspect-square relative bg-greyDark flex-shrink-0">
                          <AnimatePresence>
                            <motion.img
                              key={product.images?.[selectedImageIndex[product._id] || 0]?.key || product._id}
                              src={
                                product.images?.[selectedImageIndex[product._id] || 0]?.key 
                                  ? `${CDNURL}${product.images[selectedImageIndex[product._id] || 0].key}` 
                                  : 'https://via.placeholder.com/300?text=No+Image'
                              }
                              alt={product.title}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="w-full h-full object-cover"
                            />
                          </AnimatePresence>
                          {hasOffer && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                              {discount}% OFF
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                           <h3 className="font-semibold text-whiteLight mb-1.5 truncate">
                            {product.title || "Unnamed Product"}
                           </h3>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xl font-bold text-greenLight">
                                ₹{product.productPrice?.toLocaleString() || 'N/A'}
                              </span>
                              {hasOffer && (
                                <span className="text-sm text-whiteSecondary line-through">
                                  ₹{product.MRP?.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {/* --- STOCK VIEW --- */}
                            <div className="flex items-center gap-2 text-xs font-medium mb-3">
                              {isOutOfStock ? (
                                <span className="flex items-center gap-1.5 text-red-400">
                                  <AlertCircle size={14} />
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-greenLight">
                                  <CheckCircle2 size={14} />
                                  {product.quantity} in Stock
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            className={`w-full py-2.5 px-4 cursor-not-allowed rounded-full font-semibold transition-colors text-sm flex items-center justify-center gap-2 ${
                              isOutOfStock 
                                ? 'bg-greyDark text-whiteSecondary cursor-not-allowed' 
                                : 'bg-newYellow text-blackLight hover:bg-opacity-90'
                            }`}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? (
                              <>
                                <Lock size={14} /> 
                                <span>Out of Stock</span>
                              </>
                            ) : (
                              'View Product'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="text-center py-16 bg-blackLight rounded-2xl border-2 border-dashed border-greyDark" 
                variants={fadeInUp}
              >
                <Package size={48} className="mx-auto mb-4 text-greyLight" />
                <p className="text-whiteHalf">No products featured in this video.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default ShoppableVideoDetail;