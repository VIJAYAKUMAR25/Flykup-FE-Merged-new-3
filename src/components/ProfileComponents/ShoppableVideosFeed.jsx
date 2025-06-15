import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlayIcon } from "lucide-react";
import { PAGINATED_SHOPPABLE_VIDEOS } from "../api/apiDetails";
import axiosInstance from "../../utils/axiosInstance";

const ShoppableVideosFeed = ({
  totalShoppableVideos,
  shoppableVideos,
  sellerInfo,
  userInfo,
  hostId
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [shoppableVideosList, setShoppableVideosList] =
    useState(shoppableVideos);

  const pageLimit = 20;
  const [currPage, setCurrPage] = useState(1);
  const totalPages = Math.ceil(totalShoppableVideos / pageLimit);

  // Use a ref to track the current loading state
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchMoreShoppableVideos = async () => {
    if (currPage >= totalPages) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(PAGINATED_SHOPPABLE_VIDEOS.replace(":sellerId", hostId),
        {
          params: {
            page: currPage + 1,
            limit: pageLimit,
          },
        }
      );

      const newShoppable = res.data.data;
      setShoppableVideosList((prevShoppable) => [
        ...prevShoppable,
        ...newShoppable,
      ]);
      setCurrPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error in fetchMoreShoppableVideos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // fetching more Shoppable videos when near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        // Use the ref value to check current loading state
        if (loadingRef.current || currPage >= totalPages) return;
        fetchMoreShoppableVideos();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currPage, totalPages]);

  const getImageUrl = (thumbnailBlobName) => {
    const cdnUrl = import.meta.env.VITE_AWS_CDN_URL || "https://d2jp9e7w3mhbvf.cloudfront.net/";
    // Ensure proper URL construction - remove trailing slash from CDN and leading slash from blob name
    const cleanCdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
    const cleanBlobName = thumbnailBlobName.startsWith('/') ? thumbnailBlobName.slice(1) : thumbnailBlobName;
    return `${cleanCdnUrl}/${cleanBlobName}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackDark p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-blackLight rounded-2xl overflow-hidden animate-pulse aspect-[4/3]"
              >
                <div className="w-full h-full bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shoppableVideosList.length === 0) {
    return (
      <div className="min-h-screen bg-blackDark flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-newYellow rounded-full flex items-center justify-center">
            <PlayIcon size={32} className="text-blackDark" />
          </div>
          <h1 className="text-3xl font-bold text-whiteLight mb-4">
            No Videos Available
          </h1>
          <p className="text-whiteHalf text-lg">
            Currently there are no shoppable videos available. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  console.log(userInfo);

  return (
    <div className="min-h-screen  p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {shoppableVideosList.map((shopVid, index) => (
            <motion.div
              key={shopVid._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-blackLight backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/50 hover:border-newYellow/30 transition-all duration-300 shadow-2xl hover:shadow-newYellow/10 aspect-[4/3]"
            >
              {/* Video Thumbnail - Full Coverage */}
              <div className="absolute inset-0">
                <img
                  src={shopVid?.thumbnailBlobName ? getImageUrl(shopVid.thumbnailBlobName) : shopVid?.thumbnailURL}
                  alt={shopVid?.title || "Video thumbnail"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => navigate(`/user/reel/${shopVid._id}`)}
                  onError={(e) => {
                    console.log('Thumbnail failed to load:', e.target.src);
                    console.log('thumbnailBlobName:', shopVid?.thumbnailBlobName);
                    console.log('thumbnailURL:', shopVid?.thumbnailURL);
                    // Try fallback or show placeholder
                    e.target.src = `https://via.placeholder.com/400x300/1a1a1a/666666?text=Video+Thumbnail`;
                  }}
                />
              </div>
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-blackDark/80 via-transparent to-blackDark/40"></div>
              
              {/* Play button overlay - Center */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 bg-newYellow rounded-full flex items-center justify-center shadow-xl shadow-newYellow/30"
                  onClick={() => navigate(`/user/reel/${shopVid._id}`)}
                >
                  <PlayIcon size={20} className="text-blackDark ml-1" />
                </motion.button>
              </div>

              {/* Category badge - Top Left */}
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-newYellow text-blackDark text-xs font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-sm">
                  {shopVid.category}
                </span>
              </div>

              {/* Content Overlay - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                {/* Title */}
                <h2
                  className="text-whiteLight font-bold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-newYellow transition-all duration-300 mb-2 drop-shadow-lg"
                  onClick={() => navigate(`/user/reel/${shopVid._id}`)}
                >
                  {shopVid.title}
                </h2>

                {/* Tags and play button */}
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="bg-blackLight/80 text-whiteLight text-xs font-medium px-2 py-1 rounded-lg shadow-lg backdrop-blur-sm border border-gray-600/50">
                      {shopVid.subcategory}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-newYellow rounded-full flex items-center justify-center shadow-lg hover:shadow-newYellow/30 transition-all duration-300"
                    onClick={() => navigate(`/user/reel/${shopVid._id}`)}
                  >
                    <PlayIcon size={14} className="text-blackDark ml-0.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppableVideosFeed;