import React from "react";
import { Outlet, useLocation } from 'react-router-dom';
import UserNavbar from "../nav/userNav/userNav";


const UserLayout = ({ inputData }) => {

  const location = useLocation();
  const isFeedRoute = location.pathname === '/profile/feed' || location.pathname.startsWith('/profile/show/') || location.pathname.startsWith('/profile/reels') || location.pathname.startsWith('/profile/reel');

  return (
    <div className="min-h-screen">
      {/* Common Navigation Bar */}
      
      {!isFeedRoute && <UserNavbar inputData={inputData} />}
      <div className="">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;
