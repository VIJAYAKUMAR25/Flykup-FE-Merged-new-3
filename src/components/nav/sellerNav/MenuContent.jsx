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
  FiLock    
} from 'react-icons/fi';
import { FaArrowCircleLeft } from "react-icons/fa";
const menuItems = [
    { name: "Back To Home",         path: "/user",         icon: <FaArrowCircleLeft />,       locked: false },
  { name: "Dashboard",         path: "/seller/dashboard",         icon: <FiLayout />,       locked: true },
  { name: "Store Setup",       path: "/seller/store-setup",       icon: <FiShoppingBag />,  locked: true },
  { name: "Products",          path: "/seller/productlisting",          icon: <FiPackage />,      locked: false },
  { name: "Shopable Videos",   path: "/seller/viewvideo",            icon: <FiFilm />,         locked: false },
   { name: "Live Stream",       path: "/seller/allshows",       icon: <FiVideo />,        locked: true },
  { name: "Orders",            path: "/seller/orders",            icon: <FiInbox />,        locked: true },
  { name: "Payments",          path: "/seller/payments",          icon: <FiCreditCard />,   locked: true },
  { name: "Fulfillment",       path: "/seller/fulfillment",       icon: <FiTruck />,        locked: true },
  { name: "Marketing & Growth",path: "/seller/marketing",         icon: <FiTrendingUp />,   locked: true },
  { name: "Audience",          path: "/seller/audience",          icon: <FiUsers />,        locked: true },
  { name: "Learn & Support",   path: "/seller/support",           icon: <FiHelpCircle />,   locked: true },
  { name: "Settings",          path: "/seller/settings",          icon: <FiSettings />,     locked: true },
];


const MenuContent = ({ isExpanded, onItemClick }) => {
  const location = useLocation();

  return (
    <div className="p-4 flex-grow overflow-y-auto bg-newBlack"> {/* Added flex-grow and overflow */}
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
            to={item.locked ? '#' : item.path} // Prevent navigation for locked items
            onClick={(e) => {
                if (item.locked) {
                e.preventDefault(); // Stop navigation
                console.log(`${item.name} is locked.`);
                } else if (onItemClick) {
                onItemClick(); // Close mobile drawer
                }
            }}
            className={`flex items-center p-2 rounded-lg transition-colors ${
                location.pathname.startsWith(item.path)
                ? 'bg-newYellow text-newBlack font-semibold'
                : 'text-gray-300 hover:bg-gray-600'
            } ${item.locked ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
            {/* Icon */}
            <span className="text-xl mr-3 shrink-0">{item.icon}</span>

            {/* Text Label (Animated) */}
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

            {/* Lock Icon */}
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