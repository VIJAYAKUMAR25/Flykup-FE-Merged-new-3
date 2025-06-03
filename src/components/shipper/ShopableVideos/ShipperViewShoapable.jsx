import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GET_SELLER_SHOPPABLE_VIDEOS, DELETE_SHOPPABLE_VIDEO_BY_ID, GET_MY_SHOPPABLE_VIDEOS } from "../../api/apiDetails.js";
import { deleteObjectFromS3, generateSignedUrl } from "../../../utils/aws.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { PlusCircle, RefreshCw, Eye, Trash2, X, AlertTriangle } from "lucide-react";
import {   Edit, Loader2, CheckCircle2 } from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "react-toastify";

const ShipperViewShopable = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchVideos = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const res = await axiosInstance.get(GET_MY_SHOPPABLE_VIDEOS);
      const videosWithUrls = await Promise.all(
        res.data.data.map(async (video) => ({
          ...video,
          signedThumbnail: await generateSignedUrl(video.thumbnailURL),
        }))
      );
      setVideos(videosWithUrls);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleViewClick = (videoId) => {
    navigate(`/shipper/shopable-videos/${videoId}`);
  };

  const handleDeleteClick = (video) => {
    setVideoToDelete(video);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await axiosInstance.delete(DELETE_SHOPPABLE_VIDEO_BY_ID.replace(":id", videoToDelete._id));

      // delete from s3
      await Promise.all([
        videoToDelete.thumbnailURL && deleteObjectFromS3(videoToDelete.thumbnailURL),
        videoToDelete.videoURL && deleteObjectFromS3(videoToDelete.videoURL)
      ]);

      toast.success("Video deleted successfully");
      setVideos(videos.filter((video) => video._id !== videoToDelete._id));
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeleteModal(false);
      setVideoToDelete(null);
    }
  };
  
  const VideoStatus = ({ status }) => {
    switch (status) {
      case 'queued':
        return (
          <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Queued
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing
          </span>
        );
      case 'published':
        return (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Published
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium" title="Processing failed">
            <AlertTriangle className="w-4 h-4" />
            Failed
          </span>
        );
      default:
        return <span className="text-sm text-gray-400">Unknown</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white rounded-xl shadow-2xl relative overflow-hidden p-6 text-gray-800">
    {/* Header Section */}
    <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex justify-between items-center mb-4 -mx-6 px-6"> 
      <h1 className="text-2xl font-bold text-gray-700">Shoppable Videos</h1>
      <div className="flex gap-4">
        <motion.button
          onClick={fetchVideos}
          whileTap={{ scale: 0.9 }}
          disabled={refreshing}
          className="btn btn-ghost bg-primaryBlack text-newYellow flex items-center gap-2 rounded-3xl transition-all duration-300 disabled:opacity-70"
        >
          {refreshing ? (
            // Use motion.span for consistency if preferred, but not strictly needed here
             <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>

        <button
          onClick={() => navigate("/shipper/shopableform")}
          className="btn btn-warning bg-primaryYellow hover:bg-yellow-300 text-newBlack rounded-3xl gap-2 transition-all duration-300 hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Create Shoppable Video</span>
        </button>
      </div>
    </div>

    {/* Table Section */}
    <div className="overflow-x-auto rounded-lg shadow flex-grow">
      <table className="table w-full">
        <thead className="bg-primaryYellow text-newBlack text-md font-bold"> 
          <tr>
            <th className="w-24 p-4 text-left font-bold">Thumbnail</th>
            <th className="p-4 text-left font-bold">Title</th>
            <th className="p-4 text-left font-bold">Category</th>
            <th className="p-4 text-left font-bold">Products</th> 
            <th className="p-4 text-left font-bold">Status</th> 
            <th className="p-4 text-left font-bold">Created</th> 
            <th className="p-4 text-center font-bold">Actions</th>
          </tr>
        </thead>
        {/* Table Body */}
        <tbody>
          {loading ? (
            <tr>
               {/* Updated colSpan */}
              <td colSpan="7" className="text-center py-12">
                 <span className="loading loading-lg loading-spinner text-primaryYellow"></span> 
              </td>
            </tr>
          ) : videos.length === 0 ? (
            <tr>
              {/* Updated colSpan */}
              <td colSpan="7" className="text-center py-12 text-gray-500">
                No videos found. Create your first shoppable video!
               </td>
            </tr>
          ) : (
            videos.map((video) => {
              const isPublished = video.processingStatus === 'published';
              return (
                <tr key={video._id} className="hover:bg-yellow-50/50 hover:shadow-md transition-all duration-150"> {/* Subtle hover */}
                  <td className="w-24 p-4">
                    <img src={video.thumbnailURL} alt={video.title} className="w-16 h-16 rounded-md object-cover shadow-sm" />
                  </td>
                  <td className="p-4 font-medium truncate max-w-xs">{video.title}</td>
                  <td className="p-4 text-sm">{video.category}</td>
                  <td className="p-4 font-medium text-sm text-left">
                    {video?.productsListed?.length || 0} product{video?.productsListed?.length !== 1 ? 's' : ''}
                  </td>
                  {/* Status Cell */}
                  <td className="p-4 whitespace-nowrap">
                    <VideoStatus status={video.processingStatus} />
                  </td>
                  <td className="p-4 whitespace-nowrap text-sm text-gray-600">{new Date(video.createdAt).toLocaleDateString()}</td>
                  {/* Actions Cell */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewClick(video._id)}
                        // Disable button if not published
                        disabled={!isPublished}
                        className="btn btn-ghost btn-sm bg-newYellow text-newBlack font-bold flex items-center gap-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        title={isPublished ? "View Video Details" : "Video must be published to view"}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        // onClick={() => handleEditClick(video._id)}
                        disabled={!isPublished}
                        className="btn btn-ghost bg-newBlack btn-sm text-newYellow hover:bg-gray-700 hover:text-white flex items-center gap-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        title={isPublished ? "Edit Video Details" : "Video must be published to edit"}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default ShipperViewShopable;