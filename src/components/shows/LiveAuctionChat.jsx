import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';
import { useAuth } from "../../context/AuthContext";


// const socket = io.connect("http://localhost:6969");
// const socket = io.connect("https://flykup-be-new.onrender.com"); // render api
// const socket = io.connect("https://flykup-be-new-production.up.railway.app"); // railway api not working in Mobile

const LiveAuctionChat = ({ streamId, prevComments }) => {
    const [comments, setComments] = useState(prevComments || []);
    const [input, setInput] = useState("");
    // const [user, setUser] = useState(null);
     const { user, logout } = useAuth();
    const [showScrollButton, setShowScrollButton] = useState(false);
    const commentsContainerRef = useRef(null);

    // Update comments when prevComments changes
    useEffect(() => {
        if (prevComments) {
            setComments(prevComments);
        }
    }, [prevComments]);

    console.log(comments);

    // useEffect(() => {
    //     const storedUser = localStorage.getItem("userData");
    //     if (storedUser) {
    //         try {
    //             const parsedUser = JSON.parse(storedUser);
    //             setUser(JSON.parse(storedUser));
    //             // setComments(prevComments)
    //         } catch (error) {
    //             console.error("Failed to parse user data:", error);
    //             localStorage.removeItem("userData");
    //         }
    //     }
    // }, []);

    useEffect(() => {
        socket.emit("joinRoom", streamId);

        socket.on(`commentAdded-${streamId}`, (comment) => {
            setComments((prev) => [...prev, comment]);
            if (commentsContainerRef.current) {
                setTimeout(scrollToBottom, 100);
            }
        });

        return () => {
            socket.off(`commentAdded-${streamId}`);
        };
    }, [streamId]);

    // useEffect(() => {
    //     if (user) {
    //         socket.emit("newComment", {
    //             user,
    //             text: "joined👋",
    //             timestamp: new Date().toLocaleTimeString(),
    //             streamId,
    //         });
    //         setInput("");
    //         scrollToBottom();
    //     }
    // }, [user, streamId])

    const scrollToBottom = () => {
        commentsContainerRef.current?.scrollTo({
            top: commentsContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    };

    const handleScroll = () => {
        if (commentsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
            setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
        }
    };

    const handleSend = () => {
        if (input.trim() && user) {
            const newComment = {
                user,
                text: input,
                timestamp: new Date().toLocaleTimeString(),
                streamId,
            };
            socket.emit("newComment", newComment);
            // setComments((prev) => [...prev, newComment]); // Optimistic update
            setInput("");
            scrollToBottom();
        }
    };

    return (
        <div className="w-100 max-h-screen border-l border-gray-800 flex-col hidden lg:flex">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <MessageCircle className="h-5 w-5" />
            </div>

            {/* Chat Messages */}
            <div
                ref={commentsContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-base-200 pr-2"
                style={{ scrollbarWidth: "thin" }}
            >
                <AnimatePresence>
                    {comments.map((comment, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`chat ${comment?.user?._id === user?._id ? 'chat-end' : 'chat-start'}`}
                        >
                            <div className="chat-image avatar">
                                {comment?.user?.profileURL ? (
                                    <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 overflow-hidden">
                                        <img
                                            src={comment?.user?.profileURL}
                                            alt={comment?.user?.name || comment?.user?.userName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.parentElement.innerHTML = `<div class="w-8 h-8 bg-base-content text-primary-content rounded-full flex items-center justify-center">
                                                            <span class="text-xs font-bold capitalize">${comment?.user?.userName.charAt(0)}</span>
                                                        </div>`;
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-base-content text-primary-content rounded-full w-8 h-8 flex items-center justify-center ring-2 ring-primary/20">
                                        <span className="text-xs font-bold capitalize">{comment?.user?.userName?.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="chat-header">
                                {comment?.user?.userName || comment?.user?.name}
                                <span className="text-xs text-gray-400 ml-2">{format(new Date(comment?.createdAt), 'hh:mm a')}</span>
                            </div>
                            <div className="chat-bubble bg-gray-800">{comment?.text}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-800 relative">
                {/* Scroll Button */}
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="btn btn-circle btn-ghost bg-gray-800 text-white btn-sm absolute right-4 shadow-lg bottom-24"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.button>
                )}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="input input-bordered w-full bg-gray-800 text-white rounded-full pr-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || !user}
                    className="btn btn-ghost bg-warning hover:bg-warning/50 text-black rounded-full btn-sm btn-circle absolute right-7 top-6"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default LiveAuctionChat;
