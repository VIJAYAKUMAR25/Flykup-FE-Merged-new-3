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

  if (shoppableVideosList.length === 0) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-base-content">
              No Videos Available
            </h1>
            <p className="py-6">
              Currently there are no shoppable videos available. Please check
              back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileClick = () => {
    navigate(`/user/${userInfo.userName}`);
  };

  console.log(userInfo);
  

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-3xl font-bold text-center mb-8 text-primary">Discover Shoppable Videos</h1> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ">
        {shoppableVideosList.map((shopVid, index) => (
          <motion.div
            key={shopVid._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="card bg-newWhite shadow-xl overflow-hidden h-full"
          >
            <figure className="relative h-64 bg-black/20 overflow-hidden">
              <img
                src={shopVid?.thumbnailURL}
                alt={shopVid?.title}
                className="w-full h-full object-cover"
                onClick={() => navigate(`/user/reel/${shopVid._id}`)}
              />
              <div className="absolute inset-0  opacity-0 hover:opacity-100 transition-opacity flex items-end">
                <div className="p-4 text-white">
                  <p className="font-bold">{shopVid.title}</p>
                  <div className="bg-slate-100 text-newBlack rounded-full text-xs px-1 py-0.5 mt-2">
                    {shopVid.category}
                  </div>
                </div>
              </div>
            </figure>
            <div className="card-body p-4">
              <div
                className="flex items-center gap-3 cursor-pointer group transition-all duration-300 rounded-lg p-1 hover:bg-slate-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProfileClick();
                }}
              >
                <div className="avatar transition-transform duration-300 group-hover:scale-101">
                  <div className="w-10 h-10 rounded-full ring ring-amber-500 group-hover:ring-slate-100 group-hover:ring-offset-2 group-hover:ring-offset-amber-100">
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
                <div className="transition-all duration-300 group-hover:translate-x-1">
                  <h3 className="text-sm font-semibold group-hover:text-amber-700">
                    {sellerInfo?.companyName || "company"}
                  </h3>
                  <p className="text-xs text-gray-500 group-hover:text-amber-500">
                    @{userInfo?.userName || "user"}
                  </p>
                </div>
              </div>
              <h2
                className="card-title text-lg line-clamp-1 text-newBlack"
                onClick={() => navigate(`/user/reel/${shopVid._id}`)}
              >
                {shopVid.title}
              </h2>
              <div className="flex justify-between items-center ">
                <div className="flex flex-col gap-2 ">
                  <p className="text-xs text-gray-700 mt-1">
                    {shopVid.category}
                  </p>
                  <p className="bg-blue-100 text-blue-800 px-1 text-xs rounded ">
                    {shopVid.subcategory}
                  </p>
                </div>
                <button
                  className="btn btn-circle btn-sm bg-red-500 btn-outline"
                  onClick={() => navigate(`/user/reel/${shopVid._id}`)}
                >
                  <PlayIcon size={16} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShoppableVideosFeed;
