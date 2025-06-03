import React, { useRef } from 'react';
import { Play, ShoppingBag, Heart, Store, TrendingUp, UserPlus, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
const MainFeed = () => {
  const videoRef = useRef(null);

  const { user } = useAuth();
  console.log("MainFeed component rendered",user);
  return (
    <div className="relative min-h-screen">
      {/* Full-screen Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source 
          src="https://flykup.in/wp-content/uploads/2025/02/3a49bb548b7c4f08b3a47eb4447beaaa.mp4" 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      {/* Optional Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto flex flex-col lg:flex-row-reverse items-center min-h-screen">
        {/* Video Content Section (Overlay Text) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-12 text-white">
          <div className="mb-4 lg:mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Play className="w-4 h-4 mr-2" />
              <span className="text-sm">Live Shopping Experience</span>
            </div>
          </div>

          <h2 className="text-2xl lg:text-4xl font-bold mb-3 lg:mb-6">Shop While You Watch</h2>
          <p className="text-sm lg:text-lg mb-4 lg:mb-8 max-w-md">
            Discover trending products through interactive live streams and shop instantly.
          </p>

          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center backdrop-blur-xs bg-white/5 p-2 lg:p-4 rounded-lg hover:bg-white/10 transition-colors duration-300">
              <ShoppingBag className="w-4 h-4 lg:w-6 lg:h-6 mr-2 lg:mr-4" />
              <span className="text-xs lg:text-base">Buy products with a single click</span>
            </div>
            
            <div className="flex items-center backdrop-blur-xs bg-white/5 p-2 lg:p-4 rounded-lg hover:bg-white/10 transition-colors duration-300">
              <Heart className="w-4 h-4 lg:w-6 lg:h-6 mr-2 lg:mr-4" />
              <span className="text-xs lg:text-base">Save your favorite items</span>
            </div>

            <div className="flex items-center backdrop-blur-xs bg-white/5 p-2 lg:p-4 rounded-lg hover:bg-white/10 transition-colors duration-300">
              <Play className="w-4 h-4 lg:w-6 lg:h-6 mr-2 lg:mr-4" />
              <span className="text-xs lg:text-base">Watch live product demonstrations</span>
            </div>
          </div>

          {/* Live Indicator */}
          <div className="absolute top-4 lg:top-8 right-4 lg:right-8 flex items-center bg-red-500 px-2 py-1 lg:px-4 lg:py-2 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            <span className="text-xs lg:text-sm font-medium">LIVE NOW</span>
          </div>
        </div>

        {/* Seller Onboarding Section */}
        <div className="w-full lg:w-1/2 h-auto overflow-y-auto">
          <div className="h-full bg-inputYellow rounded-2xl p-6 lg:p-12 flex flex-col justify-center items-center">
            <div className="max-w-lg w-full">
              <div className="">
                {/* Animated Icon */}
                <div className="relative">
                  <div className="w-16 lg:w-20 h-16 lg:h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <Store className="w-8 lg:w-10 h-8 lg:h-10 text-black bg-warning p-1 rounded-full" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Become a Seller
                  </h2>
                  <p className="text-primaryBlack font-semibold text-base lg:text-lg">Start your journey with us today</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="p-3 lg:p-4 bg-primaryBlack rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <UserPlus className="w-5 lg:w-6 h-5 lg:h-6 text-white mb-2" />
                  <h3 className="font-medium text-warning text-sm lg:text-base">Quick Setup</h3>
                  <p className="text-xs lg:text-sm text-gray-500">Easy registration process</p>
                </div>
                <div className="p-3 lg:p-4 bg-primaryBlack rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <Package className="w-5 lg:w-6 h-5 lg:h-6 text-white mb-2" />
                  <h3 className="font-medium text-warning text-sm lg:text-base">List Products</h3>
                  <p className="text-xs lg:text-sm text-gray-500">Start selling instantly</p>
                </div>
                <div className="p-3 lg:p-4 bg-primaryBlack rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 text-white mb-2" />
                  <h3 className="font-medium text-sm text-warning lg:text-base">Growth</h3>
                  <p className="text-xs lg:text-sm text-gray-500">Expand your business</p>
                </div>
                <div className="p-3 lg:p-4 bg-primaryBlack rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <ShoppingBag className="w-5 lg:w-6 h-5 lg:h-6 text-white mb-2" />
                  <h3 className="font-medium text-sm text-warning lg:text-base">Live Sales</h3>
                  <p className="text-xs lg:text-sm text-gray-500">Real-time transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainFeed;
