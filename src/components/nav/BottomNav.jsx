import React from 'react'; // Removed useState, useEffect as they are not used
import { Home, Clapperboard, Radio, ShoppingBag, User, CircleUserRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
// Removed useSearchTab import as activeTab and setActiveTab are not used in this component snippet

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (path) => {
        if (path === '/profile/user/' && user?.userName) {
            return location.pathname === `/profile/user/${user.userName}`;
        }
        return location.pathname === path;
    };

    const navItems = [
        { id: 'home', path: '/profile', icon: Home, label: 'Home' },
        { id: 'reels', path: '/profile/reels', icon: Clapperboard, label: 'Clips' },
        { id: 'live', path: '/live', icon: Radio, label: 'Go Live', isCenter: true }, // Placeholder for spacing
        { id: 'cart', path: '/cart', icon: ShoppingBag, label: 'Products' },
        { id: 'userProfile', path: `/profile/user/${user?.userName || ''}`, icon: CircleUserRound, label: 'Profile' }
    ];

    const handleNavigate = (path) => {
        if (path.includes('/user/') && !user?.userName) {
            console.warn("User not available for profile navigation.");
            navigate('/login');
            return;
        }
        navigate(path);
    };

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1a1a] via-[#1f1f1f] to-[#2a2a2a] border-t border-neutral-700 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.2)] z-50"
        >
            <div className="flex justify-around items-center px-2 sm:px-4 h-16 relative">
                {navItems.map((item, index) => { // Added 'index' here
                    if (item.isCenter) {
                        // This div acts as a spacer for the central button
                        return (
                            <div key={`${item.id}-${index}`} className="w-14 h-14"></div> // 'index' is now defined
                        );
                    }

                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id} // item.id should be unique enough here
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200 w-16 h-full ${
                                active
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 hover:text-neutral-100'
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
                        onClick={() => handleNavigate('/live')} // Assumed navigation for Go Live
                        className="bg-gradient-to-br from-yellow-400 to-amber-500 text-neutral-900 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-800"
                        aria-label="Go Live"
                        key="go-live-button" // Changed to a static, unique key
                    >
                        <Radio className="w-7 h-7" strokeWidth={2.5}/>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}