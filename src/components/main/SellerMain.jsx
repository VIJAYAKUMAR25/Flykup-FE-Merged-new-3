// src/pages/seller/SellerMain.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import SellerNavbar from '../../components/nav/sellerNav/SellerNav.jsx';

const SellerMain = () => {
  return (
    <div
      className="grid min-h-screen bg-blackLight"
      style={{
        // Use the CSS variable for grid-template-columns.
        // On mobile, --current-sidebar-width will be 0, making it '1fr'.
        // On desktop, it will be '5rem 1fr' or '16rem 1fr'.
        gridTemplateColumns: `var(--current-sidebar-width) 1fr`
      }}
    >
      <SellerNavbar /> {/* No need to pass onStateChange now, it controls CSS variables */}

      {/* The main content area.
          CORRECTED: Use `col-start-2` for Tailwind.
          It always starts in the second column IF a sidebar width is present.
          If --current-sidebar-width is 0 (mobile), the grid effectively becomes `0fr 1fr`,
          and `col-start-2` will still reference the second (and only substantial) column.
      */}
      <main className="col-start-2 pt-16 transition-all duration-300">
        <div className="w-full h-full"> {/* Ensure content takes full available space */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerMain;