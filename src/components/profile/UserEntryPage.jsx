import React, { useState, useEffect } from 'react';
import { ShoppingBag, Play, Radio, Search, Heart, ShoppingCart, SlidersHorizontal, X, ChevronRight, Truck, Star, Tag } from 'lucide-react';
import ShowsFeed from './ShowsFeed.jsx'
import ProductsFeed from './ProductsFeed.jsx';
import ShoppableVideosFeed from './ShoppableVideosFeed.jsx';
import PayUPaymentGateway from '../products/PayUPaymentGateway.jsx';
const ShoppingTabsLayout = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [savedCount, setFavoriteCount] = useState(5);

  const contentTypes = [
    {
      id: 'images',
      title: 'Images',
      icon: <ShoppingBag className="w-5 h-5" />,
      count: ""
    },
    {
      id: 'videos',
      title: 'Videos',
      icon: <Play className="w-5 h-5" />,
      count: ""
    },
    {
      id: 'livestreams',
      title: 'Live',
      icon: <Radio className="w-5 h-5" />,
      count: ""
    }
  ];

  // Reset filters visibility when switching away from images tab
  useEffect(() => {
    if (activeTab !== 'images') {
      setIsFiltersVisible(false);
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'images':
        return (
          <div className="w-full p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Discover Products</h2>
              <div className="flex space-x-2">
                <button className="text-sm font-medium text-gray-600 hover:text-black">Recent</button>
                <button className="text-sm font-medium text-gray-600 hover:text-black">Popular</button>
                <button className="text-sm font-medium text-black border-b-2 border-black">Featured</button>
              </div>
            </div>

            <ProductsFeed />

            {/* Active filters display */}
            {isFiltersVisible && (
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-sm mr-1">Fashion</span>
                  <button><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-sm mr-1">₹500 - ₹1000</span>
                  <button><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}



            <div className="mt-8 flex justify-center">
              <button className="flex items-center px-5 py-2 border border-gray-300 rounded-full hover:bg-gray-50">
                <span className="font-medium mr-2">Load More</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      case 'videos':
        return (
          <div className="w-full p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold">Shop from Videos</h2>
              <div className="flex space-x-4">
                <button className="px-3 py-1 text-sm font-medium bg-black text-white rounded-full">New</button>
                <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full">Trending</button>
                <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full">Suggested</button>
              </div>
            </div>

            <ShoppableVideosFeed />


          </div>
        );
      case 'livestreams':
        return (
          <div className="w-full px-6 py-2 bg-white rounded-xl shadow-md">
            <div className="flex items-center justify-between ">
              <h2 className="text-2xl font-bold">Live Shopping Events</h2>
              <div className="flex items-center space-x-2 bg-red-600 rounded-full px-2 py-1 text-white">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-sm text-white font-medium"> Live Now</span>
              </div>
            </div>

            {/*             
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Upcoming Events</h3>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="shrink-0 w-48 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="font-medium text-sm">Spring Collection Launch</p>
                    <p className="text-xs text-gray-600 mt-1">Tomorrow, {Math.floor(Math.random() * 12) + 1}:00 PM</p>
                    <div className="mt-2 text-xs bg-black text-white px-2 py-1 rounded-full inline-block">
                      Set Reminder
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <Radio className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                      <span>LIVE</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                      {(Math.random() * 2 + 0.5).toFixed(1)}k watching
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between">
                      <p className="font-medium">Celebrity Style Showcase {item}</p>
                      <button className="text-red-500">
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">With Fashion Influencer {item}</p>
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-gray-100 rounded"></div>
                      ))}
                    </div>
                    <button className="w-full mt-3 bg-black text-white rounded-full py-2 text-sm font-medium">
                      Join Stream
                    </button>
                  </div>
                </div>
              ))}
            </div> */}
            <ShowsFeed />
          </div>
        );
      default:
        return <div className="w-full p-4">Select a content type</div>;
    }
  };

  return (
    <div className="w-full mx-auto flex flex-col items-center bg-white min-h-screen">
      {/* Header with Cart and Filter Controls - Fixed at top for better usability */}
      {/* <div className="sticky top-0 w-full bg-white shadow-sm z-10 py-2">
      <div className="w-full max-w-6xl mx-auto px-4 flex items-center justify-between">
       
        <div className="flex items-center space-x-2">
          {activeTab === 'images' && (
            <button 
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className={`flex items-center justify-center p-2 border rounded-full hover:bg-gray-50 ${
                isFiltersVisible ? 'bg-black text-white border-black hover:bg-gray-800' : 'bg-white border-gray-300'
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          )}
          
          <button 
            className="flex items-center justify-center p-2 bg-black text-white rounded-full hover:bg-gray-800 relative"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-newYellow text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div> */}

      {/* Enhanced Tabs Navigation */}
      <div className="flex justify-center mt-3 mb-3 w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-full p-1 flex w-full shadow-md">
          {contentTypes.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center px-3 py-2 text-sm font-medium transition-all flex-1 ${activeTab === tab.id
                  ? 'bg-black text-white rounded-full'
                  : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              <span className="mr-1 text-newYellow">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.title}</span>
              {tab.count > 0 && (
                <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Row - Horizontally scrollable for mobile */}
      <div className="w-full max-w-6xl px-4">
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2">
          <button className="shrink-0 bg-newYellow rounded-full px-4 py-2 text-sm font-medium flex items-center">
            <Tag className="w-4 h-4 mr-1.5 text-black" />
            <span className='text-black'>New Arrivals</span>
          </button>
          <button className="shrink-0 bg-newYellow rounded-full px-4 py-2 text-sm font-medium flex items-center">
            <Truck className="w-4 h-4 mr-1.5 text-black" />
            <span className='text-black'>Free Shipping</span>
          </button>
          <button className="shrink-0 bg-newYellow rounded-full px-4 py-2 text-sm font-medium flex items-center">
            <Star className="w-4 h-4 mr-1.5 text-black" />
            <span className='text-black'>Top Rated</span>
          </button>
          <button className="shrink-0 bg-newYellow rounded-full px-4 py-2 text-sm font-medium flex items-center">
            <Tag className="w-4 h-4 mr-1.5 text-black" />
            <span className='text-black'>Clearance</span>
          </button>
        </div>
      </div>


      {/* Collapsible Filters Panel - Better responsive layout */}
      {activeTab === 'images' && isFiltersVisible && (
        <div className="w-full max-w-6xl px-4 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg">Refine Results</h3>
              <button className="text-sm text-blue-600">Clear All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none">
                  <option>All Categories</option>
                  <option>Fashion</option>
                  <option>Electronics</option>
                  <option>Home</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Price Range</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none">
                  <option>All Prices</option>
                  <option>Under ₹500</option>
                  <option>₹500 - ₹1000</option>
                  <option>₹1000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sort By</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Brand</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none">
                  <option>All Brands</option>
                  <option>Brand A</option>
                  <option>Brand B</option>
                  <option>Brand C</option>
                </select>
              </div>
            </div>

            {/* Responsive rating filters */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="font-medium mb-2">Customer Ratings</h4>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <button key={rating} className="flex items-center border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                    <div className="flex">
                      {Array(rating).fill().map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400" fill="#FBBF24" />
                      ))}
                      {Array(5 - rating).fill().map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-xs ml-1">{rating === 5 ? "only" : "& up"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="bg-black text-white px-4 py-2 rounded-lg font-medium">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-width Content Area */}
      <div className="w-full max-w-6xl px-4 py-2 mb-2">
        {renderContent()}
      </div>

      {/* Mobile floating filter button - visible only on small screens when scrolled */}
      {activeTab === 'images' && (
        <div className="fixed bottom-4 right-4 sm:hidden z-10">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="bg-black text-white p-3 rounded-full shadow-lg flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingTabsLayout;