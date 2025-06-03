import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import Logout from "../../../assets/images/logout.png";
import ViewProducts from "../../../assets/images/viewproducts.png";
import Logo from "../../../assets/images/Logo-Flikup.png";
import Profile from "../../../assets/images/profile.png";
import Reels from "../../../assets/images/video-player.png";
import Homeicon from "../../../assets/images/home.png";
import {
  Home, Package, ClipboardList, X, ShoppingCart, Video,
  User,
  ShoppingBag,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineShoppingCart, MdShoppingCart } from "react-icons/md";
import MyCart from "../../mycart/MyCart.jsx";
import { useCart } from "../../../context/CartContext.jsx";

const ShipperNavbar = () => {
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showCartModal, setShowCartModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isHovered, setIsHovered] = useState(false);
  const { cart } = useCart();

  // Check for mobile view and update on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle left drawer (inventory)
  const toggleLeftDrawer = () => {
    setIsLeftDrawerOpen(!isLeftDrawerOpen);
  };

  // Toggle right drawer (profile)
  const toggleRightDrawer = () => {
    setIsRightDrawerOpen(!isRightDrawerOpen);
  };

  // Get user initials for profile avatar
  const getInitials = () => {
    return user.userName ? user.userName.charAt(0).toUpperCase() : "U";
  };


  const menuItems = [
    // {
    //   name: "My Profile",
    //   path: "/seller/myprofile",
    //   icon: <User className="w-5 h-5" />,
    // },
    {
      name: "Shipper Orders",
      path: "/shipper/orders",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      name: "View All Shows",
      path: "/shipper/allshows",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      name: "Shopable Videos",
      path: "/shipper/viewvideo",
      icon: <PlayCircle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="navbar bg-primaryBlack shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Left Side: Hamburger Menu (Mobile and Large Screen) */}
      <div className="navbar-start">
        <button
          className="btn btn-ghost btn-sm bg-inputYellow"
          onClick={toggleLeftDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primaryBlack"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </button>
        <Link
          to="/profile"
          className="btn btn-black btn-sm  text-black bg-inputYellow ml-2 hover:bg-primaryBlack hover:text-primaryYellow"
        >
          <FaHome className="text-xl " />
        </Link>
      </div>
      {/* Logo */}
      <div className="navbar-center">
        <Link to="/profile" className="text-xl font-bold">
          <img src={Logo} alt="Flikup " className="" width={110} height={50} />
        </Link>
      </div>

      {/* Right Side: Profile Icon */}
      <div className="navbar-end flex items-center gap-4 mr-2">

        <motion.button
          onClick={() => setShowCartModal(true)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
          // transition={{ type: "spring", stiffness: 300 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="hidden relative btn btn-sm border-0 bg-transparent text-white hover:bg-transparent"
          // Wiggle effect with a break of 500ms after each cycle
          animate={
            cart && cart.products && cart.products.length > 0
              ? { x: [0, -5, 5, -5, 5, 0] }
              : { x: 0 }
          }
          transition={
            cart && cart.products && cart.products.length > 0
              ? { duration: 0.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.5 }
              : {}
          }
        >
          {(showCartModal || isHovered) ? (
            <MdShoppingCart size={25} />
          ) : (
            <MdOutlineShoppingCart size={25} />
          )}

          {cart && cart.products && cart.products.length > 0 && (
            <motion.div
              key={cart.products.length} // key ensures re-animation on change
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
            >
              {cart.products.length}
            </motion.div>
          )}
        </motion.button>

        <button
          onClick={toggleRightDrawer}
          className="btn btn-success bg-primaryYellow btn-circle avatar"
        >
          <div className="avatar placeholder">
            <div className="avatar ring-0">
              {user.profileURL?.jpgURL ? (
                <div className="md:w-10 w-auto rounded-full">
                  <img
                    src={user.profileURL?.jpgURL}
                    alt="Profile"
                    className="object-cover w-full h-full rounded-full"
                  />
                </div>
              ) : (
                <div className="bg-white text-black rounded-full w-10 flex items-center justify-center font-semibold">
                  <span className="text-lg">{getInitials()}</span>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Left Drawer (Inventory) */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
            onClick={toggleLeftDrawer}
          ></div>
          <div className="absolute left-0 top-0 h-full w-80 bg-white transform transition-transform duration-300 ease-in-out">
            {/* Close Button */}
            <div className="sticky top-0 bg-white p-4 z-10">
              <button
                onClick={toggleLeftDrawer}
                className="absolute top-2 left-2 p-1 bg-slate-900 text-white rounded-full hover:bg-base-200 transition-colors duration-400"
              >
                <X className="h-6 w-6 text-white hover:text-white" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4 pb-4 mt-4 custom-scrollbar">
              {/* Navigation Links */}
              <div className="p-6  bg-white/70 backdrop-blur-md shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">
                  {" "}
                  Menu
                </h2>
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 p-2 rounded-lg transition duration-300 ${location.pathname === item.path
                          ? "bg-primaryYellow text-white shadow-md"
                          : "hover:bg-gray-100 text-gray-700"
                          }`}
                      >
                        <span className="bg-black p-1 text-primaryYellow rounded-full ">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Drawer (Profile) */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
            onClick={toggleRightDrawer}
          ></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-primaryBlack transform transition-transform duration-300 ease-in-out">
            {/* Close Button */}
            <div className="sticky top-0 bg-primaryBlack p-4 z-10">
              <button
                onClick={toggleRightDrawer}
                className="absolute top-2 right-2 p-1 bg-slate-300 rounded-full hover:bg-primaryYellow transition-colors duration-200"
              >
                <X className="h-6 w-6 text-black hover:text-black " />
              </button>
            </div>

            {/* Profile Content */}
            <div className="h-[calc(100vh-4rem)] overflow-y-auto mt-5 px-4 pb-4 custom-scrollbar">
              <div
                className="flex flex-col items-center gap-2 mb-2 p-2  rounded-box"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              >
                <div className="avatar placeholder">
                  <div className="avatar ring-0">
                    {user.profileURL?.jpgURL ? (
                      <div className="md:w-10 w-auto rounded-full">
                        <img
                          src={user.profileURL?.jpgURL}
                          alt="Profile"
                          className="object-cover w-full h-full rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="bg-white text-black rounded-full w-10 flex items-center justify-center font-semibold">
                        <span className="text-lg">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg text-white">
                    {user?.userName ||
                      "User"}
                  </h3>
                  <p className="text-sm opacity-75 text-primaryYellow font-semibold">
                    {user?.emailId ||
                      "email@example.com"}
                  </p>
                </div>
              </div>

              <div className="relative p-1 bg-primaryYellow rounded-xl shadow-lg mb-2">
                <div className="flex gap-1 relative z-10">
                  <button
                    className={`flex-1 px-6   rounded-lg font-bold transition-all duration-300 transform
                      ${activeTab === "user"
                        ? "bg-primaryWhite text-black shadow-lg scale-105 hover:scale-105"
                        : "text-primaryBlack hover:bg-white/30 hover:scale-105"
                      }`}
                    onClick={() => setActiveTab("user")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <img src={Profile} width={27} height={27} alt="" />
                      User
                    </div>
                  </button>

                  <button
                    className={`flex-1 px-6 rounded-lg font-bold transition-all duration-300 transform
                      ${activeTab === "seller"
                        ? "bg-primaryWhite text-black shadow-lg scale-105 hover:scale-105"
                        : "text-primaryBlack hover:bg-white/30 hover:scale-105"
                      }`}
                    onClick={() => setActiveTab("seller")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 
                          ${activeTab === "seller" ? "scale-110" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Shipper
                    </div>
                  </button>
                </div>
              </div>
              <ul
                className="menu w-full rounded-box gap-2"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              >
                {activeTab === "user" ? (
                  <>
                    <li className="bg-primaryBlack rounded-3xl transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 cursor-pointer">
                      <Link to={"/profile/"} className="flex gap-4 p-2">
                        <div className="bg-primaryYellow p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Homeicon}
                            alt=""
                            width={20}
                            height={20}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Home
                        </p>
                      </Link>
                    </li>

                    {/* <li className="bg-primaryBlack rounded-3xl transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 cursor-pointer">
                      <Link to={"/profile/giveaway"} className="flex gap-4 p-2">
                        <div className="bg-primaryYellow p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Homeicon}
                            alt=""
                            width={20}
                            height={20}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Giveaway
                        </p>
                      </Link>
                    </li> */}

                    <li
                      onClick={logout}
                      className="bg-primaryBlack rounded-3xl transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 cursor-pointer"
                    >
                      <a className="flex gap-4 p-2">
                        <div className="bg-error p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Logout}
                            alt=""
                            width={23}
                            height={23}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Logout
                        </p>
                      </a>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="bg-primaryBlack rounded-3xl transform  transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 ">
                      <Link
                        to="/shipper/allshows"
                        className="flex items-center gap-4 p-2"
                        onClick={toggleRightDrawer}
                      >
                        <div className="bg-primaryYellow p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Reels}
                            alt=""
                            width={20}
                            height={20}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Your Shows
                        </p>
                      </Link>
                    </li>


                    <li className="bg-primaryBlack rounded-3xl transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 cursor-pointer">
                      <Link
                        to={"/shipper/myprofile"}
                        className="flex gap-4 p-2"
                      >
                        <div className="bg-primaryYellow p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Profile}
                            alt=""
                            width={20}
                            height={20}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          My Profile
                        </p>
                      </Link>
                    </li>

                    <li
                      onClick={logout}
                      className="bg-primaryBlack  rounded-3xl transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-101 hover:bg-blue-400 cursor-pointer"
                    >
                      <a className="flex gap-4 p-2">
                        <div className="bg-error p-1 rounded-full transform transition-transform duration-300 group-hover:rotate-12">
                          <img
                            src={Logout}
                            alt=""
                            width={23}
                            height={23}
                            className="transform transition-transform hover:scale-110"
                          />
                        </div>
                        <p className="text-white font-bold transition-colors duration-300 group-hover:text-white">
                          Logout
                        </p>
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <AnimatePresence>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCartModal(false)}
          />
          {isMobile ? (
            // Centered Modal for Mobile View with dynamic width
            <motion.div
              key="cart-modal-mobile"
              className="fixed inset-0 flex items-center justify-center z-50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-xl p-4 w-[90%] max-w-md">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-1">
                    <h1 className="text-2xl font-bold">My Cart</h1>
                    <motion.button
                      transition={{ type: "spring", stiffness: 300 }}
                      onHoverStart={() => setIsHovered(true)}
                      onHoverEnd={() => setIsHovered(false)}
                      className="relative btn btn-sm border-0 bg-transparent text-black hover:bg-transparent"
                    >
                      {(showCartModal || isHovered) ? (
                        <MdShoppingCart size={25} />
                      ) : (
                        <MdOutlineShoppingCart size={25} />
                      )}

                      {cart && cart.products && cart.products.length > 0 && (
                        <motion.div
                          key={cart.products.length} // key ensures re-animation on change
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 10 }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                        >
                          {cart.products.length}
                        </motion.div>
                      )}
                    </motion.button>
                  </div>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="btn btn-ghost"
                  >
                    <X />
                  </button>
                </div>
                <MyCart onClose={() => setShowCartModal(false)} />
              </div>
            </motion.div>
          ) : (
            // Side Drawer Modal for Desktop View with dynamic width
            <motion.div
              key="cart-modal-desktop"
              className="fixed flex flex-col items-start top-0 right-0 h-full bg-white shadow-xl z-50 w-[90%] sm:w-96 lg:w-1/3 "
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="p-4 flex justify-between items-center border-b w-full">
                <div className="flex items-center gap-1">
                  <h1 className="text-2xl font-bold">My Cart</h1>
                  <motion.button
                    transition={{ type: "spring", stiffness: 300 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="relative btn btn-sm border-0 bg-transparent text-black hover:bg-transparent"
                  >
                    {(showCartModal || isHovered) ? (
                      <MdShoppingCart size={25} />
                    ) : (
                      <MdOutlineShoppingCart size={25} />
                    )}

                    {cart && cart.products && cart.products.length > 0 && (
                      <motion.div
                        key={cart.products.length} // key ensures re-animation on change
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                      >
                        {cart.products.length}
                      </motion.div>
                    )}
                  </motion.button>
                </div>                  <button
                  onClick={() => setShowCartModal(false)}
                  className="btn btn-ghost"
                >
                  <X />
                </button>
              </div>
              <MyCart onClose={() => setShowCartModal(false)} />

            </motion.div>
          )}
        </AnimatePresence>
      )}


    </div>
  );
};

export default ShipperNavbar;
