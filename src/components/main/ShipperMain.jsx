import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SellerNavbar from "../nav/sellerNav/SellerNav";
import ShipperNavbar from "../nav/shipperNav/ShipperNavbar";

const ShipperMain = () => {
  const location = useLocation();
  const isFeedRoute = location.pathname.startsWith("/shipper/show/");

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      {!isFeedRoute && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <ShipperNavbar />
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto ${isFeedRoute ? "" : "mt-16"}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default ShipperMain;
