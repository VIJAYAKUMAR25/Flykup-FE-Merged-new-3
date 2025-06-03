import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// This would replace the current rolling text display in your component
const AnimatedRollingDisplay = ({ isRolling, rollingWinner, isWinner, winner }) => {
    const [dots, setDots] = useState("...");

    // Animated dots effect
    useEffect(() => {
        if (isRolling) {
            const dotsInterval = setInterval(() => {
                setDots(prev => prev.length >= 3 ? "." : prev + ".");
            }, 300);

            return () => clearInterval(dotsInterval);
        }
    }, [isRolling]);

    return (
        <div className="pt-4 relative">
            <AnimatePresence mode="wait">
                {isRolling ? (
                    <motion.div
                        key="rolling"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center"
                    >
                        <div className="text-xl font-bold text-blue-500 mb-2">
                            Rolling{dots}
                        </div>

                        <div className="relative h-16 overflow-hidden w-full max-w-md mx-auto bg-gray-800 rounded-lg">
                            {/* Flashing light effects */}
                            <motion.div
                                className="absolute inset-0 bg-blue-500 opacity-10"
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />

                            {/* Rolling names display */}
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ y: ["-100%", "0%", "100%"] }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    ease: "easeInOut"
                                }}
                            >
                                <p className="text-lg font-semibold text-white">
                                    {rollingWinner
                                        ? rollingWinner.name || rollingWinner.emailId || "Anonymous"
                                        : "..."}
                                </p>
                            </motion.div>

                            {/* Slot machine effect overlay */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.8) 100%)"
                            }} />
                        </div>
                        <span className="loading loading-dots loading-lg text-blue-500"></span>


                        {/* Spinning wheel indicator */}
                        <motion.div
                            className="hidden w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mt-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        {isWinner ? (<>

                            <motion.div
                                className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-lg shadow-lg"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    boxShadow: [
                                        "0 0 0 rgba(0, 255, 0, 0)",
                                        "0 0 20px rgba(0, 255, 0, 0.7)",
                                        "0 0 0 rgba(0, 255, 0, 0)"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <span className="text-xl font-bold text-white">
                                    Congrats🤝 You are the winner!🥇🥂🔥
                                </span>
                            </motion.div>

                            <p className="text-xl font-bold text-success mt-10">
                                {`Winner: ${winner.userName ||
                                    winner.name ||
                                    "N/A"} ${winner.emailId || winner.email
                                        ? "(" + (winner.emailId || winner.email) + ")"
                                        : ""
                                    }🥇`}
                            </p>
                        </>
                        ) : (
                            <div className="text-xl font-bold text-success">
                                Winner: {winner.userName || winner.name || "N/A"}
                                {winner.emailId || winner.email
                                    ? ` (${winner.emailId || winner.email})`
                                    : ""
                                } 🥇
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedRollingDisplay;
