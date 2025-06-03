import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  GET_MY_SHOPPABLE_VIDEOS,
  DELETE_SHOPPABLE_VIDEO_BY_ID,
  SHOPPABLE_VIDEO_VISIBILITY,
} from "../../api/apiDetails.js";
import { deleteObjectFromS3 } from "../../../utils/aws.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import {
  PlusCircle,
  RefreshCw,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  Edit,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { backendurl } from "../../../../config.js";

const BASE_URL = backendurl.replace(/\/api\/?$/, "");

const SOCKET_SERVER_URL = `${BASE_URL}`;

const toggleStyles = `
  .toggle-checkbox:checked {
    right: 0;
    border-color: #4CAF50; /* Green when checked */
  }
  .toggle-checkbox:checked + .toggle-label {
    background-color: #4CAF50; /* Green when checked */
  }
`;

const ViewShopable = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [visibilityLoading, setVisibilityLoading] = useState({});

  const cdnURL = import.meta.env.VITE_AWS_CDN_URL;
  const [failureModal, setFailureModal] = useState(false);
  const [videoForFailureModal, setVideoForFailureModal] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null); // Ref to store the socket instance

  const handleFailedStatusClick = (video) => {
    setVideoForFailureModal(video);
    setFailureModal(true);
  };

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const res = await axiosInstance.get(GET_MY_SHOPPABLE_VIDEOS);
      const videosWithUrls = res.data.data.map((video) => ({
        ...video,
        signedThumbnail: video.thumbnailURL,
      }));
      setVideos(videosWithUrls);

      if (socketRef.current && socketRef.current.connected) {
        videosWithUrls.forEach((video) => {
          if (
            ["uploaded", "processing", "failed"].includes(
              video.processingStatus
            )
          ) {
            console.log(
              `[Socket.IO Client] (fetchVideos) Attempting to subscribe to video ${video._id} (status: ${video.processingStatus}).`
            );
            socketRef.current.emit("subscribeToShoppableVideo", {
              videoId: video._id,
            });
          } else if (video.processingStatus === "published") {
            console.log(
              `[Socket.IO Client] (fetchVideos) Video ${video._id} is 'published'. Ensuring unsubscription.`
            );
            socketRef.current.emit("unsubscribeFromShoppableVideo", {
              videoId: video._id,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to fetch videos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // --- Socket.IO Setup ---
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      // auth: { token: "your_user_token_if_needed" } // Example for auth
    });

    const currentSocket = socketRef.current; // Capture for cleanup stability

    const handleConnect = () => {
      console.log(
        "[Socket.IO Client] Connected successfully:",
        currentSocket.id
      );
      // When connected (or reconnected), iterate through existing videos
      // and subscribe if they are in a state that requires live updates.
      videos.forEach((video) => {
        if (
          ["uploaded", "processing", "failed"].includes(
            video.processingStatus
          )
        ) {
          console.log(
            `[Socket.IO Client] Attempting to subscribe to video ${video._id} (status: ${video.processingStatus}) on connect.`
          );
          currentSocket.emit(
            "subscribeToShoppableVideo",
            { videoId: video._id },
            (ack) => {
              if (ack && ack.success) {
                console.log(
                  `[Socket.IO Client] Successfully subscribed to video ${video._id} on connect: ${ack.message}`
                );
              } else if (ack) {
                console.error(
                  `[Socket.IO Client] Failed to subscribe to video ${video._id} on connect: ${ack.message}`
                );
              }
            }
          );
        } else if (video.processingStatus === "published") {
          // Ensure unsubscription if already published on connect (e.g., after quick reconnect)
          console.log(
            `[Socket.IO Client] Video ${video._id} is 'published' on connect. Ensuring unsubscription.`
          );
          currentSocket.emit("unsubscribeFromShoppableVideo", {
            videoId: video._id,
          });
        }
      });
    };

    const handleDisconnect = (reason) => {
      console.warn("[Socket.IO Client] Disconnected:", reason);
    };

    const handleConnectError = (error) => {
      console.error("[Socket.IO Client] Connection Error:", error);
    };

    const handleStatusUpdate = (update) => {
      console.log(
        "[Socket.IO Client] Received shoppableVideoStatusUpdate:",
        update
      );
      if (update && update.videoId && update.statusDetails) {
        // Update local video state first
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video._id === update.videoId
              ? { ...video, ...update.statusDetails } // Update the specific video's details
              : video
          )
        );

        // After state update, a new video status might require action
        const newStatus = update.statusDetails.processingStatus;
        if (newStatus === "published") {
          console.log(
            `[Socket.IO Client] Video ${update.videoId} has become 'published'. Unsubscribing.`
          );
          currentSocket.emit("unsubscribeFromShoppableVideo", {
            videoId: update.videoId,
          });
        } else if (
          ["uploaded", "processing", "failed"].includes(newStatus)
        ) {
          // If it transitions to a state we care about, ensure subscription.
          // This is particularly useful if it somehow wasn't subscribed before.
          console.log(
            `[Socket.IO Client] Video ${update.videoId} status is now '${newStatus}'. Ensuring subscription.`
          );
          currentSocket.emit("subscribeToShoppableVideo", {
            videoId: update.videoId,
          });
        }
      }
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);
    currentSocket.on("shoppableVideoStatusUpdate", handleStatusUpdate);

    // This part runs when `videos` array changes.
    // It ensures that for the current set of videos, subscriptions are correctly managed.
    if (currentSocket.connected) {
      videos.forEach((video) => {
        if (
          ["uploaded", "processing", "failed"].includes(
            video.processingStatus
          )
        ) {
          console.log(
            `[Socket.IO Client] (videos effect) Ensuring subscription for video ${video._id} (status: ${video.processingStatus}).`
          );
          currentSocket.emit("subscribeToShoppableVideo", {
            videoId: video._id,
          });
        } else if (video.processingStatus === "published") {
          // If a video is marked as published in the current `videos` state, ensure we are not subscribed.
          console.log(
            `[Socket.IO Client] (videos effect) Video ${video._id} is 'published'. Ensuring unsubscription.`
          );
          currentSocket.emit("unsubscribeFromShoppableVideo", {
            videoId: video._id,
          });
        }
      });
    }

    // Cleanup on component unmount
    return () => {
      console.log(
        "[Socket.IO Client] Cleaning up socket connections and listeners for ViewShopable component..."
      );
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.off("shoppableVideoStatusUpdate", handleStatusUpdate);

      // Unsubscribe from all videos this component *might* have subscribed to.
      // The server should handle `leave(roomName)` gracefully even if not in the room.
      videos.forEach((video) => {
        // Only attempt unsubscription if it might have been in a state that led to subscription.
        if (
          ["uploaded", "processing", "failed", "published"].includes(
            video.processingStatus
          )
        ) {
          console.log(
            `[Socket.IO Client] Unsubscribing from video ${video._id} on unmount (original status: ${video.processingStatus}).`
          );
          currentSocket.emit("unsubscribeFromShoppableVideo", {
            videoId: video._id,
          });
        }
      });

      console.log("[Socket.IO Client] Disconnecting main socket instance.");
      currentSocket.disconnect();
      socketRef.current = null;
    };
  }, [videos]);

  const handleEditClick = (id) => {
    navigate(`/seller/shopableform-edit/${id}`);
  };

  const handleViewClick = (videoId) => {
    navigate(`/seller/shopable-videos/${videoId}`);
  };

  const handleDeleteClick = (video) => {
    setVideoToDelete(video);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await axiosInstance.delete(
        DELETE_SHOPPABLE_VIDEO_BY_ID.replace(":id", videoToDelete._id)
      );

      const s3DeletePromises = [];
      if (videoToDelete.thumbnailBlobName) {
        s3DeletePromises.push(deleteObjectFromS3(videoToDelete.thumbnailBlobName));
      } else if (videoToDelete.thumbnailURL && videoToDelete.thumbnailURL.includes('amazonaws.com')) {
        s3DeletePromises.push(deleteObjectFromS3(videoToDelete.thumbnailURL));
      }

      if (videoToDelete.originalVideoBlobName) {
        s3DeletePromises.push(deleteObjectFromS3(videoToDelete.originalVideoBlobName));
      }

      await Promise.all(s3DeletePromises);

      toast.success("Video deleted successfully");
      setVideos((prevVideos) =>
        prevVideos.filter((video) => video._id !== videoToDelete._id)
      );
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("unsubscribeFromShoppableVideo", {
          videoId: videoToDelete._id,
        });
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeleteModal(false);
      setVideoToDelete(null);
    }
  };

  const handleVisibilityChange = async (videoId, currentVisibility) => {
    const newVisibility = currentVisibility === "public" ? "private" : "public";
    setVisibilityLoading((prev) => ({ ...prev, [videoId]: true }));

    const originalVideos = JSON.parse(JSON.stringify(videos)); // Deep copy for reliable rollback
    setVideos((prevVideos) =>
      prevVideos.map((video) =>
        video._id === videoId ? { ...video, visibility: newVisibility } : video
      )
    );

    try {
      const response = await axiosInstance.put(
        SHOPPABLE_VIDEO_VISIBILITY.replace(":id", videoId),
        { visibility: newVisibility }
      );
      if (response.data.status) {
        toast.success(`Video visibility updated to ${newVisibility}.`);
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video._id === videoId ? { ...video, ...response.data.data } : video
          )
        );
      } else {
        toast.error(response.data.message || "Failed to update visibility.");
        setVideos(originalVideos); // Revert on API error
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error(
        error.response?.data?.message || "Failed to update visibility."
      );
      setVideos(originalVideos); // Revert on network/server error
    } finally {
      setVisibilityLoading((prev) => ({ ...prev, [videoId]: false }));
    }
  };

  const VideoStatus = ({ status, videoData, onClick }) => {
    switch (status) {
      case "queued":
        return (
          <span className="flex items-center gap-1.5 text-sm text-whiteLight font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Queued
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing
          </span>
        );
      case "published":
        return (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Published
          </span>
        );
      case "uploaded":
        return (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Published.
          </span>
        );
      case "failed":
        return (
          <button
            onClick={() => onClick(videoData)}
            className="flex flex-col items-center gap-0.5 text-sm text-red-600 font-medium hover:text-red-400 cursor-pointer"
            title={videoData?.processingError || "Processing failed. Click for details."}
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Failed
            </div>
            <span className="text-xs ">Click for details</span>
          </button>
        );
      default:
        return <span className="text-sm text-gray-400">Unknown</span>;
    }
  };

  return (
    <>
      <style>{toggleStyles}</style>
      <div className="flex flex-col min-h-screen w-full bg-blackLight shadow-2xl relative overflow-hidden p-6 text-gray-800">
        {/* Header Section - Sticky at the top */}
        <div class="
    bg-blackLight p-4 shadow-sm flex flex-col items-start gap-4  
    sm:flex-row sm:justify-between sm:gap-0  
    mb-4 -mx-6 px-6 sticky top-0 z-10">
    <h1 class="text-2xl font-bold text-whiteLight text-center sm:text-left">
        Shoppable Videos
    </h1>
    <div class="flex flex-wrap justify-center gap-2 sm:gap-4">
        <motion.button
            onClick={fetchVideos}
            whileTap={{ scale: 0.9 }}
            disabled={refreshing}
            class="
                btn btn-ghost bg-primaryBlack text-newYellow flex items-center gap-2 rounded-3xl 
                transition-all duration-300 disabled:opacity-70 text-sm px-3 py-1 
                sm:text-base sm:px-4 sm:py-2"
        >
            {refreshing ? (
                <RefreshCw class="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
                <RefreshCw class="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span class="inline">Refresh</span>
        </motion.button>

        <button
            onClick={() => navigate("/seller/shopableform")}
            class="
                btn btn-warning bg-primaryYellow hover:bg-yellow-300 text-newBlack rounded-3xl gap-2 
                transition-all duration-300 hover:scale-105 text-sm px-3 py-1 
                sm:text-base sm:px-4 sm:py-2"
        >
            <PlusCircle class="w-4 h-4 sm:w-5 sm:h-5" />
            <span class="inline">Create</span>
        </button>
    </div>
</div>

        {/* Table Section - Restructured for sticky header and scrollable body */}
        <div className="flex flex-col rounded-lg shadow flex-grow overflow-hidden border border-gray-100">
          {/* Table Header (Non-scrolling part, wrapped in its own div) */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-newYellow text-blackDark text-md font-bold">
                <tr>
                  {/* Ensure these widths match the <td> widths below for perfect alignment */}
                  <th className="w-[100px] p-4 text-left font-bold">Thumbnail</th>
                  <th className="w-[200px] p-4 text-left font-bold">Title</th>
                  <th className="w-[120px] p-4 text-left font-bold">Category</th>
                  <th className="w-[100px] p-4 text-left font-bold">Products</th>
                  <th className="w-[150px] p-4 text-left font-bold">Status</th>
                  <th className="w-[150px] p-4 text-center font-bold">Active/Deactive</th>
                  <th className="w-[120px] p-4 text-left font-bold">Created</th>
                  <th className="w-[180px] p-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body (Scrollable part, wrapped in its own div) */}
          <div
            className="overflow-x-auto overflow-y-auto flex-grow"
            style={{
              height: 'calc(100vh - 250px)', // Adjust this value based on your header's total height
              minHeight: '450px'            // Ensure a minimum height for visibility (e.g., ~5-6 rows)
            }}
          >
            <table className="table w-full">
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <span className="loading loading-lg loading-spinner text-primaryYellow"></span>
                    </td>
                  </tr>
                ) : videos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No videos found. Create your first shoppable video!
                    </td>
                  </tr>
                ) : (
                  videos.map((video) => {
                    const isPublished = video.processingStatus === "published";
                    const isCurrentlyLoadingVisibility = visibilityLoading[video._id];

                    return (
                      <tr
                        key={video._id}
                        className="hover:bg-white/5 hover:shadow-xl hover:shadow-white/10 hover:translate-y-[-2px] transform transition-all duration-200 ease-out text-whiteLight cursor-pointer"
                      >
                        <td className="w-[100px] p-2"> {/* Match width of corresponding <th> */}
                          <img
                            src={`${cdnURL}${video.thumbnailBlobName || 'placeholder-image.png'}`}
                            alt={video.title}
                            className="w-16 h-16 rounded-md object-cover shadow-sm"
                          />
                        </td>
                        <td className="w-[200px] p-4 font-medium truncate max-w-xs"> {/* Match width of corresponding <th> */}
                          {video.title}
                        </td>
                        <td className="w-[120px] p-4 text-sm"> {/* Match width of corresponding <th> */}
                          {video.category}
                        </td>
                        <td className="w-[100px] p-4 font-medium text-sm text-left"> {/* Match width of corresponding <th> */}
                          {video?.productsListed?.length || 0} product
                          {video?.productsListed?.length !== 1 ? "s" : ""}
                        </td>
                        <td className="w-[150px] p-4 whitespace-nowrap"> {/* Match width of corresponding <th> */}
                          <VideoStatus
                            status={video.processingStatus}
                            videoData={video}
                            onClick={video.processingStatus === "failed" ? handleFailedStatusClick : () => {}}
                          />
                        </td>
                        <td className="w-[150px] p-4 text-center whitespace-nowrap"> {/* Match width of corresponding <th> */}
                          {isPublished ? (
                            isCurrentlyLoadingVisibility ? (
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-primaryYellow" />
                            ) : (
                              <button
                                onClick={() => handleVisibilityChange(video._id, video.visibility)}
                                disabled={!isPublished || isCurrentlyLoadingVisibility}
                                title={isPublished ? `Set to ${video.visibility === 'public' ? 'Private' : 'Public'}` : "Video must be published to change visibility"}
                                className={`p-1 rounded-full transition-colors duration-200 ${
                                  video.visibility === 'public' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {video.visibility === 'public' ?
                                  <ToggleRight className="w-6 h-6 text-white" /> :
                                  <ToggleLeft className="w-6 h-6 text-gray-700" />
                                }
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 italic">• • •</span>
                          )}
                        </td>
                        <td className="w-[120px] p-4 whitespace-nowrap text-sm text-whiteLight"> {/* Match width of corresponding <th> */}
                          {new Date(video.createdAt).toLocaleDateString()}
                        </td>
                        <td className="w-[180px] p-4"> {/* Match width of corresponding <th> */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewClick(video._id)}
                              className="btn btn-ghost btn-sm bg-newYellow text-newBlack font-bold flex items-center gap-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                              title={
                                isPublished
                                  ? "View Video Details"
                                  : "Video must be published to view"
                              }
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleEditClick(video._id)}
                              className="btn btn-ghost bg-newBlack btn-sm text-newYellow hover:bg-gray-700 hover:text-white flex items-center gap-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                              title={
                                (video.processingStatus === 'published' || video.processingStatus === 'failed')
                                  ? "Edit Video Details"
                                  : "Video cannot be edited while queued or processing"
                              }
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            {/* <button
                              onClick={() => handleDeleteClick(video)}
                              className="btn btn-ghost btn-sm bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button> */}
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

        {/* Failure Modal */}
        {failureModal && videoForFailureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg text-gray-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> Processing Failed
                </h2>
                <button
                  onClick={() => {
                    setFailureModal(false);
                    setVideoForFailureModal(null);
                  }}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-5">
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  Video Title:
                </h3>
                <p className="text-gray-900 bg-gray-100 p-2 rounded">
                  {videoForFailureModal.title}
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  Failure Reason:
                </h3>
                <pre className="text-sm text-red-700 bg-red-50 p-3 rounded whitespace-pre-wrap break-all max-h-60 overflow-y-auto border border-red-200">
                  {videoForFailureModal.processingError ||
                    "No specific error message provided."}
                </pre>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setFailureModal(false);
                    setVideoForFailureModal(null);
                  }}
                  className="btn bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && videoToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                  <AlertTriangle /> Confirm Deletion
                </h2>
                <button
                  onClick={() => setDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the video "
                <strong>{videoToDelete.title}</strong>"? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                {/* Keep the delete button commented out or uncomment if you need it */}
                {/* <button
                  onClick={confirmDelete}
                  className="btn btn-error bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </button> */}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewShopable;