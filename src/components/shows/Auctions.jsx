import { useState, useEffect } from "react"
import io from "socket.io-client"
import { Trophy, IndianRupee, Gavel, Clock, PlayIcon, XCircle, AlertCircle, Timer, ArrowUp, ArrowDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FaPlay } from "react-icons/fa"
import { RiCloseLargeFill } from "react-icons/ri"
// import { SOCKET_URL } from "../api/apiDetails"

import { useAuth } from "../../context/AuthContext"
import { socketurl } from "../../../config"

const socket = io.connect(socketurl, {
  transports: ['websocket'], // Force WebSocket transport
});

const Auctions = ({ showId, streamId, product, signedUrls, currentAuction }) => {
  const [isActive, setIsActive] = useState(false)
  const { user, logout } = useAuth()
  const [isAuctionStarted, setIsAuctionStarted] = useState(false)
  const [highestBid, setHighestBid] = useState(100)
  const [highestBidder, setHighestBidder] = useState(null)
  const [nextBids, setNextBids] = useState([])
  const [bidderWon, setBidderWon] = useState(null)
  const [timer, setTimer] = useState(0) // auction time

  // Admin Functions
  const [customTime, setCustomTime] = useState(30)
  const [startingBid, setStartingBid] = useState(product?.startingPrice || 0)
  const [reservedPrice, setReservedPrice] = useState(product?.reservedPrice || 0)
  const [auctionType, setAuctionType] = useState("default")
  const [increment, setIncrement] = useState(2)
  const [showModal, setShowModal] = useState(false)
  const [bidHistory, setBidHistory] = useState([])
  const [uniqueStreamId, setUniqueStreamId] = useState("")
  const [bidDirection, setBidDirection] = useState("incremental"); // 'incremental' or 'decremental'
  const [bidReserveError, setBidReserveError] = useState(null);


  useEffect(() => {
    setBidderWon(product.bidderWon || null)
    setIsActive(currentAuction?.isActive || false)
  }, [currentAuction, product])

  useEffect(() => {
    socket.emit("joinRoom", streamId)

    socket.on("auctionStarted", (data) => {
      console.log("🚀 Auction started:", data)
      if (data.product !== product.productId._id) return
      setHighestBid(data.startingBid)
      setIsAuctionStarted(true)
      setIsActive(true)
      setUniqueStreamId(data.uniqueStreamId)

      const remainingTime = Math.max(0, data.endsAt - Date.now())
      setTimer(remainingTime)

      const increment = data.increment ?? Math.max(500, Math.floor(data.startingBid * 0.1))
      setNextBids([Math.round(data.startingBid + increment), Math.round(data.startingBid + increment * 2)])
    })

    socket.on("timerUpdate", (data) => {
      console.log("⏳ Timer update received:", data)
      if (data.product !== product.productId._id) return
      if (data.remainingTime !== undefined) {
        setTimer(data.remainingTime)
        setIsActive(data.remainingTime > 0)
      }
    })

    socket.on("auctionEnded", (data) => {
      if (data.product !== product.productId._id) return
      setIsActive(false)
      setBidderWon(data?.highestBidder)
      console.log("🏆 Auction ended! Winner:", data?.highestBidder?.name, "Final bid:", data?.highestBid)
    })

    socket.on("clrScr", () => {
      console.log("clr screen")

      setHighestBid(startingBid)
      setHighestBidder(null)
      setBidderWon(null)
      setTimer(30)
      setBidHistory([])
      setIsActive(false)
    })

    // Updates bid from backend
    socket.on("bidUpdated", (data) => {
      if (data.product !== product.productId._id) return
      if (data.streamId === streamId) {
        setHighestBid(data?.highestBid)
        setHighestBidder(data?.highestBidder)
        setBidHistory((prev) => [
          ...prev,
          {
            amount: data?.highestBid,
            bidder: data?.highestBidder,
            time: new Date().toLocaleTimeString(),
          },
        ])
      }
    })

    return () => {
      socket.off("bidUpdated")
      socket.off("timerUpdate")
      socket.off("auctionStarted")
      socket.off("auctionEnded")
      socket.off("clrScr")
    }
  }, [streamId])

  // --- Validation Effect for Bid/Reserve Price ---
  useEffect(() => {
    const startNum = parseFloat(startingBid);
    const reserveNum = parseFloat(reservedPrice);

    // Reset error first
    setBidReserveError(null);

    // Validation only applies if reserve price is entered and valid
    if (reservedPrice && !isNaN(reserveNum) && reserveNum > 0) {
      // Check if starting bid is also valid before comparing
      if (!isNaN(startNum) && startNum > 0) {
        if (bidDirection === "incremental" && startNum >= reserveNum) {
          setBidReserveError("Starting bid must be less than the reserved price.");
        } else if (bidDirection === "decremental" && startNum <= reserveNum) {
          setBidReserveError("Starting price must be greater than the reserved price.");
        }
      } else if (startingBid) {
        // Starting bid is required if reserve is set, handle this via button disable maybe
        // Or set error: setBidReserveError("Starting bid is required and must be positive.");
      }
    } else if (reservedPrice && (isNaN(reserveNum) || reserveNum <= 0)) {
      // Optional: Validate that if reserve price is entered, it's valid > 0
      setBidReserveError("Reserved price must be a valid number greater than 0.");
    }

  }, [startingBid, reservedPrice, bidDirection]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000) // Convert milliseconds to seconds
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleBid = (newBid) => {
    if (newBid > highestBid && isActive && user) {
      socket.emit("placeBid", {
        streamId,
        user,
        amount: newBid,
      })
    }
  }

  // from backend
  const calculateNextBids = () => {
    const increment = Math.max(500, Math.floor(highestBid * 0.1))
    return [Math.round(highestBid + increment), Math.round(highestBid + increment * 2)]
  }

  // Admin Functions
  const handleClearAuction = () => {
    socket.emit("clearAuction", streamId, product.productId)
  }

  const handleSetTimer = (e) => {
    console.log(e.target.value)
    setCustomTime(e.target.value)
  }

  const handleStartAuction = () => {
    setShowModal(true)
    console.log("modal open")
  }

  const confirmStartAuction = () => {
    setShowModal(false)
    if (auctionType === "suddenDeath") {
      socket.emit("startAuction", {
        streamId,
        product: product.productId._id,
        timer: customTime,
        bidDirection,
        auctionType,
        increment: null,
        startingBid: Number(startingBid),
        reservedPrice: Number(reservedPrice),
      })
    } else {
      socket.emit("startAuction", {
        streamId,
        product: product.productId._id,
        timer: customTime,
        bidDirection,
        auctionType,
        increment,
        startingBid: Number(startingBid),
        reservedPrice: Number(reservedPrice),
      })
    }
  }

  const [nextBid1, nextBid2] = calculateNextBids()

  return (
    <div className="w-full bg-stone-900 shadow-lg rounded-xl overflow-hidden ">
      {/* Header with timer and controls */}
      <div className="flex justify-between items-center p-3 bg-stone-800 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-white">Auction Controls</h3>
        </div>

        {isActive ? (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timer / 1000 <= 11 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}
          >
            <Clock className={`w-4 h-4 ${timer / 1000 <= 11 ? "text-red-400" : "text-amber-400"}`} />
            <span className="font-mono font-bold">{formatTime(timer)}</span>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleStartAuction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <PlayIcon className="w-3.5 h-3.5" />
              Start
            </button>

            {bidderWon && (
              <button
                onClick={handleClearAuction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="p-1">
        <div className="flex items-center space-x-4 bg-stone-950/50 p-3 rounded-lg border border-stone-800">
          <div className="w-24 h-24 bg-stone-800 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={signedUrls[product?.productId?._id] || "/placeholder.svg?height=96&width=96"}
              className="w-full h-full object-contain"
              alt={product?.productId?.title || "Product"}
            />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white">{product?.productId?.title || "Product Title"}</h4>
            <p className="text-stone-400 text-sm line-clamp-2">
              {product?.productId?.description || "No description available"}
            </p>

            {!isActive && !bidderWon && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-400">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Start auction to begin bidding</span>
              </div>
            )}
          </div>
        </div>

        {/* Bid information */}
        <div className="mt-4 text-center">
          {isActive && (
            <div className="bg-stone-950/50 rounded-lg p-4 border border-stone-800">
              <p className="text-sm text-stone-400 mb-1">Current Bid</p>
              <p className="text-3xl font-bold text-amber-500 flex items-center justify-center gap-1">
                <IndianRupee className="w-6 h-6" /> {highestBid?.toLocaleString() || "0"}
              </p>

              <AnimatePresence>
                {highestBidder && (
                  <motion.div
                    className="flex items-center justify-center gap-2 mt-3 bg-amber-500/10 py-2 px-3 rounded-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-400 font-medium">
                      Highest Bidder: {highestBidder.name || "Unknown"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {bidderWon && (
              <motion.div
                className="mt-4 bg-amber-500/10 py-3 px-4 rounded-lg border border-amber-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <p className="text-lg font-semibold text-amber-500">Winner: {bidderWon.name || "Unknown"}</p>
                </div>
                <p className="text-sm text-stone-400 mt-1">Final bid: ₹{highestBid?.toLocaleString() || "0"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Auction Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-stone-900 shadow-xl rounded-2xl p-6 max-w-md w-full border border-stone-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-500" />
                Auction Settings
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              >
                <RiCloseLargeFill className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {/* Auction Type Toggle */}
              <div className="bg-stone-800 p-3 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-white">Auction Type</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm ${auctionType !== "suddenDeath" ? "text-amber-500 font-medium" : "text-stone-400"}`}
                    >
                      Default
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={auctionType === "suddenDeath"}
                        onChange={() => setAuctionType(auctionType === "suddenDeath" ? "default" : "suddenDeath")}
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${auctionType === "suddenDeath" ? "bg-amber-500" : "bg-stone-700"}`}
                      >
                        <div
                          className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${auctionType === "suddenDeath" ? "translate-x-6" : "translate-x-0.5"}`}
                        ></div>
                      </div>
                    </div>
                    <span
                      className={`text-sm ${auctionType === "suddenDeath" ? "text-amber-500 font-medium" : "text-stone-400"}`}
                    >
                      Sudden Death
                    </span>
                  </div>
                </label>
              </div>

              {/* ----- New Bid Direction Radio Buttons ----- */}
              <div className="bg-stone-800 p-3 rounded-xl">
                <label className="block mb-3 text-sm font-medium text-white">Bidding Direction</label>
                <div className="flex items-center gap-6"> {/* Increased gap */}
                  {/* Incremental Option */}
                  <label htmlFor="incrementalRadio" className="flex items-center gap-2 cursor-pointer text-sm text-stone-200 hover:text-white">
                    <input
                      type="radio"
                      id="incrementalRadio"
                      name="bidDirection"
                      value="incremental"
                      checked={bidDirection === "incremental"}
                      onChange={(e) => setBidDirection(e.target.value)}
                      className="w-4 h-4 text-amber-600 bg-stone-700 border-stone-600 focus:ring-amber-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900"
                    />
                    <ArrowUp className={`w-4 h-4 ${bidDirection === 'incremental' ? 'text-green-500' : 'text-stone-400'}`} />
                    Incremental
                  </label>

                  {/* Decremental Option */}
                  <label htmlFor="decrementalRadio" className="flex items-center gap-2 cursor-pointer text-sm text-stone-200 hover:text-white">
                    <input
                      type="radio"
                      id="decrementalRadio"
                      name="bidDirection"
                      value="decremental"
                      checked={bidDirection === "decremental"}
                      // disabled
                      placeholder="Not available"
                      onChange={(e) => setBidDirection(e.target.value)}
                      className="w-4 h-4 text-amber-600 bg-stone-700 border-stone-600 focus:ring-amber-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900"
                    />
                    <ArrowDown className={`w-4 h-4 ${bidDirection === 'decremental' ? 'text-red-500' : 'text-stone-400'}`} />
                    Decremental
                  </label>
                </div>
              </div>
              {/* ----- End New Bid Direction Radio Buttons ----- */}

              {/* Increment Selection (only for default auction type) */}
              {auctionType === "default" && (
                <div className="bg-stone-800 p-3 rounded-xl">
                  <label className="block mb-2 text-sm font-medium text-white">Time Increment</label>
                  <select
                    value={increment}
                    onChange={(e) => setIncrement(Number(e.target.value))}
                    className="w-full bg-stone-700 border border-stone-600 text-white rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value={2}>2 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                  </select>
                </div>
              )}

              <div className="bg-stone-800 p-1 flex flex-col rounded-xl">
                <div className="flex gap-1">
                  {/* Starting Bid Input */}
                  <div className="bg-stone-800 p-1 rounded-xl">
                    <label className="block mb-1 text-sm font-medium text-white">Starting Bid (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                      <input
                        type="number"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        className="w-full pl-10 bg-stone-700 border border-stone-600 text-white rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Reserved price Input */}
                  <div className="bg-stone-800 p-1 rounded-xl">
                    <label className="block mb-2 text-sm font-medium text-white">Reserved Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                      <input
                        type="number"
                        value={reservedPrice}
                        onChange={(e) => setReservedPrice(e.target.value)}
                        className="w-full pl-10 bg-stone-700 border border-stone-600 text-white rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  {/* ----- Validation Error Display ----- */}
                  {bidReserveError && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {bidReserveError}
                    </p>
                  )}
                </div>
              </div>

              {/* Auction Time Input */}
              <div className="bg-stone-800 p-3 rounded-xl">
                <label className="block mb-2 text-sm font-medium text-white">Auction Time (seconds)</label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    type="number"
                    value={customTime}
                    onChange={handleSetTimer}
                    className="w-full pl-10 bg-stone-700 border border-stone-600 text-white rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500 rounded-full"
                  />
                </div>
              </div>



              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={confirmStartAuction}
                  disabled={
                    !startingBid || Number(startingBid) <= 0 || // Must have positive starting bid
                    !customTime || Number(customTime) < 10 || // Must have time >= 10s (example)
                    (reservedPrice !== "" && Number(reservedPrice) <= 0) || // If reserve set, must be positive
                    !!bidReserveError // Disabled if specific bid/reserve error exists
                  }
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPlay className="w-3.5 h-3.5" />
                  Start Auction
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auctions;

