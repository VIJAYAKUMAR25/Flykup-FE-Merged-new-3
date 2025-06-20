// import { useEffect, useState } from "react"
// import { Link, useNavigate, useParams } from "react-router-dom"
// import { motion, AnimatePresence } from "framer-motion"
// import { FiShoppingBag, FiFilm, FiRadio, FiUserPlus, FiMapPin, FiShare2, FiChevronLeft } from "react-icons/fi"
// import { UserPlus, MessageCircle, Users, Package, AlertCircle } from "lucide-react"
// import { MdVerified } from "react-icons/md"
// import { toast } from "react-toastify"
// // import EditProfileModal from "./ProfileWithBacground.jsx"
// import ProductsFeed from "./ProductsFeed.jsx"
// import ShowsFeed from "./ShowsFeed.jsx"
// import ShoppableVideosFeed from "./ShoppableVideosFeed.jsx"
// import axiosInstance from "../../utils/axiosInstance.js"
// import { useAlert } from "../Alerts/useAlert.jsx"
// import FollowModal from "./FollowModal.jsx"
// import Logo from "../../assets/images/Logo-Flikup.png"
// import { IoArrowBackCircleOutline } from "react-icons/io5";
// import { GrCirclePlay } from "react-icons/gr"
// import { ImPlay } from "react-icons/im"
// import { HiOutlineShoppingBag } from "react-icons/hi"
// import { BsPlayBtnFill } from "react-icons/bs"
// import EditProfileModal from "./ProfileWithBacground.jsx"
// const UserProfile = () => {
//     const { userName } = useParams()
//     const navigate = useNavigate()
//     const { positive, negative } = useAlert()
//     const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

//     const [profileData, setProfileData] = useState(null)
//     const [activeTab, setActiveTab] = useState("shop")
//     const [loading, setLoading] = useState(true)
//     const [products, setProducts] = useState([])
//     const [shows, setShows] = useState([])
//     const [shoppableVideos, setShoppableVideos] = useState([])
//     const [followInfo, setFollowInfo] = useState({
//         followersCount: 0,
//         followingCount: 0,
//         followStatus: "Follow",
//     })
//     const [localFollowState, setLocalFollowState] = useState({
//         followStatus: "",
//         followersCount: 0,
//     })
//     const [showFollowModal, setShowFollowModal] = useState(false)
//     const [followModalType, setFollowModalType] = useState("followers")
//     const [totalProducts, setTotalProducts] = useState(0)
//     const [totalShows, setTotalShows] = useState(0)
//     const [totalShoppableVideos, setTotalShoppableVideos] = useState(0)
//     const [sellerInfo, setSellerInfo] = useState({})
//     const [shipperInfo, setShipperInfo] = useState({})

//     // Update local follow state when followInfo changes
//     useEffect(() => {
//         if (followInfo) {
//             setLocalFollowState({
//                 followStatus: followInfo.followStatus,
//                 followersCount: followInfo.followersCount,
//             })
//         }
//     }, [followInfo])

//     // Fetch user data
//     useEffect(() => {
//         const fetchUser = async () => {
//             setLoading(true)
//             try {
//                 const response = await axiosInstance.get(`profile/${userName}`)
//                 const data = response.data
//                 console.log("User Data:", data);
//                 setProfileData(data.data)
//                 setFollowInfo(data.data.follow)

//                 if (data.data.isSeller) {
//                     const { counts, products, sellerInfo: sellerData, shows, shoppableVideos } = data.data.seller
//                     setProducts(products)
//                     setShows(shows)
//                     setShoppableVideos(shoppableVideos)
//                     setTotalProducts(counts.totalProducts)
//                     setTotalShows(counts.totalShows)
//                     setTotalShoppableVideos(counts.totalShoppableVideos)
//                     setSellerInfo(sellerData)
//                     setActiveTab("shop")
//                 } else if (data.data.isDropshipper) {
//                     const { counts, shipperInfo: shipperData, shows, shoppableVideos } = data.data.dropshipper
//                     setShows(shows)
//                     setShoppableVideos(shoppableVideos)
//                     setTotalShows(counts.totalShows)
//                     setTotalShoppableVideos(counts.totalShoppableVideos)
//                     setShipperInfo(shipperData)
//                     setActiveTab("videos") // Default tab for dropshippers
//                 } else if (data.data.isOwnProfile) {
//                     setActiveTab("becomeSeller")
//                 } else {
//                     setActiveTab("none")
//                 }
//             } catch (error) {
//                 console.error("Error fetching user:", error)
//                 toast.error("Failed to fetch user profile")
//             } finally {
//                 setLoading(false)
//             }
//         }

//         if (userName) {
//             fetchUser()
//         }
//     }, [userName])



//     const tabs = [
//         // Seller Tabs
//         { id: "shows", label: "Shows", icon: GrCirclePlay, role: "seller" }, // Shows hosted by seller
//         { id: "shop", label: "Shop", icon: HiOutlineShoppingBag, role: "seller" },
//         { id: "videos", label: "ShopClips", icon: BsPlayBtnFill, role: "seller" }, // Videos created by seller

//         // Dropshipper Tabs (Assuming they use same components for hosted content)
//         // Note: Backend needs to provide hosted shows/videos for dropshippers
//         // { id: "shows", label: "Shows", icon: FiRadio, role: "dropshipper" }, // Shows hosted by dropshipper
//         // { id: "videos", label: "ShopClips", icon: FiFilm, role: "dropshipper" }, // Videos hosted by dropshipper

//         // Owner-Specific Tabs (User Role)
//         // { id: "becomeSeller", label: "Become a Host", icon: FiUserPlus, role: "user", ownerOnly: true },
//         // { id: "address", label: "Address", icon: FiMapPin, role: "user", ownerOnly: true },
//     ]

//     // --- UPDATED: Filter visible tabs based on user type ---
//     const visibleTabs = tabs.filter((tab) => {
//         // Start with basic role matching assumption
//         let shouldShow = false

//         // Match seller tabs if the profile user is a seller
//         if (profileData?.isSeller && tab.role === "seller") shouldShow = true

//         // Match dropshipper tabs if the profile user is a dropshipper
//         if (profileData?.isDropshipper && tab.role === "dropshipper") shouldShow = true

//         // Handle 'user' role tabs (owner-specific actions)
//         if (tab.role === "user") {
//             if (tab.id === "becomeSeller") {
//                 // Show only if owner AND *not* already a Seller AND *not* already a Dropshipper
//                 shouldShow = profileData?.isOwnProfile && !profileData?.isSeller && !profileData?.isDropshipper
//             } else if (tab.id === "address") {
//                 // Show only if owner
//                 shouldShow = profileData?.isOwnProfile
//             } else {
//                 // Fallback for any other 'user' role tabs
//                 shouldShow = profileData?.isOwnProfile && tab.ownerOnly === true
//             }
//         }

//         // Apply exclusion rules IF shouldShow is currently true
//         if (shouldShow) {
//             // Rule 1: Hide ownerOnly tabs if not the owner viewing their own profile
//             // (This check is slightly redundant due to logic above but adds safety)
//             if (tab.ownerOnly === true && !profileData?.isOwnProfile) {
//                 shouldShow = false
//             }
//             // Rule 2: Hide Shop tab if the profile belongs to a Dropshipper (even if they are also technically a seller in DB)
//             if (profileData?.isDropshipper && tab.id === "shop") {
//                 shouldShow = false
//             }
//             // Rule 3: Hide Address tab if the profile user is a Dropshipper (as requested)
//             if (profileData?.isDropshipper && tab.id === "address") {
//                 shouldShow = false
//             }
//         }

//         return shouldShow
//     })

//     // Handle share functionality
//     const handleShare = async () => {
//         const shareUrl = `${window.location.origin}/${userName}`
//         if (navigator.share) {
//             try {
//                 await navigator.share({
//                     title: `Check out ${profileData?.user?.name}'s profile`,
//                     url: shareUrl,
//                 })
//             } catch (error) {
//                 console.error("Error sharing:", error)
//                 navigator.clipboard.writeText(shareUrl)
//                 positive("Profile link copied to clipboard!")
//             }
//         } else {
//             navigator.clipboard.writeText(shareUrl)
//             positive("Profile link copied to clipboard!")
//         }
//     }

//     // Handle follow/unfollow actions
//     const handleFollowClick = async () => {
//         try {
//             setLocalFollowState({
//                 followStatus: "Following",
//                 followersCount: localFollowState.followersCount + 1,
//             })
//             const response = await axiosInstance.post(`follow`, {
//                 targetUserId: profileData?.user?._id,
//             })
//             positive(response.data.message)
//         } catch (error) {
//             setLocalFollowState({
//                 followStatus: "Follow",
//                 followersCount: localFollowState.followersCount - 1,
//             })
//             console.error("Error following user:", error)
//             negative("Failed to follow user")
//         }
//     }

//     const handleUnFollowClick = async () => {
//         try {
//             setLocalFollowState({
//                 followStatus: "Follow",
//                 followersCount: localFollowState.followersCount - 1,
//             })
//             const response = await axiosInstance.delete(`follow`, {
//                 data: { targetUserId: profileData?.user?._id },
//             })
//             positive(response.data.message)
//         } catch (error) {
//             setLocalFollowState({
//                 followStatus: "Following",
//                 followersCount: localFollowState.followersCount + 1,
//             })
//             console.error("Error unfollowing user:", error)
//             negative("Failed to unfollow user")
//         }
//     }

//     const getUserInitials = (userName) => {
//         if (!userName) return "??"
//         const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, "")
//         if (!alphanumericChars) return "??"
//         return alphanumericChars.substring(0, 2).toUpperCase()
//     }

//     const userInitials = getUserInitials(profileData?.user?.userName)

//     // Profile skeleton for loading state
//     const ProfileSkeleton = () => (
//         <div className="min-h-screen bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A]">
//             {/* Cover Photo Skeleton */}
//             <div className="h-64 md:h-80 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse relative rounded-xl">
//                 {/* Faded Overlay structure - no visual change in skeleton */}
//                 <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-amber-900/10">
//                     {/* Back Button Skeleton */}
//                     <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
//                     {/* Share/Edit Buttons Skeleton */}
//                     <div className="absolute top-4 right-4 flex gap-3">
//                         <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
//                         {/* Placeholder for potential Edit button */}
//                         <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
//                     </div>
//                 </div>

//                 {/* Profile Image Skeleton */}
//                 <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
//                     <div className="relative">
//                         {/* Main avatar circle */}
//                         <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse ring-4 ring-amber-600/30 ring-offset-2 ring-offset-[#1A1A1A] shadow-xl"></div>
//                         {/* Verified Badge Skeleton (optional placeholder) */}
//                         <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-600 animate-pulse shadow-lg"></div>
//                     </div>
//                 </div>
//             </div>

//             {/* Profile Content Skeleton */}
//             <div className="px-4 pt-20 pb-6">
//                 <div className="card bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A] shadow-xl overflow-hidden">

//                     {/* User Info Skeleton */}
//                     <div className="text-center px-4 pt-5">
//                         {/* Name Skeleton */}
//                         <div className="h-8 w-48 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-lg mb-3"></div>
//                         {/* Role Badge Skeleton */}
//                         <div className="h-5 w-36 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-full py-3 mb-2"></div>
//                         {/* Bio Skeleton */}
//                         <div className="h-4 w-72 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-lg mb-2 mt-3"></div>
//                         <div className="h-4 w-64 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-lg mb-3"></div>

//                         <div className="flex items-center justify-center gap-2 mt-2 mb-3">
//                             <div className="h-5 w-5 rounded-full bg-yellow-700/50 animate-pulse mr-1"></div> {/* Star */}
//                             <div className="h-5 w-8 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded"></div> {/* Rating */}
//                             <div className="h-5 w-24 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded"></div> {/* Reviews */}
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-4 gap-4 mt-6 max-w-3xl mx-auto">
//                         {[1, 2, 3, 4].map((i) => (
//                             <div key={i} className="text-center">
//                                 <div className="h-6 w-12 md:w-16 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-lg mb-1"></div>
//                                 <div className="h-4 w-16 md:w-20 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse mx-auto rounded-lg"></div>
//                             </div>
//                         ))}
//                     </div>

//                     <div className="flex justify-center gap-4 mt-6">
//                         <div className="h-10 w-28 bg-gradient-to-r from-yellow-700/50 to-yellow-800/50 animate-pulse rounded-2xl"></div>
//                         <div className="h-10 w-28 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded-2xl"></div>
//                         <div className="h-10 w-28 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded-2xl"></div>
//                     </div>

//                     <div className="flex justify-center mt-8 border-b border-gray-800">
//                         <div className="flex">
//                             {[1, 2, 3].map((i) => (
//                                 <div
//                                     key={i}
//                                     className="flex items-center justify-center py-4 px-8"
//                                 >
//                                     <div className="h-5 w-5 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded mr-2"></div> {/* Icon */}
//                                     <div className="h-5 w-16 bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse rounded"></div> {/* Label */}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="p-4 sm:p-6 min-h-[300px]">
//                         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
//                             {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
//                                 <div key={i} className="aspect-square bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 animate-pulse rounded-lg"></div>
//                             ))}
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </div>
//     );

//     useEffect(() => {
//         if (profileData?.user?.name) {
//             document.title = `${profileData?.user.name} | Profile`;
//         } else {
//             document.title = "Profile";
//         }
//     }, [profileData?.user]);


//     // Render the component
//     if (loading) {
//         return <ProfileSkeleton />
//     }

//     if (!profileData) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-black">
//                 <div className="card bg-gray-900 shadow-lg border border-gray-800">
//                     <div className="card-body text-center">
//                         <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//                         <h2 className="card-title text-xl justify-center text-white">Failed to load profile data</h2>
//                         <p className="text-gray-400">Please try again later</p>
//                         <div className="card-actions justify-center mt-4">
//                             <button onClick={() => navigate(-1)} className="btn bg-yellow-400 hover:bg-yellow-500 text-black">
//                                 Go Back
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         )
//     }

//     const { user, isOwnProfile, isSeller, isDropshipper } = profileData

//     return (
//         <div className="min-h-screen bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#0f0f0f] shadow-lg border border-stone-800 text-white">

//             <div className=" container mx-auto">

//                 {/* Logo Header */}
//                 {/* <div className="hidden py-4 px-6">
//                     <Link to="/">
//                         <img src={Logo || "/placeholder.svg"} alt="Logo" className="md:w-28 w-20 object-contain" />
//                     </Link>
//                 </div> */}

//                 {/* Cover Photo - Smoke Background */}
//                 <div
//                     className="md:h-60 h-36 bg-cover bg-center md:rounded-lg rounded-b-sm relative"
//                     style={{
//                         backgroundImage: `url(${user.backgroundCoverURL?.key ? CDNURL + user.backgroundCoverURL.key : "/smoke-background.jpg"})`,
//                         backgroundSize: "cover"
//                     }}
//                 >
//                     {/* Profile Image */}
//                     <div className="hidden absolute -bottom-20 left-1/2 md:left-20 transform -translate-x-1/2 md:translate-x-0">
//                         {/* Animation Wrapper */}
//                         <motion.div
//                             className="relative group"
//                             initial={{ scale: 0.8, opacity: 0 }}
//                             animate={{ scale: 1.1, opacity: 1 }}
//                             transition={{ type: "spring", stiffness: 260, damping: 20 }}
//                         >
//                             <div className="avatar">
//                                 <div
//                                     className="
//                                         w-40 h-40                                    
//                                         rounded-full
//                                         overflow-hidden                                     
//                                         ring-2 ring-newYellow     
//                                         ring-offset-2 ring-offset-[#1A1A1A] 
//                                         shadow-[0_0_15px_rgba(251,191,36,0.4)] 
//                                         transition-transform duration-300 ease-in-out hover:scale-[1.03]
//                                     "
//                                 >
//                                     {user.profileURL?.key ? (
//                                         <img
//                                             src={
//                                                 user.profileURL?.key
//                                                     ? `${CDNURL}${user.profileURL.key}`
//                                                     : "/placeholder.svg"
//                                             }
//                                             alt={user.userName ? `${user.userName}'s profile` : "User profile"}
//                                             className="w-full h-full object-cover"
//                                             loading="eager"
//                                             onError={(e) => {
//                                                 console.error("Failed to load profile image:", user.profileURL.key);
//                                             }}
//                                         />
//                                     ) : (
//                                         <div
//                                             className="
//                                                 w-full h-full flex items-center justify-center
//                                                 bg-gradient-to-br from-amber-300 to-yellow-400 
//                                                 text-white font-bold text-5xl /* Adjusted font size for w-40 avatar */
//                                                 select-none /* Prevent text selection */
//                                             "
//                                             aria-label={user.userName ? `${user.userName}'s profile initials` : "User profile initials"}
//                                         >
//                                             {userInitials}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Verified Badge - Hidden as per your last code snippet */}
//                             {(isSeller || isDropshipper) && (
//                                 <motion.div
//                                     className="hidden absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg" // Kept hidden
//                                     initial={{ scale: 0, opacity: 0 }}
//                                     animate={{ scale: 1, opacity: 1 }}
//                                     transition={{ delay: 0.5, type: "spring" }}
//                                     title="Verified"
//                                 >
//                                     <MdVerified size={24} className="text-amber-500" />
//                                 </motion.div>
//                             )}
//                         </motion.div>
//                     </div>

//                     <div className="hidden absolute top-2 left-2 shadow-md">
//                         <IoArrowBackCircleOutline size={24} />
//                     </div>
//                     <div className="hidden absolute top-2 right-2">
//                         <button className="btn btn-outline btn-xs rounded-full text-white shadow-md">Become a verified seller</button>
//                     </div>
//                 </div>

//                 {/* Profile Content */}
//                 <div className="container mx-auto px-4 pt-2 ">

//                     {/* Web view */}
//                     <div className="container mx-auto px-10 md:pt-4 pt-2 md:flex hidden md:flex-row flex-col">
//                         {/* Avatar - Positioned Independently */}
//                         <div className="relative flex justify-center md:justify-start md:mx-20">
//                             <motion.div
//                                 className="
//                                     absolute -top-16 md:-top-20 
//                                     w-24 h-24 md:w-44 md:h-44                                     
//                                     rounded-full overflow-hidden                                     
//                                     md:ring-8 ring-4 ring-amber-300     
//                                     md:ring-offset-4 ring-offset-[#1A1A1A] 
//                                     shadow-[0_0_15px_rgba(251,191,36,0.4)] 
//                                     transition-transform duration-300 ease-in-out hover:scale-[1.03]
//                                     z-10
//                                 "
//                                 initial={{ scale: 0.8, opacity: 0 }}
//                                 animate={{ scale: 1.1, opacity: 1 }}
//                                 transition={{ type: "spring", stiffness: 260, damping: 20 }}
//                             >
//                                 {user.profileURL?.key ? (
//                                     <img
//                                         src={
//                                             user.profileURL?.key
//                                                 ? `${CDNURL}${user.profileURL.key}`
//                                                 : "/placeholder.svg"
//                                         }
//                                         alt={user.userName ? `${user.userName}'s profile` : "User profile"}
//                                         className="w-full h-full object-cover"
//                                         loading="eager"
//                                     />
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-400 text-white font-bold text-4xl md:text-5xl">
//                                         {userInitials}
//                                     </div>
//                                 )}
//                             </motion.div>
//                         </div>

//                         {/* Info Section */}
//                         <div className="flex flex-col justify-start items-center md:items-start w-full md:ml-36 ml-0 mt-10 md:mt-4">
//                             {/* Heading and Bio */}
//                             <div className="text-center md:text-left px-4 w-full">
//                                 <div className="flex items-center justify-center md:justify-start">
//                                     <h1 className="md:text-xl text-md font-bold text-white text-nowrap">{user.name}</h1>
//                                     {(isSeller || isDropshipper) && (
//                                         <MdVerified size={24} className="text-blue-400 ml-2" />
//                                     )}
//                                 </div>

//                                 <p className="text-gray-300 max-w-xl mx-auto md:mx-0 mt-2 md:text-sm text-sm line-clamp-2">
//                                     {user.bio || "No bio available"}
//                                 </p>

//                                 {/* <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
//                                     <div className="flex items-center">
//                                         <span className="text-yellow-400 text-xl mr-1">★</span>
//                                         <span className="font-bold text-gray-50">4.9</span>
//                                     </div>
//                                     <span className="text-gray-400">2.1K reviews</span>
//                                 </div> */}
//                             </div>

//                             {/* Stats Section */}
//                             <div className="md:grid hidden grid-cols-4 sm:grid-cols-3 md:grid-cols-4 mt-6 w-full md:max-w-xl divide-x divide-gray-700 text-center">
//                                 {/* Followers */}
//                                 <div className="px-2 sm:px-4 py-4" onClick={() => { setShowFollowModal(true); setFollowModalType("followers") }}>
//                                     <div className="text-sm md:text-2xl font-bold text-white cursor-pointer">
//                                         {localFollowState.followersCount >= 1000
//                                             ? (localFollowState.followersCount / 1000).toFixed(0) + 'K'
//                                             : localFollowState.followersCount}
//                                     </div>
//                                     <div className="text-gray-400 text-xs sm:text-sm">Followers</div>
//                                 </div>

//                                 {/* Following */}
//                                 <div className="px-2 sm:px-4 py-4" onClick={() => { setShowFollowModal(true); setFollowModalType("following") }}>
//                                     <div className="text-sm md:text-2xl font-bold text-white cursor-pointer">
//                                         {followInfo.followingCount >= 1000
//                                             ? (followInfo.followingCount / 1000).toFixed(1) + 'K'
//                                             : followInfo.followingCount}
//                                     </div>
//                                     <div className="text-gray-400 text-xs sm:text-sm">Following</div>
//                                 </div>

//                                 {/* Products Sold */}
//                                 {/* <div className="px-2 sm:px-4 py-4">
//                                     <div className="text-sm md:text-2xl font-bold text-white">
//                                         {totalProducts >= 1000
//                                             ? (totalProducts / 1000).toFixed(0) + 'K'
//                                             : totalProducts}
//                                     </div>
//                                     <div className="text-gray-400 text-xs sm:text-sm text">Products sold</div>
//                                 </div> */}

//                                 {/* Avg Shipping */}
//                                 {/* <div className="px-2 sm:px-4 py-4">
//                                     <div className="text-sm md:text-2xl font-bold text-white">1 Day</div>
//                                     <div className="text-gray-400 text-xs sm:text-sm text-nowrap">Avg shipping</div>
//                                 </div> */}
//                             </div>

//                             {/* Buttons */}
//                             <div className="md:flex hidden justify-center md:justify-start gap-6 mt-6 px-4 w-full">
//                                 {!isOwnProfile ? (
//                                     <>
//                                         {localFollowState.followStatus === 'Following' ? (
//                                             <button
//                                                 onClick={handleUnFollowClick}
//                                                 className="btn bg-stone-800 hover:bg-stone-700 text-white rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0"
//                                             >
//                                                 Following
//                                             </button>
//                                         ) : (
//                                             <button
//                                                 onClick={handleFollowClick}
//                                                 className="btn bg-amber-300 hover:bg-amber-400 text-black font-bold rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0"
//                                             >
//                                                 Follow
//                                             </button>
//                                         )}
//                                         {/* <button
//                                             // onClick logic for message
//                                             className="btn bg-stone-800 hover:bg-stone-700 text-white rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0"
//                                         >
//                                             Message
//                                         </button> */}
//                                     </>
//                                 ) : (
//                                     <EditProfileModal />
//                                 )}

//                                 <button
//                                     onClick={handleShare}
//                                     className="btn bg-stone-800 hover:bg-stone-700 text-white rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0"
//                                 >
//                                     Share
//                                 </button>
//                             </div>
//                         </div>
//                     </div>


//                     {/* Mobile view */}
//                     <div className=" pt-2 md:hidden flex md:flex-row flex-col">

//                         <div className="flex">
//                             {/* Avatar - Positioned Independently */}
//                             <div className="relative flex justify-start ">
//                                 <motion.div
//                                     className="
//                                         absolute -top-16  
//                                         w-24 h-24 md:w-34 md:h-34                                     
//                                         rounded-full overflow-hidden                                     
//                                         ring-4 ring-amber-300     
//                                         ring-offset-4 ring-offset-[#1A1A1A] 
//                                         shadow-[0_0_15px_rgba(251,191,36,0.4)] 
//                                         transition-transform duration-300 ease-in-out hover:scale-[1.03]
//                                         z-10
//                                     "
//                                     initial={{ scale: 0.8, opacity: 0 }}
//                                     animate={{ scale: 1.1, opacity: 1 }}
//                                     transition={{ type: "spring", stiffness: 260, damping: 20 }}
//                                 >
//                                     {user.profileURL?.key ? (
//                                         <img
//                                             src={
//                                                 user.profileURL?.key
//                                                     ? `${CDNURL}${user.profileURL.key}`
//                                                     : "/placeholder.svg"
//                                             }
//                                             alt={user.userName ? `${user.userName}'s profile` : "User profile"}
//                                             className="w-full h-full object-cover"
//                                             loading="eager"
//                                         />
//                                     ) : (
//                                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-400 text-white font-bold text-4xl md:text-5xl">
//                                             {userInitials}
//                                         </div>
//                                     )}
//                                 </motion.div>
//                             </div>

//                             {/* Heading and Bio */}
//                             <div className="text-left px-4 w-full ml-28">
//                                 <div className="flex items-center justify-start">
//                                     <h1 className="md:text-3xl text-md font-bold text-white text-left text-nowrap">{user.name}</h1>
//                                     {(isSeller || isDropshipper) && (
//                                         <MdVerified size={20} className="text-blue-400 ml-2" />
//                                     )}
//                                 </div>

//                                 <p className="text-gray-300 max-w-xl mx-auto md:mx-0 mt-2 text-xs line-clamp-2">
//                                     {user.bio || "No bio available"}
//                                 </p>

//                                 {/* <div className="flex items-center justify-start gap-2 my-3">
//                                     <div className="flex items-center bg-stone-600 rounded-full px-4">
//                                         <span className="text-yellow-400 text-sm mr-1">★</span>
//                                         <span className="font-bold text-gray-50 text-sm ">4.9</span>
//                                     </div>
//                                     <span className="text-gray-100 text-xs">2.1K reviews</span>
//                                 </div> */}
//                             </div>
//                         </div>

//                         {/* Info Section */}
//                         <div className="flex flex-col justify-start items-center md:items-start w-full">

//                             {/* Stats Section */}
//                             <div className="grid grid-cols-4 md:grid-cols-4 mt-6 w-full md:max-w-xl divide-x divide-gray-700 text-center">
//                                 {/* Followers */}
//                                 <div className="" onClick={() => { setShowFollowModal(true); setFollowModalType("followers") }}>
//                                     <div className="text-sm md:text-2xl font-bold text-white cursor-pointer">
//                                         {localFollowState.followersCount >= 1000
//                                             ? (localFollowState.followersCount / 1000).toFixed(0) + 'K'
//                                             : localFollowState.followersCount}
//                                     </div>
//                                     <div className="text-gray-100 text-[10px]">Followers</div>
//                                 </div>

//                                 {/* Following */}
//                                 <div className="" onClick={() => { setShowFollowModal(true); setFollowModalType("following") }}>
//                                     <div className="text-sm md:text-2xl font-bold text-white cursor-pointer">
//                                         {followInfo.followingCount >= 1000
//                                             ? (followInfo.followingCount / 1000).toFixed(1) + 'K'
//                                             : followInfo.followingCount}
//                                     </div>
//                                     <div className="text-gray-100 text-[10px] ">Following</div>
//                                 </div>

//                                 {/* Products Sold */}
//                                 {/* <div className="">
//                                     <div className="text-sm md:text-2xl font-bold text-white">
//                                         {totalProducts >= 1000
//                                             ? (totalProducts / 1000).toFixed(0) + 'K'
//                                             : totalProducts}
//                                     </div>
//                                     <div className="text-gray-100 text-[10px]  whitespace-nowrap">Products sold</div>
//                                 </div> */}

//                                 {/* Avg Shipping */}
//                                 {/* <div className="">
//                                     <div className="text-sm md:text-2xl font-bold text-white">1 Day</div>
//                                     <div className="text-gray-100 text-[10px]  whitespace-nowrap">Avg shipping</div>
//                                 </div> */}
//                             </div>

//                             {/* Buttons */}
//                             <div className="flex justify-center md:justify-start gap-4 mt-6 px-4 w-full">
//                                 {!isOwnProfile ? (
//                                     <>
//                                         {localFollowState.followStatus === 'Following' ? (
//                                             <button
//                                                 onClick={handleUnFollowClick}
//                                                 className="bg-stone-900 hover:bg-stone-700 btn border-white border-1 text-white rounded-full px-5 text-xs h-8 min-h-8 flex-shrink-0"
//                                             >
//                                                 Following
//                                             </button>
//                                         ) : (
//                                             <button
//                                                 onClick={handleFollowClick}
//                                                 className="bg-yellow-300 hover:bg-amber-400 text-black font-bold rounded-full px-5 text-xs h-8  min-h-8 border-none flex-shrink-0"
//                                             >
//                                                 Follow
//                                             </button>
//                                         )}
//                                         <button
//                                             className="bg-stone-900 hover:bg-stone-700 btn border-white border-1 text-white rounded-full px-5 text-xs h-8 min-h-8 flex-shrink-0"
//                                         >
//                                             Message
//                                         </button>
//                                     </>
//                                 ) : (
//                                     <EditProfileModal />
//                                 )}


//                                 <button
//                                     onClick={handleShare}
//                                     className="bg-stone-900 hover:bg-stone-700 btn border-white  text-white rounded-full px-5 text-xs h-8 min-h-8 flex-shrink-0"
//                                 >
//                                     Share
//                                 </button>
//                             </div>

//                         </div>
//                     </div>


//                 </div>

//                 {visibleTabs.length > 0 && (
//                     <div className="flex justify-center md:mt-4 mt-2 border-b border-gray-800 w-full">
//                         <div className="flex w-full">
//                             {visibleTabs.map((tab) => {
//                                 const Icon = tab.icon;
//                                 return (
//                                     <button
//                                         key={tab.id}
//                                         onClick={() => setActiveTab(tab.id)}
//                                         className={`flex flex-1 items-center justify-center py-4 px-4 sm:px-6 ${activeTab === tab.id
//                                             ? "border-b-2 border-yellow-400 text-yellow-400"
//                                             : "text-gray-400"
//                                             }`}
//                                     >
//                                         <Icon size={20} className="mr-2" />

//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}


//                 {/* Content Area */}
//                 <div className="md:mt-8">
//                     <AnimatePresence mode="wait">
//                         <motion.div
//                             key={activeTab}
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -10 }}
//                             transition={{ duration: 0.3 }}
//                             className="min-h-[300px]"
//                         >
//                             {activeTab === "shop" && isSeller && (
//                                 <ProductsFeed
//                                     totalProducts={totalProducts}
//                                     products={products}
//                                     sellerInfo={sellerInfo}
//                                     userInfo={user}
//                                 />
//                             )}

//                             {activeTab === "videos" && (isSeller || isDropshipper) && (
//                                 <ShoppableVideosFeed
//                                     totalShoppableVideos={totalShoppableVideos}
//                                     shoppableVideos={shoppableVideos}
//                                     sellerInfo={sellerInfo}
//                                     userInfo={user}
//                                 />
//                             )}

//                             {activeTab === "shows" && (isSeller || isDropshipper) && (
//                                 <ShowsFeed
//                                     totalShows={totalShows}
//                                     shows={shows}
//                                     sellerInfo={sellerInfo}
//                                     userInfo={user}
//                                 />
//                             )}
//                         </motion.div>
//                     </AnimatePresence>
//                 </div>

//                 {/* Follow Modal */}
//                 <AnimatePresence>
//                     {showFollowModal && (
//                         <FollowModal
//                             userId={profileData.user._id}
//                             initialTab={followModalType}
//                             onClose={() => setShowFollowModal(false)}
//                         />
//                     )}
//                 </AnimatePresence>

//             </div>
//         </div >
//     )
// }

// export default UserProfile
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { MdVerified } from "react-icons/md";
import { toast } from "react-toastify";
import ProductsFeed from "./ProductsFeed.jsx";
import ShowsFeed from "./ShowsFeed.jsx";
import ShoppableVideosFeed from "./ShoppableVideosFeed.jsx";
import axiosInstance from "../../utils/axiosInstance.js";
import { useAlert } from "../Alerts/useAlert.jsx";
import FollowModal from "./FollowModal.jsx";
import EditProfileModal from "./ProfileWithBacground.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { GrCirclePlay } from "react-icons/gr";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { BsPlayBtnFill } from "react-icons/bs";

const UserProfile = () => {
    const { userName } = useParams();
    const navigate = useNavigate();
    const { positive, negative } = useAlert();
    const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

    const { requireAuth } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [activeTab, setActiveTab] = useState("shop");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [products, setProducts] = useState([]);
    const [shows, setShows] = useState([]);
    const [shoppableVideos, setShoppableVideos] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [localFollowState, setLocalFollowState] = useState({
        followStatus: "Follow",
        followersCount: 0,
    });
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState("followers");

    // --- Data Fetching Effects ---

    // EFFECT 1: Fetch Core Profile Data
    useEffect(() => {
        const fetchCoreProfile = async () => {
            setLoadingProfile(true);
            setProfileData(null); // Reset on new username
            try {
                const response = await axiosInstance.get(`profile/${userName}`);
                const data = response.data.data;

                if (!data) {
                    throw new Error(response.data.message || "User profile data is missing in the API response.");
                }

                setProfileData(data);
                setLocalFollowState(data.follow);
                
                // Set the initial active tab based on user role
                if (data.isSeller) {
                    setActiveTab("shop");
                } else if (data.isDropshipper) {
                    setActiveTab("videos");
                } else if (data.isOwnProfile) {
                    setActiveTab("becomeSeller"); // Placeholder for non-sellers
                } else {
                    setActiveTab("none");
                }
            } catch (error) {
                console.error("Error fetching core profile:", error);
                toast.error(error.message || "Failed to fetch user profile.");
                setProfileData(null); // Ensure data is null on error
            } finally {
                setLoadingProfile(false);
            }
        };

        if (userName) {
            fetchCoreProfile();
        }
    }, [userName]);

    // EFFECT 2: Fetch Initial Content for the Active Tab
    useEffect(() => {
        const fetchTabData = async () => {
            if (!profileData?.hostId || ["none", "becomeSeller"].includes(activeTab)) {
                setProducts([]);
                setShows([]);
                setShoppableVideos([]);
                return;
            }

            setLoadingContent(true);
            let endpoint = '';
            if (activeTab === 'shop') endpoint = `/profile/${profileData.hostId}/products`;
            if (activeTab === 'shows') endpoint = `/profile/${profileData.hostId}/shows`;
            if (activeTab === 'videos') endpoint = `/profile/${profileData.hostId}/shoppableVideos`;

            if (!endpoint) {
                setLoadingContent(false);
                return;
            }

            try {
                const response = await axiosInstance.get(endpoint, { params: { page: 1, limit: 20 } });
                const { data, pagination: newPagination } = response.data;
                
                if (activeTab === 'shop') setProducts(data);
                if (activeTab === 'shows') setShows(data);
                if (activeTab === 'videos') setShoppableVideos(data);
                
                setPagination(newPagination);
            } catch (error) {
                console.error(`Error fetching ${activeTab}:`, error);
                toast.error(`Failed to load ${activeTab}`);
            } finally {
                setLoadingContent(false);
            }
        };

        if (profileData) {
            fetchTabData();
        }
    }, [activeTab, profileData]);

    // --- Actions and Helpers ---

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/${userName}`;
        try {
            await navigator.share({
                title: `Check out ${profileData?.user?.name}'s profile on Flikup`,
                url: shareUrl,
            });
        } catch (error) {
            navigator.clipboard.writeText(shareUrl);
            positive("Profile link copied to clipboard!");
        }
    };

    const handleFollowClick = () => {
        requireAuth(async () => {
            const originalState = { ...localFollowState };
            setLocalFollowState(prev => ({ ...prev, followStatus: "Following", followersCount: prev.followersCount + 1 }));
            try {
                await axiosInstance.post(`follow`, { targetUserId: profileData.user._id });
                positive("Followed successfully!");
            } catch (error) {
                setLocalFollowState(originalState);
                negative("Failed to follow user");
            }
        });
    };

    const handleUnFollowClick = () => {
        requireAuth(async () => {
            const originalState = { ...localFollowState };
            setLocalFollowState(prev => ({ ...prev, followStatus: "Follow", followersCount: prev.followersCount - 1 }));
            try {
                await axiosInstance.delete(`follow`, { data: { targetUserId: profileData.user._id } });
                positive("Unfollowed successfully!");
            } catch (error) {
                setLocalFollowState(originalState);
                negative("Failed to unfollow user");
            }
        });
    };
    
    const handleFollowModalOpen = (type) => {
        requireAuth(() => {
            setFollowModalType(type);
            setShowFollowModal(true);
        });
    };

    const getUserInitials = (name) => {
        if (!name) return "??";
        return name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 2).toUpperCase();
    };

    // --- Render Logic ---

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center p-8 bg-stone-900 rounded-lg">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl text-white">Profile Not Found</h2>
                    <p className="text-gray-400">This user does not exist or the profile could not be loaded.</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const { user, isOwnProfile, isSeller, isDropshipper, counts, follow, hostId } = profileData;
    const userInitials = getUserInitials(user.userName);

    const tabs = [
        { id: "shows", label: "Shows", icon: GrCirclePlay, role: "seller", count: counts?.totalShows },
        { id: "shop", label: "Shop", icon: HiOutlineShoppingBag, role: "seller", count: counts?.totalProducts },
        { id: "videos", label: "ShopClips", icon: BsPlayBtnFill, role: "seller", count: counts?.totalShoppableVideos },
    ];

    const visibleTabs = tabs.filter(tab => {
        if (isSeller) return true;
        if (isDropshipper) return tab.id !== "shop";
        return false;
    });

    return (
        <div className="min-h-screen bg-gradient-to-r from-[#0F0F0F] via-[#1A1A1A] to-[#0f0f0f] text-white">
            <div className="container mx-auto">
                <div
                    className="md:h-60 h-36 bg-cover bg-center md:rounded-lg rounded-b-sm relative"
                    style={{ backgroundImage: `url(${user.backgroundCoverURL?.key ? CDNURL + user.backgroundCoverURL.key : "/smoke-background.jpg"})` }}
                ></div>
                <div className="container mx-auto px-4 pt-2">
                    {/* Web view */}
                    <div className="container mx-auto px-10 md:pt-4 pt-2 md:flex hidden md:flex-row flex-col">
                        <div className="relative flex justify-center md:justify-start md:mx-20">
                            <motion.div
                                className="absolute -top-16 md:-top-20 w-24 h-24 md:w-44 md:h-44 rounded-full overflow-hidden md:ring-8 ring-4 ring-amber-300 md:ring-offset-4 ring-offset-[#1A1A1A] shadow-[0_0_15px_rgba(251,191,36,0.4)] z-10"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {user.profileURL?.key ? (
                                    <img src={`${CDNURL}${user.profileURL.key}`} alt={`${user.userName}'s profile`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-400 text-white font-bold text-4xl md:text-5xl">
                                        {userInitials}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                        <div className="flex flex-col justify-start items-center md:items-start w-full md:ml-36 ml-0 mt-10 md:mt-4">
                            <div className="text-center md:text-left px-4 w-full">
                                <div className="flex items-center justify-center md:justify-start">
                                    <h1 className="md:text-xl text-md font-bold text-white text-nowrap">{user.name}</h1>
                                    {(isSeller || isDropshipper) && <MdVerified size={24} className="text-blue-400 ml-2" />}
                                </div>
                                <p className="text-gray-300 max-w-xl mx-auto md:mx-0 mt-2 md:text-sm text-sm line-clamp-2">{user.bio || "No bio available"}</p>
                            </div>
                            <div className="md:grid hidden grid-cols-2 md:grid-cols-4 mt-6 w-full md:max-w-xl divide-x divide-gray-700 text-center">
                                <div className="px-2 sm:px-4 py-4 cursor-pointer" onClick={() => handleFollowModalOpen("followers")}>
                                    <div className="text-sm md:text-2xl font-bold text-white">{localFollowState.followersCount}</div>
                                    <div className="text-gray-400 text-xs sm:text-sm">Followers</div>
                                </div>
                                <div className="px-2 sm:px-4 py-4 cursor-pointer" onClick={() => handleFollowModalOpen("following")}>
                                    <div className="text-sm md:text-2xl font-bold text-white">{follow.followingCount}</div>
                                    <div className="text-gray-400 text-xs sm:text-sm">Following</div>
                                </div>
                            </div>
                            <div className="md:flex hidden justify-center md:justify-start gap-6 mt-6 px-4 w-full">
                                {!isOwnProfile ? (
                                    <>
                                        {localFollowState.followStatus === 'Following' ? (
                                            <button onClick={handleUnFollowClick} className="btn bg-stone-800 hover:bg-stone-700 text-white rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0">Following</button>
                                        ) : (
                                            <button onClick={handleFollowClick} className="btn bg-amber-300 hover:bg-amber-400 text-black font-bold rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0">Follow</button>
                                        )}
                                    </>
                                ) : (
                                    <EditProfileModal />
                                )}
                                <button onClick={handleShare} className="btn bg-stone-800 hover:bg-stone-700 text-white rounded-2xl px-5 sm:px-8 text-sm sm:text-base h-10 sm:h-12 min-h-10 border-none flex-shrink-0">Share</button>
                            </div>
                        </div>
                    </div>
                    {/* Mobile view */}
                    <div className="md:hidden flex flex-col items-center pt-10">
                        <div className="relative w-full flex justify-start items-center px-2">
                             <motion.div
                                className="absolute -top-16 w-24 h-24 rounded-full overflow-hidden ring-4 ring-amber-300 ring-offset-4 ring-offset-[#1A1A1A] z-10"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {user.profileURL?.key ? (
                                    <img src={`${CDNURL}${user.profileURL.key}`} alt={`${user.userName}'s profile`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-400 text-white font-bold text-4xl">
                                        {userInitials}
                                    </div>
                                )}
                            </motion.div>
                            <div className="text-left w-full ml-28">
                               <div className="flex items-center">
                                    <h1 className="text-md font-bold text-white text-nowrap">{user.name}</h1>
                                    {(isSeller || isDropshipper) && <MdVerified size={20} className="text-blue-400 ml-2" />}
                                </div>
                                <p className="text-gray-300 text-xs line-clamp-2 mt-1">{user.bio || "No bio available"}</p>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4 mt-4 w-full text-center px-4">
                            <div className="cursor-pointer" onClick={() => handleFollowModalOpen("followers")}>
                                <div className="text-lg font-bold text-white">{localFollowState.followersCount}</div>
                                <div className="text-gray-400 text-xs">Followers</div>
                            </div>
                            <div className="cursor-pointer" onClick={() => handleFollowModalOpen("following")}>
                                <div className="text-lg font-bold text-white">{follow.followingCount}</div>
                                <div className="text-gray-400 text-xs">Following</div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 px-4 w-full">
                            {!isOwnProfile ? (
                                <>
                                    {localFollowState.followStatus === 'Following' ? (
                                        <button onClick={handleUnFollowClick} className="btn flex-1 bg-stone-800 text-white rounded-full text-sm h-10 min-h-10 border-none">Following</button>
                                    ) : (
                                        <button onClick={handleFollowClick} className="btn flex-1 bg-amber-300 text-black font-bold rounded-full text-sm h-10 min-h-10 border-none">Follow</button>
                                    )}
                                </>
                            ) : (
                                <div className="w-full">
                                    <EditProfileModal />
                                </div>
                            )}
                            <button onClick={handleShare} className="btn bg-stone-800 text-white rounded-full text-sm h-10 min-h-10 border-none">Share</button>
                        </div>
                    </div>
                </div>

                {visibleTabs.length > 0 && (
                    <div className="flex justify-center md:mt-4 mt-4 border-b border-gray-800 w-full">
                        <div className="flex w-full">
                            {visibleTabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center py-3 px-2 sm:px-6 transition-colors duration-200 ${activeTab === tab.id ? "border-b-2 border-yellow-400 text-yellow-400" : "text-gray-400 hover:text-white"}`}>
                                        <Icon size={20} className="mr-2" />
                                        <span className="text-sm font-semibold">{tab.label} ({tab.count || 0})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="md:mt-8 min-h-[300px]">
                    {loadingContent ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                        </div>
                    ) : (
                        profileData && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === "shop" && <ProductsFeed products={products} sellerInfo={profileData.sellerInfo} userInfo={user}/>}
                                    {activeTab === "videos" && 
                                        <ShoppableVideosFeed 
                                            shoppableVideos={shoppableVideos} 
                                            userInfo={user}
                                            hostId={hostId}
                                            totalShoppableVideos={counts.totalShoppableVideos}
                                        />
                                    }
                                    {activeTab === "shows" && 
                                        <ShowsFeed 
                                            shows={shows} 
                                            userInfo={user}
                                            hostId={hostId}
                                            totalShows={counts.totalShows}
                                        />
                                    }
                                </motion.div>
                            </AnimatePresence>
                        )
                    )}
                </div>

                <AnimatePresence>
                    {showFollowModal && (
                        <FollowModal userId={user._id} initialTab={followModalType} onClose={() => setShowFollowModal(false)} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UserProfile;