"use client"

import { useState, useEffect } from "react"
// Updated lucide-react imports
import { User, X, UserCircle, Search, Home as HomeIcon, LogOut, Package, PlaySquare } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import "../../../Styles/userNav.css"
// Removed image imports for icons, kept Logo
import Logo from "../../../assets/images/Logo-Flikup.png"
import { useAuth } from "../../../context/AuthContext.jsx"
import { motion, AnimatePresence } from "framer-motion"
import { MdOutlineShoppingCart, MdShoppingCart } from "react-icons/md"
import MyCart from "../../mycart/MyCart.jsx"
import { useCart } from "../../../context/CartContext.jsx"
import BottomNav from "../BottomNav.jsx"
import useDebounce from '../../../customHooks/useDebounce.js';

const UserNavbar = ({ inputData }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [activeTab, setActiveTab] = useState("user")
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isHovered, setIsHovered] = useState(false)
  const { cart } = useCart()
const CDNURL = import.meta.env.VITE_AWS_CDN_URL;
  const [alertConfig, setAlertConfig] = useState({
    isVisible: false,
    type: "info",
    message: "",
  })

  const [dropdownWidth, setDropdownWidth] = useState("100%")


      // --- Effect to navigate when debounced query changes ---
      useEffect(() => {
       // Only navigate if the search query has actually changed and is not just the initial empty state triggering it
       // OR if we are already on the search page and the query becomes empty (to clear results)
       const isOnSearchPage = location.pathname === '/user/search';

       // Navigate if the debounced term has content, OR if we are on the search page
   
       // and updating the search page when the term changes (including becoming empty).
       if (debouncedSearchQuery || isOnSearchPage) {
           console.log("Navigating with debounced term:", debouncedSearchQuery);
         
           navigate('/user/search', {
               state: { searchTerm: debouncedSearchQuery },
               replace: isOnSearchPage
           });
       }

    }, [debouncedSearchQuery, navigate, location.pathname]); // Add location.pathname dependency


  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setDropdownWidth("40%") // lg
      } else if (width >= 768) {
        setDropdownWidth("60%") // md
      } else {
        setDropdownWidth("100%") // sm
      }
    }

    updateWidth() // Set on mount
    window.addEventListener("resize", updateWidth) // Update on resize
    return () => window.removeEventListener("resize", updateWidth) // Clean up
  }, [])

  // Check for mobile view and update on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleSellerAction = () => {
    if (user.sellerInfo?.approvalStatus === "pending") {
      setAlertConfig({
        isVisible: true,
        type: "info",
        message: "Your seller application is under review. Please wait for approval.",
      })
    } else if (user.sellerInfo?.approvalStatus === "rejected") {
      setAlertConfig({
        
        isVisible: true,
        type: "error",
        message: "Your seller application was rejected. Please reapply.",
      })
      setTimeout(() => navigate("/profile/reapplyform"), 2000)
    } else if (user.role === "user") {
      navigate("/user/sellerform")
    } else if (user.role === "seller") {
      navigate("/seller/productlisting")
    }
  }

  // Updated button configuration
  const getButtonConfig = () => {
    if (user.sellerInfo?.approvalStatus === "pending") {
      return {
        text: "Approval Pending",
        className: "btn-info",
        icon: <User className="h-4 w-4" />,
      }
    }

    if (user.sellerInfo?.approvalStatus === "rejected") {
      return {
        text: "Reapply ",
        className: "btn-error",
        icon: <User className="h-4 w-4" />,
      }
    }

    if (user.role === "seller") {
      return {
        text: "Seller Hub",
        className: "btn-success",
        icon: <User className="h-4 w-4" />,
      }
    }
    return {
      text: "Become Seller",
      className: "btn-warning",
      icon: <User className="h-4 w-4" />,
    }
  }

  const handleCloseAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isVisible: false }))
  }

  const getInitials = () => {
    return user.userName ? user.userName.charAt(0).toUpperCase() : "U"
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Handling explicit submit for:", searchQuery);
   
    navigate('/user/search', { state: { searchTerm: searchQuery.trim() } });
    setShowMobileSearch(false);
};

const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
};

const handleSearchFocus = () => {
  navigate('/user/search', { state: { searchTerm: searchQuery } });
};

const handleClearSearch = () => {
    setSearchQuery("");
};

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  const toggleCartDrawer = () => {
    setShowCartModal(!showCartModal)
  }

  const { text, className, icon } = getButtonConfig()

  return (
    <div className="relative " style={{ position: "sticky", top: "0", zIndex: "9998" }}>
      <div className=" ">
        <div className="navbar bg-newBlack shadow-lg border border-stone-800 px-6  py-3  flex items-center justify-between">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-6">
            <Link to="/">
              <img src={Logo || "/placeholder.svg"} alt="Logo" className="md:w-28 w-20 object-contain" />
            </Link>

                  <div className="hidden lg:block ml-8 w-[400px]">
                      {/* Use onSubmit for explicit submission */}
                      <form
                       onSubmit={handleSearchSubmit} 
                        className="relative group">
                          <input
                              type="text"
                              placeholder="Search for products..."
                              className="w-full h-12 pl-12 pr-14 rounded-full border-2 border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 bg-gray-50 text-gray-900 placeholder:text-gray-400 font-medium transition-all"
                              value={searchQuery}
                              onChange={handleSearchChange}
                              onFocus={handleSearchFocus} 
                          />
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                          {searchQuery && (
                              <button
                                  type="button"
                                  onClick={handleClearSearch}
                                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black"
                                  aria-label="Clear search"
                              >
                                  <X className="h-4 w-4" />
                              </button>
                          )}

                          <button
                              // type="submit" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 transform btn btn-sm btn-circle bg-newYellow border-none shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                              aria-label="Submit search"
                          >
                              <Search className="h-4 w-4 text-white" />
                          </button>
                      </form>
                  </div>

              {/* Mobile Search Overlay */}
              {showMobileSearch && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden">
                      <div className="absolute top-0 w-full bg-white shadow-xl animate-slide-down">
                          <div className="container mx-auto p-4">
                              <form 
                              onSubmit={handleSearchSubmit}
                                className="relative">
                                  <input
                                      type="text"
                                      placeholder="Search for products..."
                                      className="w-full h-12 pl-12 pr-20 rounded-full border-2 border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 bg-gray-50 text-gray-900 placeholder:text-gray-400 font-medium transition-all"
                                      value={searchQuery}
                                      onChange={handleSearchChange} 
                                      onFocus={handleSearchFocus}
                                  />
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />

                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                      {/* Clear Search Button - Mobile */}
                                      {searchQuery && (
                                          <button
                                              type="button"
                                              onClick={handleClearSearch}
                                              className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:bg-gray-200"
                                              aria-label="Clear search"
                                          >
                                              <X className="h-4 w-4" />
                                          </button>
                                      )}
                                      <button
                                          type="submit" // Explicit submit button
                                          className="btn btn-sm btn-circle bg-amber-400 hover:bg-amber-500 border-none"
                                          aria-label="Submit search"
                                      >
                                          <Search className="h-4 w-4 text-white" />
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => {
                                              setShowMobileSearch(false);
                                              handleClearSearch();
                                              navigate("/user");
                                          }}
                                          className="btn btn-sm btn-circle bg-gray-100 hover:bg-gray-200 border-none"
                                          aria-label="Close search"
                                      >
                                          <p>Close</p>
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* Right: Cart & Profile */}
          <div className="flex items-center gap-6">
            {/* Mobile Search Icon */}
            <button className="lg:hidden btn btn-ghost btn-circle text-white"
             onClick={() => setShowMobileSearch(true)}
             >
              <Search className="h-5 w-5" />
            </button>
            {/* Cart Button */}
            {/* <motion.button
              onClick={() => setShowCartModal(!showCartModal)}
              className={`relative  hover:text-amber-400 transition-all duration-300 ${showCartModal ? "text-amber-400" : "text-white"}`}
            >
              {showCartModal ? <MdShoppingCart size={28} /> : <MdOutlineShoppingCart size={28} />}
              {cart?.products?.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center shadow-lg"
                >
                  {cart.products.length}
                </motion.div>
              )}
            </motion.button> */}

            {/* Profile Avatar */}
           <button
              onClick={toggleDrawer}
              className="btn md:btn-md btn-sm w-10 h-10 btn-circle bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow shadow-lg hover:scale-105 hover:shadow-amber-400/50 transition-transform duration-300 border-0 ring-2 ring-yellow overflow-hidden"
            >
              <div className="w-full h-full flex items-center justify-center">
                {user.profileURL?.key ? (
                  <img
                    src={`${CDNURL}${user.profileURL.key}`}
                    alt={user.userName || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blackLight flex items-center justify-center border border-2 border-newYellow text-newYellow text-xl font-semibold">
                    {getInitials()}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              key="profile-backdrop"
              className="fixed inset-0 bg-transparent z-40"
              onClick={toggleDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dropdown Panel */}
            <motion.div
              key="profile-dropdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="absolute right-4 top-20 w-[320px] max-w-[90vw] bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-lg origin-top"
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-700/50 bg-gradient-to-r from-stone-900/50 to-stone-800/30">
                  <div className="flex items-center justify-between">
                    {/* User Info Section */}
                    <div
                      className="flex items-center gap-4 cursor-pointer group flex-1 min-w-0 pr-4"
                      onClick={() => navigate(`/user/user/${user?.userName}`)}
                    >
                      {/* Avatar Container */}
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {user.profileURL?.key ? (
                                  <img
                                    src={`${CDNURL}${user.profileURL.key}`}
                                    alt={user.userName || "User"}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-blackLight flex items-center justify-center border border-2 border-newYellow text-newYellow text-xl font-semibold">
                                    {getInitials()}
                                  </div>
                                )}
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-stone-900"></div>
                      </div>

                      {/* User Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-base md:text-lg truncate group-hover:text-yellow-400 transition-colors duration-200">
                          {user?.userName || "User"}
                        </h3>
                        <p className="text-sm text-stone-400 truncate group-hover:text-stone-300 transition-colors duration-200">
                          {user?.emailId || "email@example.com"}
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button 
                      onClick={toggleDrawer} 
                      className="flex-shrink-0  w-6 h-6 rounded-full bg-stone-800/50 hover:bg-red-300/20 border border-stone-600/50 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 group"
                    >
                      <X className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
                    </button>
                  </div>
                </div>

              {/* Seller Action */}
              {user.role === "dropshipper" ? (
                <div className="p-3 border-b border-stone-700 bg-stone-800">
                  <Link
                    to="/shipper"
                    className="btn btn-sm w-full justify-center font-semibold bg-gradient-to-r from-purple-500 to-blue-800 hover:from-indigo-500 hover:to-purple-700 text-white hover:scale-105 transition-transform duration-300"
                    onClick={toggleDrawer}
                  >
                    Shipper Hub
                  </Link>
                </div>
              ) : (
                <div className="p-3 border-b border-stone-700 bg-stone-800">
                  <button
                    onClick={() => {
                      handleSellerAction()
                      toggleDrawer()
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
                    className={`flex-1 px-4 py-1 rounded-md font-bold transition-all
                    ${activeTab === "user" ? "bg-white text-black shadow-md" : "text-black/80 hover:bg-white/30"}`}
                    onClick={() => setActiveTab("user")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {/* Replaced img with User icon */}
                      <User className="w-[22px] h-[22px]" />
                      User
                    </div>
                  </button>
                  {user.role === "seller" && (
                    <button
                      className={`flex-1 px-4 py-1 rounded-md font-bold transition-all
                      ${activeTab === "seller" ? "bg-white text-black shadow-md" : "text-black/80 hover:bg-white/30"}`}
                      onClick={() => setActiveTab("seller")}
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
              <ul className="menu w-full bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A]  text-white px-5 pb-10 rounded-box gap-2">
                {activeTab === "user" ? (
                  <>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link to="/user/" className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          {/* Replaced img with HomeIcon */}
                          <HomeIcon className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-medium">Home</span>
                      </Link>
                    </li>
                    
                    <li
                      onClick={logout}
                      className="rounded-xl bg-red-600 hover:bg-red-700 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <div className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          {/* Replaced img with LogOut icon */}
                          <LogOut className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-medium">Logout</span>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link to="/seller/productlisting" className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          {/* Replaced img with Package icon */}
                          <Package className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-medium">Products</span>
                      </Link>
                    </li>
                  
                     <li className="rounded-xl bg-gradient-to-r from-[#2A2A2A] via-[#1A1A1A] to-[#0F0F0F] hover:bg-blue-400/60 hover:scale-[1.01] transition-all">
                      <Link to="/seller/viewvideo" className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          {/* Replaced img with PlaySquare icon */}
                          <PlaySquare className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-medium">Shopable Videos</span>
                      </Link>
                    </li>
                    <li
                      onClick={logout}
                      className="rounded-xl bg-red-600 hover:bg-red-700 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <div className="flex gap-3 items-center p-2">
                        <div className="bg-primaryYellow p-1 rounded-md">
                          {/* Replaced img with LogOut icon */}
                          <LogOut className="w-5 h-5 text-black" />
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

      {/* Cart Dropdown */}
      <div className="relative">
        <AnimatePresence>
          {showCartModal && (
            <>
              {/* Click-away backdrop */}
              <motion.div
                key="dropdown-cart-backdrop"
                className="fixed inset-0 bg-transparent z-40"
                onClick={toggleCartDrawer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                key="dropdown-cart"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                style={{ width: dropdownWidth }}
                className={`absolute ${
                  window.innerWidth < 768 ? "right-2" : "right-10"
                }  max-w-[90vw] bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A] animate-gradient-x backdrop-blur-xl border border-stone-200 rounded-xl shadow-2xl z-50 overflow-hidden origin-top-right`}
              >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                    <MdShoppingCart size={25} /> My Cart
                  </h3>
                  <button onClick={() => setShowCartModal(false)} className="btn btn-sm btn-circle hover:bg-stone-100">
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
                <div className=" p-4">
                  <MyCart onClose={() => setShowCartModal(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* {isMobile && (
        <>
        <BottomNav />
        </>
      )} */}
    </div>
  )
}

export default UserNavbar