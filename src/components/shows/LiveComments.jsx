// import { useState, useEffect, useRef } from "react";
// import io from "socket.io-client";
// import { Send, ChevronDown, MessageCircle } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { format } from 'date-fns';
// import { useAuth } from "../../context/AuthContext";
// import { SOCKET_URL } from "../api/apiDetails";
// import { socketurl } from "../../../config";

// // const socket = io.connect("http://localhost:6969");
// const socket = io.connect(socketurl, {
//     transports: ['websocket'], // Force WebSocket transport
// });

// // const socket = io.connect("https://flykup-be-new-production.up.railway.app"); // railway api not working in Mobile

// const LiveComments = ({ streamId, prevComments, height }) => {
//     const [comments, setComments] = useState(prevComments || []);
//     const [input, setInput] = useState("");
//     // const [user, setUser] = useState(null);
//     const { user, logout } = useAuth();
//     const [showScrollButton, setShowScrollButton] = useState(false);
//     const commentsContainerRef = useRef(null);

//     // Update comments when prevComments changes
//     useEffect(() => {
//         if (prevComments) {
//             setComments(prevComments);
//         }
//     }, [prevComments]);


//     // useEffect(() => {
//     //     const storedUser = localStorage.getItem("userData");
//     //     if (storedUser) {
//     //         try {
//     //             const parsedUser = JSON.parse(storedUser);
//     //             setUser(JSON.parse(storedUser));
//     //             // setComments(prevComments)
//     //         } catch (error) {
//     //             console.error("Failed to parse user data:", error);
//     //             localStorage.removeItem("userData");
//     //         }
//     //     }
//     // }, []);

//     useEffect(() => {
//         socket.emit("joinRoom", streamId);

//         socket.on(`commentAdded-${streamId}`, (comment) => {
//             setComments((prev) => [...prev, comment]);
//             if (commentsContainerRef.current) {
//                 setTimeout(scrollToBottom, 100);
//             }
//         });

//         return () => {
//             socket.off(`commentAdded-${streamId}`);
//         };
//     }, [streamId]);

//     useEffect(() => {
//         if (user) {
//             // socket.emit("newComment", {
//             //     user,
//             //     text: "joined👋",
//             //     timestamp: new Date().toLocaleTimeString(),
//             //     streamId,
//             // });
//             setInput("");
//             scrollToBottom();
//         }
//     }, [user, streamId])

//     const scrollToBottom = () => {
//         commentsContainerRef.current?.scrollTo({
//             top: commentsContainerRef.current.scrollHeight,
//             behavior: "smooth",
//         });
//     };

//     const handleScroll = () => {
//         if (commentsContainerRef.current) {
//             const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
//             setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
//         }
//     };

//     const handleSend = () => {
//         if (input.trim() && user) {
//             const newComment = {
//                 user,
//                 text: input,
//                 timestamp: new Date().toLocaleTimeString(),
//                 streamId,
//             };
//             socket.emit("newComment", newComment);
//             // setComments((prev) => [...prev, newComment]); // Optimistic update
//             setInput("");
//             scrollToBottom();
//         }
//     };

//     return (
//         <div
//             className={`w-100 flex flex-col transition-all font-inter`}
//             style={{ maxHeight: height || "30vh" }}
//         >
//             {/* Chat Messages */}
//             <div
//                 ref={commentsContainerRef}
//                 onScroll={handleScroll}
//                 className="flex-1 overflow-y-auto px-4 space-y-4 h-screen 
//                 bg-[radial-gradient(circle, rgba(0,0,0,0.5) 0%, transparent 100%)] 
//     rounded-xl 
//     overflow-hidden"
//                 style={{ scrollbarWidth: "none" }}
//             >
//                 <AnimatePresence>
//                     {comments.map((comment, index) => (
//                         <motion.div
//                             key={index}
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             className="flex items-start space-x-2"
//                         >
//                             <div className="avatar">
//                                 {comment?.user?.profileURL ? (
//                                     <div className="w-8 h-8 rounded-full flex items-center justify-center">
//                                         <img
//                                             src={comment?.user?.profileURL}
//                                             alt={comment?.user?.name || comment?.user?.userName}
//                                             className="w-full h-full object-cover"
//                                             onError={(e) => {
//                                                 e.target.parentElement.innerHTML = `<div class="w-8 h-8 bg-base-content text-primary-content rounded-full flex items-center justify-center">
//                                                     <span class="text-xs font-bold capitalize">${comment?.user?.userName.charAt(0)}</span>
//                                                 </div>`;
//                                             }}
//                                         />
//                                     </div>
//                                 ) : (
//                                     <div className="bg-base-content text-primary-content rounded-full w-8 h-8 flex items-center justify-center ring-2 ring-primary/20">
//                                         <span className="text-xs font-bold capitalize">{comment?.user?.userName?.charAt(0)}</span>
//                                     </div>
//                                 )}
//                             </div>
//                             <div className="flex-1 gap-0">
//                                 <div className="flex items-center space-x-2">
//                                     <span
//                                         className="
//         font-bold 
//         text-yellow-400 md:text-sm text-xs
//          [text-shadow:1px_1px_2px_rgba(0,0,0,0.7)]
//       "
//                                     >
//                                         {comment?.user?.userName || comment?.user?.name}
//                                     </span>
//                                     <span
//                                         className="
//         text-xs 
//         text-gray-200 
//         [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]
//       "
//                                     >
//                                         {format(new Date(comment?.createdAt), 'hh:mm a')}
//                                     </span>
//                                 </div>
//                                 <p
//                                     className="
//       text-white 
//       font-semibold md:text-sm text-xs
//       [text-shadow:2px_2px_3px_rgba(0,0,0,0.7)]
//     "
//                                 >
//                                     {comment?.text}
//                                 </p>
//                             </div>


//                             {/* <div className="chat-header">
//                                 {comment?.user?.name || comment?.user?.userName}
//                                 <span className="text-xs text-gray-400 ml-2">{format(new Date(comment?.createdAt), 'hh:mm a')}</span>
//                             </div>
//                             <div className="chat-bubble bg-gray-800">{comment?.text}</div> */}
//                         </motion.div>
//                     ))}
//                 </AnimatePresence>
//             </div>


//             {/* Chat Input */}
//             <div className="p-2 relative w-full flex items-center">
//                 {/* Scroll Button */}
//                 {showScrollButton && (
//                     <motion.button
//                         initial={{ opacity: 0, scale: 0.8 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         exit={{ opacity: 0, scale: 0.8 }}
//                         onClick={scrollToBottom}
//                         className="btn btn-circle btn-ghost bg-gray-800 text-white btn-sm absolute right-4 shadow-lg bottom-24"
//                     >
//                         <ChevronDown className="w-4 h-4" />
//                     </motion.button>
//                 )}
//                 <input
//                     type="text"
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     placeholder="Say something..."
//                     className="input input-bordered w-full md:text-sm text-xs md:h-10 h-9 border-gray-700 bg-transparent text-white rounded-full pr-12 pl-4"
//                     onKeyPress={(e) => e.key === "Enter" && handleSend()}
//                 />
//                 <button
//                     onClick={handleSend}
//                     disabled={!input.trim() || !user}
//                     className="btn btn-ghost bg-warning hover:bg-warning/50 text-black rounded-full btn-sm btn-circle absolute right-3"
//                 >
//                     <Send className="w-4 h-4" />
//                 </button>
//             </div>
//         </div>)
// }

// export default LiveComments



import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';
import { useAuth } from "../../context/AuthContext";
import { SOCKET_URL } from "../api/apiDetails";
import { socketurl } from "../../../config";

// Get CDN URL from environment
const VITE_AWS_CDN_URL = import.meta.env.VITE_AWS_CDN_URL;

const socket = io.connect(socketurl, {
    transports: ['websocket'], // Force WebSocket transport
});

const LiveComments = ({ streamId, prevComments, height }) => {
    const [comments, setComments] = useState(prevComments || []);
    const [input, setInput] = useState("");
    const { user, logout } = useAuth();
    const [showScrollButton, setShowScrollButton] = useState(false);
    const commentsContainerRef = useRef(null);

    // Update comments when prevComments changes
    useEffect(() => {
        if (prevComments) {
            setComments(prevComments);
        }
    }, [prevComments]);

    // Generate full image URL from CDN + key
    const getImageUrl = (key) => {
        if (!key || !VITE_AWS_CDN_URL) return null;
        // Ensure CDN URL ends with '/' and key doesn't start with '/'
        const cdnUrl = VITE_AWS_CDN_URL.endsWith('/') ? VITE_AWS_CDN_URL : `${VITE_AWS_CDN_URL}/`;
        const cleanKey = key.startsWith('/') ? key.substring(1) : key;
        return `${cdnUrl}${cleanKey}`;
    };

    // Get profile display name
    const getProfileName = (user) => {
        return user?.userName || user?.name || 'User';
    };

    // Get profile initials
    const getProfileInitials = (user) => {
        const name = getProfileName(user);
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    };

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

    useEffect(() => {
        if (user) {
            setInput("");
            scrollToBottom();
        }
    }, [user, streamId])

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
            setInput("");
            scrollToBottom();
        }
    };

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    return (
        <div
            className="w-full flex flex-col font-inter"
            style={{ maxHeight: height || "30vh" }}
        >
            {/* Chat Messages Container */}
            <div
                ref={commentsContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-2 sm:px-3 py-1 space-y-1"
                style={{ 
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                
                <AnimatePresence>
                    {comments.map((comment, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex items-start space-x-2 p-1.5 sm:p-2 hover:bg-blackLight/20 transition-all duration-150 rounded-md"
                        >
                            {/* Profile Avatar */}
                            <div className="flex-shrink-0">
                                {comment?.user?.profileURL?.key && VITE_AWS_CDN_URL ? (
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-blackLight border border-newYellow/15">
                                        <img
                                            src={getImageUrl(comment.user.profileURL.key)}
                                            alt={getProfileName(comment.user)}
                                            className="w-full h-full object-cover"
                                            onError={handleImageError}
                                        />
                                        <div 
                                            className="w-full h-full bg-gradient-to-br from-newYellow to-newYellow/80 flex items-center justify-center text-blackDark font-semibold text-xs hidden rounded-full"
                                        >
                                            {getProfileInitials(comment.user)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-newYellow via-newYellow/90 to-newYellow/80 flex items-center justify-center border border-newYellow/20">
                                        <span className="text-blackDark font-semibold text-xs">
                                            {getProfileInitials(comment.user)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                                {/* Header with name and timestamp - Mobile Responsive */}
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-medium text-newYellow text-xs sm:text-sm truncate mr-2">
                                        {getProfileName(comment.user)}
                                    </span>
                                    <span className="text-xs text-whiteHalf/80 font-normal whitespace-nowrap">
                                        {format(new Date(comment?.createdAt), 'hh:mm a')}
                                    </span>
                                </div>

                                {/* Message text */}
                                <div className="bg-blackLight/40 rounded-md px-2.5 py-1.5 border border-blackLight/20">
                                    <p className="text-whiteLight text-xs sm:text-sm leading-relaxed break-words">
                                        {comment?.text}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Chat Input Section */}
            <div className="p-2 sm:p-3 relative">
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="absolute right-3 sm:right-4 bottom-14 sm:bottom-16 bg-newYellow text-blackDark rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-md hover:bg-newYellow/80 transition-all duration-200 hover:scale-105 border border-newYellow/20"
                    >
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </motion.button>
                )}

                {/* Input Container */}
                <div className="relative flex items-center bg-blackLight rounded-full border border-blackLight/30">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-transparent text-whiteLight placeholder-whiteHalf px-3 py-2 pr-10 sm:pr-12 text-sm outline-none rounded-full"
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !user}
                        className={`absolute right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 border ${
                            input.trim() && user 
                                ? 'bg-newYellow text-blackDark hover:bg-newYellow/80 transform hover:scale-105 border-newYellow/20 shadow-sm' 
                                : 'bg-blackLight text-whiteHalf cursor-not-allowed border-blackLight/20'
                        }`}
                    >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveComments;