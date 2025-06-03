import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { GET_SHOPPABLE_VIDEO_BY_ID } from "../../api/apiDetails.js";
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
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const ShipperShoppableVideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [loadingStage, setLoadingStage] = useState("initial");
  const navigate = useNavigate(); 
  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        setLoadingStage("initial");
        
        const res = await axiosInstance.get(
          GET_SHOPPABLE_VIDEO_BY_ID.replace(":id", id)
        );
        
        if (!res.data || !res.data.data) {
          throw new Error("Invalid response data");
        }
        
        setLoadingStage("video");
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const videoData = res.data.data;
        setVideo(videoData);
        
        setLoadingStage("products");
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const initialImageIndices = {};
        videoData.productsListed.forEach((product) => {
          initialImageIndices[product._id] = 0;
        });
        setSelectedImageIndex(initialImageIndices);
        
        setLoadingStage("complete");
      } catch (error) {
        console.error("Error fetching video details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoDetails();
  }, [id]);

  // Initialize HLS player when video data is available
  useEffect(() => {
    if (video && videoRef.current) {
      if (video.hlsMasterPlaylistUrl && Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60
        });
        hlsRef.current = hls;
        
        hls.loadSource(video.hlsMasterPlaylistUrl);
        hls.attachMedia(videoRef.current);
        
        // Handle errors
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
        
        // Set up video event listeners
        videoRef.current.addEventListener('play', () => setIsVideoPlaying(true));
        videoRef.current.addEventListener('pause', () => setIsVideoPlaying(false));
        videoRef.current.addEventListener('ended', () => setIsVideoPlaying(false));
        
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari which has native HLS support
        videoRef.current.src = video.hlsMasterPlaylistUrl;
      } else if (video.originalVideoBlobName) {
        // Fallback to original video if HLS is not available
        videoRef.current.src = video.originalVideoBlobName;
      }
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', () => setIsVideoPlaying(true));
        videoRef.current.removeEventListener('pause', () => setIsVideoPlaying(false));
        videoRef.current.removeEventListener('ended', () => setIsVideoPlaying(false));
      }
    };
  }, [video]);

  // Clean up HLS instance on component unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  // Fixed play/pause method
  const handleVideoPlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsVideoPlaying(true))
        .catch(error => console.error("Error playing video:", error));
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleImageRotation = (productId) => {
    if (hoveredProduct === productId) {
      const product = video.productsListed.find((p) => p._id === productId);
      if (product && product.images.length > 1) {
        setSelectedImageIndex((prev) => ({
          ...prev,
          [productId]: (prev[productId] + 1) % product.images.length,
        }));
      }
    }
  };

  useEffect(() => {
    if (hoveredProduct) {
      const intervalId = setInterval(() => {
        handleImageRotation(hoveredProduct);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [hoveredProduct]);

  const renderLoadingScreen = () => {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-newYellow p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2 mb-6">
              <RefreshCw className="text-primary animate-spin" size={24} />
              Loading Video Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStage !== "initial" ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {loadingStage !== "initial" ? "✓" : "1"}
                  </div>
                  <span className="font-medium">Initializing</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-primary rounded-full h-2 ${loadingStage !== "initial" ? "w-full" : "w-1/4"}`}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStage === "video" || loadingStage === "products" || loadingStage === "complete" ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {loadingStage === "video" || loadingStage === "products" || loadingStage === "complete" ? "✓" : "2"}
                  </div>
                  <span className="font-medium">Loading Video</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-primary rounded-full h-2 ${loadingStage === "video" || loadingStage === "products" || loadingStage === "complete" ? "w-full" : "w-0"}`}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStage === "products" || loadingStage === "complete" ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {loadingStage === "products" || loadingStage === "complete" ? "✓" : "3"}
                  </div>
                  <span className="font-medium">Loading Products</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-primary rounded-full h-2 ${loadingStage === "products" || loadingStage === "complete" ? "w-full" : "w-0"}`}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStage === "complete" ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {loadingStage === "complete" ? "✓" : "4"}
                  </div>
                  <span className="font-medium">Finalizing</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-primary rounded-full h-2 ${loadingStage === "complete" ? "w-full" : "w-0"}`}></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6 text-sm text-gray-500">
              <span>Please wait...</span>
              <span>{loadingStage === "complete" ? "100%" : loadingStage === "products" ? "75%" : loadingStage === "video" ? "50%" : "25%"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return renderLoadingScreen();
  }

  if (!video) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 p-4">
        <div className="alert alert-error max-w-md shadow-lg">
          <AlertCircle size={20} />
          <span>Error loading video details. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-newYellow">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Video title header with subtle animation */}
        <div className="mb-3 md:mb-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.history.back()} 
                    className="text-primary hover:text-primary-dark transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{video.title}</h1>
                    <span className={`badge text-newWhite ${video.processingStatus === "queued" ? "badge-warning" : "badge-success"}`}>
                      {video.processingStatus}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-newBlack font-semibold">
                      {new Date(video.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="hidden md:block w-0.5 h-4 bg-newWhite rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Tag size={16} className="text-primary" />
                    <span className="text-newBlack font-semibold">{video.category} / {video.subcategory}</span>
                  </div>
                  <div className="hidden md:block w-0.5 h-4 bg-newWhite rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-primary" />
                    <span className="text-newBlack font-semibold">{video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, '0')}` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            <div className="badge badge-primary gap-2 p-3">
              <ShoppingBag size={16} />
              <span>{video.productsListed.length} products</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Video player column with responsive height */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="relative w-full" style={{ height: "300px", maxHeight: "calc(100vh - 300px)" }}>
                {video.hlsMasterPlaylistUrl || video.originalVideoBlobName ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    poster={video.thumbnailURL}
                    controls
                  />
                ) : (
                  <div className="bg-black flex items-center justify-center h-full text-white">
                    <div className="text-center p-4">
                      <AlertCircle size={40} className="mx-auto mb-2 text-yellow-400" />
                      <p>Video processing... Please check back later.</p>
                    </div>
                  </div>
                )}
                {!isVideoPlaying && (video.hlsMasterPlaylistUrl || video.originalVideoBlobName) && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                    onClick={handleVideoPlayPause}
                  >
                    <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                  </div>
                )}
                {isVideoPlaying && (
                  <div 
                    className="absolute bottom-16 right-4 p-2 bg-black/50 rounded-full cursor-pointer hover:bg-black/70 transition-colors"
                    onClick={handleVideoPlayPause}
                  >
                    <Pause size={20} className="text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2 badge badge-sm badge-primary">Seller Preview</div>
              </div>
              <div className="card-body p-4 md:p-6">
                <h3 className="font-medium text-lg">Description</h3>
                <p className="text-gray-700 leading-relaxed">{video.description}</p>
                <div className="divider my-2"></div>
                <div className="flex flex-wrap gap-2">
                  <h3 className="font-medium text-lg mr-2">Tags:</h3>
                  {video.hashTags && video.hashTags.map((tag, index) => (
                    <span
                      key={tag}
                      className="badge badge-primary badge-outline hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info column cards */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl overflow-hidden mb-6">
              <div className="card-body p-4 md:p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-primary" />
                  Video Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="p-2 md:p-3 bg-primary/10 rounded-lg mr-3">
                      <ShoppingBag size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Category</div>
                      <div className="font-medium text-gray-800">{video.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="p-2 md:p-3 bg-primary/10 rounded-lg mr-3">
                      <Tag size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Subcategory</div>
                      <div className="font-medium text-gray-800">{video.subcategory || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="p-2 md:p-3 bg-primary/10 rounded-lg mr-3">
                      <ShoppingBag size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Featured Products</div>
                      <div className="font-medium text-gray-800">{video.productsListed.length} items</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors duration-300">
                    <div className="p-2 md:p-3 bg-primary/10 rounded-lg mr-3">
                      <Calendar size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Published On</div>
                      <div className="font-medium text-gray-800">
                        {new Date(video.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products section layout */}
        <div className="mt-2 md:mt-2">
          <div className="flex flex-wrap justify-between items-center mb-4 md:mb-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag size={22} className="text-primary" />
              Featured Products
            </h2>
            <div className="tabs tabs-boxed mt-2 md:mt-0">
              <button
                className={`tab ${activeTab === "products" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                All Products ({video.productsListed.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {video.productsListed.map((product, index) => (
              <div
                key={product._id}
                className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredProduct(product._id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <figure className="aspect-square relative overflow-hidden bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImageIndex[product._id] || 0].azureUrl}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-in-out hover:scale-105"
                    />
                  ) : (
                    <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                      <Package size={48} className="text-gray-300" />
                    </div>
                  )}

                  {/* Image navigation dots */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {product.images.map((_, i) => (
                        <button
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            selectedImageIndex[product._id] === i
                              ? "bg-primary w-4"
                              : "bg-white/70"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex((prev) => ({
                              ...prev,
                              [product._id]: i,
                            }));
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <div className="badge badge-primary badge-sm">
                      Stock: {product.quantity}
                    </div>
                  </div>
                </figure>

                <div className="card-body p-3 md:p-4">
                  <h4 className="card-title text-base font-bold text-gray-800 hover:text-primary transition-colors duration-300 line-clamp-1">
                    {product.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex flex-col">
                      <span className="text-success font-bold text-lg">
                        ₹{product.productPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ₹{product?.MRP?.toLocaleString()}
                      </span>
                    </div>
                    <div className="badge badge-outline">{product.weight}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ShipperShoppableVideoDetail;