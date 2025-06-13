import React, { useState, useEffect } from 'react'; // Import React if not already
import { Home, Clapperboard, Radio, ShoppingBag, User, CircleUserRound } from 'lucide-react'; // Using Clapperboard instead of BiSolidVideos, CircleUserRound as alternative
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { motion } from 'framer-motion';
import { useSearchTab } from '../../context/SearchContext';

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to get current path
    const { user } = useAuth();
    const { activeTab, setActiveTab } = useSearchTab();
 

    // Function to determine if a nav item is active
    // Handles base paths and dynamic user profile path
    const isActive = (path) => {
        if (path === '/profile/user/' && user?.userName) {
            // Special check for the dynamic user profile path
            return location.pathname === `/profile/user/${user.userName}`;
        }
         // Check for exact match or if the current path starts with the nav item's path
         // (Handles cases like /profile matching /profile/reels if not careful, so prioritize longer paths first if needed)
         // Simple check often works:
         return location.pathname === path;

         // More robust check if needed for nested routes:
         // if (path === '/profile') return location.pathname === '/profile'; // Exact match for profile
         // return location.pathname.startsWith(path);
    };

    const navItems = [
        { id: 'profile', path: '/profile', icon: Home, label: 'Home' },
        { id: 'reels', path: '/profile/reels', icon: Clapperboard, label: 'Clips' }, // Changed Icon & Label
        // Placeholder for the center button space
        { id: 'live', path: '/live', icon: Radio, label: 'Go Live', isCenter: true }, // Added isCenter flag and path
        { id: 'cart', path: '/cart', icon: ShoppingBag, label: 'Products' },
        { id: 'profile', path: `/profile/user/${user?.userName || ''}`, icon: CircleUserRound, label: 'Profile' } // Use different icon, dynamic path
    ];

    // Handle navigation, ensure user exists for profile
    const handleNavigate = (path) => {
        if (path.includes('/user/') && !user?.userName) {
            // Optionally navigate to login or show message if user not available
            console.warn("User not available for profile navigation.");
            navigate('/login'); // Example redirect
            return;
        }
        navigate(path);
    };


    return (
        // Animate the entire nav bar sliding up
        <motion.div
            initial={{ y: 100 }} // Start off-screen below
            animate={{ y: 0 }} // Animate to y: 0
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }} // Add a small delay
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1a1a] via-[#1f1f1f] to-[#2a2a2a] border-t border-neutral-700 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.2)] z-50" // Subtle top border, refined shadow/gradient
        >
            <div className="flex justify-around items-center px-2 sm:px-4 h-16 relative"> {/* Use justify-around, set height */}
                {navItems.map((item) => {
                    // Handle the center button separately for positioning
                    if (item.isCenter) {
                        return (
                            // Placeholder to maintain spacing, actual button is absolutely positioned
                            <div key={item.id} className="w-14 h-14"></div>
                        );
                    }

                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.1, y: -2 }} // Scale up slightly on hover
                            whileTap={{ scale: 0.95 }} // Scale down slightly on tap
                            className={`flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200 w-16 h-full ${ // Fixed width for better spacing
                                active
                                    ? 'text-yellow-400' // Active color
                                    : 'text-gray-300 hover:text-neutral-100' // Inactive and hover color
                            }`}
                            onClick={() => handleNavigate(item.path)}
                            aria-label={item.label}
                        >
                            <Icon className="w-5 h-5 mb-0.5" strokeWidth={active ? 2.5 : 2} />
                            <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{item.label}</span>
                        </motion.button>
                    );
                })}

                 {/* Absolutely Positioned Center Button */}
                 <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.button
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         // Add navigation for Go Live if needed: onClick={() => navigate('/go-live')}
                         className="bg-gradient-to-br from-yellow-400 to-amber-500 text-neutral-900 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-800"
                         aria-label="Go Live"
                     >
                         <Radio className="w-7 h-7" strokeWidth={2.5}/>
                     </motion.button>
                 </div>
            </div>
        </motion.div>
    );
}