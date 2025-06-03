import React, { useEffect, useState } from 'react';
import { useNavigate ,useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { 
  FiShoppingBag, 
  FiFilm, 
  FiRadio, 
  FiUserPlus, 
  FiMapPin, 
  FiShare2, 
  FiChevronLeft,
 
} from 'react-icons/fi';
import { UserPlus, MessageCircle,Users, Package } from 'lucide-react';
import { MdVerified } from "react-icons/md";
import { toast } from 'react-toastify';
import EditProfileModal from './ProfileWithBacground.jsx';
// import ProductsFeed from '../ProfileComponents/ProductsFeed.jsx';
import ShowsFeed from '../ProfileComponents/ShowsFeed.jsx';
import ShoppableVideosFeed from '../ProfileComponents/ShoppableVideosFeed.jsx';
import axiosInstance from '../../utils/axiosInstance.js';

const SellerProfile = () => {
  const { userName } = useParams();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user.role === 'seller' ? 'shop' : 'becomeSeller');

  // Static social links for demonstration
 



  useEffect(() => {
    const fetchUser = async () => {
        try {
        
            const response = await axiosInstance.get(`profile/${userName}`);
            const data = response.data; 
            console.log("User Data:", data);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };
    if (!userName) {
        console.log("ERROR FETCJING USER");
    }else{
      fetchUser();
    }
}, [userName]);



  const tabs = [
    { id: 'shop', label: 'Shop', icon: FiShoppingBag, role: 'seller' },
    { id: 'videos', label: 'ShopClips', icon: FiFilm, role: 'seller' },
    { id: 'shows', label: 'Shows', icon: FiRadio, role: 'seller' },
    { id: 'becomeSeller', label: 'Become a Seller', icon: FiUserPlus, role: 'user' },
    { id: 'address', label: 'Address', icon: FiMapPin, role: 'user' },
  ];

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/user/${userName}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${user.name}'s profile`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shop': return <ProductsFeed />;
      case 'videos': return <ShowsFeed />;
      case 'shows': return <ShoppableVideosFeed />;
      case 'becomeSeller': return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-6 bg-white rounded-lg shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Become a Seller
          </h2>
          <p className="text-gray-600 mb-6">
            Start your selling journey today! Join our community of sellers.
          </p>
          <button className="btn btn-primary px-8 py-2 rounded-full">
            Get Started
          </button>
        </motion.div>
      );
      case 'address': return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Saved Addresses
          </h2>
          <button className="btn btn-outline btn-primary w-full">
            Add New Address
          </button>
        </motion.div>
      );
      default: return null;
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div 
    className="h-64 bg-cover bg-center relative"
    style={{ backgroundImage: `url(${user.backgroundCoverURL?.jpgURL || 'https://via.placeholder.com/1200x300'})` }}
  >
    <div className="absolute inset-0 bg-black/40 flex items-end p-4">
      {/* Navigation and Share Buttons */}
      <button 
        onClick={() => navigate(-1)}
        className="btn btn-circle btn-sm absolute top-4 left-4 bg-white/80 hover:bg-white"
      >
        <FiChevronLeft className="text-xl text-gray-800" />
      </button>
      <div className="flex gap-2 absolute top-4 right-4">
        <button 
          onClick={handleShare} 
          className="btn btn-circle btn-sm bg-white/80 hover:bg-white"
        >
          <FiShare2 className="text-gray-800" />
        </button>
        <EditProfileModal/>
      </div>
    </div>

    {/* Profile Image positioned over background */}
    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
      <div className="relative group">
        <img
          src={user.profileURL?.jpgURL || `https://ui-avatars.com/api/?name=${user.name}`}
          alt="Profile"
          className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-xl"
        />
        
      </div>
    </div>
  </div>
      {/* Profile Content */}
      <div className="container mx-auto pt-10"> 
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white shadow-xl rounded-xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative pt-6 z-40">
            {/* Profile Image */}
            

            {/* Profile Info */}
            <div className="text-center px-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {user.name}
              </h1>
              <p className="text-gray-600 text-sm mb-1">
                @{user.userName}
              </p>
              {user.role === 'seller' && (
                <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium space-x-1">
                  
                  <MdVerified size={18} className='text-blue-600' />
                <span className='font-bold '>Verified Seller</span>
              </div>
              )}
              <p className="text-gray-500 mt-2 max-w-xl mx-auto">
                {user.bio || 'No bio available'}
              </p>

             
              <div className="flex justify-center space-x-4 mt-2">
                <button className="flex items-center px-4 py-1 bg-newYellow text-newBlack  hover:text-newYellow rounded-full hover:bg-newBlack transition-colors">
                  <UserPlus className="mr-2" size={20} />
                  Follow
                </button>
                <button className="flex items-center px-4 py-1 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors">
                  <MessageCircle className="mr-2" size={20} />
                  Message
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center mt-3 pb-6">
            <div className="grid grid-cols-3 gap-6 text-center w-full max-w-md">
              <div className="flex flex-col items-center">
                <div className='flex gap-2 items-center'>
                    <Users className=" text-newBlack" size={20} />
                    <p className="text-xl font-bold text-newBlack">1.2K</p>
                </div>
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <div className="flex flex-col items-center">
                <div className='flex gap-2 items-center'>
                    <UserPlus className=" text-newBlack" size={20} />
                    <p className="text-xl font-bold text-newBlack">200</p>
                </div>
                <p className="text-gray-600 text-sm">Following</p>
              </div>
              <div className="flex flex-col items-center">
                <div className='flex items-center gap-2'>
                    <Package className=" text-newBlack" size={20} />
                    <p className="text-xl font-bold text-newBlack">20</p>
                </div>
                <p className="text-gray-600 text-sm">Products</p>
              </div>
            </div>
          </div>

          </div>

          {/* Tabs Navigation */}
          <div className="border-t border-gray-200">
            <div className="flex justify-center">
              {tabs
                .filter(tab => tab.role === user.role)
                .map(tab => (
                  <button
                    key={tab.id}
                    className={`px-6 py-4 text-sm ${
                      activeTab === tab.id 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-gray-600 hover:text-primary'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerProfile;