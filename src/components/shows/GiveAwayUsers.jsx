import { FaGift } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../api/apiDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { socketurl } from '../../../config';

const socket = io.connect(socketurl, {
  transports: ['websocket'], // Force WebSocket transport
});

const GiveAwayUsers = ({ showId, streamId, product, signedUrls }) => {
  const { user } = useAuth();
  const [hasApplied, setHasApplied] = useState(false);
  const [winner, setWinner] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [giveawayStarted, setGiveawayStarted] = useState(false);

  useEffect(() => {
    setWinner(product?.winner || null);
    setApplicants(product?.applicants || []);
    if (product?.applicants && user && product.applicants.includes(user._id)) {
      setHasApplied(true);
    } else {
      setHasApplied(false);
    }
  }, [product, user]);

  useEffect(() => {
    socket.emit('joinRoom', streamId);
    socket.on('giveawayStarted', (data) => {
      setApplicants(data.applicants);
      if (data.applicants && user && data.applicants.includes(user._id)) {
        setHasApplied(true);
      }
      setGiveawayStarted(true);
    });

    return () => {
      socket.off('giveawayStarted');
    };
  }, [streamId, product, user]);

  const handleGiveaway = () => {
    if (!user) return;
    socket.emit('applyGiveaway', {
      streamId,
      productId: product.productId._id,
      user: user,
    });
    setHasApplied(true);
  };

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-black p-6 rounded-3xl shadow-2xl max-w-xl mx-auto text-white space-y-4">
      <div className="flex items-center gap-4 bg-stone-800 p-4 rounded-xl">
        <img
          src={signedUrls[product.productId._id] || "/placeholder.svg"}
          className="w-24 h-24 object-cover rounded-lg shadow-md"
          alt={product.productId.title}
        />
        <div>
          <h3 className="text-xl font-semibold">{product.productId.title}</h3>
          <p className="text-sm text-gray-300 mt-1 line-clamp-2">
            {product.productId.description}
          </p>
        </div>
      </div>

      <div className="text-center">
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-2 text-yellow-400"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Winner: {winner.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!product.isGiveawayEnded && (
        <div className="flex justify-center gap-4">
          <button
            onClick={handleGiveaway}
            className={`bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-full font-medium transition duration-300 flex items-center gap-2 ${hasApplied ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={hasApplied}
          >
            <FaGift size={14} /> {hasApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GiveAwayUsers;
