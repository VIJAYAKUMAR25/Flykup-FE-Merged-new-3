import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share, Play, ShoppingBag, Video, Calendar, Package, Store, ChevronLeft, Loader2, Share2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socketurl } from '../../../config';
import { toast } from 'react-toastify';
const SellerProfile = () => {
  const { user } = useAuth();
  const id = user.sellerInfo._id;
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shop");
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const response = await fetch(`${socketurl}/api/seller/get/${id}`);
        const data = await response.json();
        setSellerData(data);
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-newWhite">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-lg font-medium text-gray-700">Your seller profile is loading...</p>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">No seller data available</p>
        </div>
      </div>
    );
  }

  const dummySeller = {
    displayName: sellerData.companyName || "Fashion Hub",
    username: sellerData.userInfo.userName || "Your Name",
    profileUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      sellerData?.userInfo?.userName || "User"
    )}&background=random`,
    followers: "18.2K",
    following: "320",
    bio: [
      "Authentic Tamil Nadu handicrafts from skilled artisans",
      "Family business since 1975 • Shipping across India",
      "📍 Chennai, Tamil Nadu"
    ],
    shop: [
      { id: 1, name: "Kanchipuram Silk Saree", price: "₹5,499", size: "Free Size", image: "https://picsum.photos/id/1061/300/300" },
      { id: 2, name: "Tanjore Painting (Lakshmi)", price: "₹3,299", size: "Medium", image: "https://picsum.photos/id/1063/300/300" },
      { id: 3, name: "Brass Kuthu Vilakku", price: "₹1,799", size: "Standard", image: "https://picsum.photos/id/1064/300/300" },
      { id: 4, name: "Palm Leaf Manuscript Notebook", price: "₹799", size: "A5", image: "https://picsum.photos/id/1065/300/300" }
    ],
    videos: [
      {
        id: 1,
        title: "Handloom Weaving of Kanchipuram Sarees",
        hashtags: "#kanchipuramsilk #handloom #tamilnadu",
        username: "tamil_crafts",
        views: "55.3K",
        image: "https://picsum.photos/id/1066/300/375"
      },
      {
        id: 2,
        title: "Tanjore Painting: Gold Leaf Art Process",
        hashtags: "#tanjorepainting #goldleafart #traditional",
        username: "tamil_crafts",
        views: "42.1K",
        image: "https://picsum.photos/id/1067/300/375"
      },
      {
        id: 3,
        title: "Crafting Brass Kuthu Vilakku",
        hashtags: "#brasscraft #lampmaking #handmade",
        username: "tamil_crafts",
        views: "22.8K",
        image: "https://picsum.photos/id/1068/300/375"
      }
    ],
    shows: [
      { id: 1, status: "LIVE", viewers: "2.5K", image: "https://picsum.photos/id/1069/300/375" },
      { id: 2, status: "Upcoming", time: "Tomorrow, 6 PM", image: "https://picsum.photos/id/1070/300/375" },
      { id: 3, status: "Ended", views: "7.2K", image: "https://picsum.photos/id/1071/300/375" }
    ],
    orders: [
      { id: 1, name: "Panchaloha Ganesha Idol", status: "Delivered on 10 Mar", productImage: "https://picsum.photos/id/1072/100/100", rating: 5, price: "₹2,999" },
      { id: 2, name: "Handmade Clay Golu Dolls", status: "Shipped • Arriving Tomorrow", productImage: "https://picsum.photos/id/1073/100/100", price: "₹1,499" },
      { id: 3, name: "Brass Veena Miniature", status: "Processing", productImage: "https://picsum.photos/id/1074/100/100", price: "₹2,199" }
    ]
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case "shop":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dummySeller.shop.map((item) => (
              <div key={item.id} className="bg-newWhite hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden border border-gray-100">
                <figure className="relative">
                  <img src={item.image} alt={item.name} className="w-full h-48 sm:h-40 object-cover" />
                  <div className="absolute top-3 right-3">
                    <button className="p-2 bg-newWhite/80 backdrop-blur-sm rounded-full border-none shadow-sm hover:bg-newWhite transition-all">
                      <Heart className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </figure>
                <div className="p-4">
                  <h3 className="font-medium text-base mb-1 line-clamp-1">{item.name}</h3>
                  <p className="text-newBlack font-semibold text-base">{item.price}</p>
                  <p className="text-sm text-gray-500">{item.size}</p>
                  <button className="mt-3 py-2 px-4 w-full bg-newYellow hover:bg-amber-200 text-newBlack font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <ShoppingBag className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case "videos":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dummySeller.videos.map((video) => (
              <div key={video.id} className="relative rounded-xl overflow-hidden shadow-sm aspect-[3/4]">
                <img src={video.image} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-newBlack/70 via-newBlack/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-newWhite/20 backdrop-blur flex items-center justify-center">
                      <Play className="w-4 h-4 text-newWhite" fill="white" />
                    </div>
                    <span className="text-newWhite text-sm font-medium">{video.views}</span>
                  </div>
                  <h3 className="text-newWhite font-semibold text-base line-clamp-1">{video.title}</h3>
                  <p className="text-newWhite/80 text-sm mt-1 line-clamp-1">{video.hashtags}</p>
                  <div className="flex justify-between mt-4">
                    <button className="flex items-center text-newWhite/90 text-sm">
                      <Heart className="w-4 h-4 mr-1" /> 4.2K
                    </button>
                    <button className="flex items-center text-newWhite/90 text-sm">
                      <MessageSquare className="w-4 h-4 mr-1" /> 162
                    </button>
                    <button className="flex items-center text-newWhite/90 text-sm">
                      <Share className="w-4 h-4 mr-1" />
                    </button>
                  </div>
                  <button className="mt-4 py-2 w-full bg-newYellow hover:bg-amber-200 text-newBlack font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <ShoppingBag className="w-4 h-4" /> Shop Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case "shows":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dummySeller.shows.map((show) => (
              <div key={show.id} className="relative rounded-xl overflow-hidden shadow-sm aspect-[3/4]">
                <img src={show.image} alt={`Show ${show.id}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-newBlack/70 via-newBlack/20 to-transparent flex flex-col justify-between p-4">
                  <div className={`self-start px-3 py-1 rounded-full text-sm font-medium ${show.status === "LIVE" ? "bg-rose-500 text-newWhite animate-pulse" :
                    show.status === "Upcoming" ? "bg-amber-300 text-newBlack" :
                      "bg-gray-500/80 text-newWhite"
                    }`}>
                    {show.status}
                    {show.status === "LIVE" && ` • ${show.viewers}`}
                    {show.status === "Upcoming" && ` • ${show.time}`}
                    {show.status === "Ended" && ` • ${show.views}`}
                  </div>

                  <div className="mt-auto space-y-3">
                    {show.status === "LIVE" && (
                      <button className="py-2 w-full bg-rose-500 hover:bg-rose-600 text-newWhite font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                        <Play className="w-4 h-4" fill="white" /> Watch Now
                      </button>
                    )}

                    {show.status === "Upcoming" && (
                      <button className="py-2 w-full bg-amber-400 hover:bg-amber-500 text-newBlack font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" /> Set Reminder
                      </button>
                    )}

                    {show.status === "Ended" && (
                      <button className="py-2 w-full bg-newWhite/20 hover:bg-newWhite/30 text-newWhite font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                        <Play className="w-4 h-4" fill="white" /> Watch Replay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "orders":
        return (
          <div className="space-y-4">
            {dummySeller.orders.map((order) => (
              <div key={order.id} className="bg-newWhite rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 flex items-center">
                  <div className="relative flex-shrink-0">
                    <img src={order.productImage} alt={order.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                    <div className="absolute -top-1 -right-1 bg-newYellow/70 rounded-full w-6 h-6 flex items-center justify-center">
                      <ShoppingBag className="w-3 h-3 text-newBlack" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between flex-wrap">
                      <h3 className="font-medium text-base">{order.name}</h3>
                      <span className="text-newBlack font-semibold text-base">{order.price}</span>
                    </div>
                    <p className={`text-sm mt-1 ${order.status.includes("Delivered") ? "text-emerald-600" :
                      order.status.includes("Shipped") ? "text-blue-600" : "text-gray-600"
                      }`}>
                      {order.status.includes("Delivered") && "✓ "}
                      {order.status}
                    </p>
                    {order.rating && (
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < order.rating ? "text-amber-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">18 Mar</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 flex items-center justify-between text-sm">
                  <button className="text-newBlack font-medium">View Details</button>
                  <button className="text-gray-600">Need Help?</button>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/seller/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this reel!',
          text: 'Hey, check out this amazing video reel!',
          url: shareUrl,
        });
        console.log('Shared successfully');
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          // Optionally, use your toast library for feedback:
          toast.success("Link copied to clipboard!");
        })
        .catch(err => console.error("Error copying link:", err));
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 shadow-md py-2 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Back button with improved styling */}
            <button
              onClick={() => navigate("/")}
              className="bg-white rounded-full py-2 px-4 flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
              <span className="text-gray-700 text-sm font-medium">Back</span>
            </button>

            {/* Shop title with badge */}
            <div className="flex items-center gap-2 bg-white py-1.5 px-3 rounded-full shadow-sm border border-amber-200">
              <Store className="w-5 h-5 text-amber-600" />
              <div className="flex flex-col items-center">
                <h1 className="text-gray-800 font-semibold text-lg">{sellerData.companyName}</h1>
                <span className="text-xs text-amber-600 -mt-1">Verified Seller</span>
              </div>
              <div className="flex items-center bg-amber-100 rounded-full px-2 py-0.5 ml-1">
                <span className="text-amber-700 text-xs font-medium">4.8</span>
                <svg className="w-3 h-3 text-amber-500 ml-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>

            {/* Actions menu */}
            <button className="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5">
        <div className="bg-newWhite rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-newYellow/20 p-1 mx-auto sm:mx-0">
              <img
                src={dummySeller.profileUrl}
                alt={dummySeller.displayName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                    <h1 className="text-xl font-bold">{dummySeller.displayName}</h1>
                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-newYellow/40">
                      <div className="text-newBlack text-xs font-bold">✓</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">@{dummySeller.username}</p>
                  <div className="flex gap-4 mt-2 justify-center sm:justify-start">
                    <p className="text-newBlack text-sm"><span className="font-bold">{dummySeller.following}</span> Following</p>
                    <p className="text-newBlack text-sm"><span className="font-bold">{dummySeller.followers}</span> Followers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-center sm:justify-end">
                  <button className="py-2 px-4 bg-newBlack/20 hover:bg-amber-200 text-newBlack font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    onClick={handleShare}>
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    className="py-2 px-4 bg-newYellow hover:bg-amber-200 text-newBlack rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit Profile
                  </button>
                </div>
              </div>
              <div className="mt-3 text-newBlack space-y-1 text-center sm:text-left">
                {dummySeller.bio.map((line, index) => (
                  <p key={index} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5">
        <div className="bg-white rounded-full shadow-sm border border-gray-100 p-1.5 flex items-center overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all ${activeTab === "shop"
              ? "bg-newBlack text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm">Shop</span>
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all ${activeTab === "videos"
              ? "bg-newBlack text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Video className="w-5 h-5" />
            <span className="text-sm whitespace-nowrap">ShopClips</span>
          </button>
          <button
            onClick={() => setActiveTab("shows")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all ${activeTab === "shows"
              ? "bg-newBlack text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Play className="w-5 h-5" />
            <span className="text-sm">Shows</span>
          </button>
          {/* <button 
            onClick={() => setActiveTab("orders")} 
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all ${
              activeTab === "orders" 
                ? "bg-newBlack text-white font-medium" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Package className="w-5 h-5" /> 
            <span className="text-sm">Your Orders</span> 
          </button> */}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SellerProfile;