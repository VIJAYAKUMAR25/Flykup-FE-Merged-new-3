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


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="card bg-base-100 shadow-xl animate-pulse"
            >
              <figure className="h-48 bg-gray-300"></figure>
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="h-5 bg-gray-300 rounded w-3/4 mt-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showsList.length === 0) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-base-content">
              No Shows Available
            </h1>
            <p className="py-6">
              Currently there are no shows available. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileView = (id) => {
    navigate(`/user/${userInfo?.userName}`);
  };

  return (
    <div className="p-2">
      {/* Tabs for filtering */}
      <div className="flex justify-center mb-6 bg-newWhite rounded-lg p-1 shadow-sm mx-auto max-w-md">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-medium text-sm md:text-base rounded-lg transition-all duration-300 flex items-center justify-center flex-1 ${
            activeTab === "all"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6H20M4 12H20M4 18H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All Shows
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 font-medium text-sm md:text-base rounded-lg transition-all duration-300 flex items-center justify-center flex-1 ${
            activeTab === "live"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="3"
              fill={activeTab === "live" ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 5V3M12 21v-2M5 12H3M21 12h-2M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636M18.364 5.636l-1.414 1.414M7.05 16.95l-1.414 1.414"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Live Shows
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 font-medium text-sm md:text-base rounded-lg transition-all duration-300 flex items-center justify-center flex-1 ${
            activeTab === "upcoming"
              ? "bg-white text-purple-600 shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Upcoming
        </button>
      </div>

      {/* Shows grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-6">
        {filteredShows().map((show, index) => (
          <motion.div
            key={show._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="card bg-white shadow-lg rounded-lg overflow-hidden h-full relative"
          >
            {/* Watch Now Button - Only shown for live shows */}
            {show.showStatus === "live" && (
              <div className="absolute top-3 right-3 z-30">
                <Link
                  to={`/user/show/${show._id}`}
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-center py-1.5 px-4 rounded-full transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
                >
                  Watch Now
                </Link>
              </div>
            )}

            <figure className="relative">
              {/* Image Container */}
              <div className="w-full h-52 overflow-hidden">
                <img
                  src={show?.thumbnailImageURL}
                  alt={show?.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 left-3 z-20">
                {show.showStatus === "live" ? (
                  <motion.div
                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-md"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <motion.span
                      className="w-2 h-2 bg-white rounded-full mr-1.5"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="font-bold">LIVE</span>
                  </motion.div>
                ) : (
                  <motion.div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md flex items-center">
                    <span className="mr-1.5">•</span>
                    <span>UPCOMING</span>
                  </motion.div>
                )}
              </div>

              {/* Date & Time Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-3">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    <span className="text-xs font-medium">
                      {formatDateForDisplay(show?.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span className="text-xs font-medium">{formatTimeForDisplay(show?.scheduledAt)}</span>
                  </div>
                </div>
              </div>
            </figure>

            <div className="card-body p-4">
              {/* Title with improved styling */}
              <h2 className="card-title text-lg font-bold  line-clamp-2 text-gray-800">
                {show.title}
              </h2>

              {/* Category and Language with enhanced styling */}
              <div className="flex flex-wrap gap-2 ">
                <span className="bg-amber-100 px-3 text-xs py-1 rounded-full text-amber-700 font-medium">
                  {show.language}
                </span>
                <span className="bg-gray-100 px-3 text-xs py-1 rounded-full text-gray-700 font-medium">
                  {show.subCategory}
                </span>
              </div>

              {/* Profile Section - Redesigned to look more professional */}
              <div
                className="flex items-center gap-3 mb-3 cursor-pointer rounded-lg hover:bg-gray-50 p-2 transition-all duration-200 border-t border-gray-100 pt-3"
                onClick={() => handleProfileView(show?.sellerId?._id)}
              >
                <div className="avatar">
                  <div className="w-8 h-8 rounded-full ring ring-amber-400 ring-offset-1">
                  {
                      userInfo?.profileURL?.azureUrl ? 
                      <img
                      src={userInfo.profileURL.azureUrl}
                      alt="profile"
                    />
                    :
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userInfo?.userName || "User"
                      )}&background=random&size=128`}
                      alt="profile"
                    />
                    }
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 truncate">
                    {sellerInfo?.companyName || "Company"}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    @{userInfo?.userName || "user"}
                  </p>
                </div>
              </div>

              {/* Tags with improved styling */}
              {show.tags && show.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {show.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                  {show.tags.length > 3 && (
                    <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-0.5 rounded-md">
                      +{show.tags.length - 3} more
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
          <h3 className="font-medium text-gray-500">
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
