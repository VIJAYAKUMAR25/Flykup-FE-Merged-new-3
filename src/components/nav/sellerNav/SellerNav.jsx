// src/components/nav/sellerNav/SellerNav.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
// import { useCart } from "../../../context/CartContext"; // Uncomment if cart is used
import { motion, AnimatePresence } from "framer-motion";
// import { MdOutlineShoppingCart, MdShoppingCart } from "react-icons/md"; // Uncomment if cart is used
import { FiMenu as Menu, FiX as X, FiUser as User } from "react-icons/fi";
import Logo from "../../../assets/images/Logo-Flikup.png";
// import MyCart from "../../mycart/MyCart"; // Uncomment if cart is used
import MenuContent from "./MenuContent";
import RightDrawerContent from "./RightDrawerContent";

const SIDEBAR_WIDTH_EXPANDED = "16rem"; // 256px - Matches CSS variable
const SIDEBAR_WIDTH_COLLAPSED = "5rem";  // 80px - Matches CSS variable
const MOBILE_BREAKPOINT = 768; // Consistent with Tailwind's 'md' breakpoint

// We no longer need onStateChange prop, as we directly modify CSS variables
const SellerNavbar = () => {
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showCartModal, setShowCartModal] = useState(false); // If cart is used
  // const { cart } = useCart(); // If cart is used

  // Responsive state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Controls desktop sidebar expansion
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false); // Controls mobile (left) drawer visibility

  const checkMobileView = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobileView(mobile);
    // If we transition from mobile to desktop, close mobile drawer
    if (!mobile && isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
    // If we transition from desktop to mobile, collapse desktop sidebar
    if (mobile && isSidebarExpanded) {
      setIsSidebarExpanded(false);
    }
  }, [isMobileDrawerOpen, isSidebarExpanded]);

  useEffect(() => {
    window.addEventListener("resize", checkMobileView);
    checkMobileView(); // Initial check
    return () => window.removeEventListener("resize", checkMobileView);
  }, [checkMobileView]);

  // EFFECT TO UPDATE CSS VARIABLE for sidebar width
  useEffect(() => {
    let newSidebarWidth;
    if (isMobileView) {
      newSidebarWidth = '0rem'; // On mobile, sidebar is a drawer, doesn't occupy horizontal grid space
    } else {
      newSidebarWidth = isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
    }
    document.documentElement.style.setProperty('--current-sidebar-width', newSidebarWidth);

    // Optional: Also set the width of the desktop sidebar motion.div directly here for consistency
    // This part might be redundant if framer-motion's animate prop already controls it well,
    // but useful for clarity if there were ever issues.
    // document.getElementById('desktop-sidebar-id').style.width = newSidebarWidth; // Add id to desktop sidebar motion.div
  }, [isMobileView, isSidebarExpanded]);


  const getInitials = () => user?.userName ? user.userName.charAt(0).toUpperCase() : "U";

  const handleMobileItemClick = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {/* TOP NAVBAR (Always fixed at the top, spans full width initially) */}
      <nav
        className="fixed top-0 w-full h-16 bg-newBlack flex items-center justify-between px-4 z-40 shadow-md"
        style={{
          // On desktop, push the top nav content to the right to clear the sidebar
          paddingLeft: `var(--current-sidebar-width)`,
          transition: 'padding-left 0.3s ease-in-out' // Smooth transition for padding
        }}
      >
        <div className="flex items-center">
          {/* Mobile Menu Toggle (only visible on mobile) */}
          {isMobileView && (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="text-white mr-4 p-2"
            >
              <Menu size={24} />
            </button>
          )}
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="Flikup Logo" className="h-8 md:h-10" />
          </Link>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Cart Button (if uncommented) */}
          {/* <button
            onClick={() => setShowCartModal(true)}
            className="relative text-white p-1"
          >
            <MdOutlineShoppingCart size={24} />
            {cart?.products?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center border border-gray-900">
                {cart.products.length > 9 ? '9+' : cart.products.length}
              </span>
            )}
          </button> */}

          {/* User Profile Button to open Right Drawer */}
          <button
            onClick={() => setIsRightDrawerOpen(true)}
            className="flex items-center justify-center p-3"
          >
            <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold border-2 border-yellow-400">
              <span className="text-lg">{getInitials()}</span>
            </div>
          </button>
        </div>
      </nav>

      {/* DESKTOP SIDEBAR (Fixed left, only visible on desktop) */}
      {!isMobileView && (
        <motion.div
          id="desktop-sidebar-id" // Added ID for potential direct manipulation (optional)
          className="fixed top-0 left-0 h-screen bg-newBlack shadow-lg z-30 flex flex-col text-white pt-16" // pt-16 to clear top nav
          initial={false}
          animate={{ width: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <MenuContent isExpanded={isSidebarExpanded} />
        </motion.div>
      )}

      {/* MOBILE DRAWER (Fixed left, hidden by default, slides in, only visible on mobile) */}
      <AnimatePresence>
        {isMobileView && isMobileDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-newBlack bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer Content */}
            <motion.div
              className="fixed top-0 left-0 h-full w-64 bg-newBlack z-50 text-white flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Close button inside mobile drawer */}
              <div className="p-4 flex justify-start ml-3">
                <button onClick={() => setIsMobileDrawerOpen(false)} className="text-white">
                  <X size={24} />
                </button>
              </div>
              <MenuContent isExpanded={true} onItemClick={handleMobileItemClick} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Drawer for Account (unchanged) */}
      <RightDrawerContent
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        user={user}
        logout={logout}
      />

      {/* Cart Modal (if uncommented) */}
      {/* <AnimatePresence>
        {showCartModal && (
          <motion.div
              className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center md:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartModal(false)}
            >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-t-xl md:rounded-xl shadow-xl max-h-[80vh] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <MyCart onClose={() => setShowCartModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence> */}
    </>
  );
};

export default SellerNavbar;