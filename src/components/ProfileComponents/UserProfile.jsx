import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingBag,
  FiFilm,
  FiRadio,
  FiUserPlus,
  FiMapPin,
  FiShare2,
  FiChevronLeft,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

import {
  UserPlus,
  MessageCircle,
  Users,
  Package,
  AlertCircle,
} from "lucide-react";
import { MdVerified } from "react-icons/md";
import { toast } from "react-toastify";
import EditProfileModal from "./ProfileWithBacground.jsx";
import ProductsFeed from "./ProductsFeed.jsx";
import ShowsFeed from "./ShowsFeed.jsx";
import ShoppableVideosFeed from "./ShoppableVideosFeed.jsx";
import axiosInstance from "../../utils/axiosInstance.js";
import { useAlert } from "../Alerts/useAlert.jsx";
import FollowModal from "./FollowModal.jsx";
import ShipperApplicationBanner from "./ShipperApplicationBanner.jsx";


import CohostModal from "../reuse/LiveStream/CoHostModal.jsx";

const UserProfile = () => {
  const { userName } = useParams();
  const navigate = useNavigate();
  const { positive, negative } = useAlert();

  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [shows, setShows] = useState([]);
  const [shoppableVideos, setShoppableVideos] = useState([]);
  const [followInfo, setFollowInfo] = useState({
    followersCount: 0,
    followingCount: 0,
    followStatus: "Follow",
  });
  const [localFollowState, setLocalFollowState] = useState({
    followStatus: "",
    followersCount: 0,
  });
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalShows, setTotalShows] = useState(0);
  const [totalShoppableVideos, setTotalShoppableVideos] = useState(0);
  const [sellerInfo, setSellerInfo] = useState({});
  const [shipperInfo, setShipperInfo] = useState({});
  const [ hostId, setHostId ] = useState(null);


  // --- Wrap fetchUser in useCallback for stable reference ---
  const fetchUser = useCallback(async () => {
    console.log("UserProfile: Fetching data for", userName);
    // Set loading true only if profileData isn't already available (prevents full page loading feel on refetch)
    if (!profileData) {
      setLoading(true);
    }
    try {
      const response = await axiosInstance.get(`profile/${userName}`);
      const data = response.data;
      console.log("UserProfile: Fetched Data:", data);

      // Update core profile data
      setProfileData(data.data);
      setFollowInfo(data.data.follow); // Update follow info based on fetched data

      if ( data?.data?.isSeller || data?.data?.isDropshipper){
          setHostId(data.data?.hostId)
      }

      // Update content based on fetched data
      if (data.data.isSeller) {
        const {
          counts,
          products,
          sellerInfo: sellerData,
          shows,
          shoppableVideos,
        } = data.data.seller;
        setProducts(products);
        setShows(shows);
        setShoppableVideos(shoppableVideos);
        setTotalProducts(counts.totalProducts);
        setTotalShows(counts.totalShows);
        setTotalShoppableVideos(counts.totalShoppableVideos);
        setSellerInfo(sellerData);
        // Set active tab only if it needs initialization or resetting
        setActiveTab((currentTab) =>
          currentTab === "loading" ||
          !["shop", "videos", "shows"].includes(currentTab)
            ? "shop"
            : currentTab
        );
      } else if (data.data.isDropshipper) {
        const {
          counts,
          shipperInfo: shipperData,
          shows,
          shoppableVideos,
        } = data.data.dropshipper;
        setShows(shows);
        setShoppableVideos(shoppableVideos);
        setTotalShows(counts.totalShows);
        setTotalShoppableVideos(counts.totalShoppableVideos);
        setShipperInfo(shipperData);
        setActiveTab((currentTab) =>
          currentTab === "loading" || !["videos", "shows"].includes(currentTab)
            ? "videos"
            : currentTab
        );
      } else if (data.data.isOwnProfile) {
        setActiveTab((currentTab) =>
          currentTab === "loading" ||
          !["becomeSeller", "address"].includes(currentTab)
            ? "becomeSeller"
            : currentTab
        );
      } else {
        setActiveTab((currentTab) =>
          currentTab === "loading" || currentTab !== "none"
            ? "none"
            : currentTab
        );
      }
    } catch (error) {
      console.error("UserProfile: Error fetching user:", error);
      toast.error("Failed to fetch user profile");
      setProfileData(null); // Clear data on error
      setActiveTab("error"); // Set a distinct tab state for error
    } finally {
      setLoading(false); // Always set loading false after attempt
    }
  }, [userName]); // userName is the primary trigger for fetching

  // Fetch user data when userName changes
  useEffect(() => {
    if (userName) {
      setActiveTab("loading"); // Reset tab state on user change
      fetchUser();
    }
    // Cleanup function
    return () => {};
  }, [userName, fetchUser]); // Run when userName changes

  // Update local follow state derived from followInfo
  useEffect(() => {
    if (followInfo) {
      setLocalFollowState({
        followStatus: followInfo.followStatus,
        followersCount: followInfo.followersCount,
      });
    }
  }, [followInfo]);

  // --- Define the callback for the modal ---
  // Depends only on the stable fetchUser function
  const handleProfileUpdate = useCallback(() => {
    console.log(
      "UserProfile: handleProfileUpdate triggered, re-fetching profile data."
    );
    fetchUser(); // Re-run the fetch logic
  }, [fetchUser]);

 
  // Define tabs configuration (kept as is)
  const tabs = [
    { id: "shop", label: "Shop", icon: FiShoppingBag, role: "seller" },
    { id: "videos", label: "ShopClips", icon: FiFilm, role: "seller" },
    { id: "shows", label: "Shows", icon: FiRadio, role: "seller" },
    { id: "videos", label: "ShopClips", icon: FiFilm, role: "dropshipper" },
    { id: "shows", label: "Shows", icon: FiRadio, role: "dropshipper" },
    {
      id: "becomeSeller",
      label: "Become a Host",
      icon: FiUserPlus,
      role: "user",
      ownerOnly: true,
    },
    {
      id: "address",
      label: "Address",
      icon: FiMapPin,
      role: "user",
      ownerOnly: true,
    },
  ];

  // Filter visible tabs based on profileData (calculate only when profileData is available)
  const visibleTabs = profileData
    ? tabs.filter((tab) => {
        let shouldShow = false;
        if (profileData.isSeller && tab.role === "seller") shouldShow = true;
        if (profileData.isDropshipper && tab.role === "dropshipper")
          shouldShow = true;
        if (tab.role === "user") {
          if (tab.id === "becomeSeller") {
            shouldShow =
              profileData.isOwnProfile &&
              !profileData.isSeller &&
              !profileData.isDropshipper;
          } else if (tab.id === "address") {
            shouldShow = profileData.isOwnProfile;
          } else {
            shouldShow = profileData.isOwnProfile && tab.ownerOnly === true;
          }
        }
        // Apply exclusion rules
        if (shouldShow) {
          if (tab.ownerOnly === true && !profileData.isOwnProfile) {
            shouldShow = false;
          }
          if (profileData.isDropshipper && tab.id === "shop") {
            shouldShow = false;
          }
          if (profileData.isDropshipper && tab.id === "address") {
            shouldShow = false;
          }
        }
        return shouldShow;
      })
    : []; // Return empty array if profileData is not loaded

  // Render tab content (ensure currentUserInfo exists)
  const renderTabContent = () => {
    // Show loading indicator inside tab content area if profile data is loaded but content might still be fetching/processing
    if (loading && profileData) {
      return (
        <div className="flex justify-center p-10">
          <span className="loading loading-dots loading-lg text-amber-500"></span>
        </div>
      );
    }

    const currentUserInfo = profileData?.user;
    if (!currentUserInfo) {
      // Check specifically for user info within profileData
      // This case might overlap with the main loading/error states handled below
      // If activeTab is 'error', show error message
      if (activeTab === "error") {
        return (
          <div className="text-center p-10 text-error">
            Could not load content for this tab.
          </div>
        );
      }
      // Otherwise, if still loading generally or data missing
      return (
        <div className="flex justify-center p-10">
          <span className="loading loading-dots loading-lg text-amber-500"></span>
        </div>
      );
    }

    switch (activeTab) {
      case "shop":
        return profileData?.isSeller ? (
          <ProductsFeed
            totalProducts={totalProducts}
            products={products}
            sellerInfo={sellerInfo}
            userInfo={currentUserInfo}
          />
        ) : null;

      case "videos":
        return profileData?.isSeller || profileData?.isDropshipper ? (
          <ShoppableVideosFeed
            totalShoppableVideos={totalShoppableVideos}
            hostId= {hostId}
            shoppableVideos={shoppableVideos}
            sellerInfo={sellerInfo} // Pass relevant info based on role if needed
            userInfo={currentUserInfo}
          />
        ) : null;

      case "shows":
        return profileData?.isSeller || profileData?.isDropshipper ? (
          <ShowsFeed
            totalShows={totalShows}
            hostId= {hostId}
            shows={shows}
            sellerInfo={sellerInfo} // Pass relevant info based on role if needed
            userInfo={currentUserInfo}
          />
        ) : null;

      case "becomeSeller":
        if (
          profileData?.isOwnProfile &&
          !profileData?.isSeller &&
          !profileData?.isDropshipper
        ) {
          return (
            <motion.div
              /* ... */ className="card bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg"
            >
              <div className="card-body text-center">
                <h2 className="card-title text-2xl font-bold justify-center mb-2">
                  Become a Host
                </h2>
                <p className="text-gray-700 mb-6">
                  Start your selling journey today! Join our community of
                  sellers.
                </p>
                <div className="card-actions justify-center">
                  <button className="btn btn-primary bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-none text-black font-semibold px-8">
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          );
        }
        return null;

      case "address":
        if (profileData?.isOwnProfile && !profileData?.isDropshipper) {
          return (
            <motion.div /* ... */ className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl font-semibold mb-4">
                  Saved Addresses
                </h2>
                <div className="card-actions">
                  <button className="btn btn-outline btn-warning w-full">
                    Add New Address
                  </button>
                </div>
              </div>
            </motion.div>
          );
        }
        return null;

      case "none":
        return (
          <div className="text-center p-10">
            <p className="text-gray-500">
              This user hasn't set up a shop or hosting profile yet.
            </p>
          </div>
        );

      case "loading": // Explicitly handle loading state within tabs
        return (
          <div className="flex justify-center p-10">
            <span className="loading loading-dots loading-lg text-amber-500"></span>
          </div>
        );

      case "error": // Explicitly handle error state within tabs
        return (
          <div className="text-center p-10 text-error">
            Failed to load profile content.
          </div>
        );

      default:
        return null;
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/user/${userName}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${profileData?.user?.name}'s profile`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        navigator.clipboard.writeText(shareUrl);
        positive("Profile link copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      positive("Profile link copied to clipboard!");
    }
  };

  // Handle follow/unfollow actions
  const handleFollowClick = async () => {
    if (!profileData?.user?._id) return; // Guard clause
    const originalState = { ...localFollowState };
    try {
      // Optimistic update
      setLocalFollowState((prevState) => ({
        followStatus: "Following",
        followersCount: prevState.followersCount + 1,
      }));
      const response = await axiosInstance.post(`follow`, {
        targetUserId: profileData.user._id,
      });
      positive(response.data.message);
    } catch (error) {
      // Revert on error
      setLocalFollowState(originalState);
      console.error("Error following user:", error);
      negative(error.response?.data?.message || "Failed to follow user");
    }
  };

  const handleUnFollowClick = async () => {
    if (!profileData?.user?._id) return; // Guard clause
    const originalState = { ...localFollowState };
    try {
      // Optimistic update
      setLocalFollowState((prevState) => ({
        followStatus: "Follow",
        followersCount: Math.max(0, prevState.followersCount - 1), // Prevent negative count
      }));
      const response = await axiosInstance.delete(`follow`, {
        data: { targetUserId: profileData.user._id },
      });
      positive(response.data.message);
    } catch (error) {
      // Revert on error
      setLocalFollowState(originalState);
      console.error("Error unfollowing user:", error);
      negative(error.response?.data?.message || "Failed to unfollow user");
    }
  };

  // Profile skeleton for loading state
  const ProfileSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Cover Photo Skeleton */}
      <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse relative">
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200 animate-pulse border-4 border-white shadow-lg"></div>
        </div>
      </div>
      {/* Profile Content Skeleton */}
      <div className="container mx-auto pt-20">
        <div className="card bg-base-100 shadow-xl">
          {/* Profile Header Skeleton */}
          <div className="card-body pt-6">
            {/* ... Rest of skeleton structure ... */}
          </div>
          {/* Tabs Navigation Skeleton */}
          <div className="border-t border-base-200">
            {/* ... Tabs skeleton ... */}
          </div>
          {/* Tab Content Skeleton */}
          <div className="p-6">{/* ... Content skeleton ... */}</div>
        </div>
      </div>
    </div>
  );

  // Get user initials for profile image fallback
  const getUserInitials = (username) => {
    if (!username) return "??";
    const alphanumericChars = username.replace(/[^a-zA-Z0-9]/g, "");
    if (!alphanumericChars) return "??";
    return alphanumericChars.substring(0, 2).toUpperCase();
  };

  // --- Render Logic ---

  // 1. Show Skeleton during initial load when profileData is null
  if (loading && !profileData) {
    return <ProfileSkeleton />;
  }

  // 2. Show Error message if fetching failed and profileData is still null
  if (!loading && !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="card-title text-xl justify-center">
              Failed to load profile data
            </h2>
            <p className="text-gray-500">Please try refreshing the page.</p>
            <div className="card-actions justify-center mt-4">
              <button onClick={() => navigate(-1)} className="btn btn-ghost">
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render the main profile content if profileData exists
  // Destructure needed data *after* confirming profileData exists
  const { user, isOwnProfile, isSeller, isDropshipper } = profileData;
  const userInitials = getUserInitials(user?.userName);
   const showButton = isOwnProfile && (isSeller || isDropshipper);



  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Cover Photo */}
      <div
        className="h-64 md:h-80 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${
            user.backgroundCoverURL?.azureUrl || "/api/placeholder/1200/300"
          })`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-amber-500/30">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-circle btn-sm absolute top-4 left-4 bg-white/90 hover:bg-white text-black border-none shadow-md"
            aria-label="Go back"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          {/* Action Buttons */}
         <div className="flex gap-3 absolute top-4 right-4">
            {/* Existing Share button */}
            <button
              onClick={handleShare}
              className="btn btn-circle btn-sm bg-white/90 hover:bg-white text-black border-none shadow-md"
            >
              <FiShare2 />
            </button>
            {/* Existing Edit Profile Modal */}
            {isOwnProfile && <EditProfileModal onProfileUpdate={handleProfileUpdate} />}
            {isOwnProfile && (
        <motion.button
          className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-medium text-sm shadow-lg overflow-hidden group"
          onClick={() => navigate("/user/verified-user")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background gradient animation on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700"
            initial={{ x: "100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Icon with rotation animation */}
          <motion.div
            className="relative z-10"
            initial={{ rotate: 0 }}
            whileHover={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: 1.1 
            }}
            transition={{ 
              rotate: { duration: 0.5 },
              scale: { duration: 0.2 }
            }}
          >
            <MdVerified className="w-5 h-5" />
          </motion.div>
          
          {/* Text with underline effect */}
          <span className="relative z-10 font-semibold">
            Verify Account
            <motion.div
              className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </span>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0, opacity: 0.5 }}
            whileHover={{ 
              scale: 2, 
              opacity: 0,
            }}
            transition={{ duration: 0.6 }}
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }}
          />
          
          {/* Subtle glow effect */}
          <motion.div
            className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-md"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      )}
          </div>
        </div>

        {/* Profile Image */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <motion.div
            className="relative group"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Avatar itself */}
            <div className="avatar online">
              <div className="w-32 h-32 rounded-full ring ring-amber-400 ring-offset-2 ring-offset-base-100 shadow-xl overflow-hidden">
                {user.profileURL?.azureUrl ? (
                  <img
                    src={user.profileURL.azureUrl}
                    alt={
                      user.userName
                        ? `${user.userName}'s profile`
                        : "User profile"
                    }
                    className="w-full h-full object-cover"
                    loading="eager" // Load profile pic eagerly
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold text-4xl"
                    aria-label={
                      user.userName
                        ? `${user.userName}'s profile initials`
                        : "User profile initials"
                    }
                  >
                    {userInitials}
                  </div>
                )}
              </div>
            </div>

            {/* Verified badge */}
            {(isSeller || isDropshipper) && (
              <motion.div
                className="absolute -bottom-3 right-12 bg-base-100 rounded-full p-0.5 leading-none shadow"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.15,
                }} 
              >
                {/* Added 'block' to prevent potential inline spacing issues */}
                <MdVerified size={24} className="text-amber-500 block" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Profile Content Area */}
      <div className="container mx-auto px-4 pt-20 pb-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="card bg-base-100 shadow-xl overflow-hidden"
        >
          {/* User Info */}
          <div className="card-body pt-4 md:pt-6 z-10">
            <div className="text-center px-4 md:px-8">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-2">
                  <motion.h1 className="text-2xl sm:text-3xl font-bold">
                    {user.name}
                  </motion.h1>
                  
                  {showButton && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <motion.button
                        className="relative group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-xl overflow-hidden"
                        onClick={() => navigate("/user/verify-seller")}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          backgroundSize: "200% 100%",
                          backgroundPosition: "0% 50%",
                        }}
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                          backgroundPosition: {
                            duration: 5,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        />

                        {/* Icon with animation */}
                        <motion.div
                          className="relative z-10 flex items-center justify-center"
                          animate={{
                            rotate: [0, 15, -15, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        >
                          <FiShoppingBag className="w-4 h-4" />
                        </motion.div>

                        {/* Text */}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <span className="font-bold tracking-wide">Premium Seller</span>
                          
                          {/* Sparkle icon */}
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                            }}
                          >
                            <HiSparkles className="w-4 h-4 text-yellow-300" />
                          </motion.div>
                        </span>

                        {/* Floating particles */}
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white/30 rounded-full"
                              style={{
                                left: `${20 + i * 30}%`,
                                bottom: "20%",
                              }}
                              animate={{
                                y: [-20, -60],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.6,
                                ease: "easeOut",
                              }}
                            />
                          ))}
                        </div>

                        {/* Glow effect */}
                        <motion.div
                          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-50"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />

                        {/* Border animation */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                            backgroundSize: "200% 100%",
                          }}
                          animate={{
                            backgroundPosition: ["-200% 0", "200% 0"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        />
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              <motion.p className="text-gray-500 text-sm mb-2">
                @{user.userName}
              </motion.p>
              
              <motion.p
                className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base whitespace-pre-wrap mb-4"
              >
                {user.bio || "No bio available."}
              </motion.p>

              {/* Action Buttons (Follow/Message) */}
              <motion.div
                className="flex flex-wrap justify-center gap-4"
              >
                {!isOwnProfile && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={
                        localFollowState.followStatus === "Following"
                          ? handleUnFollowClick
                          : handleFollowClick
                      }
                      className={`btn ${
                        localFollowState.followStatus === "Following"
                          ? "btn-outline btn-primary"
                          : "btn-warning"
                      } gap-2`} // Adjusted style for following
                    >
                      <UserPlus size={18} />
                      {localFollowState.followStatus}
                    </motion.button>
                    <motion.button>
                      <MessageCircle size={18} /> Message
                    </motion.button>
                  </>
                )}
              </motion.div>
            </div>
            {/* Stats Section */}
            <motion.div /* ... */ className="flex justify-center mt-6">
              <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-200">
                {/* Followers Stat */}
                <div className="stat">
                  <button
                    onClick={() => {
                      setFollowModalType("followers");
                      setShowFollowModal(true);
                    }}
                    className="stat-figure text-warning cursor-pointer"
                    aria-label={`View ${localFollowState.followersCount} followers`}
                  >
                    {" "}
                    <Users size={24} />{" "}
                  </button>
                  <div className="stat-title">Followers</div>
                  <div className="stat-value text-2xl">
                    {localFollowState.followersCount}
                  </div>
                </div>
                {/* Following Stat */}
                <div className="stat">
                  <button
                    onClick={() => {
                      setFollowModalType("following");
                      setShowFollowModal(true);
                    }}
                    className="stat-figure text-warning cursor-pointer"
                    aria-label={`View ${followInfo.followingCount} following`}
                  >
                    {" "}
                    <UserPlus size={24} />{" "}
                  </button>
                  <div className="stat-title">Following</div>
                  <div className="stat-value text-2xl">
                    {followInfo.followingCount}
                  </div>
                </div>
                {/* Products Stat (Seller only) */}
                {isSeller && (
                  <div className="stat">
                    <div className="stat-figure text-warning">
                      <Package size={24} />
                    </div>
                    <div className="stat-title">Products</div>
                    <div className="stat-value text-2xl">{totalProducts}</div>
                  </div>
                )}
              </div>
            </motion.div>
            {/* Shipper Application Banner */}
            {(user.role === "user" || user.role === "dropshipper") &&
              isOwnProfile && (
                <div className="mt-6">
                  <ShipperApplicationBanner />
                </div>
              )}
          </div>

          {/* Tabs Section */}
          {visibleTabs.length > 0 && (
            <div className="border-t border-base-200">
              <div className="tabs tabs-boxed bg-base-200 justify-center p-2 rounded-none overflow-x-auto whitespace-nowrap">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id + "-" + tab.role} // Use role in key if IDs overlap
                      className={`tab gap-2 ${
                        activeTab === tab.id
                          ? "tab-active bg-warning text-black"
                          : ""
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon size={16} /> {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Animate based on active tab
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }} // Faster transition
                className="min-h-[300px]" // Ensure content area has min height
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Follow Modal */}
      <AnimatePresence>
        {showFollowModal &&
          profileData?.user?._id && ( // Ensure userId is available
            <FollowModal
              userId={profileData.user._id}
              initialTab={followModalType}
              onClose={() => setShowFollowModal(false)}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
