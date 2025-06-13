import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
const Nav = () => {
  const navigate = useNavigate();

  const [user, setUser] =useState(null);

 
  return (
    <nav className="shadow-md">
      <div className="max-w-8xl rounded-3xl bg-primaryYellow mx-auto my-5 px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-blue-600">Logo</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {!user ? (
              <>
                <Link
                  to="/auth/login-email"
                  className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                // onClick={signOut}
                className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            )}

            <button className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-150">
              Become a Seller
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
