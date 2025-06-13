// src/components/nav/sellerNav/MenuContent.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
// Import necessary icons from react-icons/fi
import {
  FiLayout,
  FiShoppingBag,
  FiPackage,
  FiVideo,
  FiFilm,
  FiInbox,
  FiCreditCard,
  FiTruck,
  FiTrendingUp,
  FiUsers,
  FiHelpCircle,
  FiSettings,
  FiLock,
  FiUser 
} from 'react-icons/fi';
import { FaArrowCircleLeft } from "react-icons/fa";

const menuItems = [
  { name: "Back To Home", path: "/user", icon: <FaArrowCircleLeft />, locked: false },
  { name: "Dashboard", path: "/seller/dashboard", icon: <FiLayout />, locked: true },
  { name: "Store Setup", path: "/seller/store-setup", icon: <FiShoppingBag />, locked: true },
  { name: "Products", path: "/seller/productlisting", icon: <FiPackage />, locked: false },
  { name: "Shoppable Videos", path: "/seller/viewvideo", icon: <FiFilm />, locked: false },
  { name: "Live Stream", path: "/seller/allshows", icon: <FiVideo />, locked: false },
  { name: "Orders", path: "/seller/orders", icon: <FiInbox />, locked: true },
  { name: "Payments", path: "/seller/payments", icon: <FiCreditCard />, locked: true },
  { name: "Fulfillment", path: "/seller/fulfillment", icon: <FiTruck />, locked: true },
  { name: "Marketing & Growth", path: "/seller/marketing", icon: <FiTrendingUp />, locked: true },
  { name: "Audience", path: "/seller/audience", icon: <FiUsers />, locked: true },
  { name: "Learn & Support", path: "/seller/support", icon: <FiHelpCircle />, locked: true },
  { name: "Settings", path: "/seller/settings", icon: <FiSettings />, locked: true },
];

const MenuContent = ({ isExpanded, onItemClick, user }) => { 
  const location = useLocation();
const CDNURL = import.meta.env.VITE_AWS_CDN_URL;
  const getInitials = () => {
    return user?.userName ? user.userName.charAt(0).toUpperCase() : "U";
  };

  const profilePath = "/profile"; 

  return (
    <div className="p-2 flex-grow overflow-y-auto bg-blackDark flex flex-col h-full">
      {user && (
        <Link
          // to={profilePath}
          onClick={() => {
            if (onItemClick) {
              onItemClick(); 
            }
          }}
          className={`flex items-center p-2 cursor-not-allowed mb-4 rounded-lg transition-colors ${
            location.pathname.startsWith(profilePath)
              ? 'bg-newYellow text-newBlack font-semibold'
              : 'text-whiteLight hover:bg-yellowHalf'
          }`}
        >
          {/* Avatar */}
          <div className="shrink-0 mr-3">
            {user.profileURL?.key ? (
              <img
                src={`${CDNURL}${user.profileURL.key}`}
                alt={user.userName || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blackLight flex items-center justify-center border border-2 border-newYellow text-newYellow text-xl font-semibold">
                {getInitials()}
              </div>
            )}
          </div>

          {/* User Info (Animated) */}
           <motion.div
            initial={{ opacity: 0, width: 0, x: -10 }}
            animate={{
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 'auto' : 0, 
              x: isExpanded ? 0 : -10,
              marginLeft: isExpanded ? '0.5rem' : '0',
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-grow min-w-0" 
          >
            <p className="font-semibold text-sm whitespace-nowrap truncate"> 
              {user.userName || "User Name"}
            </p>
            <p className="text-xs text-gray-400 whitespace-nowrap truncate"> 
              {user.emailId || "user@example.com"}
            </p>
          </motion.div>
        </Link>
      )}

      {/* Navigation Menu Items */}
      <ul className="space-y-2 flex-grow">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.locked ? '#' : item.path}
              onClick={(e) => {
                if (item.locked) {
                  e.preventDefault();
                  console.log(`${item.name} is locked.`);
                } else if (onItemClick) {
                  onItemClick();
                }
              }}
              className={`flex items-center p-2 rounded-lg transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-newYellow text-newBlack font-semibold'
                  : 'text-gray-300 hover:bg-yellowHalf'
              } ${item.locked ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span className="text-xl mr-1 shrink-0">{item.icon}</span>
              <motion.span
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? 'auto' : 0,
                  x: isExpanded ? 0 : -10,
                  marginLeft: isExpanded ? '0.75rem' : 0,
                }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden flex-grow"
              >
                {item.name}
              </motion.span>
              {item.locked && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isExpanded ? 1 : 0 }}
                  transition={{ delay: isExpanded ? 0.1 : 0, duration: 0.2 }}
                  className="ml-auto text-white shrink-0"
                >
                  <FiLock size={16} />
                </motion.span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuContent;