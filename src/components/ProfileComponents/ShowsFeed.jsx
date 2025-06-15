import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { PAGINATED_SHOWS } from "../api/apiDetails";
import axiosInstance from "../../utils/axiosInstance";
import { formatDateForDisplay, formatTimeForDisplay } from "../../utils/dateUtils";

const ShowsFeed = ({ totalShows, shows, userInfo, sellerInfo, hostId }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showsList, setShowsList] = useState(shows);

  const navigate = useNavigate();

  const pageLimit = 20;
  const [currPage, setCurrPage] = useState(1);
  const totalPages = Math.ceil(totalShows / pageLimit);

  // Use a ref to track the current loading state
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchMoreShows = async () => {
    if (currPage >= totalPages) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        PAGINATED_SHOWS.replace(":sellerId", hostId),
        {
          params: {
            page: currPage + 1,
            limit: pageLimit,
          },
        }
      );

      const newShows = res.data.data;
      setShowsList((prevShows) => [...prevShows, ...newShows]);
      setCurrPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error in fetchMoreShows:", error.message);
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
        fetchMoreShows();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currPage, totalPages]);

  // Filter shows based on active tab
  const filteredShows = () => {
    if (activeTab === "all") return showsList;
    return showsList.filter((show) =>
      activeTab === "live"
        ? show.showStatus === "live"
        : show.showStatus !== "live"
    );
  };

  // Helper function to get AWS image URL
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";
    const cdnUrl = import.meta.env.VITE_AWS_CDN_URL || "https://d2jp9e7w3mhbvf.cloudfront.net/";
    return `${cdnUrl}${imageKey}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blackDark px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-blackLight rounded-2xl overflow-hidden animate-pulse border border-blackLight"
            >
              <div className="aspect-[16/10] bg-blackLight"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-blackLight rounded w-3/4"></div>
                <div className="h-3 bg-blackLight rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-blackLight rounded-full w-16"></div>
                  <div className="h-6 bg-blackLight rounded-full w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showsList.length === 0) {
    return (
      <div className="min-h-screen bg-blackDark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-whiteLight mb-4">
            No Shows Available
          </h1>
          <p className="text-whiteHalf">
            Currently there are no shows available. Please check back later.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen  px-4 py-6">
      {/* Tabs for filtering */}
      <div className="flex justify-center mb-8">
        <div className="bg-blackDark/80 backdrop-blur-sm rounded-full p-1 flex gap-1 border border-blackLight">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 font-medium text-sm rounded-full transition-all duration-300 ${
              activeTab === "all"
                ? "bg-newYellow text-blackDark font-bold"
                : "text-whiteHalf hover:text-newYellow"
            }`}
          >
            All Shows
          </button>
          <button
            onClick={() => setActiveTab("live")}
            className={`px-6 py-2 font-medium text-sm rounded-full transition-all duration-300 ${
              activeTab === "live"
                ? "bg-red-500 text-whiteLight font-bold"
                : "text-whiteHalf hover:text-red-400"
            }`}
          >
            Live Shows
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-2 font-medium text-sm rounded-full transition-all duration-300 ${
              activeTab === "upcoming"
                ? "bg-newYellow text-blackDark font-bold"
                : "text-whiteHalf hover:text-newYellow"
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Shows grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {filteredShows().map((show, index) => (
          <motion.div
            key={show._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-blackLight rounded-2xl overflow-hidden relative group cursor-pointer border border-blackLight hover:border-newYellow/50 transition-all duration-300 shadow-xl"
          >
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={getImageUrl(show?.thumbnailImage)}
                alt={show?.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blackDark/90 via-transparent to-transparent"></div>
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                {show.showStatus === "live" ? (
                  <motion.div
                    className="bg-red-500 text-whiteLight text-xs px-3 py-2 rounded-full flex items-center shadow-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <motion.span
                      className="w-2 h-2 bg-whiteLight rounded-full mr-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="font-bold">LIVE</span>
                  </motion.div>
                ) : (
                  <div className="bg-newYellow text-blackDark text-xs px-3 py-2 rounded-full font-bold shadow-lg">
                    UPCOMING
                  </div>
                )}
              </div>

              {/* Watch Now Button - Only for live shows */}
              {show.showStatus === "live" && (
                <div className="absolute top-4 right-4">
                  <Link
                    to={`/user/show/${show._id}`}
                    className="bg-newYellow text-blackDark font-bold text-xs py-2 px-4 rounded-full hover:bg-newYellow/90 transition-all duration-200 shadow-lg"
                  >
                    Watch Now
                  </Link>
                </div>
              )}

              {/* Date & Time */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between text-whiteLight text-xs">
                  <span className="bg-blackDark/60 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">
                    {formatDateForDisplay(show?.scheduledAt)}
                  </span>
                  <span className="bg-blackDark/60 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">
                    {formatTimeForDisplay(show?.scheduledAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <h3 className="text-whiteLight font-semibold text-lg line-clamp-2 group-hover:text-newYellow transition-colors duration-300">
                {show.title}
              </h3>

              {/* Category and Language */}
              <div className="flex gap-2 flex-wrap">
                <span className="bg-newYellow/20 border border-newYellow/30 text-newYellow text-xs px-3 py-1.5 rounded-full font-medium">
                  {show.language}
                </span>
                <span className="bg-newYellow/20 border border-newYellow/30 text-newYellow text-xs px-3 py-1.5 rounded-full font-medium">
                  {show.subCategory}
                </span>
              </div>

              {/* Tags */}
              {show.tags && show.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {show.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blackDark/50 border border-whiteHalf/20 text-whiteHalf text-xs px-2.5 py-1 rounded-full hover:border-newYellow/50 hover:text-newYellow transition-all duration-300"
                    >
                      #{tag}
                    </span>
                  ))}
                  {show.tags.length > 3 && (
                    <span className="bg-blackDark/50 border border-whiteHalf/20 text-whiteHalf text-xs px-2.5 py-1 rounded-full">
                      +{show.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* No shows message */}
      {filteredShows().length === 0 && (
        <div className="flex justify-center items-center py-16">
          <h3 className="font-medium text-whiteHalf text-lg">
            {activeTab === "live"
              ? "No live shows available at the moment."
              : activeTab === "upcoming"
              ? "No upcoming shows scheduled."
              : "No shows available."}
          </h3>
        </div>
      )}
    </div>
  );
};

export default ShowsFeed;