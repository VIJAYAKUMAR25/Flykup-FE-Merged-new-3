// SellerNavbar.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // Ensure this path is correct

import { motion, AnimatePresence } from "framer-motion";
import { FiMenu as Menu, FiX as X ,FiHome} from "react-icons/fi"; // Removed FiUser as it's not used here anymore
import Logo from "../../../assets/images/Logo-Flikup.png"; // Ensure this path is correct
import MenuContent from "./MenuContent";
// Removed: import RightDrawerContent from "./RightDrawerContent";

const SIDEBAR_WIDTH_EXPANDED = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "5rem";
const MOBILE_BREAKPOINT = 768;

const SellerNavbar = () => {
  // Removed: const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth(); // user object is now primarily for MenuContent
  // Removed: const [showCartModal, setShowCartModal] = useState(false); // If not used

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const checkMobileView = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobileView(mobile);
    if (!mobile && isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
    if (mobile && isSidebarExpanded) {
      setIsSidebarExpanded(false); // Collapse sidebar on mobile if it was expanded
    }
  }, [isMobileDrawerOpen, isSidebarExpanded]); // Added isSidebarExpanded to dependencies

  useEffect(() => {
    window.addEventListener("resize", checkMobileView);
    checkMobileView(); // Initial check
    return () => window.removeEventListener("resize", checkMobileView);
  }, [checkMobileView]);

  useEffect(() => {
    let newSidebarWidth;
    if (isMobileView) {
      newSidebarWidth = '0rem'; // Sidebar is not part of padding in mobile, it's a drawer
    } else {
      newSidebarWidth = isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
    }
    document.documentElement.style.setProperty('--current-sidebar-width', newSidebarWidth);
  }, [isMobileView, isSidebarExpanded]);

  // Removed: const getInitials = () => user?.userName ? user.userName.charAt(0).toUpperCase() : "U";

  const handleMobileItemClick = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full h-16 bg-blackDark flex items-center justify-between px-4 z-40 shadow-md"
        style={{
          paddingLeft: isMobileView ? '0' : `var(--current-sidebar-width)`,
          transition: 'padding-left 0.3s ease-in-out'
        }}
      >
        <div className="flex items-center">
          {isMobileView && (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="text-white mr-4 p-2"
            >
              <Menu size={24} />
            </button>
          )}
          <Link to="/" className="flex items-center"> 
            <img src={Logo} alt="Flikup Logo" className="h-8 md:h-10" />
          </Link>
        </div>

       <div className="flex items-center gap-4 md:gap-6">
          <Link
            to="/user" 
            className="text-white p-2 rounded-full hover:bg-yellowHalf transition-colors"
            aria-label="Go to homepage"
          >
            <FiHome size={22} /> 
          </Link>
        </div>
      </nav>

      {!isMobileView && (
        <motion.div
          id="desktop-sidebar-id"
          className="fixed top-0 left-0 h-screen bg-blackDark shadow-lg z-30 flex flex-col text-white pt-16" // pt-16 to clear top nav
          initial={false}
          animate={{ width: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <MenuContent isExpanded={isSidebarExpanded} user={user} />
        </motion.div>
      )}

      <AnimatePresence>
        {isMobileView && isMobileDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-blackDark bg-opacity-50 z-40" // Ensure this bg is `bg-black` not `bg-newBlack` if newBlack has opacity
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 h-full w-64 bg-blackDark z-50 text-white flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="p-4 flex justify-start items-center"> {/* Ensure X button is aligned */}
                <button onClick={() => setIsMobileDrawerOpen(false)} className="text-white p-2"> {/* Added padding for easier click */}
                  <X size={24} />
                </button>
                {/* Optionally, add logo or title here in mobile drawer header */}
              </div>
              <MenuContent isExpanded={true} onItemClick={handleMobileItemClick} user={user} /> {/* Pass user here */}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RightDrawerContent removed */}
    </>
  );
};

export default SellerNavbar;