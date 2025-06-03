import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
import axiosInstance from "../../../utils/axiosInstance.js"; 
import { GET_SHOPPABLE_VIDEO_BY_ID } from "../../api/apiDetails.js"; 
import { generateSignedVideoUrl } from "../../../utils/aws.js"; 
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  Calendar,
  Info,
  Play,
  Pause,
  Package,
  Clock,
  AlertCircle,
  RefreshCw,
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
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};


const ShoppableVideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null); // HLS.js instance ref
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [loadingStage, setLoadingStage] = useState("initial");
  const [isOperationPending, setIsOperationPending] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState("");
  const [useHlsPlayer, setUseHlsPlayer] = useState(false); 

  const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

  const fetchVideoDetails = useCallback(async () => {
    try {
      setLoading(true);
      setVideoUrl(""); 
      setUseHlsPlayer(false);
      setIsVideoPlaying(false);
      setLoadingStage("initial");
      const res = await axiosInstance.get(
        GET_SHOPPABLE_VIDEO_BY_ID.replace(":id", id)
      );
      if (!res.data || !res.data.data) {
        throw new Error("Invalid response data");
      }
      console.log("API Response - Video Details:", res.data.data);
      setLoadingStage("video");
      await new Promise(resolve => setTimeout(resolve, 100));
      const videoData = res.data.data;
      setVideo(videoData);

      setLoadingStage("products");
      await new Promise(resolve => setTimeout(resolve, 100));
      const initialImageIndices = {};
      if (videoData.productsListed && Array.isArray(videoData.productsListed)) {
        videoData.productsListed.forEach((product) => {
          initialImageIndices[product._id] = 0;
        });
      }
      setSelectedImageIndex(initialImageIndices);
      setLoadingStage("complete");
    } catch (error) {
      console.error("Error fetching video details:", error);
      setVideo(null);
      setVideoUrl("");
      setUseHlsPlayer(false);
      setIsVideoPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideoDetails();
  }, [fetchVideoDetails]);

  useEffect(() => {
    const currentVideoRef = videoRef.current;
    if (!currentVideoRef) {
      console.warn("Video ref not available in useEffect");
      return;
    }

    const onPlay = () => { console.log("Video event: play triggered"); setIsVideoPlaying(true); };
    const onPause = () => { console.log("Video event: pause triggered"); setIsVideoPlaying(false); };
    const onEnded = () => { console.log("Video event: ended triggered"); setIsVideoPlaying(false); };
    const onLoadedMetadata = () => { console.log("Video event: loadedmetadata triggered"); };
    const onCanPlay = () => { console.log("Video event: canplay triggered"); };
    const onVideoError = (e) => { 
        console.error("Video Element Error:", e, currentVideoRef?.error); 
        setIsVideoPlaying(false); 
    };

    const setupVideoSource = async () => {
      if (hlsRef.current) {
        console.log("Destroying previous HLS instance.");
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      currentVideoRef.removeAttribute('src'); 
      currentVideoRef.load(); 
      setVideoUrl(""); 
      setUseHlsPlayer(false); 
      setIsVideoPlaying(false); 

      if (!video) {
        console.log("No video data, aborting source setup.");
        return;
      }

      let sourceToPlay = "";
      let isHlsSource = false;

      if (video.masterPlaylistKey) {
        sourceToPlay = `${CDNURL}${video.masterPlaylistKey}`;
        isHlsSource = true;
        console.log("HLS Playlist URL determined:", sourceToPlay);
      } else if (video.originalVideoBlobName) {
        console.log("No masterPlaylistKey, attempting signed URL for:", video.originalVideoBlobName);
        try {
          const signedUrl = await generateSignedVideoUrl(video.originalVideoBlobName);
          if (signedUrl) {
            sourceToPlay = signedUrl;
            console.log("Signed URL for originalVideoBlobName:", sourceToPlay);
          } else {
            console.error("Failed to generate signed URL for:", video.originalVideoBlobName);
          }
        } catch (err) {
          console.error("Error generating signed URL:", err);
        }
        isHlsSource = false;
      } else {
        console.warn("No playable video source found in video data.");
      }

      setVideoUrl(sourceToPlay);

      if (sourceToPlay) {
        if (isHlsSource) {
          if (Hls.isSupported()) {
            console.log("Initializing HLS.js for:", sourceToPlay);
            const hls = new Hls({ // HLS.js configuration
              maxBufferLength: 30, maxMaxBufferLength: 600, startLevel: -1,
              manifestLoadingTimeOut: 20000, manifestLoadingMaxRetry: 3, manifestLoadingRetryDelay: 1000,
              levelLoadingTimeOut: 20000, levelLoadingMaxRetry: 3, levelLoadingRetryDelay: 1000,
              fragLoadingTimeOut: 30000, fragLoadingMaxRetry: 5, fragLoadingRetryDelay: 1000,
            });
            hlsRef.current = hls;
            hls.loadSource(sourceToPlay);
            hls.attachMedia(currentVideoRef);
            setUseHlsPlayer(true); 
            hls.on(Hls.Events.MANIFEST_PARSED, () => console.log("HLS Manifest parsed."));
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error("HLS Error:", data.type, "Details:", data.details, "Fatal:", data.fatal);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR: 
                    console.log("HLS network error, trying to startLoad().");
                    hls.startLoad(); 
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR: 
                    console.log("HLS media error, trying to recoverMediaError().");
                    hls.recoverMediaError(); 
                    break;
                  default: 
                    console.log("Fatal HLS error, destroying HLS instance.");
                    hls.destroy(); 
                    hlsRef.current = null; 
                    setUseHlsPlayer(false); 
                    setIsVideoPlaying(false); 
                    break;
                }
              }
            });
          } else if (currentVideoRef.canPlayType('application/vnd.apple.mpegurl')) {
            console.log("Using native HLS (e.g., Safari) for:", sourceToPlay);
            currentVideoRef.src = sourceToPlay;
            // setUseHlsPlayer(false) is already default, HLS.js instance not created
          } else {
            console.warn("HLS playlist provided, but HLS.js not supported and no native HLS support.");
            setVideoUrl(""); // Clear videoUrl if HLS cannot be played
          }
        } else { // Direct URL (e.g., signed MP4)
          console.log("Setting direct video source:", sourceToPlay);
          currentVideoRef.src = sourceToPlay;
          // setUseHlsPlayer(false) is already default
        }
      } else {
        console.log("No sourceToPlay determined. Video element will remain empty.");
        // videoUrl is already "" from earlier setVideoUrl(sourceToPlay)
      }
    };

    setupVideoSource();

    // Attach event listeners to the video element
    currentVideoRef.addEventListener('play', onPlay);
    currentVideoRef.addEventListener('pause', onPause);
    currentVideoRef.addEventListener('ended', onEnded);
    currentVideoRef.addEventListener('loadedmetadata', onLoadedMetadata);
    currentVideoRef.addEventListener('canplay', onCanPlay);
    currentVideoRef.addEventListener('error', onVideoError);

    // Cleanup function for this effect
    return () => {
      console.log("Cleanup: Removing event listeners and HLS for video ID:", video?._id);
      currentVideoRef.removeEventListener('play', onPlay);
      currentVideoRef.removeEventListener('pause', onPause);
      currentVideoRef.removeEventListener('ended', onEnded);
      currentVideoRef.removeEventListener('loadedmetadata', onLoadedMetadata);
      currentVideoRef.removeEventListener('canplay', onCanPlay);
      currentVideoRef.removeEventListener('error', onVideoError);

      if (hlsRef.current) {
        console.log("Destroying HLS instance on unmount or video change.");
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      // Ensure video element is reset if the component unmounts or video changes
      if (currentVideoRef) { 
          if (!currentVideoRef.paused) currentVideoRef.pause();
          currentVideoRef.removeAttribute('src');
          currentVideoRef.load();
      }
      setUseHlsPlayer(false); // Reset HLS flag
      setIsVideoPlaying(false); // Reset playing state
    };
  }, [video, CDNURL]); // Dependencies for the video setup effect

  const handleVideoPlayPause = async () => {
    const currentVideoElement = videoRef.current;
    if (!currentVideoElement) {
      console.warn("Video reference not available for play/pause.");
      return;
    }
    if (isOperationPending) return;

    setIsOperationPending(true);
    try {
      if (currentVideoElement.paused) {
        // If HLS.js is active and media isn't attached (e.g., after an error or manual detach)
        // This check helps ensure HLS is properly set up before trying to play.
        if (useHlsPlayer && hlsRef.current && !hlsRef.current.media && videoUrl) {
             console.log("HLS player active but media not attached. Re-attaching for play.");
             hlsRef.current.attachMedia(currentVideoElement);
             // Ensure the HLS source is correct if it might have changed or wasn't loaded
             if(hlsRef.current.url !== videoUrl) { // Check if the HLS instance has the correct URL
                console.log("HLS source URL mismatch or not loaded, loading source:", videoUrl);
                hlsRef.current.loadSource(videoUrl);
             }
        } 
        // For non-HLS cases or native HLS, if src somehow got unset but we have a videoUrl
        // This is a fallback, ideally src should be set by the main useEffect.
        else if (!currentVideoElement.src && !useHlsPlayer && videoUrl) {
            console.log("src not set for non-HLS, but videoUrl exists. Setting src before play.");
            currentVideoElement.src = videoUrl;
        }

        // Attempt to play if a videoUrl is set (meaning a source was determined)
        if (videoUrl) { 
             await currentVideoElement.play();
        } else {
             console.warn("No videoUrl available to play. Source determination might have failed.");
        }
      } else { // Video is playing, so pause it
        currentVideoElement.pause();
      }
    } catch (error) {
      console.error("Error in handleVideoPlayPause:", error.name, error.message);
      setIsVideoPlaying(false); // Ensure UI reflects paused state on error
      // Potentially display an error to the user
    } finally {
      setIsOperationPending(false);
    }
  };

  const handleImageRotation = useCallback((productId) => {
    if (hoveredProduct === productId && video && video.productsListed) {
      const product = video.productsListed.find((p) => p._id === productId);
      if (product && product.images && product.images.length > 1) {
        setSelectedImageIndex((prev) => ({
          ...prev,
          [productId]: ((prev[productId] || 0) + 1) % product.images.length,
        }));
      }
    }
  }, [hoveredProduct, video]);

  useEffect(() => {
    let intervalId;
    if (hoveredProduct) {
      intervalId = setInterval(() => {
        handleImageRotation(hoveredProduct);
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [hoveredProduct, handleImageRotation]);

  const renderLoadingScreen = () => (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col justify-center items-center h-screen bg-blackDark p-4"
    >
      <motion.div
        className="card w-full max-w-md bg-base-100 shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2 mb-6">
            <RefreshCw className="text-primary animate-spin" size={24} />
            Loading Video Details
          </h2>
          <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
            {[
              { label: "Initializing", stage: "initial", progress: loadingStage !== "initial" ? "w-full" : "w-1/4", step: 1 },
              { label: "Loading Video", stage: "video", progress: loadingStage === "video" || loadingStage === "products" || loadingStage === "complete" ? "w-full" : "w-0", step: 2 },
              { label: "Loading Products", stage: "products", progress: loadingStage === "products" || loadingStage === "complete" ? "w-full" : "w-0", step: 3 },
              { label: "Finalizing", stage: "complete", progress: loadingStage === "complete" ? "w-full" : "w-0", step: 4 },
            ].map(item => (
              <motion.div key={item.step} variants={fadeInUp}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ (item.step === 1 && loadingStage !== "initial") || (item.step === 2 && (loadingStage === "video" || loadingStage === "products" || loadingStage === "complete")) || (item.step === 3 && (loadingStage === "products" || loadingStage === "complete")) || (item.step === 4 && loadingStage === "complete") ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {(item.step === 1 && loadingStage !== "initial") || (item.step === 2 && (loadingStage === "video" || loadingStage === "products" || loadingStage === "complete")) || (item.step === 3 && (loadingStage === "products" || loadingStage === "complete")) || (item.step === 4 && loadingStage === "complete") ? "✓" : item.step}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className={`bg-primary rounded-full h-2 ${item.progress} transition-all duration-500`}></div></div>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex justify-between mt-6 text-sm text-gray-500">
            <span>Please wait...</span>
            <span>{loadingStage === "complete" ? "100%" : loadingStage === "products" ? "75%" : loadingStage === "video" ? "50%" : "25%"}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading && !video) return renderLoadingScreen();

  if (!loading && !video) return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex justify-center items-center h-screen bg-gray-50 p-4"
    >
      <motion.div
        className="alert alert-error max-w-md shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <AlertCircle size={20} /><span>Video details could not be loaded. Please try again.</span>
      </motion.div>
    </motion.div>
  );

  const products = video?.productsListed || [];

  return (
    <motion.div
      className="min-h-screen bg-blackLight"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <motion.div className="mb-3 md:mb-8" variants={fadeInUp} initial="hidden" animate="show">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => window.history.back()}
                  className="text-newYellow hover:text-primary-dark transition-colors"
                  aria-label="Go back"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={24} />
                </motion.button>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-newYellow tracking-tight">{video?.title || "Untitled Video"}</h1>
                  <span className={`badge text-newWhite ${video?.processingStatus === "queued" || video?.processingStatus === "processing" ? "badge-warning" : ["published", "approved", "uploaded"].includes(video?.processingStatus || "") ? "badge-success" : "badge-neutral"}`}>{video?.processingStatus || "Unknown"}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-2">
                <div className="flex items-center gap-1"><Calendar size={16} className="text-newYellow" /><span className="text-whiteLight font-semibold">{video?.createdAt ? new Date(video.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span></div>
                <div className="hidden md:block w-0.5 h-4 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1"><Tag size={16} className="text-newYellow" /><span className="text-whiteLight font-semibold">{video?.category || "N/A"} / {video?.subcategory || "N/A"}</span></div>
                <div className="hidden md:block w-0.5 h-4 bg-gray-300 rounded-full"></div>
               
              </div>
            </div>
            <div className="badge badge-ghost gap-2 p-3"><ShoppingBag size={16} /><span>{products.length} products</span></div>
          </div>
        </motion.div>

        {/* Main Content: Video and Info */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6" variants={staggerContainer} initial="hidden" animate="show">
          {/* Video Player Column */}
          <motion.div className="lg:col-span-2" variants={fadeInUp}>
            <div className="card bg-newYellow shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="relative w-full" style={{ minHeight: "300px", maxHeight: "calc(100vh - 250px)", background: "#000" }}>
                {/* Render video tag if a source is expected (even if URL is pending async) */}
                {(video && (video.masterPlaylistKey || video.originalVideoBlobName)) ? (
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-contain" 
                    poster={video?.thumbnailBlobName ? `${CDNURL}${video.thumbnailBlobName}` : undefined} 
                    controls 
                    playsInline 
                    preload="metadata"
                    key={videoUrl || video?._id} // Helps React re-initialize if source URL or video fundamentally changes
                  />
                ) : (
                  // Placeholder if no video source identified in the video data itself
                  <motion.div variants={fadeIn} className="flex items-center justify-center h-full text-white p-4" style={{minHeight: '300px'}}>
                    <div className="text-center">
                      <AlertCircle size={40} className="mx-auto mb-2 text-yellow-400" />
                       {loading && <p>Loading video details...</p>} 
                       {!loading && video && !video.masterPlaylistKey && !video.originalVideoBlobName && <p>Video source not available.</p>}
                       {/* Message for when video data is present, but URL couldn't be formed (e.g., signed URL failed) */}
                       {!loading && video && (video.masterPlaylistKey || video.originalVideoBlobName) && !videoUrl && <p>Preparing video...</p>}
                       {video?.processingStatus && !["published", "approved", "uploaded"].includes(video.processingStatus) && <p className="text-sm mt-1">Status: {video.processingStatus}</p>}
                       {video?.processingStatus === "uploaded" &&  <p className="text-sm mt-1">Video is uploaded, processing may take time.</p>}
                    </div>
                  </motion.div>
                )}
                <AnimatePresence>
                  {/* Show play button overlay only if a videoUrl is successfully set and video is paused */}
                  {!isVideoPlaying && videoUrl && ( 
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                      onClick={handleVideoPlayPause}
                    >
                      <motion.div
                        className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping:15 }}
                      >
                        <Play size={32} className="text-white ml-1" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {/* Show custom pause button if video is playing, has a URL, and native controls are hidden (not applicable here as controls are always on) */}
                 {isVideoPlaying && videoUrl && !videoRef.current?.controls && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-4 right-4 p-3 bg-black/60 rounded-full cursor-pointer hover:bg-black/80 transition-colors"
                      onClick={handleVideoPlayPause} aria-label="Pause video"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                    >
                      <Pause size={24} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute top-2 right-2 badge badge-sm badge-primary opacity-80">Seller Preview</div>
              </div>
              <div className="card-body p-4 md:p-6">
                <h3 className="font-medium text-lg text-gray-800">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{video?.description || "No description available."}</p>
                <div className="divider my-3"></div>
                <div className="flex flex-wrap gap-2 items-center">
                  <h3 className="font-medium text-lg text-gray-800 mr-2">Tags:</h3>
                  {video?.hashTags && video.hashTags.length > 0 ? video.hashTags.map((tag) => (
                    <motion.span
                      key={tag}
                      className="badge badge-primary badge-outline hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer"
                      whileHover={{ y: -2 }}
                    >
                      {tag}
                    </motion.span>
                  )) : (<span className="text-gray-500 text-sm">No tags</span>)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Column */}
          <motion.div className="lg:col-span-1" variants={fadeInUp}>
            <div className="card bg-newYellow shadow-xl overflow-hidden">
              <div className="card-body p-4 md:p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Info size={20} className="text-blackDark" />Video Information</h3>
                <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
                  {[
                    { icon: <ShoppingBag size={18} className="text-blackDark" />, label: "Category", value: video?.category || "N/A" },
                    { icon: <Tag size={18} className="text-blackDark" />, label: "Subcategory", value: video?.subcategory || "N/A" },
                    { icon: <ShoppingBag size={18} className="text-blackDark" />, label: "Featured Products", value: `${products.length} items` },
                    { icon: <Calendar size={18} className="text-blackDark" />, label: "Published On", value: video?.createdAt ? new Date(video.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "N/A" },
                  ].map(item => (
                    <motion.div
                      key={item.label}
                      className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                      variants={itemVariants}
                      whileHover={{x: 3}}
                    >
                      <div className="p-2.5 bg-primary/10 rounded-lg mr-3.5">{item.icon}</div>
                      <div><div className="text-sm text-gray-500">{item.label}</div><div className="font-medium text-gray-800">{item.value}</div></div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Products Section */}
        <motion.div className="mt-6 md:mt-8" variants={fadeInUp} initial="hidden" animate="show">
          <div className="flex flex-wrap justify-between items-center mb-4 md:mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-newYellow flex items-center gap-2"><ShoppingBag size={22} className="text-whiteLight" />Featured Products</h2>
          </div>
          <AnimatePresence>
            {products.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                    variants={fadeInUp}
                    onMouseEnter={() => setHoveredProduct(product._id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    layout 
                    whileHover={{ y: -5, scale: 1.02 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <figure className="aspect-square relative overflow-hidden bg-gray-100 group">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={ 
                            (product.images && product.images.length > 0) ?
                            `${CDNURL}${product.images[selectedImageIndex[product._id] !== undefined ? selectedImageIndex[product._id] : 0]?.key}`
                            : product._id 
                          }
                          src={
                            (product.images && product.images.length > 0 && product.images[selectedImageIndex[product._id] !== undefined ? selectedImageIndex[product._id] : 0]?.key) ?
                            `${CDNURL}${product.images[selectedImageIndex[product._id] !== undefined ? selectedImageIndex[product._id] : 0]?.key}`
                            : 'https://via.placeholder.com/300?text=Image+Not+Available'
                          }
                          alt={product.title || "Product image"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300?text=Image+Not+Available'; }}
                        />
                      </AnimatePresence>
                      {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {product.images.map((_, i) => (
                            <button
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${(selectedImageIndex[product._id] || 0) === i ? "bg-primary scale-125 w-3" : "bg-white/80 hover:bg-white"}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((prev) => ({ ...prev, [product._id]: i })); }}
                              aria-label={`View image ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      <div className="absolute top-2 right-2"><div className="badge badge-primary badge-sm opacity-90">Stock: {product.quantity !== undefined ? product.quantity : 'N/A'}</div></div>
                    </figure>
                    <div className="card-body p-3.5">
                      <h4 className="card-title text-base font-semibold text-gray-800 hover:text-primary transition-colors duration-300 line-clamp-1" title={product.title}>{product.title || "Unnamed Product"}</h4>
                      <p className="text-xs text-blackLight line-clamp-2 h-8 my-1">{product.description || "No description."}</p>
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-bold text-lg">₹{product.productPrice !== undefined ? product.productPrice.toLocaleString() : 'N/A'}</span>
                          {product.MRP !== undefined && product.MRP > (product.productPrice || 0) && (<span className="text-xs text-gray-500 line-through">₹{product.MRP.toLocaleString()}</span>)}
                        </div>
                        <div className="badge badge-outline text-xs py-2">{product.weight && product.weight.value !== undefined && product.weight.unit ? `${product.weight.value} ${product.weight.unit}`: 'N/A'}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-10 text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No products featured in this video yet.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <style jsx global>{`
        .whitespace-pre-wrap { white-space: pre-wrap; } /* For description formatting */
        video::-webkit-media-controls-enclosure { border-radius: 0 0 8px 8px; /* Example */ }
      `}</style>
    </motion.div>
  );
};

export default ShoppableVideoDetail;