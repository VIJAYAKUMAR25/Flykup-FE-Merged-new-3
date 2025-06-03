import React from "react";
import { PlusCircle, Users, Search, Video, TrendingUp, Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sellers = [
  { name: "Seller A", status: "Available", avatar: "/api/placeholder/40/40", rating: 4.8 },
  { name: "Seller B", status: "Live Now", avatar: "/api/placeholder/40/40", rating: 4.5 },
  { name: "Seller C", status: "Offline", avatar: "/api/placeholder/40/40", rating: 4.9 },
];

const collaborators = [
  { name: "Brand X", role: "Partner", logo: "/api/placeholder/40/40", products: 12 },
  { name: "Brand Y", role: "Affiliate", logo: "/api/placeholder/40/40", products: 8 },
];

const connections = [
  { name: "User 1", type: "Customer", avatar: "/api/placeholder/40/40", lastActive: "2 hours ago" },
  { name: "User 2", type: "Follower", avatar: "/api/placeholder/40/40", lastActive: "1 day ago" },
  { name: "User 3", type: "VIP Customer", avatar: "/api/placeholder/40/40", lastActive: "Just now" },
];

const stats = [
  { label: "Total Sales", value: "$12,540", change: "+12%" },
  { label: "Live Views", value: "8,721", change: "+5%" },
  { label: "Engagement", value: "67%", change: "+3%" },
  { label: "Connections", value: "238", change: "+15%" },
];

const ShipperPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-50 min-h-screen">  

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shipper Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your streams, collaborations, and connections</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="flex items-center justify-between mt-2">
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Go Live Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">Go Live Now</h2>
              <p className="opacity-90 mt-1">Start streaming and selling to your audience instantly</p>
            </div>
            <button className="bg-white text-blue-800 hover:bg-blue-50 py-3 px-5 rounded-lg shadow-sm font-medium flex items-center justify-center"
            onClick={() => navigate("/shipper/allshows")}>
              <Video size={18} className="mr-2" />
              Start Streaming
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sellers Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <Search size={20} className="text-gray-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Featured Sellers</h2>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sellers..."
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {sellers.map((seller, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <img 
                        src={seller.avatar} 
                        alt={seller.name} 
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-800">{seller.name}</h3>
                          <div className="flex items-center">
                            <span className="text-sm text-yellow-500 mr-1">★</span>
                            <span className="text-sm text-gray-600">{seller.rating}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${
                          seller.status === "Live Now" 
                            ? "text-red-500" 
                            : seller.status === "Available" 
                              ? "text-green-500" 
                              : "text-gray-400"
                        }`}>
                          {seller.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium">
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center mx-auto">
                  View all sellers
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collaborations Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <PlusCircle size={20} className="text-blue-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Brand Collaborations</h2>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  New Collaboration
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {collaborators.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <img 
                          src={c.logo} 
                          alt={c.name} 
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{c.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{c.role}</span>
                          <span className="text-xs text-gray-500 ml-2">{c.products} products</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connections Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <Users size={20} className="text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Connections</h2>
              </div>
              
              <div className="space-y-4">
                {connections.map((conn, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <img 
                        src={conn.avatar} 
                        alt={conn.name} 
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <h3 className="font-medium text-gray-800">{conn.name}</h3>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">{conn.type}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full mx-2"></span>
                          <span className="text-xs text-gray-400">{conn.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border-t border-gray-100 pt-6">
                <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center">
                  View All Connections
                </button>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-600 mb-3">Our support team is available 24/7 to assist with your questions.</p>
                <button className="w-full bg-white text-blue-600 border border-blue-200 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperPage;