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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EditLiveStreamModal from "../LiveStream/EditShowForm.jsx";
import { toast } from "react-toastify";
import { CANCEL_SHOW, GET_MY_SHOWS, GET_SHOWS_BY_SELLER_ID } from "../../api/apiDetails.js";
import axiosInstance from "../../../utils/axiosInstance.js";
import { formatScheduledDateTimeLocal } from "../../../utils/dateUtils.js";



const ViewScheduledShows = () => {
  const [shows, setShows] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const [cancelShowModalOpen, setCancelShowModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchShows = async () => {
    setIsLoading(true);    
    try {
      const { data } = await axiosInstance.get(GET_MY_SHOWS);

      setShows(data.data);
    } catch (error) {
      console.error("Error fetching shows:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  const handleRefresh = () => {
    fetchShows();
  };

  const handleUpdateSuccess = async () => {
    await fetchShows();
  };

  const handleCloseEditModal = useCallback((success) => {
    setShowEditModal(false);
    setSelectedShowId(null);
    if (success === true) { 
      handleUpdateSuccess();
    }
  }, [handleUpdateSuccess]);

  const tabs = [
    { id: "all", icon: <Sparkles className="w-4 h-4" /> },
    { id: "created", icon: <Calendar className="w-4 h-4" /> },
    { id: "live", icon: <Activity className="w-4 h-4" /> },
    { id: "cancelled", icon: <XCircle className="w-4 h-4" /> },
    { id: "ended", icon: <CheckCircle className="w-4 h-4" /> },
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

  const formatDateTime = (dateString, timeString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const date = new Date(dateString).toLocaleDateString("en-IN", options);
    return `${date} at ${timeString}`;
  };

  const getBadgeColor = (status) => {
    const statusColors = {
      created: "badge-success",
      live: "badge-success",
      cancelled: "badge-error",
      ended: "badge-warning",
      UpComing: "badge-primary",
    };
    return statusColors[status] || "badge-ghost";
  };

  const handleEdit = (showId) => {
    setSelectedShowId(showId);
    setShowEditModal(true);
  };

  const handleEditProductsTagged = (showId) => {
    navigate('/seller/edit-tagged-products', { state: showId});
  }

  const handleOpenShow = (showId) => {
    navigate(`/seller/show/${showId}`);
  };

  const handleGoLive = (showId) => {
    navigate(`/seller/stream/${showId}`);
  };

  const handleCopyUrl = async (showId) => {
    if (isCopied) return;
  
    const url = `${window.location.origin}/user/show/${showId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  

  const handleCancelShow = (showId) => {
    setSelectedShowId(showId);
    setCancelShowModalOpen(true);
  };

  const confirmCancelShow = async () => {
    try {
      const { data } = await axiosInstance.patch(`${CANCEL_SHOW}/${selectedShowId}/cancel`,{});
      if(data.status){
        setShows(
          shows.map((show) =>
            show._id === selectedShowId
              ? { ...show, showStatus: "cancelled" }
              : show
          )
        );
        toast.success("Show cancelled");
      }
    } catch (error) {
      console.error("Error cancelling show:", error);
    } finally{
      setCancelShowModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white rounded-xl shadow-2xl relative overflow-hidden">
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50 animate-pulse" />
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />

    {/* Header Section */}
    <div className="sticky top-0 z-10 bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-500">Your Shows</h1>
          <Sparkles className="w-6 h-6 text-primaryYellow animate-pulse" />
        </div>
        <button
          onClick={() => navigate("/seller/sheduleshow")}
          className="btn btn-warning bg-primaryYellow hover:bg-yellow-400 rounded-3xl gap-2 transition-all duration-300 hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Create Show</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto py-2 mb-2 bg-inputYellow rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap
              transition-all duration-300 transform hover:scale-105 flex-shrink-0
              ${
                activeTab === tab.id
                  ? "bg-primaryYellow text-black shadow-md"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-50"
              }
            `}
          >
            {tab.icon}
            <span className="capitalize">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* Search and Refresh Section */}
<div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
  <div className="relative flex-grow">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 text-gray-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
    </div>
    <input
      type="text"
      placeholder="Search shows by title or description..."
      className="pl-10 pr-4 py-2.5 w-full border bg-inputYellow rounded-full shadow-sm focus:ring-2 focus:ring-amber-100 focus:border-amber-100 transition-all duration-200 outline-none"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    {searchQuery && (
      <button 
        onClick={() => setSearchQuery('')}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    )}
  </div>
  
  <button
    onClick={handleRefresh}
    className="btn btn-outline flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all sm:min-w-[120px] sm:max-w-[150px]"
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <span className="loading loading-spinner loading-sm"></span>
        <span className="whitespace-nowrap">Refreshing...</span>
      </>
    ) : (
      <>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span className="whitespace-nowrap">Refresh</span>
      </>
    )}
  </button>
</div>
    </div>

    {/* Content Section */}
    <div className="flex-grow overflow-y-auto p-3 bg-inputYellow">
      <div className="flex flex-col gap-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-4 border-primaryYellow border-t-transparent rounded-full animate-spin" />
              <span>Loading shows...</span>
            </div>
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="flex justify-center items-center py-6">
            <div className="flex flex-col items-center gap-3 text-gray-500 bg-gray-50 p-6 rounded-xl shadow-sm max-w-md w-full">
              <Calendar className="w-12 h-12 text-yellow-400" />
              <p className="text-lg font-medium text-center">No shows found matching your criteria</p>
              <p className="text-sm text-center text-gray-400 mb-2">
                {searchQuery ? `No results for "${searchQuery}"` : "Create your first show to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate("/seller/sheduleshow")}
                  className="btn btn-ghost bg-primaryYellow hover:bg-yellow-200 text-black rounded-3xl gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md w-full"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Create New Show</span>
                </button>
              )}
            </div>
          </div>
        ) : (
            filteredShows.map((show, index) => (
              <div
                key={show._id}
                className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="p-4">
                  {/* Show Title with improved styling */}
                  <div className="mb-4">
                    <div className="truncate px-4 py-3 rounded-xl bg-slate-100 text-center text-black font-semibold shadow-sm">
                      {show.title}
                    </div>
                  </div>
            
                  {/* Show details section with improved layout */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Left section: Status and Time */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-grow">
                      <span
                        className={`badge ${getBadgeColor(
                          show.showStatus
                        )} border-none shadow-md font-bold text-amber-100 text-xs px-4 py-3 flex-shrink-0`}
                      >
                        {show.showStatus}
                      </span>
            
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap font-medium">{formatScheduledDateTimeLocal(show?.scheduledAt)}</span>
                      </div>
                    </div>
            
                    {/* Right section: Action buttons with improved layout */}
                    {(show.showStatus === "created" || show.showStatus === "live") && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 justify-start sm:justify-end">
                        <button
                          disabled={isCopied}
                          onClick={() => handleCopyUrl(show._id)}
                          className={`btn btn-sm ${
                            isCopied ? "bg-green-100" : "bg-primaryYellow"
                          } text-primaryBlack border-none rounded-full px-4 hover:bg-slate-200 flex-shrink-0 min-w-20`}
                        >
                          {isCopied ? (
                            <span className="text-green-700 font-medium">Copied!</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Copy className="w-4 h-4" />
                              <span className="hidden sm:inline">URL</span>
                            </div>
                          )}
                        </button>

                        <button
                          className="btn btn-sm bg-primaryYellow text-primaryBlack border-none rounded-full px-4 hover:bg-slate-200 flex-shrink-0 min-w-20"
                          onClick={() => handleEditProductsTagged(show._id)}
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Tag Products</span>
                          </div>
                        </button>
            
                        <button
                          className="btn btn-sm bg-primaryYellow text-primaryBlack border-none rounded-full px-4 hover:bg-slate-200 flex-shrink-0 min-w-20"
                          onClick={() => handleEdit(show._id)}
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Show</span>
                          </div>
                        </button>
                        
                        <button
                          className="btn btn-sm bg-primaryBlack text-primaryYellow border-none rounded-full px-4 hover:bg-gray-800 flex-shrink-0"
                          onClick={() => handleOpenShow(show._id)}
                          // disabled
                        >
                          <span>Open Show</span>
                        </button>

                        <button
                          className="btn btn-sm bg-primaryBlack text-primaryYellow border-none rounded-full px-4 hover:bg-gray-800 flex-shrink-0"
                          onClick={() => handleGoLive(show._id)}
                          // disabled
                        >
                          <span>Go Live</span>
                        </button>
                        
                        <button
                          className="btn btn-sm bg-primaryBlack text-primaryYellow hover:bg-red-600 rounded-full px-4 border-none flex-shrink-0 min-w-1"
                          onClick={() => handleCancelShow(show._id)}
                        >
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Cancel</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <EditLiveStreamModal
        isOpen={showEditModal}
        onClose={(success) => {
          setShowEditModal(false);
          setSelectedShowId(null);
          if (success) handleUpdateSuccess();
        }}
        streamId={selectedShowId}
      />

      {cancelShowModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-white shadow-lg">
            <h3 className="font-bold text-lg text-gray-800">
              Confirm Cancellation
            </h3>
            <p className="py-3 text-gray-600">
              Are you sure you want to cancel this show?
            </p>
            <div className="modal-action">
              <button
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 border-none"
                onClick={() => setCancelShowModalOpen(false)}
              >
                No
              </button>
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white border-none"
                onClick={confirmCancelShow}
              >
                Yes, Cancel Show
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default ViewScheduledShows;