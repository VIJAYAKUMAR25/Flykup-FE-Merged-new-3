// import { useState, useEffect, useRef } from 'react';
// import io from 'socket.io-client';
// import { Trophy, IndianRupee, Gavel, Clock, ListStartIcon, Hash } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { set } from 'date-fns';
// // import { SOCKET_URL } from '../api/apiDetails';
// import ConfettiExplosion from 'react-confetti-explosion';
// import { MdOutlineTimer } from "react-icons/md";
// import SlidingBidButton from './ui/SlidingBidButton';
// import { useAuth } from '../../context/AuthContext';
// import { socketurl } from '../../../config';

// const socket = io.connect(socketurl, {
//     transports: ['websocket'], // Force WebSocket transport
// });


// const AuctionsOverlay = ({ streamId, show, currentAuction }) => {
//     console.log("🚀 currentAuction:", currentAuction);
//     console.log("🚀 streamId:", streamId);
//     console.log("🚀 show:", show);
//     const countdownRef = useRef(null); // Store interval reference
//     const [isActive, setIsActive] = useState(currentAuction?.isActive || false);
//     const [isAuctionStarted, setIsAuctionStarted] = useState(false);
//     // const [user, setUser] = useState(null);
//     const { user, logout } = useAuth();

//     const [highestBid, setHighestBid] = useState(0);
//     const [highestBidder, setHighestBidder] = useState(null);
//     const [nextBids, setNextBids] = useState([]);
//     const [bidderWon, setBidderWon] = useState(null);
//     const [timer, setTimer] = useState(0); // auction time

//     // Admin Functions
//     const [startingBid, setStartingBid] = useState(0)
//     const [bidHistory, setBidHistory] = useState([]);
//     const [uniqueStreamId, setUniqueStreamId] = useState(null);
//     const [auctionNum, setAuctionNum] = useState(currentAuction?.auctionNumber || null)


//     useEffect(() => {
//         // setHighestBid(currentAuction?.currentHighestBid || 0);
//         // setHighestBidder(currentAuction?.highestBidder || null);
//         // setNextBids([currentAuction?.nextBid1, currentAuction?.nextBid2] || []);
//         setIsActive(currentAuction?.isActive || false)
//         setBidderWon(currentAuction?.bidderWon || null)
//     }, [currentAuction])

//     // useEffect(() => {
//     //     const storedUser = localStorage.getItem('userData');
//     //     if (storedUser) {
//     //         try {
//     //             setUser(JSON.parse(storedUser));
//     //         } catch (error) {
//     //             console.error('Failed to parse user data:', error);
//     //             localStorage.removeItem('userData');
//     //         }
//     //     }
//     // }, []);

//     useEffect(() => {
//         socket.emit('joinRoom', streamId);

//         socket.on("auctionStarted", (data) => {
//             console.log("🚀 Auction started:", data);
//             setHighestBid(data.startingBid);
//             setIsAuctionStarted(true);
//             setIsActive(true);
//             setUniqueStreamId(data.uniqueStreamId)
//             setAuctionNum(data.auctionNumber)

//             const remainingTime = Math.max(0, data.endsAt - Date.now());
//             setTimer(remainingTime);

//             // Use fixed increment of 50 for next bid suggestions
//             const fixedIncrement = 50;
//             setNextBids([
//                 Math.round(data.startingBid + fixedIncrement),
//                 Math.round(data.startingBid + fixedIncrement * 2),
//             ]);

//             // ✅ Ensure only one countdown runs
//             // stopCountdown(); 
//             // startCountdown(data.endsAt);
//         });

//         socket.on("timerUpdate", (data) => {
//             // console.log("⏳ Timer update received:", data);
//             if (data.remainingTime !== undefined) {
//                 setTimer(data.remainingTime);
//                 setIsActive(data.remainingTime > 0);
//             }
//         });

//         socket.on("auctionEnded", (data) => {
//             console.log("🏆 Auction ended! Winner:", data?.highestBidder?.name, "Final bid:", data?.highestBid);
//             setBidderWon(data?.bidderWon);
//             setIsActive(false);
//             // stopCountdown(); // Stop countdown on auction end
//         });

//         socket.on("clrScr", () => {
//             setHighestBid(startingBid);
//             setHighestBidder(null);
//             setBidderWon(null);
//             setTimer(30);
//             setBidHistory([]);
//             setIsActive(false);
//             setIsAuctionStarted(false);
//             setAuctionNum(null)
//             // stopCountdown(); // Reset countdown on clear
//         });

//         socket.on("bidUpdated", (data) => {
//             if (data.streamId === streamId) {
//                 setHighestBid(data?.highestBid);
//                 setHighestBidder(data?.highestBidder);
//                 setBidHistory((prev) => [
//                     ...prev,
//                     {
//                         amount: data?.highestBid,
//                         bidder: data?.highestBidder,
//                         time: new Date().toLocaleTimeString(),
//                     },
//                 ]);

//                 if (data.nextBids) {
//                     setNextBids(data.nextBids);
//                 }
//             }
//         });

//         return () => {
//             socket.off('bidUpdated');
//             socket.off("timerUpdate");
//             socket.off("auctionStarted");
//             socket.off("auctionEnded");
//             socket.off("clrScr");
//             // stopCountdown(); // Cleanup countdown on unmount
//         };
//     }, [streamId, auctionNum]);


//     // ⏳ Format time function
//     const formatTime = (ms) => {
//         const seconds = Math.floor(ms / 1000); // Convert milliseconds to seconds
//         const mins = Math.floor(seconds / 60);
//         const secs = seconds % 60;
//         return `${mins}:${secs.toString().padStart(2, "0")}`;
//     };

//     const handleBid = (newBid) => {
//         if (isActive && user) {
//             socket.emit('placeBid', {
//                 streamId,
//                 user,
//                 amount: newBid,
//                 uniqueStreamId: uniqueStreamId || currentAuction?.uniqueStreamId,
//                 // bidDirection: currentAuction?.bidDirection || 'decremental'
//             });
//         }
//     };

//     // const handleBid = (newBid) => {
//     //     console.log("handleBid called with newBid:", newBid);
//     //     console.log("Current Auction Bid dir:", currentAuction.bidDirection);
//     //     const direction = currentAuction?.bidDirection || 'incremental';
//     //     const isValidBid =
//     //         (direction === 'incremental' && newBid > highestBid) ||
//     //         (direction === 'decremental' && newBid < highestBid);
//     //     console.log("isValidBid:", isValidBid);

//     //     if (isValidBid && isActive && user) {
//     //         socket.emit('placeBid', {
//     //             streamId,
//     //             user,
//     //             amount: newBid,
//     //             uniqueStreamId: uniqueStreamId || currentAuction?.uniqueStreamId,
//     //             bidDirection: direction
//     //         });
//     //     }
//     // };


//     // from backend
//     const calculateNextBids = () => {
//         const increment = 50; // Fixed increment of 50
//         return [
//             Math.round(highestBid + increment),
//             Math.round(highestBid + increment * 2)
//         ];
//     };

//     const [nextBid1, nextBid2] = calculateNextBids();


//     return (
//         <div className='flex flex-col gap-1'>

//             {/* { isAuctionStarted && ( */}
//             <div className="rounded-xl ">
//                 <div className="flex mb-2">
//                     <AnimatePresence>
//                         {bidderWon?.name ? (
//                             // 🏆 Show only the winner when auction ends
//                             <motion.div
//                                 className="flex items-center justify-center gap-2 bg-gray-900/25 py-2 px-4 rounded-full"
//                                 initial={{ opacity: 0, y: 10 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                             >
//                                 <div className='flex gap-2 items-center'>
//                                     <Trophy className="w-4 h-4 text-yellow" />
//                                     <p className="text-sm font-medium text-yellow">Winner: {bidderWon.name}</p>
//                                 </div>
//                                 <div className="absolute z-50 top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
//                                     <ConfettiExplosion
//                                         force={0.7}
//                                         duration={5000}
//                                         particleCount={61}
//                                         width={1600}
//                                     />
//                                 </div>
//                             </motion.div>
//                         ) : (
//                             // 🔥 Show highest bidder only if auction is active
//                             highestBidder?.name && (
//                                 <motion.div
//                                     className="flex items-center justify-center gap-2 mt-2"
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                 >
//                                     <div className='flex gap-2 items-center'>
//                                         <Trophy className="w-4 h-4 text-yellow [text-shadow:2px_2px_3px_rgba(0,0,0,0.7)]" />
//                                         <p className="text-sm text-yellow font-medium [text-shadow:2px_2px_3px_rgba(0,0,0,0.7)]">Highest Bidder: {highestBidder.name}</p>
//                                     </div>
//                                 </motion.div>
//                             )
//                         )}
//                     </AnimatePresence>
//                 </div>
//                 {/* Current Bid */}
//                 <div className="flex justify-between items-center mb-1">
//                     <div className="flex items-center gap-2 text-md font-semibold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,0.2)]">
//                         <h3 className="text-xl font-bold">
//                             {show?.title}
//                         </h3>

//                         {auctionNum && (
//                             <div className="flex items-center gap-1 px-2 py-1 rounded-md text-white text-2xl font-semibold shadow-sm [text-shadow:1px_1px_1px_rgba(0,0,0,0.2)]">
//                                 {/* Add icon if needed */}
//                                 <span className="">: #{auctionNum}</span>
//                             </div>
//                         )}
//                     </div>

//                     <div className={`text-xl flex items-center gap-1 [text-shadow:1px_1px_1px_rgba(0,0,0,0.2)] bg-gray-900/25 py-1 px-4 rounded-full font-bold ${timer / 1000 <= 11 ? 'text-error' : 'text-white'}`}>
//                         <MdOutlineTimer size={20} color='white' />{formatTime(timer)}
//                     </div>
//                 </div>

//                 {/* Bid Buttons */}
//                 <div className="mt-2 flex items-center justify-between gap-2">
//                     <div className=" text-center">
//                         {/* <p className="text-sm text-right text-white bg-gray-900/25 rounded-full [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Current Bid</p> */}
//                         <p className="md:text-3xl text-xl font-bold text-yellow flex items-center justify-center gap-2 [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
//                             <IndianRupee className="w-6 h-6 [text-shadow:2px_2px_3px_rgba(0,0,0,0.5)]" />
//                             {highestBid?.toLocaleString()}
//                         </p>
//                     </div>

//                     <div className='hidden'>
//                         {nextBids.length > 0 && (
//                             <button
//                                 onClick={() => handleBid(nextBids[0])}  // ✅ Use first suggested bid
//                                 disabled={!isActive || !user || user?._id === highestBidder?._id}
//                                 className="btn btn-ghost btn-md btn-wide bg-yellow-400 hover:bg-yellow/70 border- text-black rounded-full"
//                             >
//                                 Bid <IndianRupee size={12} /> {nextBids[0]?.toLocaleString()} {/* ✅ Fix Display */}
//                             </button>
//                         )}
//                     </div>

//                     <div className='flex-1 flex justify-center max-w-xs'>
//                         {nextBids.length > 0 && (
//                             <SlidingBidButton
//                                 amount={nextBids[0]}
//                                 onBid={handleBid}
//                                 disabled={!isActive || !user || user?._id === highestBidder?._id}
//                             />
//                         )}
//                     </div>

//                     {/* <div className='hidden gap-2'>
//                         <button
//                             onClick={() => handleBid(nextBid1)}
//                             disabled={!isActive || !user || user?._id === highestBidder?._id}
//                             className="btn btn-ghost bg-warning hover:bg-warning/80 text-black rounded-full btn-sm "
//                         >
//                             Bid <IndianRupee size={12} />{nextBid1.toLocaleString()}
//                         </button>
//                         <button
//                             onClick={() => handleBid(nextBid2)}
//                             disabled={!isActive || !user || user?._id === highestBidder?._id}
//                             className="btn btn-ghost bg-warning hover:bg-warning/80 text-black rounded-full btn-sm"
//                         >
//                             Bid <IndianRupee size={12} />{nextBid2.toLocaleString()}
//                         </button>
//                     </div> */}
//                 </div>
//             </div>
//             {/* )} */}
//         </div>
//     )
// }

// export default AuctionsOverlay;

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Trophy, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import { MdOutlineTimer } from "react-icons/md";
import SlidingBidButton from './ui/SlidingBidButton';
import { useAuth } from '../../context/AuthContext';
import { socketurl } from '../../../config';
import { toast } from 'react-toastify'; // Import toast for winner notification

const socket = io.connect(socketurl, {
    transports: ['websocket'],
});

const AuctionsOverlay = ({ streamId, show, currentAuction, product, signedUrls }) => {
    const { user } = useAuth();
    const countdownRef = useRef(null);
    const [isActive, setIsActive] = useState(currentAuction?.isActive || false);
    const [highestBid, setHighestBid] = useState(currentAuction?.currentHighestBid || 0);
    const [highestBidder, setHighestBidder] = useState(currentAuction?.highestBidder || null);
    const [nextBids, setNextBids] = useState(currentAuction?.nextBids || []);
    const [bidderWon, setBidderWon] = useState(currentAuction?.bidderWon || null);
    const [timer, setTimer] = useState(0);
    const [uniqueStreamId, setUniqueStreamId] = useState(currentAuction?.uniqueStreamId || null);
    const [auctionNum, setAuctionNum] = useState(currentAuction?.auctionNumber || null);
    
    // Get product details
    const getProductDetails = () => {
        if (!product) return { title: '', image: '' };
        
        const pid = product.productId?._id?.toString() || 
                   product.productId?.toString() || 
                   product._id?.toString();
        
        const title = product.productId?.title || 
                     product.productTitle || 
                     product.title || 
                     "Auction Product";
        
        const image = signedUrls[pid] || 
                     (product.productId?.images?.[0]?.jpgURL) || 
                     (product.images?.[0]?.jpgURL) || 
                     "/placeholder.svg";
        
        return { title, image };
    };
    
    const { title: productTitle, image: productImage } = getProductDetails();

    // Show winner toast
    useEffect(() => {
        if (bidderWon?.name) {
            toast.success(`🎉 ${bidderWon.name} won the auction with ₹${highestBid}`);
        }
    }, [bidderWon, highestBid]);

    useEffect(() => {
        setIsActive(currentAuction?.isActive || false);
        setBidderWon(currentAuction?.bidderWon || null);
    }, [currentAuction]);

    useEffect(() => {
        socket.emit('joinRoom', streamId);

        socket.on("auctionStarted", (data) => {
            setHighestBid(data.startingBid);
            setIsActive(true);
            setUniqueStreamId(data.uniqueStreamId);
            setAuctionNum(data.auctionNumber);

            const remainingTime = Math.max(0, data.endsAt - Date.now());
            setTimer(remainingTime);

            const fixedIncrement = 50;
            setNextBids([
                Math.round(data.startingBid + fixedIncrement),
                Math.round(data.startingBid + fixedIncrement * 2),
            ]);
        });

        socket.on("timerUpdate", (data) => {
            if (data.remainingTime !== undefined) {
                setTimer(data.remainingTime);
                setIsActive(data.remainingTime > 0);
            }
        });

        socket.on("auctionEnded", (data) => {
            setBidderWon(data?.bidderWon);
            setIsActive(false);
        });

        socket.on("clrScr", () => {
            setHighestBid(0);
            setHighestBidder(null);
            setBidderWon(null);
            setTimer(0);
            setIsActive(false);
            setAuctionNum(null);
        });

        socket.on("bidUpdated", (data) => {
            if (data.streamId === streamId) {
                setHighestBid(data?.highestBid);
                setHighestBidder(data?.highestBidder);
                if (data.nextBids) {
                    setNextBids(data.nextBids);
                }
            }
        });

        return () => {
            socket.off('bidUpdated');
            socket.off("timerUpdate");
            socket.off("auctionStarted");
            socket.off("auctionEnded");
            socket.off("clrScr");
        };
    }, [streamId, auctionNum]);

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleBid = (newBid) => {
        if (isActive && user) {
            socket.emit('placeBid', {
                streamId,
                user,
                amount: newBid,
                uniqueStreamId: uniqueStreamId || currentAuction?.uniqueStreamId,
            });
        }
    };

    return (
        // <div className='flex flex-col gap-2 bg-stone-900/80 backdrop-blur-sm p-3 rounded-xl border border-stone-700/30'>
        //     {/* Product Display - Always shown */}
        //     <div className="flex items-center gap-3">
        //         {productImage ? (
        //             <img
        //                 src={productImage}
        //                 alt={productTitle}
        //                 className="w-12 h-12 rounded-lg object-cover border border-stone-600"
        //             />
        //         ) : (
        //             <div className="bg-stone-800 border border-stone-700 rounded-lg w-12 h-12 flex items-center justify-center">
        //                 <div className="text-stone-400 text-xs text-center">Product Image</div>
        //             </div>
        //         )}
        //         <div className="flex-1 min-w-0">
        //             <h3 className="font-semibold text-white truncate">{productTitle}</h3>
        //             {auctionNum && (
        //                 <p className="text-xs text-stone-400">Auction #{auctionNum}</p>
        //             )}
        //         </div>
        //     </div>

        //     {/* Top Bidder Display - Always shown */}
        //     <AnimatePresence>
        //         {bidderWon ? (
        //             <motion.div
        //                 className="flex items-center justify-center gap-2 p-2 bg-yellow-900/30 rounded-lg"
        //                 initial={{ opacity: 0, y: 10 }}
        //                 animate={{ opacity: 1, y: 0 }}
        //             >
        //                 <Trophy className="w-4 h-4 text-yellow-300" />
        //                 <p className="text-sm font-medium text-yellow-300 truncate">
        //                     Winner: {bidderWon.name}
        //                 </p>
        //                 <ConfettiExplosion
        //                     force={0.7}
        //                     duration={5000}
        //                     particleCount={61}
        //                     width={1600}
        //                     className="absolute inset-0 pointer-events-none"
        //                 />
        //             </motion.div>
        //         ) : highestBidder ? (
        //             <motion.div
        //                 className="flex items-center gap-2 text-sm text-stone-300 truncate"
        //                 initial={{ opacity: 0 }}
        //                 animate={{ opacity: 1 }}
        //             >
        //                 <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        //                 <span className="truncate">
        //                     Highest: {highestBidder.name}
        //                 </span>
        //             </motion.div>
        //         ) : (
        //             <div className="h-5"></div>
        //         )}
        //     </AnimatePresence>

        //     {/* Current Bid and Timer - Only during active auction */}
        //     {isActive && (
        //         <>
        //             <div className="flex justify-between items-center">
        //                 <div className="text-center">
        //                     <p className="text-sm text-stone-400">Current Bid</p>
        //                     <p className="text-xl font-bold text-yellow flex items-center gap-1">
        //                         <IndianRupee className="w-5 h-5" />
        //                         {highestBid?.toLocaleString()}
        //                     </p>
        //                 </div>
                       
        //                 <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
        //                     timer / 1000 <= 11 ? 'bg-red-900/70 text-red-300' : 'bg-stone-800/70 text-white'
        //                 }`}>
        //                     <MdOutlineTimer size={18} />
        //                     <span>{formatTime(timer)}</span>
        //                 </div>
        //             </div>

        //             <div className="mt-2">
        //                 {nextBids.length > 0 && (
        //                     <SlidingBidButton
        //                         amount={nextBids[0]}
        //                         onBid={handleBid}
        //                         disabled={!user || user?._id === highestBidder?._id}
        //                     />
        //                 )}
        //             </div>
        //         </>
        //     )}
        // </div>

        <div className='flex flex-col gap-0.5 p-1.5 pb-0 shadow-lg shadow-black/20 border border-stone-800/20'>
            {/* Product Display with Timer - Always shown */}
            <div className="flex items-start gap-2 relative">
                {productImage ? (
                    <img
                        src={productImage}
                        alt={productTitle}
                        className="w-10 h-10 rounded-lg object-cover border border-stone-600 flex-shrink-0"
                    />
                ) : (
                    <div className="bg-stone-800 border border-stone-700 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <div className="text-stone-400 text-xs">IMG</div>
                    </div>
                )}
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold text-white truncate text-sm leading-tight">{productTitle}</h3>
                    {auctionNum && (
                        <p className="text-xs text-stone-400 leading-none">Auction #{auctionNum}</p>
                    )}
                </div>
                
                {/* Timer - Positioned to the right of image and title */}
                {isActive && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${
                        timer / 1000 <= 11 ? 'bg-red-900/70 text-red-300' : 'bg-stone-800/70 text-white'
                    }`}>
                        <MdOutlineTimer size={12} />
                        <span>{formatTime(timer)}</span>
                    </div>
                )}
            </div>
            
            {/* Top Bidder Display - Always shown */}
            <AnimatePresence>
                {bidderWon ? (
                    <motion.div
                        className="flex items-center justify-center gap-1.5 p-1.5 bg-yellow-900/30 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                        <p className="text-xs font-medium text-yellow-300 truncate">
                            Winner: {bidderWon.name}
                        </p>
                        <ConfettiExplosion
                            force={0.7}
                            duration={5000}
                            particleCount={61}
                            width={1600}
                            className="absolute inset-0 pointer-events-none"
                        />
                    </motion.div>
                ) : highestBidder ? (
                     <motion.div
                        className="flex justify-center items-center text-xs text-stone-300  mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Trophy className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0" />
                        <span className="truncate">
                        Highest: {highestBidder.name}
                        </span>
                    </motion.div>
                            ) : (
                                <div className="h-3"></div>
                            )}
                        </AnimatePresence>
                        
                        {/* Current Bid and Bid Button - Same row during active auction */}
                        {isActive && (
                            <div className="flex items-center gap-3 h-8">
                                {/* Current Bid */}
                            <div className="flex flex-col min-w-0">
                    <p className="text-[10px] sm:text-xs md:text-sm text-stone-400 leading-none mb-0.5">
                        Current Bid
                    </p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-yellow flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        <span>{highestBid?.toLocaleString()}</span>
                    </p>
                    </div>
        
                    
                    {/* Bid Button */}
                    <div className="flex-1">
                        {nextBids.length > 0 && (
                            <SlidingBidButton
                                amount={nextBids[0]}
                                onBid={handleBid}
                                disabled={!user || user?._id === highestBidder?._id}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AuctionsOverlay;