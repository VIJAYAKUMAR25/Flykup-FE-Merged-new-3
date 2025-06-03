import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Trophy, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { SOCKET_URL } from '../api/apiDetails';
import { useAuth } from '../../context/AuthContext';
import { socketurl } from '../../../config';

const socket = io.connect(socketurl, {
  transports: ['websocket'], // Force WebSocket transport
});

const AuctionsUser = ({ showId, streamId, product, signedUrls, fetchShow, currentAuction }) => {
  const [isActive, setIsActive] = useState(false);
  const { user } = useAuth();
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [highestBid, setHighestBid] = useState(100);
  const [highestBidder, setHighestBidder] = useState(null);
  const [bidderWon, setBidderWon] = useState(null);
  const [timer, setTimer] = useState(0);
  const countdownRef = useRef(null);

  useEffect(() => {
    setHighestBid(currentAuction?.currentHighestBid || 0);
    setHighestBidder(currentAuction?.highestBidder || null);
    setIsActive(currentAuction?.isActive || false);
    setBidderWon(currentAuction?.bidderWon || null);
  }, [currentAuction]);

  useEffect(() => {
    socket.emit('joinRoom', streamId);

    socket.on("auctionStarted", (data) => {
      if (data.product !== product.productId._id) return;
      setHighestBid(data.startingBid);
      setIsAuctionStarted(true);
      setIsActive(true);

      const remainingTime = Math.max(0, data.endsAt - Date.now());
      setTimer(remainingTime);
    });

    socket.on("timerUpdate", (data) => {
      if (data.product !== product.productId._id) return;
      if (data.remainingTime !== undefined) {
        setTimer(data.remainingTime);
        setIsActive(data.remainingTime > 0);
      }
    });

    socket.on("auctionEnded", (data) => {
      if (data.product !== product.productId._id) return;
      setIsActive(false);
      setBidderWon(data?.highestBidder);
    });

    socket.on("clrScr", () => {
      setHighestBid(0);
      setHighestBidder(null);
      setBidderWon(null);
      setTimer(0);
      setIsActive(false);
    });

    socket.on('bidUpdated', (data) => {
      if (data.product !== product.productId._id) return;
      if (data.streamId === streamId) {
        setHighestBid(data?.highestBid);
        setHighestBidder(data?.highestBidder);
      }
    });

    return () => {
      socket.off('bidUpdated');
      socket.off("timerUpdate");
      socket.off("auctionStarted");
      socket.off("auctionEnded");
      socket.off("clrScr");
    };
  }, [streamId]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBid = (newBid) => {
    if (newBid > highestBid && isActive && user) {
      socket.emit('placeBid', {
        streamId,
        user,
        amount: newBid
      });
    }
  };

  const calculateNextBids = () => {
    const increment = Math.max(500, Math.floor(highestBid * 0.1));
    return [
      Math.round(highestBid + increment),
      Math.round(highestBid + increment * 2)
    ];
  };

  const [nextBid1, nextBid2] = calculateNextBids();

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-black p-6 rounded-3xl shadow-2xl max-w-xl mx-auto text-white space-y-4">
      <div className="flex justify-between items-center">
        {isActive && (
          <span className={`text-xl font-bold ${timer / 1000 <= 11 ? 'text-red-500' : 'text-green-400'}`}>{formatTime(timer)}</span>
        )}
      </div>

      <div className="flex items-center gap-4 bg-stone-800 p-4 rounded-xl">
        <img src={signedUrls[product?.productId?._id] || "/placeholder.svg"} className="w-24 h-24 object-cover rounded-lg shadow-md" alt={product?.productId?.title} />
        <div>
          <h3 className="text-xl font-semibold">{product?.productId?.title}</h3>
          <p className="text-sm text-gray-300 mt-1 line-clamp-2">{product?.productId?.description}</p>
        </div>
      </div>

      <div className="text-center">
        {isActive && (
          <>
            <p className="text-sm text-gray-400">Current Bid</p>
            <p className="text-3xl font-bold text-yellow-400 flex justify-center items-center gap-2">
              <IndianRupee className="w-6 h-6" /> {highestBid?.toLocaleString()}
            </p>
          </>
        )}

        <AnimatePresence>
          {bidderWon ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mt-2 text-yellow-400">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Winner: {bidderWon.name}</span>
            </motion.div>
          ) : highestBidder && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mt-2 text-yellow-400">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Highest Bidder: {highestBidder.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden flex justify-center gap-4 mt-4">
        <button onClick={() => handleBid(nextBid1)} disabled={!isActive || !user || user?._id === highestBidder?._id} className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full font-medium transition duration-300">
          Bid <IndianRupee size={12} /> {nextBid1.toLocaleString()}
        </button>
        <button onClick={() => handleBid(nextBid2)} disabled={!isActive || !user || user?._id === highestBidder?._id} className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full font-medium transition duration-300">
          Bid <IndianRupee size={12} /> {nextBid2.toLocaleString()}
        </button>
      </div>
    </div>
  );
};

export default AuctionsUser;
