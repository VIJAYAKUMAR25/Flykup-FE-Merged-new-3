// src/pages/seller/SellerMain.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import SellerNavbar from '../../components/nav/sellerNav/SellerNav.jsx';

const SellerMain = () => {
  return (
    <div
      className="grid min-h-screen bg-blackLight"
      style={{
        gridTemplateColumns: `var(--current-sidebar-width) 1fr`
      }}
    >
      <SellerNavbar /> 


      <main className="col-start-2 pt-16 transition-all duration-300">
        <div className="w-full h-full"> 
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerMain;