import { FaGift } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
// import { SOCKET_URL } from '../api/apiDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { socketurl } from '../../../config';

const socket = io.connect(socketurl, {
    transports: ['websocket'], // Force WebSocket transport
  });

const GiveAway = ({ showId, streamId, product, signedUrls }) => {
    const [applicants, setApplicants] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        setWinner(product?.winner || null);
        setApplicants(product?.applicants || []);
    }, [product]);

    useEffect(() => {
        socket.emit('joinRoom', streamId);

        socket.emit('startGiveaway', {
            streamId,
            productId: product.productId._id,
            productTitle: product.productId.title,
            followersOnly: false,
        });

        socket.on('giveawayApplicantsUpdated', ({ giveawayKey, applicants: updatedApplicants }) => {
            if (giveawayKey === `${streamId}_${product.productId._id}`) {
                setApplicants(updatedApplicants);
            }
        });

        socket.on('giveawayWinner', ({ giveawayKey, winner }) => {
            if (giveawayKey === `${streamId}_${product.productId._id}`) {
                setWinner(winner);
            }
        });

        socket.on('giveawayStarted', (data) => {
            setApplicants(data.applicants);
        });

        return () => {
            socket.off('giveawayApplicantsUpdated');
            socket.off('giveawayWinner');
        };
    }, [streamId, product]);

    const handleRollAndSelect = () => {
        socket.emit('rollGiveaway', {
            streamId,
            productId: product.productId._id,
        });
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-stone-950 border border-stone-800 shadow-lg rounded-2xl p-6 space-y-6 transition-all">
            {/* Product Card */}
            <div className="flex items-center gap-4 bg-stone-900 p-5 rounded-xl shadow-inner">
                <img
                    src={signedUrls[product.productId._id] || "/placeholder.svg"}
                    className="w-20 h-20 object-contain rounded-lg border border-stone-700"
                    alt={product.productId.title}
                />
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-1">{product.productId.title}</h2>
                    <p className="text-sm text-gray-400 line-clamp-2">{product.productId.description}</p>
                </div>
            </div>

            {/* Applicants */}
            <div className="space-y-1">
                <h4 className="text-sm font-semibold text-stone-300">Applicants</h4>
                {applicants.length > 0 ? (
                    <p className="text-sm text-gray-400">{applicants.length} user(s) applied for this giveaway.</p>
                ) : (
                    <p className="text-sm italic text-gray-500">No applicants yet.</p>
                )}
            </div>

            {/* Winner */}
            <div className="text-center">
                <AnimatePresence>
                    {winner && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-center gap-2 bg-stone-800 px-4 py-2 rounded-full mt-2 shadow"
                        >
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <p className="text-sm font-medium text-yellow-400">
                                Winner: <span className="font-semibold">{winner.name}</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Roll Button */}
            {!product.isGiveawayEnded && (
                <div className="flex justify-end">
                    <button
                        onClick={handleRollAndSelect}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm rounded-full shadow-md transition-all"
                    >
                        <FaGift size={14} /> Roll & Select
                    </button>
                </div>
            )}
        </div>
    );
};

export default GiveAway;
