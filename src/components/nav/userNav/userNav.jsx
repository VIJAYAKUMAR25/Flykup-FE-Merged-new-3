"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, Search, ShoppingCart } from "lucide-react"; // Using ShoppingCart from lucide-react
import { Link, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import "../../../Styles/userNav.css"; // Ensure this contains any custom CSS
import LogoutIcon from "../../../assets/images/logout.png";
import InventoryIcon from "../../../assets/images/inventory.png";
import ReelsIcon from "../../../assets/images/video-player.png";
import FlikupLogo from "../../../assets/images/Logo-Flikup.png";
import ProfileIcon from "../../../assets/images/profile.png";
import HomeIcon from "../../../assets/images/home.png";
import { useAuth } from "../../../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import MyCart from "../../mycart/MyCart.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import BottomNav from "../BottomNav.jsx";
import useDebounce from "../../../customHooks/useDebounce.js";
// import Alert from "../../ui/Alert.jsx"; // Assuming you have an Alert component

const UserNavbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false); // Renamed for clarity
  const [activeTab, setActiveTab] = useState("user");
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { cart } = useCart();

  const profileDrawerRef = useRef(null); // Ref for profile drawer
  const cartDrawerRef = useRef(null); // Ref for cart drawer

  const [alertConfig, setAlertConfig] = useState({
    isVisible: false,
    type: "info",
    message: "",
  });

  // --- Effect to navigate when debounced query changes ---
  useEffect(() => {
    const isOnSearchPage = location.pathname === "/user/search";

    if (debouncedSearchQuery || isOnSearchPage) {
      console.log("Navigating with debounced term:", debouncedSearchQuery);
      navigate("/user/search", {
        state: { searchTerm: debouncedSearchQuery },
        replace: isOnSearchPage,
      });
    }
  }, [debouncedSearchQuery, navigate, location.pathname]);

  // Handle outside clicks for drawers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDrawerRef.current &&
        !profileDrawerRef.current.contains(event.target) &&
        isProfileDrawerOpen
      ) {
        setIsProfileDrawerOpen(false);
      }
      if (
        cartDrawerRef.current &&
        !cartDrawerRef.current.contains(event.target) &&
        isCartDrawerOpen
      ) {
        setIsCartDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDrawerOpen, isCartDrawerOpen]);

  // Check for mobile view and update on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile search when navigating away from search page
  useEffect(() => {
    if (showMobileSearch && location.pathname !== "/user/search") {
      setShowMobileSearch(false);
      setSearchQuery(""); // Clear search query when closing mobile search
    }
  }, [location.pathname, showMobileSearch]);

  const handleSellerAction = () => {
    if (user.sellerInfo?.approvalStatus === "pending") {
      setAlertConfig({
        isVisible: true,
        type: "info",
        message: "Your seller application is under review. Please wait for approval.",
      });
    } else if (user.sellerInfo?.approvalStatus === "rejected") {
      setAlertConfig({
        isVisible: true,
        type: "error",
        message: "Your seller application was rejected. Please reapply.",
      });
      setTimeout(() => navigate("/profile/reapplyform"), 2000);
    } else if (user.role === "user") {
      navigate("/user/sellerform");
    } else if (user.role === "seller") {
      navigate("/seller/productlisting");
    }
  };

  const getButtonConfig = () => {
    if (user.sellerInfo?.approvalStatus === "pending") {
      return {
        text: "Approval Pending",
        className: "btn-info",
        icon: <User className="h-4 w-4" />,
      };
    }
    if (user.sellerInfo?.approvalStatus === "rejected") {
      return {
        text: "Reapply ",
        className: "btn-error",
        icon: <User className="h-4 w-4" />,
      };
    }
    if (user.role === "seller") {
      return {
        text: "Seller Hub",
        className: "btn-success",
        icon: <User className="h-4 w-4" />,
      };
    }
    return {
      text: "Become Seller",
      className: "btn-warning",
      icon: <User className="h-4 w-4" />,
    };
  };

  const handleCloseAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isVisible: false }));
  };

  const getInitials = () => {
    return user.userName ? user.userName.charAt(0).toUpperCase() : "U";
  };

  // Explicit search submission for desktop
  const handleDesktopSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/user/search", { state: { searchTerm: searchQuery.trim() } });
    }
  };

  // Mobile search submission (when pressing enter or search icon)
  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/user/search", { state: { searchTerm: searchQuery.trim() } });
      setShowMobileSearch(false); // Close mobile search after submission
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    // Only navigate to search page if not already there, and if there's a query
    if (location.pathname !== "/user/search" && searchQuery.trim()) {
      navigate("/user/search", { state: { searchTerm: searchQuery.trim() } });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    // Optionally navigate back from search results if clear is pressed
    if (location.pathname === "/user/search") {
      navigate("/user"); // Or any other default page
    }
  };

  const toggleProfileDrawer = () => {
    setIsProfileDrawerOpen(!isProfileDrawerOpen);
    setIsCartDrawerOpen(false); // Close other drawer
  };

  const toggleCartDrawer = () => {
    setIsCartDrawerOpen(!isCartDrawerOpen);
    setIsProfileDrawerOpen(false); // Close other drawer
  };

  const { text, className, icon } = getButtonConfig();

  // const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Framer Motion variants for drawers
  const drawerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20, x: 20 },
    visible: { opacity: 1, scale: 1, y: 0, x: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, y: -20, x: 20, transition: { duration: 0.2 } },
  };

  return (
    <div className="relative z-[9998] sticky top-0">
      <div className="navbar bg-newBlack shadow-lg border-b border-stone-800 px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left: Logo & Search (Desktop) */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/">
            <img
              src={FlikupLogo || "/placeholder.svg"}
              alt="Flikup Logo"
              className="md:w-28 w-20 object-contain"
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:block flex-grow max-w-xl">
            <form onSubmit={handleDesktopSearchSubmit} className="relative group">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full h-12 pl-12 pr-14 rounded-full border-2 border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 bg-gray-50 text-gray-900 placeholder:text-gray-400 font-medium transition-all"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                aria-label="Search for products"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 transform btn btn-sm btn-circle bg-newYellow border-none shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Submit search"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Search (Mobile), Cart & Profile */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Mobile Search Icon */}
          <button
            className="lg:hidden btn btn-ghost btn-circle text-white focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setShowMobileSearch(true)}
            aria-label="Open mobile search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart Icon */}
          {/* <button
            className="btn btn-ghost btn-circle text-white relative focus:outline-none focus:ring-2 focus:ring-white"
            onClick={toggleCartDrawer}
            aria-label={`Shopping cart with ${cartItemCount} items`}
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="badge badge-sm badge-secondary absolute -top-1 -right-1 text-xs">
                {cartItemCount}
              </span>
            )}
          </button> */}

          {/* Profile Avatar Button */}
          <button
            onClick={toggleProfileDrawer}
            className="btn md:btn-md btn-sm btn-circle bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow shadow-lg hover:scale-105 hover:shadow-amber-400/50 transition-transform duration-300 border-0 ring-2 ring-yellow focus:outline-none focus:ring-4 focus:ring-amber-300"
            aria-label="Open profile menu"
          >
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
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-newBlack/90 backdrop-blur-sm z-[9999] lg:hidden"
          >
            <div className="absolute top-0 w-full bg-newBlack shadow-xl py-4 border-b border-stone-700">
              <div className="container mx-auto px-4">
                <form onSubmit={handleMobileSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full h-12 pl-12 pr-20 rounded-full border-2 border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 bg-gray-50 text-gray-900 placeholder:text-gray-400 font-medium transition-all"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    aria-label="Mobile search input"
                    autoFocus // Automatically focus when opened
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:bg-gray-200"
                        aria-label="Clear mobile search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button" // Change to button to prevent form submission unless needed
                      onClick={() => {
                        setShowMobileSearch(false);
                        handleClearSearch(); // Clear search on close
                        navigate("/user"); // Navigate to home or previous page
                      }}
                      className="btn btn-sm btn-circle bg-gray-700 hover:bg-gray-600 border-none text-white"
                      aria-label="Close mobile search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Drawer */}
      <AnimatePresence>
        {isProfileDrawerOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              key="profile-backdrop"
              className="fixed inset-0 bg-black/60 z-[9997]"
              onClick={toggleProfileDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer Panel */}
            <motion.div
              ref={profileDrawerRef}
              key="profile-drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-4 top-20 w-[320px] max-w-[90vw] bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-[9998] overflow-hidden origin-top-right"
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-700 flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => {
                    navigate(`/user/user/${user?.userName}`);
                    toggleProfileDrawer(); // Close drawer on navigation
                  }}
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
                    <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                      {user?.userName || "User"}
                    </h3>
                    <p className="text-sm text-stone-400">{user?.emailId || "email@example.com"}</p>
                  </div>
                </div>
                <button
                  onClick={toggleProfileDrawer}
                  className="btn btn-sm btn-circle btn-ghost text-stone-400 hover:text-white hover:bg-stone-800"
                  aria-label="Close profile menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Seller Action */}
              {user.role === "dropshipper" ? (
                <div className="p-3 border-b border-stone-700 bg-stone-800">
                  <Link
                    to="/shipper"
                    className="btn btn-sm w-full justify-center font-semibold bg-gradient-to-r from-purple-500 to-blue-800 hover:from-indigo-500 hover:to-purple-700 text-white hover:scale-105 transition-transform duration-300"
                    onClick={toggleProfileDrawer}
                  >
                    Shipper Hub
                  </Link>
                </div>
              ) : (
                <div className="p-3 border-b border-stone-700 bg-stone-800">
                  <button
                    onClick={() => {
                      handleSellerAction();
                      toggleProfileDrawer();
                    }}
                    className={`btn btn-sm w-full justify-center font-semibold ${className} hover:from-amber-500 hover:to-amber-600 text-white hover:scale-105`}
                  >
                    {icon}
                    <span className="ml-2">{text}</span>
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-primaryYellow rounded-md m-3 mb-1 p-1 shadow-inner">
                <div className="flex gap-1 z-10 relative">
                  <button
                    className={`flex-1 px-4 py-1 rounded-md font-bold transition-all ${
                      activeTab === "user" ? "bg-white text-black shadow-md" : "text-black/80 hover:bg-white/30"
                    }`}
                    onClick={() => setActiveTab("user")}
                    aria-controls="user-menu-list"
                    aria-selected={activeTab === "user"}
                    role="tab"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <img src={ProfileIcon} alt="user" width={22} height={22} />
                      User
                    </div>
                  </button>
                  {user.role === "seller" && (
                    <button
                      className={`flex-1 px-4 py-1 rounded-md font-bold transition-all ${
                        activeTab === "seller" ? "bg-white text-black shadow-md" : "text-black/80 hover:bg-white/30"
                      }`}
                      onClick={() => setActiveTab("seller")}
                      aria-controls="seller-menu-list"
                      aria-selected={activeTab === "seller"}
                      role="tab"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        Seller
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Menu List */}
              <ul
                role="tablist"
                id={activeTab === "user" ? "user-menu-list" : "seller-menu-list"}
                className="menu w-full bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A] text-white px-5 pb-10 rounded-box gap-2"
              >
                {activeTab === "user" ? (
                  <>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link to="/user/" className="flex gap-3 items-center p-2" onClick={toggleProfileDrawer}>
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={HomeIcon} alt="Home" width={20} />
                        </div>
                        <span className="font-medium">Home</span>
                      </Link>
                    </li>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link
                        to="/user/verified-user"
                        className="flex gap-3 items-center p-2"
                        onClick={toggleProfileDrawer}
                      >
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={User} alt="Verified User" width={20} />{" "}
                          {/* Changed to lucide User icon for consistency */}
                        </div>
                        <span className="font-medium">Verified User</span>
                      </Link>
                    </li>
                    <li
                      onClick={() => {
                        logout();
                        toggleProfileDrawer();
                      }}
                      className="rounded-xl bg-red-600 hover:bg-red-700 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <div className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={LogoutIcon} alt="Logout" width={22} />
                        </div>
                        <span className="font-medium">Logout</span>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link
                        to="/seller/productlisting"
                        className="flex gap-3 items-center p-2"
                        onClick={toggleProfileDrawer}
                      >
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={InventoryIcon} alt="Listing" width={20} />
                        </div>
                        <span className="font-medium">Products</span>
                      </Link>
                    </li>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link
                        to="/seller/viewvideo"
                        className="flex gap-3 items-center p-2"
                        onClick={toggleProfileDrawer}
                      >
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={ReelsIcon} alt="Shopable Videos" width={20} />
                        </div>
                        <span className="font-medium">Shopable Videos</span>
                      </Link>
                    </li>
                    <li
                      onClick={() => {
                        logout();
                        toggleProfileDrawer();
                      }}
                      className="rounded-xl bg-red-600 hover:bg-red-700 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <div className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          <img src={LogoutIcon} alt="Logout" width={22} />
                        </div>
                        <span className="font-medium">Logout</span>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartDrawerOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              key="cart-backdrop"
              className="fixed inset-0 bg-black/60 z-[9997]"
              onClick={toggleCartDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              ref={cartDrawerRef}
              key="cart-drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`absolute right-4 top-20 w-[320px] max-w-[90vw] bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A] animate-gradient-x backdrop-blur-xl border border-stone-700 rounded-xl shadow-2xl z-[9998] overflow-hidden origin-top-right`}
            >
              <div className="p-4 border-b border-stone-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                  <ShoppingCart size={25} /> My Cart
                </h3>
                <button
                  onClick={toggleCartDrawer}
                  className="btn btn-sm btn-circle btn-ghost text-stone-400 hover:text-white hover:bg-stone-800"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {" "}
                {/* Added max-height and overflow */}
                <MyCart onClose={toggleCartDrawer} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alert Component */}
      {/* <Alert
        isVisible={alertConfig.isVisible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleCloseAlert}
      /> */}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default UserNavbar;