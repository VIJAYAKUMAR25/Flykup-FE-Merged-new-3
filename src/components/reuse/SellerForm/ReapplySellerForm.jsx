import React, { useState, useEffect } from "react";
import {
  ShoppingBag, User, AlertTriangle, ArrowRight, 
  XCircle, RefreshCw, ChevronRight, Building, Video,
Radio, Package,Hammer, Film, ImageIcon, Store
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Document from '../../../assets/docs/Flykup_GST_Exemption_Social_Seller.pdf';
import { FaArrowCircleLeft } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
const ReapplySellerFormNew = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const {user }= useAuth();
  console.log(user, "userData");

 
  // Check seller status when userData updates
  useEffect(() => {
   
      if (user.sellerInfo?.approvalStatus === "rejected") {
        setShowRejectionModal(true);
      }
    
  }, []);

  const handleReapply = () => {
    setShowRejectionModal(false);
    // Add any additional reapplication logic here
  };

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    navigate("/user");
  };

  const handleSellerTypeSelect = (type) => setSelectedType(type);

  const proceedToRegistration = () => {
    if (selectedType === "brand") {
      navigate("/user/reapply-brand");
    } else {
      navigate("/user/reapply-social");
    }
  };

  return (
    <div className="min-h-screen w-full bg-newYellow mb-10">
      <div className="max-w-6xl mx-auto h-full px-4 py-6">
        <div className="flex justify-start mb-6">
          <Link to="/" className="btn btn-ghost btn-sm bg-white/30 backdrop-blur-md text-gray-800 border border-white/20 hover:bg-white/40 transition-all">
            <FaArrowCircleLeft size={18} /> <span className="ml-1">Back</span>
          </Link>
        </div>

        <div className="text-center mb-3 animate-fade-in">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Welcome to <span className="text-gray-800">Flykup</span>
            </h1>
            <div className="h-1 w-40 bg-white/50 mx-auto mt-2"></div>
            <p className="text-white/90 mt-1 text-lg font-medium">One Platform. Every Way to Sell.</p>
          </div>
        </div>

        <div className="w-full bg-yellow-400 py-3 overflow-hidden my-3 rounded-lg border-l-4 border-red-500">
          <div className="whitespace-nowrap animate-marquee inline-block">
            <span className="px-4 font-semibold text-gray-800">
              ⚠️ ATTENTION: New "Quality Seller" field is now available! Please fill out this form to access this new feature. We apologize for any inconvenience.
            </span>
          </div>
        </div>

        {!selectedType ? (
          <div className="text-center animate-fade-in w-full">
            
            <div className="flex flex-col lg:flex-row gap-6 justify-center w-full">
              {/* Brand & Store Seller Card */}
              <div 
                className={`card w-full lg:w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-900 hover:to-gray-800 text-white shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-500 overflow-hidden border border-gray-700 ${
                  hoveredCard === "brand" ? "transform -translate-y-2 border-amber-400" : ""
                }`}
                onClick={() => handleSellerTypeSelect("brand")}
                onMouseEnter={() => setHoveredCard("brand")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 to-amber-300"></div>
                <div className="card-body p-6 lg:p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-amber-400 bg-opacity-20 rounded-full mr-4">
                      <Building className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="card-title text-2xl">Brand & Store Seller</h2>
                      <p className="text-amber-300 text-sm">For Established Brands, Retailers & Store Owners</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Sell through multiple channels on one unified platform:</p>
                      
                      <ul className="space-y-3 mt-3">
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                            <Video className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-gray-300">Live Shopping</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                            <Hammer className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-gray-300">Auctions</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                            <Film className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-gray-300">Shoppable Videos</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-gray-300">Image Listings</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                            <Store className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-gray-300">Digital Storefront</span>
                        </li>
                      </ul>
                    </div>
                  
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-2">
                    <h3 className="font-medium text-amber-400 mb-2">Best For</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-gray-700 text-amber-100 px-3 py-1 rounded-full text-xs">D2C Brands</span>
                      <span className="bg-gray-700 text-amber-100 px-3 py-1 rounded-full text-xs">Retailers</span>
                      <span className="bg-gray-700 text-amber-100 px-3 py-1 rounded-full text-xs">Wholesalers</span>
                      <span className="bg-gray-700 text-amber-100 px-3 py-1 rounded-full text-xs">Store Owners</span>
                    </div>
                  </div>
                  
           
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-amber-400 mb-2">Requirements</h3>
                    <p className="text-gray-300 text-sm">GST Registration & Business Verification</p>
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-outline btn-ghost border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white w-full group">
                      <span>Register as Brand Seller</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Seller Card */}
              <div 
                className={`card w-full lg:w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-900 hover:to-gray-800 text-white shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-500 overflow-hidden border border-gray-700 ${
                  hoveredCard === "social" ? "transform -translate-y-2 border-purple-400" : ""
                }`}
                onClick={() => handleSellerTypeSelect("social")}
                onMouseEnter={() => setHoveredCard("social")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <div className="card-body p-6 lg:p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-400 bg-opacity-20 rounded-full mr-4">
                      <User className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="card-title text-2xl">Social Seller</h2>
                      <p className="text-purple-300 text-sm">For Creators, Influencers & Dropshippers</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                      
                      <p className="text-gray-400 text-sm">Turn your audience into customers with:</p>
                      
                      <ul className="space-y-3 mt-3">
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                            <Video className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-gray-300">Live Selling</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                            <ShoppingBag className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-gray-300">Shoppable Videos</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                            <Radio className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-gray-300">Instagram & WhatsApp Selling</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                            <Package className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-gray-300">Dropshipping</span>
                        </li>
                      </ul>
                    </div>
                  
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-2">
                    <h3 className="font-medium text-purple-400 mb-2">Best For</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-gray-700 text-purple-100 px-3 py-1 rounded-full text-xs">Influencers</span>
                      <span className="bg-gray-700 text-purple-100 px-3 py-1 rounded-full text-xs">Content Creators</span>
                      <span className="bg-gray-700 text-purple-100 px-3 py-1 rounded-full text-xs">New Entrepreneurs</span>
                      <span className="bg-gray-700 text-purple-100 px-3 py-1 rounded-full text-xs">Resellers</span>
                    </div>
                  </div>
                  
             
                  
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-purple-400 mb-2">Requirements</h3>
                    <p className="text-gray-300 text-sm">Social Media Verification or Identity Proof</p>
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-outline w-full group border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all">
                      <span>Register as Social Seller</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          
          </div>
        ) : (
          <div className="animate-fade-in bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-4xl mt-4 mx-auto border border-gray-700">
            <div className="flex items-center mb-6">
              <div className={`p-3 ${selectedType === 'brand' ? 'bg-amber-400' : 'bg-purple-400'} bg-opacity-20 rounded-full mr-4`}>
                <AlertTriangle className={`w-8 h-8 ${selectedType === 'brand' ? 'text-amber-400' : 'text-purple-400'}`} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                GST Exemption Available
              </h2>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
              <div className="text-gray-300">
                <p className="mb-4">
                  {selectedType === 'brand' 
                    ? "If you don't have a GST, you can still proceed as a Brand Seller. Please download and fill out the required form to complete the verification process and get prepared for the upcoming steps." 
                    : "If you don't have a GST, you can still proceed as a Social Seller. Please download and fill out the required form to complete the verification process and get prepared for the upcoming steps."}
                </p>
                <a href={Document} download className={`flex items-center bg-gray-800 p-3 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors`}>
                  <svg className={`w-5 h-5 ${selectedType === 'brand' ? 'text-amber-300' : 'text-purple-400'} mr-3`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <div>
                    <span className="text-white">GST Exemption Declaration Form</span>
                    <p className="text-xs text-gray-400">Required for non-GST registered sellers</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <button 
                className="btn btn-outline text-gray-300 border-gray-600 hover:bg-gray-700 order-2 sm:order-1"
                onClick={() => setSelectedType(null)}
              >
                Go Back
              </button>
              <button 
                className={`btn ${selectedType === 'brand' ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-purple-600 hover:bg-purple-700 border-purple-700'} text-white order-1 sm:order-2 group`}
                onClick={proceedToRegistration}
              >
                <span>
                  Proceed to Registration
                </span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-slide-up">
            <div className="relative p-6">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-400 rounded-t-2xl" />

              <div className="flex flex-col items-center space-y-6 pt-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-red-100 rounded-full animate-bounce delay-100" />
                  </div>
                  <div className="absolute -bottom-1 -left-1">
                    <div className="w-4 h-4 bg-red-100 rounded-full animate-bounce delay-200" />
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">
                    We Cannot Proceed Yet
                  </h2>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-gray-600">
                      {user?.sellerInfo?.rejectedReason ||
                        "Your seller application has been rejected. Please update your information and try again."}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Don't worry! You can address these points and try again.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3 mt-4">
                  <button
                    onClick={handleReapply}
                    className="btn btn-success text-slate-800 gap-2 group hover:scale-105 transform transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Update & Reapply
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleCloseRejectionModal}
                    className="btn btn-ghost bg-slate-100 text-gray-600 hover:bg-gray-100"
                  >
                    Review Later
                  </button>
                </div>

                <div className="text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <p>
                    Many successful applications were approved on their second
                    attempt!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReapplySellerFormNew;