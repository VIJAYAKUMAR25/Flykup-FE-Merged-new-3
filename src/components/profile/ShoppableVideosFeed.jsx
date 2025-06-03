import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { generateSignedUrl } from "../../utils/aws";
import { USER_FEED_SHOPPABLE_VIDEOS } from "../api/apiDetails";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlayIcon } from "lucide-react";

const ShoppableVideosFeed = () => {
  const [shopvideos, setShopVideos] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchShows = async () => {
    try {
      setLoading(true);
      const shopVidRes = await axiosInstance.get(USER_FEED_SHOPPABLE_VIDEOS);
      const shopVideosData = shopVidRes.data.data;
      setShopVideos(shopVideosData);

      // Generate signed URLs for all images
      const urlPromises = shopVideosData.map(async (shopVid) => {
        const url = await generateSignedUrl(shopVid.thumbnailURL);
        return { id: shopVid._id, url };
      });

      const resolvedUrls = await Promise.all(urlPromises);
      const urlMap = resolvedUrls.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {});
      setSignedUrls(urlMap);
    } catch (error) {
      console.error("Error fetching shopvideos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="card bg-base-100 shadow-xl animate-pulse">
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

  if (shopvideos.length === 0) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-base-content">No Videos Available</h1>
            <p className="py-6">Currently there are no shoppable videos available. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileClick = (shopVid) => {
    navigate(`/profile/user/${shopVid.sellerId?.userInfo?.userName}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-3xl font-bold text-center mb-8 text-primary">Discover Shoppable Videos</h1> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ">
        {shopvideos.map((shopVid, index) => (
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
                src={signedUrls[shopVid._id] || "/placeholder.jpg"}
                alt={shopVid.title}
                className="w-full h-full object-cover"
                onClick={() => navigate(`/profile/reel/${shopVid._id}`)}
              />
              <div className="absolute inset-0  opacity-0 hover:opacity-100 transition-opacity flex items-end">
                <div className="p-4 text-white">
                  <p className="font-bold">{shopVid.title}</p>
                  <div className="bg-slate-100 text-newBlack rounded-full text-xs px-1 py-0.5 mt-2">{shopVid.category}</div>
                </div>
              </div>
            </figure>
            <div className="card-body p-4">
              <div
                className="flex items-center gap-3 cursor-pointer group transition-all duration-300 rounded-lg p-1 hover:bg-slate-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProfileClick(shopVid);
                }}
              >
                <div className="avatar transition-transform duration-300 group-hover:scale-101">
                  <div className="w-10 h-10 rounded-full ring ring-amber-500 group-hover:ring-slate-100 group-hover:ring-offset-2 group-hover:ring-offset-amber-100">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        shopVid.sellerId?.userInfo?.userName || "User"
                      )}&background=random&size=128`}
                      alt="profile"
                    />
                  </div>
                </div>
                <div className="transition-all duration-300 group-hover:translate-x-1">
                  <h3 className="text-sm font-semibold group-hover:text-amber-700">{shopVid.sellerId?.companyName || "company"}</h3>
                  <p className="text-xs text-gray-500 group-hover:text-amber-500">@{shopVid.sellerId?.userInfo?.userName || "user"}</p>
                </div>
              </div>
              <h2 className="card-title text-lg line-clamp-1 text-newBlack" onClick={() => navigate(`/profile/reel/${shopVid._id}`)}>
                {shopVid.title}
              </h2>
              <div className="flex justify-between items-center ">
              <div className="flex flex-col gap-2 ">
                <p className='text-xs text-gray-700 mt-1'>{shopVid.category}</p>
                <p className='bg-blue-100 text-blue-800 px-1 text-xs rounded '>
                  {shopVid.subcategory}
                </p>
              </div>
                <button
                  className="btn btn-circle btn-sm bg-red-500 btn-outline"
                  onClick={() => navigate(`/profile/reel/${shopVid._id}`)}
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