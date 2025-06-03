import React, { useState, useEffect } from 'react';
import { socketurl } from '../../../config';
import { useAuth } from '../../context/AuthContext';

const MyProfile = () => {
  const { user } = useAuth();
  const id = user.sellerInfo._id;
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  // State for active tab
  const [activeTab, setActiveTab] = useState('Shop');

  // Set a random banner background image only once when the component mounts
  const [bannerUrl] = useState(() => {
    const bannerImages = [
      "https://plus.unsplash.com/premium_photo-1701090940014-320b715b5a8c?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z3JheSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1528465424850-54d22f092f9d?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y292ZXIlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D"
    ];
    return bannerImages[Math.floor(Math.random() * bannerImages.length)];
  });

  // Fetch seller data from the API when component mounts
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

  if (loading) return <p>Loading...</p>;
  if (!sellerData) return <p>No seller data available</p>;

  // Map API data to UI profile data; use fallback defaults if needed.
  const profileData = {
    username: sellerData.companyName || "swiftbid",
    displayName: sellerData.userInfo.userName || "Swiftbid",
    profileUrl: sellerData.userInfo.profileURL || "https://st4.depositphotos.com/15648834/23779/v/450/depositphotos_237795804-stock-illustration-unknown-person-silhouette-profile-picture.jpg",
    rating: sellerData.rating || 4.9,
    reviews: sellerData.reviews || "5.2K",
    itemsSold: sellerData.itemsSold || "16.4K",
    avgShipTime: sellerData.shippingInfo?.dispatchTime || "1 day",
    following: sellerData.following || 9,
    followers: sellerData.followers || "38K",
    bio: sellerData.bio || [
      "$1 clothing liquidation pallets at your very best prices🔥",
      "Streaming 4-5 times a week. @swiftbidwhatnot on insta",
      "All orders shipped within 24 HOURS!",
      "No cancellations. Bid responsibly!!",
      "Thanks for the support and happy buying :)"
    ],
    upcomingShows: sellerData.upcomingShows || [
      { status: "Live", viewers: "136", time: null, image: "https://via.placeholder.com/300x400" },
      { status: null, viewers: "68", time: "Today 8:30 PM", image: "https://via.placeholder.com/300x400" },
      { status: null, viewers: "34", time: "Tomorrow 2:30 AM", image: "https://via.placeholder.com/300x400" },
      { status: null, viewers: "31", time: "Tomorrow 4:30 PM", image: "https://via.placeholder.com/300x400" }
    ]
  };

  // Function to render the content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Shop':
        return (
          <div>
            <h2 className="text-xl font-bold">Shop Content</h2>
            <p>Display shop items or related content here.</p>
          </div>
        );
      case 'Shows':
        return (
          <div>
            <h2 className="text-xl font-bold">Upcoming Shows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {profileData.upcomingShows.map((show, index) => (
                <div key={index} className="card rounded-lg bg-base-100 shadow-md">
                  <figure className="relative">
                    <img src={show.image} alt="Show" className="w-full h-64 object-cover" />
                    <div className="absolute top-0 left-0 p-2 flex justify-between w-full">
                      {show.status ? (
                        <span className="badge badge-error text-white">
                          {show.status} • {show.viewers}
                        </span>
                      ) : (
                        <span className="badge badge-ghost bg-white">
                          {show.time}
                        </span>
                      )}
                      <button className="btn btn-circle btn-sm bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    {!show.status && (
                      <div className="absolute bottom-0 right-0 p-2">
                        <span className="badge badge-ghost bg-white">
                          {show.viewers}
                        </span>
                      </div>
                    )}
                  </figure>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Reviews':
        return (
          <div>
            <h2 className="text-xl font-bold">Reviews</h2>
            <p>Display reviews content here.</p>
          </div>
        );
      case 'Clips':
        return (
          <div>
            <h2 className="text-xl font-bold">Clips</h2>
            <p>Display clips content here.</p>
          </div>
        );
      case 'Orders':
        return (
          <div>
            <h2 className="text-xl font-bold">Orders</h2>
            <p>Display orders content here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Profile Banner */}
      <div
        className="w-full h-64 bg-gray-300 bg-cover bg-center"
        style={{
          backgroundImage: `url('${bannerUrl}')`
        }}
      ></div>

      {/* Profile Content */}
      <div className="container mx-auto bg-white rounded-lg shadow-lg -mt-20 relative z-10 max-w-5xl">
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="flex items-start gap-4">
              <div className="avatar">
                <div className="w-24 rounded-lg bg-gray-200">
                  <img
                    src={profileData.profileUrl}
                    alt="Profile"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profileData.username}</h1>
                <p className="text-gray-600">{profileData.displayName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {profileData.rating} Rating
                  </span>
                  <span className="text-gray-500">•</span>
                  <span>{profileData.itemsSold} Sold</span>
                  <span className="text-gray-500">•</span>
                  <span>{profileData.avgShipTime} Avg Ship Time</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <button className="btn btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="btn btn-outline rounded-full">Message</button>
              <button className="btn bg-yellow-400 rounded-full">Follow</button>
              <button className="btn btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="flex justify-end gap-6 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.following}</div>
              <div className="text-gray-500">following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.followers}</div>
              <div className="text-gray-500">followers</div>
            </div>
          </div>
          {/* Bio */}
          <div className="mt-6">
            {profileData.bio.map((line, index) => (
              <p key={index} className="mb-1">{line}</p>
            ))}
          </div>
          {/* Navigation Tabs */}
          <div className="flex border-b mt-6 overflow-x-auto">
            {['Shop', 'Shows', 'Orders', 'Clips'].map(tab => (
              <button
                key={tab}
                className={`btn btn-ghost rounded-lg flex-shrink-0 ${activeTab === tab ? 'border-b-2 border-black' : 'border-b border-transparent'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
