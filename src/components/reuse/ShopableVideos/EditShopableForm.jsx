// EditShopableForm.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import ShopableForm from "./ShopableForm";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import { BiErrorCircle, BiVideoOff } from 'react-icons/bi';
import { MdRefresh } from 'react-icons/md';

const EditShopableForm = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axiosInstance.get(`/shoppable-videos/${videoId}`);
        console.log(response.data);
        if (response.data.status) {
          setInitialData({
            ...response.data.data,
            productsListed: response.data.data.productsListed.map(p => p._id)
          });
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching video data:", error);
        toast.error("Failed to load video data");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  const handleSubmit = async (formData) => {
    try {
      const response = await axiosInstance.put(
        `/shoppable-videos/${videoId}`,
        formData
      );

      if (response.status === 200) {
        toast.success("Video updated successfully");
        navigate(`/seller/viewvideo/${videoId}`);
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.response?.data?.message || "Failed to update video");
    }
  };

  const handleRetry = () => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axiosInstance.get(`/shoppable-videos/${videoId}`);
        if (response.data.status) {
          setInitialData({
            ...response.data.data,
            productsListed: response.data.data.productsListed.map(p => p._id)
          });
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching video data:", error);
        toast.error("Failed to load video data");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  };

  // Enhanced Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blackLight">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center p-8"
        >
          {/* Animated loading ring */}
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </motion.div>
            
            {/* Pulsing inner circle */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full opacity-20"></div>
            </motion.div>
          </div>

          {/* Loading text with staggered animation */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-2"
          >
            <h3 className="text-xl font-semibold text-gray-800">Loading Video Data</h3>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center justify-center space-x-1"
            >
              <span className="text-gray-600">Please wait</span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Enhanced Error/Not Found UI
  if (!initialData || error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center p-8 max-w-md mx-auto"
        >
          {/* Error icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <BiVideoOff className="text-6xl text-red-500" />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2"
              >
                <BiErrorCircle className="text-2xl text-orange-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Error message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800">Video Not Found</h2>
            <p className="text-gray-600 leading-relaxed">
              Sorry, we couldn't find the video you're looking for. It may have been removed, 
              renamed, or is temporarily unavailable.
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              <MdRefresh className="mr-2 text-lg" />
              Try Again
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="block w-full px-6 py-3 text-gray-600 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Go Back
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <ShopableForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isEditMode={true}
    />
  );
};

export default EditShopableForm;