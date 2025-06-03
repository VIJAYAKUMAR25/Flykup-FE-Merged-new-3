import React from "react";
import Feed from "./Feed";
import { Home, User, Search, Bell, MessageSquare, ShoppingBag, Radio, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShopableVideos = () => {
  const navItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' },
    { icon: <Radio size={24} />, label: 'Live Stream', path: '/live' },
    { icon: <Search size={24} />, label: 'Search', path: '/search' },
    { icon: <Bell size={24} />, label: 'Notifications', path: '/notifications' },
    { icon: <User size={24} />, label: 'Profile', path: '/profile' },
    { icon: <MessageSquare size={24} />, label: 'Messages', path: '/messages' },
    { icon: <ShoppingBag size={24} />, label: 'Orders', path: '/orders' },
  ];

  return (
    <div className="bg-black min-h-screen flex">
      {/* Side Navigation - Visible on md and larger screens */}
      <div className="hidden md:flex flex-col w-64 bg-black/50 backdrop-blur-lg border-r border-white/10 p-4 fixed h-screen" style={{zIndex:"20"}}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">ShopStream</h1>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path}
                  className="flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-lg transition-colors"
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto pb-4">
          <div className="flex items-center gap-3 p-3">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full ring-2 ring-primary">
                <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="User" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-white/60">@johndoe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ">
        <Feed  />
      </div>

      {/* Bottom Navigation - Visible only on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-t border-white/10">
        <nav className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors px-3"
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ShopableVideos;