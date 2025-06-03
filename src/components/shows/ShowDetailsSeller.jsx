import { useEffect, useRef, useState } from "react"
import { MessageCircle, Volume2, ArrowLeft, LucideWallet } from "lucide-react"
import { Video, X, Camera, CameraOff, Mic, MicOff, Clock, Package, Gavel, Users } from "lucide-react"
import LikeButton from "./ui/LikeButton"
import { useNavigate, useParams } from "react-router-dom"
import { socketurl } from "../../../config"
import axios from "axios"
import LiveComments from "./LiveComments"
import io from "socket.io-client"
import Auctions from "./Auctions"
import { generateSignedUrl } from "../../utils/aws"
import BuyProductsSellers from "./BuyProductsSeller"
import GiveAway from "./GiveAway"
import { SOCKET_URL } from "../api/apiDetails"
import { BiNotepad } from "react-icons/bi"
import { FiShare } from "react-icons/fi"
import { AiOutlineShop } from "react-icons/ai"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import { AnimatePresence, motion } from "framer-motion"
import StartStream from "../reuse/LiveStream/StartStream"

const socket = io.connect(socketurl, {
    transports: ['websocket'], 
});

const ShowDetailsSeller = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { showId } = useParams()
    const [show, setShow] = useState()
    const [liked, setLiked] = useState(false)
    const [likes, setLikes] = useState(0)
    const [userId, setUserId] = useState(user?._id)

    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isCameraEnabled, setIsCameraEnabled] = useState(true)
    const [isMicEnabled, setIsMicEnabled] = useState(true)
    const [streamTime, setStreamTime] = useState(0)

    const publisherRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const timerRef = useRef(null)
    const [signedUrls, setSignedUrls] = useState({})
    const [products, setProducts] = useState([])
    const [activeTab, setActiveTab] = useState("Auction")
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)
    const [viewerCount, setViewerCount] = useState(0)

    useEffect(() => {
        fetchShow()
    }, [showMobileSidebar])

    useEffect(() => {
        if (show) {
            setLikes(show?.likes)
            setLiked(show?.likedBy?.includes(user?._id))
            setViewerCount(show?.viewerCount || 0)
        }
    }, [show])

    // Fetch show data
    useEffect(() => {
        const fetchShowData = async () => {
            try {
                const response = await axios.get(`${socketurl}/api/shows/get/${showId}`)
                const showData = response.data

                setShow(showData)
                // Combine all product types into a single array
                const allProducts = [
                    ...(showData?.buyNowProducts || []),
                    ...(showData?.auctionProducts || []),
                    ...(showData?.giveawayProducts || []),
                ]

                setProducts(allProducts)

                setLoading(false)
            } catch (err) {
                console.error("Error fetching show data:", err)
                setError(err.message || "Failed to load show data")
                setLoading(false)
            }
        }
        fetchShowData()
    }, [showId, showMobileSidebar])

    const fetchShow = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${socketurl}/api/shows/get/${showId}`, {
                withCredentials: true,
            })
            if (response.status === 200) {
                const showData = response.data

                setShow(showData)
                // Combine all product types into a single array
                const allProducts = [
                    ...(showData?.buyNowProducts || []),
                    ...(showData?.auctionProducts || []),
                    ...(showData?.giveawayProducts || []),
                ]

                setProducts(allProducts)
            } else {
                console.error("Failed to fetch products.")
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLike = () => {
        if (!userId) {
            console.error("❌ Cannot like: userId is null")
            return
        }
        console.log("liked")
        socket.emit("toggleLike", { streamId: showId, userId })
    }

    useEffect(() => {
        if (socket && showId) {
            socket.emit("joinRoom", showId)
            socket.on(`likesUpdated-${showId}`, ({ likes, likedBy }) => {
                console.log("Likes updated:", likes, "Liked by:", likedBy)
                setLikes(likes)
                setLiked(likedBy?.includes(userId))
            })
        }
        return () => {
            if (socket) {
                socket.off(`likesUpdated-${showId}`)
            }
        }
    }, [socket, showId, userId])

    // Handle stream timer
    useEffect(() => {
        if (isStreaming) {
            timerRef.current = setInterval(() => {
                setStreamTime((prev) => prev + 1)
            }, 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            setStreamTime(0)
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [isStreaming])

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const toggleCamera = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !isCameraEnabled
                setIsCameraEnabled(!isCameraEnabled)
            }
        }
    }

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !isMicEnabled
                setIsMicEnabled(!isMicEnabled)
            }
        }
    }

    // Streaming functions
    const fetchPublishingToken = async () => {
        try {
            const response = await axios.patch(`${socketurl}/api/shows/${showId}/start`)
            return response.data.data.token
        } catch (error) {
            console.error("Error fetching token:", error)
            throw error
        }
    }

    const startStreaming = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            })

            streamRef.current = mediaStream
            const millicast = await import("@millicast/sdk")

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                videoRef.current.autoplay = true
            }

            const token = await fetchPublishingToken()

            const tokenGenerator = () =>
                millicast.Director.getPublisher({
                    token: token,
                    streamName: show.streamName,
                })

            publisherRef.current = new millicast.Publish(show.streamName, tokenGenerator)
            await publisherRef.current.connect({ mediaStream })
            setIsStreaming(true)
            toast.success("Stream started successfully!")
        } catch (error) {
            console.error("Streaming error:", error)
            toast.error("Failed to start stream. Please try again.")
            stopStreaming()
        }
    }

    const stopStreaming = () => {
        publisherRef.current?.stop()
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setIsStreaming(false)
        setIsCameraEnabled(true)
        setIsMicEnabled(true)

        // Call API to end the stream
        axios
            .patch(`${socketurl}/api/shows/${showId}/end`)
            .then(() => {
                console.log("Stream ended successfully")
                toast.success("Stream ended successfully!")
            })
            .catch((err) => {
                console.error("Error ending stream:", err)
                toast.error("Error ending stream. Please try again.")
            })
    }

    // Share handler for the show page
    const handleShare = async () => {
        // Use the current location as the shareable link
        const shareUrl = `${window.location.origin}/user/show/${showId}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: show?.title || "Check out this show!",
                    text: "Hey, check out this live show on our platform!",
                    url: shareUrl,
                })
                console.log("Shared successfully")
            } catch (error) {
                console.error("Error sharing", error)
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard
                .writeText(shareUrl)
                .then(() => {
                    toast.success("Link copied to clipboard!")
                })
                .catch((err) => console.error("Error copying link:", err))
        }
    }

    // useEffect(() => {
    //     const fetchSignedUrls = async () => {
    //         const urls = {}
    //         for (const product of products) {
    //             if (product.productId.images[0]) {
    //                 urls[product.productId._id] = await generateSignedUrl(product.productId.images[0])
    //             }
    //         }
    //         setSignedUrls(urls)
    //     }

    //     fetchSignedUrls()
    // }, [products])

    return (
        <div className="flex min-h-screen bg-stone-950 text-white font-montserrat">
            {/* Left Sidebar - Auction Details */}
            <div className="w-[25%] hidden lg:block border-r border-stone-800 bg-stone-950 text-white shadow-xl">
                <div className="p-6 space-y-6">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(`/seller/allshows`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {/* Seller Info */}
                    <div className="flex items-center space-x-3 p-4 bg-stone-900 rounded-2xl shadow-lg border border-stone-800">
                        <div className="avatar">
                            {show?.host?.userInfo?.profileURL ? (
                                <div className="w-12 h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden">
                                    <img
                                        src={show?.host?.userInfo?.profileURL || "/placeholder.svg"}
                                        alt={show?.host?.userInfo?.userName || show?.host?.userInfo?.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                <span class="text-lg font-bold capitalize">${show?.host?.userInfo?.userName.charAt(0)}</span>
                                            </div>`
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="bg-stone-800 text-yellow-500 rounded-full w-12 h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                                    <span className="text-lg font-bold capitalize">{show?.host?.userInfo?.userName?.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">{show?.host?.companyName || show?.host?.businessName}</h2>
                            <div className="flex items-center space-x-2 text-sm text-stone-400">
                                <span className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span> <span>5.0</span>
                                </span>
                                <span>•</span>
                                <button className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors">
                                    Follow
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800">
                        <button
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Auction" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Auction")}
                        >
                            Auction
                        </button>
                        <button
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Buy Now" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Buy Now")}
                        >
                            Buy Now
                        </button>
                        <button
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Give away" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                            onClick={() => setActiveTab("Give away")}
                        >
                            Giveaway
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div
                        className="space-y-4 overflow-y-auto pr-2"
                        style={{ maxHeight: "calc(100vh - 320px)", scrollbarWidth: "thin" }}
                    >
                        {activeTab === "Auction" && (
                            <div className="space-y-4">
                                {show?.auctionProducts?.length ? (
                                    show?.auctionProducts?.map((taggedProduct) => (
                                        <div
                                            key={taggedProduct._id}
                                            className="overflow-hidden"
                                        >
                                            <Auctions showId={showId} streamId={showId} product={taggedProduct} signedUrls={signedUrls} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No auction products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "Buy Now" && (
                            <div className="space-y-4">
                                {show?.buyNowProducts?.length ? (
                                    show?.buyNowProducts?.map((taggedProduct) => (
                                        <div
                                            key={taggedProduct._id}
                                            className="overflow-hidden"
                                        >
                                            <BuyProductsSellers
                                                showId={showId}
                                                streamId={showId}
                                                product={taggedProduct}
                                                signedUrls={signedUrls}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No buy now products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "Give away" && (
                            <div className="space-y-4">
                                {show?.giveawayProducts?.length ? (
                                    show?.giveawayProducts?.map((taggedProduct) => (
                                        <div
                                            key={taggedProduct._id}
                                            className="overflow-hidden"
                                        >
                                            <GiveAway streamId={showId} product={taggedProduct} signedUrls={signedUrls} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No giveaway products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar for Auction Details */}
            <AnimatePresence>
                {showMobileSidebar && (
                    <motion.div
                        className="fixed inset-0 z-50 flex lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black"
                            onClick={() => setShowMobileSidebar(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        ></motion.div>

                        {/* Sidebar */}
                        <motion.div
                            className="relative w-full max-w-sm bg-stone-950 p-6 space-y-6 border-r border-stone-800 shadow-xl overflow-y-auto"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => navigate(`/seller/allshows`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 transition-all duration-300 text-sm font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={() => setShowMobileSidebar(false)}
                                    className="p-2 rounded-full bg-stone-800 text-stone-400 hover:bg-stone-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Seller Info */}
                            <div className="flex items-center space-x-3 p-4 bg-stone-900 rounded-2xl shadow-lg border border-stone-800">
                                <div className="avatar">
                                    {show?.host?.userInfo?.profileURL ? (
                                        <div className="w-12 h-12 rounded-full ring-2 ring-yellow-500/20 overflow-hidden">
                                            <img
                                                src={show?.host?.userInfo?.profileURL || "/placeholder.svg"}
                                                alt={show?.host?.userInfo?.userName || show?.host?.userInfo?.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-stone-800 text-yellow-500 rounded-full flex items-center justify-center">
                                                        <span class="text-lg font-bold capitalize">${show?.host?.userInfo?.userName.charAt(0)}</span>
                                                    </div>`
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-stone-800 text-yellow-500 rounded-full w-12 h-12 flex items-center justify-center ring-2 ring-yellow-500/20">
                                            <span className="text-lg font-bold capitalize">
                                                {show?.host?.userInfo?.userName?.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">{show?.host?.companyName || show?.host?.businessName}</h2>
                                    <div className="flex items-center space-x-2 text-sm text-stone-400">
                                        <span className="flex items-center gap-1">
                                            <span className="text-yellow-500">★</span> <span>5.0</span>
                                        </span>
                                        <span>•</span>
                                        <button className="px-3 py-1 bg-yellow-400 text-stone-900 rounded-full text-xs font-bold hover:bg-yellow-500 transition-colors">
                                            Follow
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex bg-stone-900 p-1.5 rounded-xl shadow-md border border-stone-800">
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Auction" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Auction")}
                                >
                                    Auction
                                </button>
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Buy Now" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Buy Now")}
                                >
                                    Buy Now
                                </button>
                                <button
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "Give away" ? "bg-yellow-400 text-stone-900 font-semibold" : "text-stone-300 hover:bg-stone-800"}`}
                                    onClick={() => setActiveTab("Give away")}
                                >
                                    Giveaway
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div
                                className="space-y-4 overflow-y-auto pr-2"
                                style={{ maxHeight: "calc(100vh - 320px)", scrollbarWidth: "thin" }}
                            >
                                {activeTab === "Auction" && (
                                    <div className="space-y-4">
                                        {show?.auctionProducts?.length ? (
                                            show?.auctionProducts?.map((taggedProduct) => (
                                                <div
                                                    key={taggedProduct._id}
                                                    className="overflow-hidden"
                                                >
                                                    <Auctions showId={showId} streamId={showId} product={taggedProduct} signedUrls={signedUrls} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No auction products available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "Buy Now" && (
                                    <div className="space-y-4">
                                        {show?.buyNowProducts?.length ? (
                                            show?.buyNowProducts?.map((taggedProduct) => (
                                                <div
                                                    key={taggedProduct._id}
                                                    className="overflow-hidden"
                                                >
                                                    <BuyProductsSellers
                                                        showId={showId}
                                                        streamId={showId}
                                                        product={taggedProduct}
                                                        signedUrls={signedUrls}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No buy now products available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === "Give away" && (
                                    <div className="space-y-4">
                                        {show?.giveawayProducts?.length ? (
                                            show?.giveawayProducts?.map((taggedProduct) => (
                                                <div
                                                    key={taggedProduct._id}
                                                    className="overflow-hidden"
                                                >
                                                    <GiveAway streamId={showId} product={taggedProduct} signedUrls={signedUrls} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-stone-400">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No giveaway products available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center - Live Stream */}
            <div className="flex-1 flex flex-col min-h-screen items-center relative">
                <div className="w-full max-w-[500px] h-screen aspect-[9/22] bg-stone-900 relative shadow-xl rounded-xl overflow-hidden">
                    <div className="relative bg-black w-full h-full">
                    <StartStream showId={showId} />

                        {/* {!isStreaming && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                <div className="text-center p-6 bg-stone-900/50 rounded-2xl backdrop-blur-sm border border-stone-800/50">
                                    <Video className="w-16 h-16 mx-auto mb-4 text-yellow-500/70" />
                                    <p className="text-white/90 font-medium">Camera Preview</p>
                                    <p className="text-stone-400 text-sm mt-2">Start streaming to go live</p>
                                </div>
                            </div>
                        )} */}

                      
                        <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full flex items-center backdrop-blur-sm border border-stone-700/30">
                            <Clock className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-white font-mono text-sm">{formatTime(streamTime)}</span>
                        </div>

                    
                        {isStreaming && (
                            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-full flex items-center backdrop-blur-sm border border-stone-700/30">
                                <Users className="w-4 h-4 text-yellow-500 mr-2" />
                                <span className="text-white font-medium text-sm">{viewerCount}</span>
                            </div>
                        )}

                        {/* <div className="absolute top-16 right-4 flex flex-col space-y-4 z-20">
                            <div className="lg:hidden block">
                                {!isStreaming ? (
                                    <button
                                        onClick={startStreaming}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500 text-stone-900 hover:bg-yellow-400 transition-colors shadow-lg"
                                    >
                                        <Video className="h-5 w-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopStreaming}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={toggleCamera}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg"
                            >
                                {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5 text-red-500" />}
                            </button>

                            <button
                                onClick={toggleMic}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg"
                            >
                                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-500" />}
                            </button>
                        </div> */}
                    </div>

                    <div className="absolute top-12 left-4 right-16 p-4">
                        <h1 className="text-xl font-bold text-white">{show?.title || "Untitled Stream"}</h1>
                        <div className="flex items-center space-x-2 text-sm text-stone-300 mt-1">
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-yellow-500" /> {viewerCount || 0} watching
                            </span>
                            <span>•</span>
                            <span>{show?.category || "General"}</span>
                        </div>
                    </div>

                    <div className="absolute right-4 bottom-28 flex flex-col space-y-3">
                        <LikeButton
                            initialLikes={likes}
                            onLike={handleLike}
                            isLiked={liked}
                            setIsLiked={setLiked}
                            setLikes={setLikes}
                            connectionReady={!!socket}
                        />

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <BiNotepad className="h-5 w-5" />
                        </button>

                        <button
                            onClick={handleShare}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg"
                        >
                            <FiShare className="h-5 w-5" />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <Volume2 className="h-5 w-5" />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 backdrop-blur-sm border border-stone-700/30 text-white hover:bg-stone-700 transition-colors shadow-lg">
                            <LucideWallet className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="relative lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400 text-stone-900 hover:bg-yellow-500 transition-colors shadow-lg"
                        >
                            <AiOutlineShop className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-stone-900">
                                {(show?.auctionProducts?.length || 0) +
                                    (show?.buyNowProducts?.length || 0) +
                                    (show?.giveawayProducts?.length || 0)}
                            </span>
                        </button>
                    </div>

                    <div className="absolute bottom-5 left-1 right-16 text-white flex flex-col">
                        <LiveComments streamId={showId} prevComments={show?.comments} />
                    </div>
                </div>
                

            </div>

            {/* Right Sidebar - Chat */}
            <div className="w-[25%] hidden lg:flex flex-col justify-between border-l border-stone-800 min-h-screen bg-stone-950">
                {/* Stream Controls */}
                {/* <div className="p-6 border-b border-stone-800 text-center flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-white">Stream Controls</h3>

                    <div className="flex flex-col gap-3">
                        {!isStreaming ? (
                            <button
                                onClick={startStreaming}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-stone-900 rounded-xl font-medium hover:bg-yellow-400 transition-colors shadow-lg"
                            >
                                <Video className="h-5 w-5" />
                                Start Live Stream
                            </button>
                        ) : (
                            <button
                                onClick={stopStreaming}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg"
                            >
                                <X className="h-5 w-5" />
                                End Live Stream
                            </button>
                        )}

                        <div className="flex justify-center gap-4 mt-2">
                            <button
                                onClick={toggleCamera}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isCameraEnabled ? "bg-stone-800 text-white" : "bg-red-500/20 text-red-500 border border-red-500/30"}`}
                            >
                                {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                                {isCameraEnabled ? "Camera On" : "Camera Off"}
                            </button>

                            <button
                                onClick={toggleMic}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isMicEnabled ? "bg-stone-800 text-white" : "bg-red-500/20 text-red-500 border border-red-500/30"}`}
                            >
                                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                {isMicEnabled ? "Mic On" : "Mic Off"}
                            </button>
                        </div>
                    </div>

                    {isStreaming && (
                        <div className="flex justify-between items-center mt-2 p-3 bg-stone-900 rounded-lg border border-stone-800">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <span className="font-mono">{formatTime(streamTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-yellow-500" />
                                <span>{viewerCount || 0}</span>
                            </div>
                        </div>
                    )}
                </div> */}

                <div className="flex-1 flex flex-col text-white">
                    <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Live Chat</h3>
                        <MessageCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <LiveComments
                        streamId={showId}
                        prevComments={show?.comments}
                        height={show?.comments?.length > 10 ? "70vh" : "32vh"}
                    />
                </div>
            </div>
        </div>
    )
}

export default ShowDetailsSeller

