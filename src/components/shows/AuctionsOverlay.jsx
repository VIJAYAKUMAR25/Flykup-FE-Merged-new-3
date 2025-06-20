
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

const AuctionsOverlay = ({ streamId, show, currentAuction, product, signedUrls,requireAuth }) => {
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

  // ... (keep all existing imports and component setup code the same)

const handleBid = (newBid) => {
    requireAuth(() => {
        if (isActive && user) {
            socket.emit('placeBid', {
                streamId,
                user,
                amount: newBid,
                uniqueStreamId: uniqueStreamId || currentAuction?.uniqueStreamId,
            });
        }
    });
};

// In the return JSX, update only the SlidingBidButton part:
{nextBids.length > 0 && (
    <SlidingBidButton
        amount={nextBids[0]}
        onBid={() => handleBidWithAuth(nextBids[0])}
    />
)}

// ... (keep all remaining code exactly the same)

    return (
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
                     
                    />
                )}
            </div>
        </div>
    )}
</div>
    )
}

export default AuctionsOverlay;




// import { useState, useEffect, useRef } from 'react';
// import io from 'socket.io-client';
// import { Trophy, IndianRupee } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import ConfettiExplosion from 'react-confetti-explosion';
// import { MdOutlineTimer } from "react-icons/md";
// import SlidingBidButton from './ui/SlidingBidButton';
// import { useAuth } from '../../context/AuthContext';
// import { socketurl } from '../../../config';
// import { toast } from 'react-toastify'; // Import toast for winner notification

// const socket = io.connect(socketurl, {
//     transports: ['websocket'],
// });

// const AuctionsOverlay = ({ streamId, show, currentAuction, product, signedUrls }) => {
//     const { user } = useAuth();
//     const countdownRef = useRef(null);
//     const [isActive, setIsActive] = useState(currentAuction?.isActive || false);
//     const [highestBid, setHighestBid] = useState(currentAuction?.currentHighestBid || 0);
//     const [highestBidder, setHighestBidder] = useState(currentAuction?.highestBidder || null);
//     const [nextBids, setNextBids] = useState(currentAuction?.nextBids || []);
//     const [bidderWon, setBidderWon] = useState(currentAuction?.bidderWon || null);
//     const [timer, setTimer] = useState(0);
//     const [uniqueStreamId, setUniqueStreamId] = useState(currentAuction?.uniqueStreamId || null);
//     const [auctionNum, setAuctionNum] = useState(currentAuction?.auctionNumber || null);
    
//     // Get product details
//     const getProductDetails = () => {
//         if (!product) return { title: '', image: '' };
        
//         const pid = product.productId?._id?.toString() || 
//                    product.productId?.toString() || 
//                    product._id?.toString();
        
//         const title = product.productId?.title || 
//                      product.productTitle || 
//                      product.title || 
//                      "Auction Product";
        
//         const image = signedUrls[pid] || 
//                      (product.productId?.images?.[0]?.jpgURL) || 
//                      (product.images?.[0]?.jpgURL) || 
//                      "/placeholder.svg";
        
//         return { title, image };
//     };
    
//     const { title: productTitle, image: productImage } = getProductDetails();

//     // Show winner toast
//     useEffect(() => {
//         if (bidderWon?.name) {
//             toast.success(`🎉 ${bidderWon.name} won the auction with ₹${highestBid}`);
//         }
//     }, [bidderWon, highestBid]);

//     useEffect(() => {
//         setIsActive(currentAuction?.isActive || false);
//         setBidderWon(currentAuction?.bidderWon || null);
//     }, [currentAuction]);

//     useEffect(() => {
//         socket.emit('joinRoom', streamId);

//         socket.on("auctionStarted", (data) => {
//             setHighestBid(data.startingBid);
//             setIsActive(true);
//             setUniqueStreamId(data.uniqueStreamId);
//             setAuctionNum(data.auctionNumber);

//             const remainingTime = Math.max(0, data.endsAt - Date.now());
//             setTimer(remainingTime);

//             const fixedIncrement = 50;
//             setNextBids([
//                 Math.round(data.startingBid + fixedIncrement),
//                 Math.round(data.startingBid + fixedIncrement * 2),
//             ]);
//         });

//         socket.on("timerUpdate", (data) => {
//             if (data.remainingTime !== undefined) {
//                 setTimer(data.remainingTime);
//                 setIsActive(data.remainingTime > 0);
//             }
//         });

//         socket.on("auctionEnded", (data) => {
//             setBidderWon(data?.bidderWon);
//             setIsActive(false);
//         });

//         socket.on("clrScr", () => {
//             setHighestBid(0);
//             setHighestBidder(null);
//             setBidderWon(null);
//             setTimer(0);
//             setIsActive(false);
//             setAuctionNum(null);
//         });

//         socket.on("bidUpdated", (data) => {
//             if (data.streamId === streamId) {
//                 setHighestBid(data?.highestBid);
//                 setHighestBidder(data?.highestBidder);
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
//         };
//     }, [streamId, auctionNum]);

//     const formatTime = (ms) => {
//         const seconds = Math.floor(ms / 1000);
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
//             });
//         }
//     };

//     return (
//         // <div className='flex flex-col gap-2 bg-stone-900/80 backdrop-blur-sm p-3 rounded-xl border border-stone-700/30'>
//         //     {/* Product Display - Always shown */}
//         //     <div className="flex items-center gap-3">
//         //         {productImage ? (
//         //             <img
//         //                 src={productImage}
//         //                 alt={productTitle}
//         //                 className="w-12 h-12 rounded-lg object-cover border border-stone-600"
//         //             />
//         //         ) : (
//         //             <div className="bg-stone-800 border border-stone-700 rounded-lg w-12 h-12 flex items-center justify-center">
//         //                 <div className="text-stone-400 text-xs text-center">Product Image</div>
//         //             </div>
//         //         )}
//         //         <div className="flex-1 min-w-0">
//         //             <h3 className="font-semibold text-white truncate">{productTitle}</h3>
//         //             {auctionNum && (
//         //                 <p className="text-xs text-stone-400">Auction #{auctionNum}</p>
//         //             )}
//         //         </div>
//         //     </div>

//         //     {/* Top Bidder Display - Always shown */}
//         //     <AnimatePresence>
//         //         {bidderWon ? (
//         //             <motion.div
//         //                 className="flex items-center justify-center gap-2 p-2 bg-yellow-900/30 rounded-lg"
//         //                 initial={{ opacity: 0, y: 10 }}
//         //                 animate={{ opacity: 1, y: 0 }}
//         //             >
//         //                 <Trophy className="w-4 h-4 text-yellow-300" />
//         //                 <p className="text-sm font-medium text-yellow-300 truncate">
//         //                     Winner: {bidderWon.name}
//         //                 </p>
//         //                 <ConfettiExplosion
//         //                     force={0.7}
//         //                     duration={5000}
//         //                     particleCount={61}
//         //                     width={1600}
//         //                     className="absolute inset-0 pointer-events-none"
//         //                 />
//         //             </motion.div>
//         //         ) : highestBidder ? (
//         //             <motion.div
//         //                 className="flex items-center gap-2 text-sm text-stone-300 truncate"
//         //                 initial={{ opacity: 0 }}
//         //                 animate={{ opacity: 1 }}
//         //             >
//         //                 <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
//         //                 <span className="truncate">
//         //                     Highest: {highestBidder.name}
//         //                 </span>
//         //             </motion.div>
//         //         ) : (
//         //             <div className="h-5"></div>
//         //         )}
//         //     </AnimatePresence>

//         //     {/* Current Bid and Timer - Only during active auction */}
//         //     {isActive && (
//         //         <>
//         //             <div className="flex justify-between items-center">
//         //                 <div className="text-center">
//         //                     <p className="text-sm text-stone-400">Current Bid</p>
//         //                     <p className="text-xl font-bold text-yellow flex items-center gap-1">
//         //                         <IndianRupee className="w-5 h-5" />
//         //                         {highestBid?.toLocaleString()}
//         //                     </p>
//         //                 </div>
                       
//         //                 <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
//         //                     timer / 1000 <= 11 ? 'bg-red-900/70 text-red-300' : 'bg-stone-800/70 text-white'
//         //                 }`}>
//         //                     <MdOutlineTimer size={18} />
//         //                     <span>{formatTime(timer)}</span>
//         //                 </div>
//         //             </div>

//         //             <div className="mt-2">
//         //                 {nextBids.length > 0 && (
//         //                     <SlidingBidButton
//         //                         amount={nextBids[0]}
//         //                         onBid={handleBid}
//         //                         disabled={!user || user?._id === highestBidder?._id}
//         //                     />
//         //                 )}
//         //             </div>
//         //         </>
//         //     )}
//         // </div>

//         <div className='flex flex-col gap-0.5 p-1.5 pb-0 shadow-lg shadow-black/20 border border-stone-800/20'>
//             {/* Product Display with Timer - Always shown */}
//             <div className="flex items-start gap-2 relative">
//                 {productImage ? (
//                     <img
//                         src={productImage}
//                         alt={productTitle}
//                         className="w-10 h-10 rounded-lg object-cover border border-stone-600 flex-shrink-0"
//                     />
//                 ) : (
//                     <div className="bg-stone-800 border border-stone-700 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
//                         <div className="text-stone-400 text-xs">IMG</div>
//                     </div>
//                 )}
                
//                 <div className="flex-1 min-w-0 flex flex-col justify-center">
//                     <h3 className="font-semibold text-white truncate text-sm leading-tight">{productTitle}</h3>
//                     {auctionNum && (
//                         <p className="text-xs text-stone-400 leading-none">Auction #{auctionNum}</p>
//                     )}
//                 </div>
                
//                 {/* Timer - Positioned to the right of image and title */}
//                 {isActive && (
//                     <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${
//                         timer / 1000 <= 11 ? 'bg-red-900/70 text-red-300' : 'bg-stone-800/70 text-white'
//                     }`}>
//                         <MdOutlineTimer size={12} />
//                         <span>{formatTime(timer)}</span>
//                     </div>
//                 )}
//             </div>
            
//             {/* Top Bidder Display - Always shown */}
//             <AnimatePresence>
//                 {bidderWon ? (
//                     <motion.div
//                         className="flex items-center justify-center gap-1.5 p-1.5 bg-yellow-900/30 rounded-lg"
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                     >
//                         <Trophy className="w-3.5 h-3.5 text-yellow-300" />
//                         <p className="text-xs font-medium text-yellow-300 truncate">
//                             Winner: {bidderWon.name}
//                         </p>
//                         <ConfettiExplosion
//                             force={0.7}
//                             duration={5000}
//                             particleCount={61}
//                             width={1600}
//                             className="absolute inset-0 pointer-events-none"
//                         />
//                     </motion.div>
//                 ) : highestBidder ? (
//                      <motion.div
//                         className="flex justify-center items-center text-xs text-stone-300  mb-2"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                     >
//                         <Trophy className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0" />
//                         <span className="truncate">
//                         Highest: {highestBidder.name}
//                         </span>
//                     </motion.div>
//                             ) : (
//                                 <div className="h-3"></div>
//                             )}
//                         </AnimatePresence>
                        
//                         {/* Current Bid and Bid Button - Same row during active auction */}
//                         {isActive && (
//                             <div className="flex items-center gap-3 h-8">
//                                 {/* Current Bid */}
//                             <div className="flex flex-col min-w-0">
//                     <p className="text-[10px] sm:text-xs md:text-sm text-stone-400 leading-none mb-0.5">
//                         Current Bid
//                     </p>
//                     <p className="text-sm sm:text-base md:text-lg font-bold text-yellow flex items-center gap-1">
//                         <IndianRupee className="w-4 h-4" />
//                         <span>{highestBid?.toLocaleString()}</span>
//                     </p>
//                     </div>
        
                    
//                     {/* Bid Button */}
//                     <div className="flex-1">
//                         {nextBids.length > 0 && (
//                             <SlidingBidButton
//                                 amount={nextBids[0]}
//                                 onBid={handleBid}
//                                 disabled={!user || user?._id === highestBidder?._id}
//                             />
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }

// export default AuctionsOverlay;