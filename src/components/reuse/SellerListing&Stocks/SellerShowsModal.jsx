import React, { useEffect, useState } from "react";
import { Music, CheckCircle, XCircle, RefreshCw, Calendar, Tag, Film, Radio } from "lucide-react";
import { backendurl } from "../../../../config";
import { GET_SHOWS_BY_SELLER_ID } from "../../api/apiDetails";
import axiosInstance from "../../../utils/axiosInstance";


const SellerShowsModal = ({ isOpen, setIsOpen, selectedProductIds ,setSelectedProducts}) => {
  const [userData, setUserData] = useState(null);
  const [showsData, setShowsData] = useState([]);
  const [selectedShows, setSelectedShows] = useState({});
  const [loading, setLoading] = useState(true);
  const [animateModal, setAnimateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  
  // Fetch user data from localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("userData"));
    if (data) {
      setUserData(data);
    }
    setLoading(false);
  }, []);

  // Animation timing effects
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateModal(true), 50);
    } else {
      setAnimateModal(false);
    }
  }, [isOpen]);

  // Fetch shows data when modal opens
  useEffect(() => {
    if (isOpen && userData?.sellerInfo?._id) {
      const fetchShows = async () => {
        try {


          const { result } = await axiosInstance.get(GET_SHOWS_BY_SELLER_ID);

            const filteredShows = result.data.filter(show => 
              show.showStatus === "created" || show.showStatus === "live"
            );
            setShowsData(filteredShows);
            console.log("Fetched Shows Data:", filteredShows);

        } catch (error) {
          console.error("Error fetching shows data:", error);
          setShowsData([]);
        }
      };

      fetchShows();
    }
  }, [isOpen, userData]);

  // Handle checkbox selection
  const handleCheckboxChange = (show) => {
    setSelectedShows((prev) => {
      const updated = { ...prev };
      if (updated[show._id]) {
        delete updated[show._id]; // Uncheck removes it
      } else {
        updated[show._id] = {
          showId: show._id,
          streamName: show.streamName,
          title: show.title,
        };
      }
      console.log("Selected Shows:", Object.values(updated));
      return updated;
    });
  };


  const handleAddToShow = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get array of selected show objects
      const taggedShows = Object.values(selectedShows).map(show => ({
        showId: show.showId,
        streamName: show.streamName,
        title: show.title
      }));
  
      // Get array of selected product objects
      const taggedProducts = selectedProductIds.map(product => ({
        productId: product.productId,
        title: product.title
      }));
  
      const response = await fetch(`${backendurl}/api/shows/tag`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          taggedShows,
          taggedProducts,
          sellerId: userData.sellerInfo._id
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to tag products to shows');
      }
  
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Operation failed');
      }
  
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setError(null);
        setSelectedShows({});
        setSelectedProducts([]);
      }, 1500);
    } catch (error) {
      console.error('Add to shows failed:', error);
      setError(error.message || 'Failed to add products to shows');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSelectAll = () => {
    if (Object.keys(selectedShows).length === showsData.length) {
      setSelectedShows({});
    } else {
      const allShows = {};
      showsData.forEach(show => {
        allShows[show._id] = {
          showId: show._id,
          streamName: show.streamName,
          title: show.title,
        };
      });
      setSelectedShows(allShows);
    }
  };

  // Determine if all shows are selected
  const areAllSelected = showsData.length > 0 && Object.keys(selectedShows).length === showsData.length;

  if (!isOpen) return null; // Prevents rendering when modal is closed

  const getStatusColor = (status) => {
    switch (status) {
      case "created": return "bg-blue-100 text-blue-800";
      case "live": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "created": return <Film className="w-4 h-4" />;
      case "live": return <Radio className="w-4 h-4 animate-pulse" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };


 
  return (
    <div className={`fixed min-h-screen  inset-0 flex items-center justify-center bg-black bg-opacity-0 z-40 transition-all duration-300 ${animateModal ? 'bg-opacity-50' : ''}`}>
      <div 
        className={`bg-white rounded-xl mt-10 max-h-[90vh] shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out 
          ${animateModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
              Available Shows
            </h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:bg-gray-100"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="mt-4 text-gray-600 font-medium">Loading your shows...</p>
            </div>
          ) : showsData.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No available shows found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm text-gray-600">
                  {Object.keys(selectedShows).length} of {showsData.length} selected Shows
                </span>
                <button 
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                >
                  <label className="swap swap-rotate mr-2">
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      onChange={handleSelectAll}
                      className="hidden"
                    />
                    <div className="swap-off">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-md"></div>
                    </div>
                    <div className="swap-on">
                      <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center text-white">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </label>
                  {areAllSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              {error && (
                    <div className=" p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        ⚠️ {error}
                    </div>
                    )}

                    {success && (
                    <div className=" p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                        ✅ Products added to shows successfully!
                    </div>
                    )}

              <div className=" space-y-1 max-h-80 overflow-y-auto pr-1">
                {showsData.map((show, index) => (
                  <div 
                    key={show._id} 
                    className="border border-gray-200 px-3 p-1 rounded-lg hover:shadow-md transition-all duration-200 
                    transform hover:translate-y-px bg-white"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center ">
                          <span className={`text-xs px-2  rounded-full flex items-center ${getStatusColor(show.showStatus)}`}>
                            {getStatusIcon(show.showStatus)}
                            <span className="ml-1 capitalize">{show.showStatus}</span>
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800  line-clamp-1">{show.title}</h3>
                        {show.streamName && (
                          <p className="text-xs text-gray-500 mb-1">Stream: {show.streamName}</p>
                        )}
                      </div>
                      <label className="swap swap-rotate">
                        <input
                          type="checkbox"
                          checked={!!selectedShows[show._id]}
                          onChange={() => handleCheckboxChange(show)}
                          className="hidden"
                        />
                        <div className="swap-off">
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-md"></div>
                        </div>
                        <div className="swap-on">
                          <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center text-white">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
                
              </div>
              <div className="flex w-full mt-1 space-x-1">
            <button 
              onClick={() => setIsOpen(false)} 
              className="btn btn-sm btn-ghost text-slate-400 rounded-full bg-slate-200 w-[50%] transition-all duration-200 hover:scale-105"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Close
            </button>
            {Object.keys(selectedShows).length > 0 && (
              <button 
              onClick={handleAddToShow}
              className="btn btn-sm btn-warning rounded-full bg-primaryYellow w-[50%] transition-all duration-200 hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Add To Shows
                  {/* <font className="text-success">({Object.keys(selectedShows).length})</font> */}
                </>
              )}
            </button>
            )}
          </div>
            </>
          )}


          
        </div>
      </div>
    </div>
  );
};

export default SellerShowsModal;