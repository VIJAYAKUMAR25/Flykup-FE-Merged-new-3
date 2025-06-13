// import { useState, useEffect, useCallback } from "react";
// import {
//   Edit,
//   PlusCircle,
//   Sparkles,
//   Calendar,
//   Activity,
//   XCircle,
//   CheckCircle,
//   Clock,
//   Copy,
//   Search,
//   RefreshCw,
//   X,
// } from "lucide-react"; // ENHANCEMENT: Imported more icons for clarity
// import { useNavigate } from "react-router-dom";
// import EditLiveStreamModal from "../LiveStream/EditShowForm.jsx";
// import { toast } from "react-toastify";
// import { CANCEL_SHOW, GET_MY_SHOWS } from "../../api/apiDetails.js";
// import axiosInstance from "../../../utils/axiosInstance.js";
// import { formatScheduledDateTimeLocal } from "../../../utils/dateUtils.js";


// const ViewScheduledShows = () => {
//   const [shows, setShows] = useState([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedShowId, setSelectedShowId] = useState(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const navigate = useNavigate();
//   const [cancelShowModalOpen, setCancelShowModalOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const [copiedId, setCopiedId] = useState(null);

//   const fetchShows = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const { data } = await axiosInstance.get(GET_MY_SHOWS);
//       setShows(data.data);

//     } catch (error) {
//       console.error("Error fetching shows:", error);
//       toast.error("Failed to fetch shows.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, []); 

//   useEffect(() => {
//     fetchShows();
//   }, [fetchShows]);

//   const handleRefresh = () => {
//     fetchShows();
//   };

//   const handleUpdateSuccess = useCallback(() => {
//     fetchShows();
//   }, [fetchShows]);

//   const handleCloseEditModal = useCallback((success) => {
//     setShowEditModal(false);
//     setSelectedShowId(null);
//     if (success) {
//       handleUpdateSuccess();
//     }
//   }, [handleUpdateSuccess]);

//   const tabs = [
//     { id: "all", icon: <Sparkles className="w-4 h-4" /> },
//     { id: "created", icon: <Calendar className="w-4 h-4" /> },
//     { id: "live", icon: <Activity className="w-4 h-4" /> },
//     { id: "cancelled", icon: <XCircle className="w-4 h-4" /> },
//     { id: "ended", icon: <CheckCircle className="w-4 h-4" /> },
//   ];

//   const filteredShows = shows
//     .filter((show) =>
//       activeTab === "all" ? true : show.showStatus === activeTab
//     )
//     .filter((show) => {
//       const searchLower = searchQuery.toLowerCase();
//       return (
//         show.title.toLowerCase().includes(searchLower) ||
//         (show.description &&
//           show.description.toLowerCase().includes(searchLower))
//       );
//     });

//   const getBadgeColor = (status) => {
//     const statusColors = {
//       created: "badge-success",
//       live: "badge-success",
//       cancelled: "badge-error",
//       ended: "badge-warning",
//       UpComing: "badge-primary",
//     };
//     return statusColors[status] || "badge-ghost";
//   };

//   const handleEdit = (showId) => {
//     navigate(`/seller/edit-show/${showId}`);
//   };

//   const handleEditProductsTagged = (showId) => {
//     navigate('/seller/edit-tagged-products', { state: showId});
//   }

//   const handleOpenShow = (showId) => {
//     navigate(`/seller/show/${showId}`);
//   };

//   const handleCopyUrl = async (showId) => {
//     if (copiedId === showId) return; // Prevent re-copying

//     const url = `${window.location.origin}/user/show/${showId}`;
//     try {
//       await navigator.clipboard.writeText(url);
//       setCopiedId(showId);
//       toast.success("Show URL copied to clipboard!");
//       setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
//     } catch (err) {
//       console.error("Failed to copy: ", err);
//       toast.error("Failed to copy URL.");
//     }
//   };

//   const handleCancelShow = (showId) => {
//     setSelectedShowId(showId);
//     setCancelShowModalOpen(true);
//   };

//   const confirmCancelShow = async () => {
//     try {
//       await axiosInstance.patch(`${CANCEL_SHOW}/${selectedShowId}/cancel`, {});
//       setShows((prevShows) =>
//         prevShows.map((show) =>
//           show._id === selectedShowId
//             ? { ...show, showStatus: "cancelled" }
//             : show
//         )
//       );
//       toast.success("Show cancelled successfully");
//     } catch (error) {
//       console.error("Error cancelling show:", error);
//       toast.error("Could not cancel the show.");
//     } finally {
//       setCancelShowModalOpen(false);
//       setSelectedShowId(null);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
//       {/* Decorative Blobs */}
//       <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50" />
//       <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50" />

//       {/* Header Section */}
//       <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
//         <div className="flex justify-between items-center gap-4 mb-4">
//           <div className="flex items-center gap-2">
//             <h1 className="text-xl md:text-2xl font-bold text-slate-600">Your Shows</h1>
//             <Sparkles className="w-6 h-6 text-primaryYellow animate-pulse" />
//           </div>
//           <button
//             onClick={() => navigate("/seller/sheduleshow")}
//             className="btn btn-warning bg-primaryYellow hover:bg-yellow-400 rounded-full gap-2 transition-all duration-300 hover:scale-105 shadow-sm"
//           >
//             <PlusCircle className="w-5 h-5" />
//             <span className="hidden sm:inline">Create Show</span>
//           </button>
//         </div>

//         {/* Tabs - now horizontally scrollable */}
//         <div className="overflow-x-auto pb-2">
//           <div className="flex space-x-2 bg-inputYellow p-1 rounded-lg w-max">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105 text-sm ${
//                   activeTab === tab.id
//                     ? "bg-primaryYellow text-black shadow"
//                     : "text-gray-600 hover:bg-white/70"
//                 }`}
//               >
//                 {tab.icon}
//                 <span className="capitalize">{tab.id}</span>
//               </button>
//             ))}
//           </div>
//         </div>
        
//         {/* ENHANCEMENT: Search and Refresh Section with better responsive behavior */}
//         <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
//             <div className="relative flex-grow">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                     type="text"
//                     placeholder="Search shows by title or description..."
//                     className="pl-10 pr-10 py-2.5 w-full border bg-inputYellow rounded-full shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all duration-200 outline-none"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//                 {searchQuery && (
//                     <button 
//                         onClick={() => setSearchQuery('')}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
//                         aria-label="Clear search"
//                     >
//                         <X className="h-5 w-5" />
//                     </button>
//                 )}
//             </div>
          
//             <button
//                 onClick={handleRefresh}
//                 className="btn btn-outline flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
//                 disabled={isLoading}
//             >
//                 {isLoading ? (
//                     <>
//                         <span className="loading loading-spinner loading-sm"></span>
//                         <span>Refreshing...</span>
//                     </>
//                 ) : (
//                     <>
//                         <RefreshCw className="h-5 w-5"/>
//                         <span>Refresh</span>
//                     </>
//                 )}
//             </button>
//         </div>
//       </header>

//       {/* Content Section */}
//       <main className="flex-grow overflow-y-auto p-2 sm:p-4 bg-inputYellow/50">
//         <div className="flex flex-col gap-4 pb-20">
//           {isLoading ? (
//             <div className="text-center py-10">
//               <div className="w-8 h-8 border-4 border-primaryYellow border-t-transparent rounded-full animate-spin mx-auto" />
//               <p className="mt-2 text-gray-600">Loading your shows...</p>
//             </div>
//           ) : filteredShows.length === 0 ? (
//             <div className="flex justify-center items-center py-6">
//                 <div className="flex flex-col items-center gap-3 text-gray-500 bg-white p-6 rounded-xl shadow-sm max-w-md w-full mx-4">
//                     <Calendar className="w-12 h-12 text-yellow-400" />
//                     <p className="text-lg font-medium text-center">No shows found</p>
//                     <p className="text-sm text-center text-gray-400 mb-2">
//                         {searchQuery ? `No results for "${searchQuery}" under the "${activeTab}" tab.` : "Why not create a new show to get started?"}
//                     </p>
//                     {!searchQuery && (
//                     <button
//                         onClick={() => navigate("/seller/sheduleshow")}
//                         className="btn btn-ghost bg-primaryYellow hover:bg-yellow-200 text-black rounded-full gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md w-full max-w-xs"
//                     >
//                         <PlusCircle className="w-5 h-5" />
//                         <span>Create New Show</span>
//                     </button>
//                     )}
//                 </div>
//             </div>
//           ) : (
//             filteredShows.map((show, index) => (
//               <div
//                 key={show._id}
//                 className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
//                 style={{ animationDelay: `${index * 50}ms` }}
//               >
//                 <div className="p-4">
//                   <div className="mb-4">
//                     <div className="truncate px-4 py-3 rounded-lg bg-slate-100 text-slate-800 font-semibold text-center">
//                       {show.title}
//                     </div>
//                   </div>
                  
//                   {/* ENHANCEMENT: This layout stacks on mobile/tablet and goes side-by-side on large screens (lg) */}
//                   <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
//                     {/* Left section: Status and Time */}
//                     <div className="flex items-center gap-3 flex-grow">
//                       <span className={`badge ${getBadgeColor(show.showStatus)} border-none shadow-sm font-bold text-white text-xs px-3 py-3`}>
//                         {show.showStatus}
//                       </span>
//                       <div className="flex items-center gap-2 text-gray-600 text-sm">
//                         <Clock className="w-4 h-4 flex-shrink-0" />
//                         <span className="font-medium">{formatScheduledDateTimeLocal(show?.scheduledAt)}</span>
//                       </div>
//                     </div>
                    
//                     {/* Right section: Action buttons with improved responsiveness */}
//                     {(show.showStatus === "created" || show.showStatus === "live") && (
//                       <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
//                         <button
//                           disabled={copiedId === show._id}
//                           onClick={() => handleCopyUrl(show._id)}
//                           className={`btn btn-sm btn-outline rounded-full ${copiedId === show._id ? "bg-green-100 border-green-300" : ""}`}
//                         >
//                           {copiedId === show._id ? (
//                             <CheckCircle className="w-4 h-4 text-green-600" />
//                           ) : (
//                             <Copy className="w-4 h-4" />
//                           )}
//                           <span className="hidden sm:inline">{copiedId === show._id ? "Copied!" : "URL"}</span>
//                         </button>

//                         <button
//                           className="btn btn-sm btn-outline rounded-full"
//                           onClick={() => handleEditProductsTagged(show._id)}
//                         >
//                             <Edit className="w-4 h-4" />
//                             <span className="hidden sm:inline">Tag Products</span>
//                         </button>
                        
//                         <button
//                           className="btn btn-sm btn-outline rounded-full mt-4"
//                           onClick={() => handleEdit(show._id)}
//                         >
//                           <Edit className="w-4 h-4" />
//                           <span className="hidden sm:inline ml-2">Edit Show</span>
//                         </button>
                        
//                         <button
//                           className="btn btn-sm btn-neutral text-white rounded-full"
//                           onClick={() => handleOpenShow(show._id)}
//                         >
//                           Open Show
//                         </button>
                        
//                         <button
//                           className="btn btn-sm btn-error btn-outline rounded-full"
//                           onClick={() => handleCancelShow(show._id)}
//                         >
//                           <XCircle className="w-4 h-4" />
//                           <span className="hidden sm:inline">Cancel</span>
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </main>

//       {/* Modals */}
//       {/* <EditLiveStreamModal
//         isOpen={showEditModal}
//         onClose={handleCloseEditModal} // Simplified onClose
//         streamId={selectedShowId}
//       /> */}

//       {cancelShowModalOpen && (
//         <div className="modal modal-open">
//           <div className="modal-box bg-white shadow-lg">
//             <h3 className="font-bold text-lg text-gray-800">Confirm Cancellation</h3>
//             <p className="py-4 text-gray-600">
//               Are you sure you want to cancel this show? This action cannot be undone.
//             </p>
//             <div className="modal-action">
//               <button
//                 className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 border-none"
//                 onClick={() => setCancelShowModalOpen(false)}
//               >
//                 No, Keep It
//               </button>
//               <button
//                 className="btn bg-red-500 hover:bg-red-600 text-white border-none"
//                 onClick={confirmCancelShow}
//               >
//                 Yes, Cancel Show
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Embedded CSS for animations */}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.4s ease-out forwards;
//         }
//         /* Custom scrollbar for tabs on Webkit browsers */
//         .overflow-x-auto::-webkit-scrollbar {
//             height: 4px;
//         }
//         .overflow-x-auto::-webkit-scrollbar-thumb {
//             background-color: #fBBF24; /* primaryYellow */
//             border-radius: 10px;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default ViewScheduledShows;


import { useState, useEffect, useCallback } from "react";
import {
  Edit,
  PlusCircle,
  Sparkles,
  Calendar,
  Activity,
  XCircle,
  CheckCircle,
  Clock,
  Copy,
  Search,
  RefreshCw,
  X,
  List, 
  Grip, 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EditLiveStreamModal from "../LiveStream/EditShowForm.jsx"; // This component is imported but not used in the provided JSX.
import { toast } from "react-toastify";
import { CANCEL_SHOW, GET_MY_SHOWS } from "../../api/apiDetails.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { formatScheduledDateTimeLocal } from "../../../utils/dateUtils.js";

const ViewScheduledShows = () => {
  // Define color constants
  const blackLight = "rgba(30, 30, 30, 1)";
  const newYellow = "rgba(247, 206, 69, 1)";
  const liveRed = "#e74c3c";
  const productGreen = "#2ecc71";
  const primaryWhite = "#ffffee";
  const whiteLight = "rgba(250, 250, 250, 1)";

  const [shows, setShows] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [cancelShowModalOpen, setCancelShowModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isGridView, setIsGridView] = useState(true); 
   const navigate = useNavigate();

   const fetchShows = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(GET_MY_SHOWS);
      setShows(data.data);
    } catch (error) {
      console.error("Error fetching shows:", error);
      toast.error("Failed to fetch shows.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const handleRefresh = () => {
    fetchShows();
  };

  const handleUpdateSuccess = useCallback(() => {
    fetchShows();
  }, [fetchShows]);

  const handleCloseEditModal = useCallback(
    (success) => {
      setShowEditModal(false);
      setSelectedShowId(null);
      if (success) {
        handleUpdateSuccess();
      }
    },
    [handleUpdateSuccess]
  );

  const tabs = [
    {
      id: "all",
      label: "All Shows",
      icon: <Sparkles className="w-4 h-4" />,
      count: shows.length,
    },
    {
      id: "created",
      label: "Scheduled",
      icon: <Calendar className="w-4 h-4" />,
      count: shows.filter((s) => s.showStatus === "created").length,
    },
    {
      id: "live",
      label: "Live Now",
      icon: <Activity className="w-4 h-4" />,
      count: shows.filter((s) => s.showStatus === "live").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      icon: <XCircle className="w-4 h-4" />,
      count: shows.filter((s) => s.showStatus === "cancelled").length,
    },
    {
      id: "ended",
      label: "Completed",
      icon: <CheckCircle className="w-4 h-4" />,
      count: shows.filter((s) => s.showStatus === "ended").length,
    },
  ];

  const filteredShows = shows
    .filter((show) =>
      activeTab === "all" ? true : show.showStatus === activeTab
    )
    .filter((show) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        show.title.toLowerCase().includes(searchLower) ||
        (show.description &&
          show.description.toLowerCase().includes(searchLower))
      );
    });

  const getBadgeStyle = (status) => {
    const statusStyles = {
      created: {
        background: newYellow,
        textColor: blackLight,
        border: "none",
      },
      live: {
        background: liveRed,
        textColor: primaryWhite,
        border: "none",
      },
      cancelled: {
        background: "transparent",
        textColor: liveRed,
        border: `1px solid ${liveRed}`,
      },
      ended: {
        background: productGreen,
        textColor: blackLight,
        border: "none",
      },
      UpComing: {
        background: newYellow,
        textColor: blackLight,
        border: "none",
      },
    };
    return (
      statusStyles[status] || {
        background: "transparent",
        textColor: whiteLight,
        border: `1px solid ${whiteLight}`,
      }
    );
  };

  const handleEdit = (showId) => {
    navigate(`/seller/edit-show/${showId}`);
  };

  const handleEditProductsTagged = (showId) => {
    navigate("/seller/edit-tagged-products", { state: showId });
  };

  const handleOpenShow = (showId) => {
    navigate(`/seller/show/${showId}`);
  };

  const handleCopyUrl = async (showId) => {
    if (copiedId === showId) return;

    const url = `${window.location.origin}/user/show/${showId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(showId);
      toast.success("Show URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy URL.");
    }
  };

  const handleCancelShow = (showId) => {
    setSelectedShowId(showId);
    setCancelShowModalOpen(true);
  };

  const confirmCancelShow = async () => {
    if (!selectedShowId) {
      toast.error("No show selected to cancel");
      return;
    }

    try {
      await axiosInstance.patch(`${CANCEL_SHOW}/${selectedShowId}/cancel`);
      setShows((prevShows) =>
        prevShows.map((show) =>
          show._id === selectedShowId
            ? { ...show, showStatus: "cancelled" }
            : show
        )
      );
      toast.success("Show cancelled successfully");
    } catch (error) {
      console.error("Error cancelling show:", error);
      toast.error("Failed to cancel the show");
    } finally {
      setCancelShowModalOpen(false);
      setSelectedShowId(null);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: blackLight, color: primaryWhite }}
    >
      {/* Header Section */}
      <header
        className="sticky top-0 z-20 p-4 border-b"
        style={{
          backgroundColor: blackLight,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: "rgba(247, 206, 69, 0.1)" }}
            >
              <Sparkles className="w-6 h-6" style={{ color: newYellow }} />
            </div>
            <div>
              <h1
                className="text-2xl lg:text-3xl font-bold"
                style={{ color: primaryWhite }}
              >
                Your Shows
              </h1>
              <p className="text-sm" style={{ color: whiteLight }}>
                Manage and monitor your live streams
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate("/seller/sheduleshow")}
              className="btn flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[15px] transition-all duration-300 transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: newYellow, color: blackLight }}
            >
              <PlusCircle className="w-6 h-6" />
              <span>Create Show</span>
            </button>

            <button
              onClick={handleRefresh}
              className="btn flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: primaryWhite,
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Refresh</span>
                </>
              )}
            </button>

            {/* View Toggle Bar */}
            <div
              className="flex rounded-full p-1 overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <button
                onClick={() => setIsGridView(true)}
                className={`px-4 py-2 text-sm rounded-full font-medium transition-colors flex items-center gap-2 ${
                  isGridView ? "shadow-lg" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  color: isGridView ? blackLight : primaryWhite,
                  backgroundColor: isGridView ? newYellow : "transparent",
                }}
              >
                <Grip className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                  !isGridView ? "shadow-lg" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  color: !isGridView ? blackLight : primaryWhite,
                  backgroundColor: !isGridView ? newYellow : "transparent",
                }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mt-4 w-full">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            />
            <input
              type="text"
              placeholder="Search shows by title or description..."
              className="pl-10 pr-10 py-2.5 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 transition-all duration-200 outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: primaryWhite,
                focusRingColor: newYellow,
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                aria-label="Clear search"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <br />

          {/* Enhanced Tabs */}
          <div className="overflow-x-auto">
            <div
              className="flex space-x-2 p-1 rounded-xl w-max min-w-full"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? "shadow-lg transform scale-105"
                      : "opacity-70 hover:opacity-100 hover:scale-102"
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? newYellow : "transparent",
                    color: activeTab === tab.id ? blackLight : primaryWhite,
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor:
                          activeTab === tab.id ? blackLight : newYellow,
                        color: activeTab === tab.id ? primaryWhite : blackLight,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <main className="flex-grow p-2 sm:p-4">
        <div
          className={`${
            isGridView ? "grid grid-cols-1 lg:grid-cols-2" : "flex flex-col"
          } gap-4 pb-20`}
        >
          {isLoading ? (
            <div className="col-span-full text-center py-10">
              <div
                className="w-8 h-8 border-4 rounded-full animate-spin mx-auto"
                style={{
                  borderColor: newYellow,
                  borderTopColor: "transparent",
                }}
              />
              <p className="mt-4" style={{ color: whiteLight }}>
                Loading your shows...
              </p>
            </div>
          ) : filteredShows.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-6">
              <div
                className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg max-w-md w-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <Calendar className="w-12 h-12" style={{ color: newYellow }} />
                <p
                  className="text-xl font-bold text-center"
                  style={{ color: primaryWhite }}
                >
                  No shows found
                </p>
                <p className="text-center mb-2" style={{ color: whiteLight }}>
                  {searchQuery
                    ? `No results for "${searchQuery}" under the "${activeTab}" tab.`
                    : "Why not create a new show to get started?"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate("/seller/sheduleshow")}
                    className="btn flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                    style={{ backgroundColor: newYellow, color: blackLight }}
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Create New Show</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredShows.map((show, index) => {
              const badgeStyle = getBadgeStyle(show.showStatus);
              // Dummy productsCount for demonstration
              const productsCount = show._id.length % 5; // Example: a random count based on show ID length

              return (
                <div
                  key={show._id}
                  className={`rounded-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn ${
                    !isGridView ? "w-full" : ""
                  }`}
                  style={{
                    backgroundColor: "rgba(40,40,40,0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="p-5">
                    {/* Title and Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h3
                        className="text-lg font-bold truncate"
                        style={{ color: primaryWhite }}
                      >
                        {show.title}
                      </h3>

                      <div
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                        style={{
                          backgroundColor: badgeStyle.background,
                          color: badgeStyle.textColor,
                          border: badgeStyle.border,
                        }}
                      >
                        {show.showStatus}
                      </div>
                    </div>

                    {/* Description */}
                    {show.description && (
                      <p
                        className="mb-4 text-sm line-clamp-2"
                        style={{ color: whiteLight }}
                      >
                        {show.description}
                      </p>
                    )}

                    {/* Date and Time */}
                    <div
                      className="flex items-center gap-2 mb-4 text-sm"
                      style={{ color: whiteLight }}
                    >
                      <Clock className="w-4 h-4" style={{ color: newYellow }} />
                      <span>
                        {formatScheduledDateTimeLocal(show?.scheduledAt)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {(show.showStatus === "created" ||
                      show.showStatus === "live") && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={copiedId === show._id}
                          onClick={() => handleCopyUrl(show._id)}
                          className="btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                          style={{
                            backgroundColor:
                              copiedId === show._id
                                ? productGreen
                                : "rgba(255,255,255,0.05)",
                            color:
                              copiedId === show._id ? blackLight : primaryWhite,
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {copiedId === show._id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>
                            {copiedId === show._id ? "Copied!" : "URL"}
                          </span>
                        </button>

                        <button
                          className="btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium relative"
                          onClick={() => handleEditProductsTagged(show._id)}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: primaryWhite,
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Tag Products</span>
                          {/* Notification count */}
                          {productsCount > 0 && (
                            <span
                              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: liveRed,
                                color: primaryWhite,
                              }}
                            >
                              {productsCount}
                            </span>
                          )}
                        </button>

                        <button
                          className="btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                          onClick={() => handleEdit(show._id)}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: primaryWhite,
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>

                        <button
                          className="btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                          onClick={() => handleOpenShow(show._id)}
                          style={{
                            backgroundColor: productGreen,
                            color: blackLight,
                          }}
                        >
                          <Activity className="w-4 h-4" />
                          <span>Go Live</span>
                        </button>

                        <button
                          className="btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                          onClick={() => handleCancelShow(show._id)}
                          style={{
                            backgroundColor: "rgba(231, 76, 60, 0.1)",
                            color: liveRed,
                            border: `1px solid ${liveRed}`,
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Cancel Show Modal */}
      {cancelShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className="w-full max-w-md rounded-xl shadow-2xl"
            style={{
              backgroundColor: "rgba(40,40,40,1)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: primaryWhite,
            }}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="font-bold text-lg">Confirm Cancellation</h3>
              <button
                onClick={() => setCancelShowModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-5 h-5" style={{ color: whiteLight }} />
              </button>
            </div>

            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <p className="text-center">
                Are you sure you want to cancel this show? This action cannot be
                undone.
              </p>
            </div>

            <div className="modal-action justify-center p-4 gap-4">
              <button
                className="btn px-6 py-2 rounded-lg font-medium"
                onClick={() => setCancelShowModalOpen(false)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: primaryWhite,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                No, Keep It
              </button>
              <button
                className="btn px-6 py-2 rounded-lg font-medium"
                onClick={confirmCancelShow}
                style={{
                  backgroundColor: liveRed,
                  color: primaryWhite,
                }}
              >
                Yes, Cancel Show
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Embedded CSS for animations */}
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
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ViewScheduledShows;
