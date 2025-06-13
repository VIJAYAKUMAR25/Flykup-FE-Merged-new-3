// RightDrawerContent.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'; 
import { X } from 'lucide-react';
import Profile from '../../../assets/images/profile.png';
import Homeicon from '../../../assets/images/home.png'; 
import Reels from '../../../assets/images/video-player.png';   
import Logout from '../../../assets/images/logout.png'; 
import ViewProducts from '../../../assets/images/viewproducts.png'; 
import { useNavigate } from 'react-router-dom';

// -----------------------------

const RightDrawerContent = ({ isOpen, onClose, user, logout }) => {

  const [activeTab, setActiveTab] = useState('user'); 
  const navigate = useNavigate();
  const getInitials = () => {
    return user?.userName ? user.userName.charAt(0).toUpperCase() : "U";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            onClick={onClose} 
          />

          {/* Drawer Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-80 bg-primaryBlack z-50 shadow-xl" 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeIn" }} 
          >
            {/* Sticky Close Button Area */}
            <div className="sticky top-0 bg-primaryBlack p-4 z-10">
              <button
                onClick={onClose} // Use onClose prop
                className="absolute top-2 right-2 p-1 bg-slate-300 rounded-full hover:bg-primaryYellow transition-colors duration-200 group" // Added group for potential parent hover effects if needed later
              >
                <X className="h-6 w-6 text-black group-hover:text-black" /> 
              </button>
            </div>

            <div className="h-[calc(100vh-4rem)] overflow-y-auto mt-1 px-4 pb-4 custom-scrollbar"> 
              <div className="p-4 border-b border-stone-700 flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  
                >
                  <div className="avatar placeholder">
                    <div className="avatar ring-0">
                      {user.profileURL?.azureUrl ? (
                        <div className="md:w-10 w-auto rounded-full">
                          <img
                            src={user.profileURL?.azureUrl || "/placeholder.svg"}
                            alt="Profile"
                            className="object-cover w-full h-full rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4">
                        <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold border-2 border-yellow-400">
                          <span className="text-lg">{getInitials()}</span>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{user?.userName || "User"}</h3>
                    <p className="text-sm text-stone-400">{user?.emailId || "email@example.com"}</p>
                  </div>
                </div>
              </div>

              {/* User/Seller Tabs */}
              <div className="relative p-1 bg-primaryYellow rounded-xl shadow-lg mb-4">
                <div className="flex gap-1 relative z-10">
                  {/* User Tab Button */}
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 transform ${ 
                        activeTab === "user"
                        ? "bg-primaryWhite text-black shadow-lg scale-105" 
                        : "text-primaryBlack hover:bg-white/30 hover:scale-105"
                      }`}
                    onClick={() => setActiveTab("user")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <img src={Profile} width={20} height={20} alt="User Icon" /> 
                      User
                    </div>
                  </button>

                  {/* Seller Tab Button */}
                  <button
                     className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 transform ${ 
                        activeTab === "seller"
                        ? "bg-primaryWhite text-black shadow-lg scale-105" 
                        : "text-primaryBlack hover:bg-white/30 hover:scale-105"
                      }`}
                    onClick={() => setActiveTab("seller")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${ 
                          activeTab === "seller" ? "scale-110" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2} 
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Seller
                    </div>
                  </button>
                </div>
              </div>

              {/* Menu List */}
              <ul
                className="menu w-full rounded-box gap-2"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              >
                {activeTab === "user" ? (
                  <>
                    {/* User Menu Items */}
                    <li className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-500 cursor-pointer group"> {/* Adjusted hover effects, rounding */}
                      <Link to={"/profile/"} className="flex items-center gap-4 p-3" onClick={onClose}> {/* Added onClose, items-center, padding */}
                        <div className="bg-primaryYellow p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12"> {/* Adjusted padding */}
                          <img
                            src={Homeicon}
                            alt="Home"
                            width={20}
                            height={20}
                            className="transform transition-transform group-hover:scale-110" // Used group-hover
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Home
                        </p>
                      </Link>
                    </li>

                     {/* Example: Shows (if uncommented) */}
                     <li className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-500 cursor-pointer group">
                       <Link to={"/profile/shows"} className="flex items-center gap-4 p-3" onClick={onClose}>
                         <div className="bg-primaryYellow p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                           <img src={Reels} alt="Shows" width={20} height={20} className="transform transition-transform group-hover:scale-110" />
                         </div>
                         <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">Shows</p>
                       </Link>
                     </li>
                    
                    {/* Logout Button (User) */}
                    <li
                      onClick={() => {
                        logout(); 

                      }}
                      className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-red-600 cursor-pointer group" // Changed hover color for logout
                    >
                    
                      <div className="flex items-center gap-4 p-3">
                        <div className="bg-error p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12"> {/* Use actual error color, adjusted padding */}
                          <img
                            src={Logout}
                            alt="Logout"
                            width={20} // Adjusted size for consistency
                            height={20}
                            className="transform transition-transform group-hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Logout
                        </p>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    {/* Seller Menu Items */}
                    <li className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-500 cursor-pointer group">
                      <Link
                        to="/seller/allshows"
                        className="flex items-center gap-4 p-3"
                        onClick={onClose} 
                      >
                        <div className="bg-primaryYellow p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Reels} 
                            alt="Your Shows"
                            width={20}
                            height={20}
                            className="transform transition-transform group-hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Your Shows
                        </p>
                      </Link>
                    </li>
                    <li className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-blue-500 cursor-pointer group">
                      <Link
                        to="/seller/productlisting"
                        className="flex items-center gap-4 p-3"
                        onClick={onClose} 
                      >
                        <div className="bg-primaryYellow p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={ViewProducts}
                            alt="Product Listing"
                            width={20}
                            height={20}
                            className="transform transition-transform group-hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Product Listing
                        </p>
                      </Link>
                    </li>

                    <li
                      onClick={() => {
                        logout();
                      }}
                      className="bg-primaryBlack rounded-lg transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-red-600 cursor-pointer group" // Changed hover color for logout
                    >
                      <div className="flex items-center gap-4 p-3"> 
                        <div className="bg-error p-1.5 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Logout}
                            alt="Logout"
                            width={20}
                            height={20}
                            className="transform transition-transform group-hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Logout
                        </p>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div> 
          </motion.div> 
        </>
      )}
    </AnimatePresence>
  );
};

export default RightDrawerContent;