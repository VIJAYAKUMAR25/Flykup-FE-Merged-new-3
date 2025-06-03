"use client"

import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { GET_SINGLE_STREAM_DATA } from "../../api/apiDetails.js"
import { io } from "socket.io-client"
import * as mediasoupClient from "mediasoup-client"
import { mediaSoupServerUrl } from "../../../../config.js"

export default function ViewLiveStream(liveStreamId) {
  // const { seller_id } = useParams()
  const navigate = useNavigate()
  const [streamData, setStreamData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Not connected")
  const [logs, setLogs] = useState([])
  const [videoElements, setVideoElements] = useState([])
  const [consumers, setConsumers] = useState([])
  const [showControls, setShowControls] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(2) 
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPipActive, setIsPipActive] = useState(false)
  const [pipAvailable, setPipAvailable] = useState(false)
  const [activeVideoRef, setActiveVideoRef] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [activeCohost, setActiveCohost] = useState(0) // Index of active cohost in vertical view
  const [userRole, setUserRole] = useState("viewer") // Default to viewer
  const [deviceType, setDeviceType] = useState("mobile") // Default to mobile
  const [streamEnded, setStreamEnded] = useState(false) // Track if stream has ended

  const socketRef = useRef(null)
  const deviceRef = useRef(null)
  const consumerTransportsRef = useRef({})
  const consumersRef = useRef(new Map()) // Changed to Map for better tracking
  const logContainerRef = useRef(null)
  const roomIdRef = useRef(null)
  const consumedProducersRef = useRef(new Set()) // Track consumed producers to prevent duplicates
  const containerRef = useRef(null)
  const producerTrackingRef = useRef(new Map()) // Store producer info for deduplication
  const videoRefsMap = useRef(new Map()) // Store refs to video elements
  const hostVideoRef = useRef(null) // Specific ref for host video
  const heartbeatIntervalRef = useRef(null) // For viewer heartbeats

  // Add log message
  const addLog = (message) => {
    console.log(message)
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])

    // Scroll to bottom of logs
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
      }
    }, 100)
  }

  // Detect device type
  useEffect(() => {
    // Check if the device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    setDeviceType(isMobile ? "mobile" : "desktop");
    
    // Update on resize
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setDeviceType(isMobile ? "mobile" : "desktop");
    };
    
    window.addEventListener('resize', handleResize);
    
    // For mobile devices that support the orientation change event
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Check if Picture-in-Picture is supported
  useEffect(() => {
    // Check if the browser supports PiP
    const isPipSupported = 
      document.pictureInPictureEnabled || 
      (document.documentElement.webkitSupportsPresentationMode && 
       typeof document.documentElement.webkitSetPresentationMode === 'function');
       
    setPipAvailable(isPipSupported);
    
    if (isPipSupported) {
      addLog("Picture-in-Picture is supported");
    } else {
      addLog("Picture-in-Picture is not supported in this browser");
    }
    
    // Listen for PiP events
    const handlePipChange = () => {
      setIsPipActive(!!document.pictureInPictureElement);
    };
    
    document.addEventListener('enterpictureinpicture', handlePipChange);
    document.addEventListener('leavepictureinpicture', handlePipChange);
    
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePipChange);
      document.removeEventListener('leavepictureinpicture', handlePipChange);
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = mediaSoupServerUrl
    addLog(`Connecting to server: ${serverUrl}`)

    // Connect with proper options to avoid CORS issues
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current.on("connect", () => {
      addLog(`Connected to server: ${socketRef.current.id}`)
      setIsConnected(true)
      setStatusMessage("Connected to server")
    })

    socketRef.current.on("connect_error", (err) => {
      addLog(`Connection error: ${err.message}`)
      setStatusMessage(`Connection error: ${err.message}`)
    })

    socketRef.current.on("disconnect", () => {
      addLog("Disconnected from server")
      setIsConnected(false)
      setStatusMessage("Disconnected from server")
      handleStopWatching()
    })

    // Listen for new producers - modified to handle duplicates
    socketRef.current.on("newProducer", async ({ producerId, kind }) => {
      addLog(`New ${kind} producer available: ${producerId}`)
      
      // Rigorous duplicate check
      if (consumedProducersRef.current.has(producerId)) {
        addLog(`Already consuming producer ${producerId}, ignoring duplicate`)
        return
      }
      
      if (isWatching && roomIdRef.current) {
        // Consume the new producer
        await consumeProducer(roomIdRef.current, producerId, kind)
      }
    })

    // Listen for producer closed events
    socketRef.current.on("producerClosed", ({ producerId }) => {
      addLog(`Producer ${producerId} closed`)
      
      // Remove this producer from tracking
      consumedProducersRef.current.delete(producerId)
      
      // Also remove from our producer tracking map
      producerTrackingRef.current.delete(producerId)
      
      // Remove from video elements
      setVideoElements(prev => prev.filter(v => v.producerId !== producerId))
      
      // Close any associated consumers
      for (const [consumerId, data] of consumersRef.current.entries()) {
        if (data.producerId === producerId) {
          if (data.consumer) {
            data.consumer.close()
          }
          consumersRef.current.delete(consumerId)
        }
      }
      
      // Update consumers state
      setConsumers(prev => prev.filter(c => c.producerId !== producerId))
    })

    // Listen for stream ended event - ENHANCED
    socketRef.current.on("streamEnded", ({ streamId, reason }) => {
      addLog(`Stream has ended: ${streamId}. Reason: ${reason || 'Unknown'}`)
      
      // Set stream ended state
      setStreamEnded(true)
      
      // Stop watching
      handleStopWatching()
      
      // Display a proper message to the user
      setStatusMessage("This stream has ended")
      
      // Show a modal/notification that stream has ended
      setTimeout(() => {
        if (confirm("The live stream has ended. Return to the homepage?")) {
          navigate('/'); // Redirect to home page
        }
      }, 1000);
    })

    // Listen for viewer count updates - REAL DATA
    socketRef.current.on("viewerCountUpdate", ({ streamId, count }) => {
      if (roomIdRef.current === streamId) {
        addLog(`Viewer count updated: ${count} viewers`);
        setViewerCount(count);
      }
    });

    // Listen for heartbeat requests and respond
    socketRef.current.on("heartbeat", (data, callback) => {
      if (typeof callback === "function") {
        callback({ received: true, timestamp: Date.now() });
      }
    });

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    }
  }, [navigate])

  // Set up heartbeat for the viewer
  useEffect(() => {
    if (isWatching && roomIdRef.current) {
      // Send ping to backend API periodically to maintain activity
      heartbeatIntervalRef.current = setInterval(() => {
        // Call the backend API to update the lastHeartbeat
        if (roomIdRef.current) {
          axios.get(`${GET_SINGLE_STREAM_DATA}/${roomIdRef.current}`)
            .catch(err => {
              console.error("Error sending viewer heartbeat:", err);
            });
        }
      }, 60000); // Every minute
      
      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [isWatching, roomIdRef.current]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      // Toggle controls visibility when fullscreen changes
      if (document.fullscreenElement) {
        setShowControls(false)
      } else {
        setShowControls(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Update isWatching dependency for newProducer handler
  useEffect(() => {
    // If socket exists, disconnect and reconnect the newProducer event handler
    // to ensure it has the latest isWatching state
    if (socketRef.current) {
      socketRef.current.off("newProducer")
      
      socketRef.current.on("newProducer", async ({ producerId, kind }) => {
        addLog(`New ${kind} producer available: ${producerId}`)
        
        // Rigorous duplicate check - check both by producerId and by kind+sellerId
        if (consumedProducersRef.current.has(producerId)) {
          addLog(`Already consuming producer ${producerId}, ignoring duplicate`)
          return
        }
        
        if (isWatching && roomIdRef.current) {
          // Consume the new producer
          await consumeProducer(roomIdRef.current, producerId, kind)
        }
      })
    }
  }, [isWatching])

  const loadDevice = async (routerRtpCapabilities) => {
    try {
      addLog("Loading mediasoup device")
      deviceRef.current = new mediasoupClient.Device()
      await deviceRef.current.load({ routerRtpCapabilities })
      addLog("Device loaded successfully")
      return true
    } catch (error) {
      addLog(`Failed to load device: ${error.message}`)
      setStatusMessage(`Error: ${error.message}`)
      return false
    }
  }

  // Create consumer transport
  const createConsumerTransport = async (roomId) => {
    try {
      addLog(`Requesting consumer transport for room: ${roomId}`)
      // Request the server to create a consumer transport
      const transportOptions = await new Promise((resolve, reject) => {
        socketRef.current.emit("createConsumerTransport", { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response)
          }
        })
      })

      addLog("Creating consumer transport")
      // Create the transport on client side
      const transport = deviceRef.current.createRecvTransport(transportOptions)
      const transportId = transport.id

      // Handle transport events
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        addLog(`Consumer transport connect event for transport: ${transportId}`)
        try {
          await new Promise((resolve, reject) => {
            socketRef.current.emit(
              "connectConsumerTransport",
              {
                dtlsParameters,
                transportId,
                roomId,
              },
              (response) => {
                if (response.error) {
                  reject(new Error(response.error))
                } else {
                  resolve(response)
                }
              },
            )
          })

          addLog(`Consumer transport connected: ${transportId}`)
          callback()
        } catch (error) {
          addLog(`Consumer transport connect error: ${error.message}`)
          errback(error)
        }
      })

      transport.on("connectionstatechange", (state) => {
        addLog(`Consumer transport connection state for transport ${transportId}: ${state}`)
        if (state === "failed") {
          addLog(`Transport ${transportId} failed - closing`)
          transport.close()
          delete consumerTransportsRef.current[transportId]
        }
      })

      addLog(`Consumer transport created successfully: ${transportId}`)
      return transport
    } catch (error) {
      addLog(`Error creating consumer transport: ${error.message}`)
      setStatusMessage(`Transport error: ${error.message}`)
      return null
    }
  }

  // Set preferred layers for a consumer based on selected quality
  const setPreferredLayers = async (consumerId, consumer) => {
    if (!consumer || consumer.kind !== 'video') return;
    
    try {
      // Only video consumers support layers
      // selectedLayerIndex: 0=low, 1=medium, 2=high
      const spatialLayer = Math.min(selectedLayerIndex, 2); // Only use up to 3 layers (0,1,2)
      
      addLog(`Setting preferred layers for consumer ${consumerId}: spatial=${spatialLayer}, temporal=2`)
      
      // For video simulcast - set the preferred spatial layer
      await consumer.setPreferredLayers({ spatialLayer, temporalLayer: 2 }); // Always use highest temporal layer
    } catch (error) {
      addLog(`Error setting preferred layers: ${error.message}`);
    }
  };

  // Find the seller associated with a producer
  const getSellerFromProducerId = (producerId) => {
    // First check our tracking map
    if (producerTrackingRef.current.has(producerId)) {
      return producerTrackingRef.current.get(producerId);
    }
    
    // If not found, check the stream data
    const producer = streamData?.producers?.find(
      p => p.videoProducerId === producerId || p.audioProducerId === producerId
    );
    
    if (producer) {
      // Store for future reference
      producerTrackingRef.current.set(producerId, {
        sellerId: producer.sellerId,
        socketId: producer.socketId,
        isHost: producer === streamData?.producers[0] // Assume first producer is host
      });
      return { 
        sellerId: producer.sellerId, 
        socketId: producer.socketId,
        isHost: producer === streamData?.producers[0]
      };
    }
    
    return null;
  };

  // Is this producer the host?
  const isHostProducer = (producerId) => {
    const sellerInfo = getSellerFromProducerId(producerId);
    return sellerInfo?.isHost || false;
  };

  // Checks if we already have a video element for this seller
  const hasVideoElementForSeller = (sellerId, socketId) => {
    if (!sellerId || !socketId) return false;
    
    // Check our existing video elements
    return videoElements.some(v => {
      const vSellerInfo = getSellerFromProducerId(v.producerId);
      return vSellerInfo && 
             vSellerInfo.sellerId === sellerId && 
             vSellerInfo.socketId === socketId;
    });
  };

  // Consume a producer's stream
  const consumeProducer = async (roomId, producerId, kind) => {
    try {
      // Skip if we're already consuming this producer
      if (consumedProducersRef.current.has(producerId)) {
        addLog(`Already consuming producer ${producerId}, skipping`)
        return null
      }
      
      // Get seller info for deduplication
      const sellerInfo = getSellerFromProducerId(producerId);
      
      // For video, check if we already have a video for this seller
      // Only do this rigorous check for video producers, as we want to merge audio with video
      if (kind === 'video' && sellerInfo) {
        if (hasVideoElementForSeller(sellerInfo.sellerId, sellerInfo.socketId)) {
          addLog(`Already have a video for seller ${sellerInfo.sellerId}, updating instead of creating new`)
          // We'll continue to consume this, but we'll update the existing video element
        }
      }
      
      addLog(`Consuming ${kind} producer: ${producerId}`)

      // Mark this producer as being consumed
      consumedProducersRef.current.add(producerId)

      // Create transport if it doesn't exist for this producer
      if (!consumerTransportsRef.current[producerId]) {
        const transport = await createConsumerTransport(roomId)
        if (!transport) {
          throw new Error(`Failed to create transport for producer: ${producerId}`)
        }
        consumerTransportsRef.current[producerId] = transport
      }

      const transport = consumerTransportsRef.current[producerId]

      // Request consumption from the server with preferred layers for video
      const preferredLayers = kind === 'video' ? { spatialLayer: selectedLayerIndex, temporalLayer: 2 } : null;
      
      // Request consumption from the server
      const { id, rtpParameters } = await new Promise((resolve, reject) => {
        socketRef.current.emit(
          "consume",
          {
            transportId: transport.id,
            producerId,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
            roomId,
            preferredLayers
          },
          (response) => {
            if (response.error) {
              reject(new Error(response.error))
            } else {
              resolve(response)
            }
          },
        )
      })

      // Create the consumer
      const consumer = await transport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
      })

      // Store the consumer properly with its producerId for tracking
      consumersRef.current.set(consumer.id, {
        consumer,
        producerId,
        kind,
        sellerInfo
      })

      // Set preferred layers for video consumers
      if (kind === 'video') {
        await setPreferredLayers(consumer.id, consumer);
      }

      // Resume the consumer to start receiving media
      let resumeSuccess = false
      let retryCount = 0
      const maxRetries = 3

      while (!resumeSuccess && retryCount < maxRetries) {
        try {
          await new Promise((resolve, reject) => {
            socketRef.current.emit(
              "resumeConsumer",
              {
                roomId,
                consumerId: consumer.id,
              },
              (response) => {
                if (response && response.error) {
                  reject(new Error(response.error))
                } else {
                  resolve(response)
                }
              },
            )

            // Add a timeout in case the server doesn't respond
            setTimeout(() => {
              reject(new Error("Resume consumer timeout"))
            }, 5000)
          })

          resumeSuccess = true
          addLog(`Successfully resumed consumer ${consumer.id}`)
        } catch (error) {
          retryCount++
          addLog(`Error resuming consumer (attempt ${retryCount}): ${error.message}`)

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      if (!resumeSuccess) {
        addLog(`Failed to resume consumer after ${maxRetries} attempts`)
        // Continue anyway - some servers auto-resume consumers
      }

      addLog(`Successfully consuming ${kind} with ID: ${consumer.id}`)

      // Add to consumers state, avoiding duplicates
      setConsumers(prev => {
        // Check if this consumer is already in the list
        const exists = prev.some(c => c.id === consumer.id)
        if (exists) return prev
        return [...prev, consumer]
      })

      // Update UI based on kind
      if (kind === "video") {
        // Create or update video element for this producer
        updateVideoElements(producerId, consumer, sellerInfo)
      } else if (kind === "audio") {
        // For audio, find the video element for this producer and add audio
        updateAudioForVideoElement(producerId, consumer, sellerInfo)
      }

      // Set up consumer event listeners
      consumer.on("transportclose", () => {
        addLog(`Consumer transport closed for ${kind} consumer ${consumer.id}`)
        consumersRef.current.delete(consumer.id)
      })

      consumer.on("trackended", () => {
        addLog(`Track ended for ${kind} consumer ${consumer.id}`)
      })

      return consumer
    } catch (error) {
      addLog(`Error consuming ${kind}: ${error.message}`)
      // Remove from consumed set if it failed
      consumedProducersRef.current.delete(producerId)
      return null
    }
  }

  // Update video elements without creating duplicates
  const updateVideoElements = (producerId, consumer, sellerInfo) => {
    setVideoElements(prev => {
      // First, check if we already have a video element for this producer
      const existingProducerIndex = prev.findIndex(v => v.producerId === producerId)
      
      // Then check if we have a video element for this seller (to handle duplicates)
      const existingSellerIndex = sellerInfo ? 
        prev.findIndex(v => {
          const vSellerInfo = getSellerFromProducerId(v.producerId)
          return vSellerInfo && 
                 vSellerInfo.sellerId === sellerInfo.sellerId && 
                 vSellerInfo.socketId === sellerInfo.socketId
        }) : -1
      
      // If we found the exact producer, update it
      if (existingProducerIndex !== -1) {
        // Update existing video element
        const updated = [...prev]
        const currentStream = updated[existingProducerIndex].stream
        
        // Replace the video track in the existing stream
        const newStream = new MediaStream()
        
        // Add any existing audio tracks
        currentStream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            newStream.addTrack(track)
          }
        })
        
        // Add the new video track
        newStream.addTrack(consumer.track)
        
        updated[existingProducerIndex] = {
          ...updated[existingProducerIndex],
          stream: newStream,
          consumer,
          isHost: sellerInfo?.isHost
        }
        
        addLog(`Updated video for producer: ${producerId}`)
        return updated
      } 
      // If we found a different producer but same seller, update that one to avoid duplicates
      else if (existingSellerIndex !== -1) {
        // Update existing video element for this seller
        const updated = [...prev]
        const currentStream = updated[existingSellerIndex].stream
        
        // Create a new stream with updated video and keep audio
        const newStream = new MediaStream()
        
        // Add any existing audio tracks
        currentStream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            newStream.addTrack(track)
          }
        })
        
        // Add the new video track
        newStream.addTrack(consumer.track)
        
        // Update the element but keep the original producerId for tracking
        updated[existingSellerIndex] = {
          ...updated[existingSellerIndex],
          stream: newStream,
          videoProducerId: producerId, // Store this for reference
          consumer,
          isHost: sellerInfo?.isHost
        }
        
        addLog(`Updated video for seller ${sellerInfo.sellerId} with new producer: ${producerId}`)
        return updated
      } 
      // Otherwise create a new video element
      else {
        // Create a new video element
        addLog(`Created new video element for producer: ${producerId}`)
        return [
          ...prev,
          {
            producerId,
            stream: new MediaStream([consumer.track]),
            label: getProducerLabel(producerId),
            consumer,
            sellerId: sellerInfo?.sellerId,
            isHost: sellerInfo?.isHost
          }
        ]
      }
    })
  }

  // Update audio for an existing video element
  const updateAudioForVideoElement = (producerId, consumer, sellerInfo) => {
    setVideoElements(prev => {
      // First try to find a video element with the same producer
      const exactProducerIndex = prev.findIndex(v => v.producerId === producerId)
      
      // Then try to find a video element for the same seller
      const sellerIndex = sellerInfo ? 
        prev.findIndex(v => {
          const vSellerInfo = getSellerFromProducerId(v.producerId)
          return vSellerInfo && 
                 vSellerInfo.sellerId === sellerInfo.sellerId && 
                 vSellerInfo.socketId === sellerInfo.socketId
        }) : -1
      
      // If we have an exact match, update it
      if (exactProducerIndex !== -1) {
        // Update existing video element with audio track
        const updated = [...prev]
        const currentStream = updated[exactProducerIndex].stream
        
        // Create a new stream with both tracks
        const newStream = new MediaStream()
        
        // Add any existing video tracks
        currentStream.getTracks().forEach(track => {
          if (track.kind === 'video') {
            newStream.addTrack(track)
          }
        })
        
        // Add the audio track
        newStream.addTrack(consumer.track)
        
        updated[exactProducerIndex] = {
          ...updated[exactProducerIndex],
          stream: newStream,
          audioConsumer: consumer
        }
        
        addLog(`Added audio to existing video for producer: ${producerId}`)
        return updated
      } 
      // If we found a video element for the same seller, update that
      else if (sellerIndex !== -1) {
        // Update seller's video element with audio
        const updated = [...prev]
        const currentStream = updated[sellerIndex].stream
        
        // Create a new stream with both tracks
        const newStream = new MediaStream()
        
        // Add any existing video tracks
        currentStream.getTracks().forEach(track => {
          if (track.kind === 'video') {
            newStream.addTrack(track)
          }
        })
        
        // Add the audio track
        newStream.addTrack(consumer.track)
        
        updated[sellerIndex] = {
          ...updated[sellerIndex],
          stream: newStream,
          audioProducerId: producerId, // Store this for reference
          audioConsumer: consumer
        }
        
        addLog(`Added audio to existing video for seller: ${sellerInfo.sellerId}`)
        return updated
      } 
      // If no matches, create audio-only for now
      else {
        // No video element yet, create audio-only for now
        addLog(`Created new audio-only element for producer: ${producerId}`)
        return [
          ...prev,
          {
            producerId,
            stream: new MediaStream([consumer.track]),
            label: `${getProducerLabel(producerId)} (audio only)`,
            consumer,
            sellerId: sellerInfo?.sellerId,
            audioOnly: true,
            isHost: sellerInfo?.isHost
          }
        ]
      }
    })
  }

  // Get a user-friendly label for a producer
  const getProducerLabel = (producerId) => {
    // Check if this producer belongs to a known seller
    const producer = streamData?.producers?.find(
      p => p.videoProducerId === producerId || p.audioProducerId === producerId
    )
    
    if (producer) {
      return producer.sellerId || `Producer ${producerId.substring(0, 8)}...`
    }
    
    return `Producer ${producerId.substring(0, 8)}...`
  }




  const handleGetStream = async () => {
    try {
      addLog(`Fetching stream data for ID: ${liveStreamId.liveStreamId}`)
      const response = await axios.get(`${GET_SINGLE_STREAM_DATA}/${liveStreamId.liveStreamId }`)

      if (response.data.status && response.data.data) {
        const stream = response.data.data
        
        // Check if stream is live
        if (stream.streamStatus !== 'live') {
          setStreamEnded(true)
          setStatusMessage("This stream is no longer live")
          addLog("Stream is not live")
          return
        }
        
        setStreamData(stream)
        addLog(`Stream data received: ${stream._id}`)

        // Store the room ID for later use
        roomIdRef.current = stream._id

        // Start watching the stream
        await handleWatchStream(stream)
      } else {
        addLog("Invalid stream data received")
        setStatusMessage("Stream not found")
      }
    } catch (err) {
      console.error("Error fetching stream:", err)
      addLog(`Error getting stream data: ${err.message}`)
      setStatusMessage(`Error: ${err.message}`)
    }
  }

  useEffect(() => {
    if (liveStreamId.liveStreamId ) {
      handleGetStream()
    }
    
    return () => {
      // Cleanup when component unmounts
      handleStopWatching();
    };
  }, [liveStreamId.liveStreamId])

  // Start watching function
  const handleWatchStream = async (stream) => {
    if (isWatching || !stream || streamEnded) return;
    
    setStatusMessage("Connecting to stream...");
    addLog(`Starting to watch stream: ${stream._id}`);

    try {
      // Clear any previous state to avoid duplicates
      setVideoElements([]);
      setConsumers([]);
      consumedProducersRef.current.clear();
      consumersRef.current.clear();
      producerTrackingRef.current.clear(); // Clear producer tracking
      videoRefsMap.current.clear(); // Clear video refs
      
      // Close any existing transports
      Object.values(consumerTransportsRef.current).forEach(transport => {
        if (transport) transport.close();
      });
      consumerTransportsRef.current = {};

      // Join the room first
      addLog(`Joining room: ${stream._id}`);
      await new Promise((resolve, reject) => {
        socketRef.current.emit("joinRoom", { roomId: stream._id }, (response) => {
          if (response && response.joined) {
            resolve();
            addLog(`Successfully joined room: ${stream._id}`);
          } else {
            reject(new Error("Failed to join room"));
          }
        });

        // Add timeout in case server doesn't respond
        setTimeout(() => {
          reject(new Error("Join room timeout"));
        }, 5000);
      });

      // Get router capabilities
      addLog("Getting router RTP capabilities");
      const routerRtpCapabilities = await new Promise((resolve, reject) => {
        console.log("Requesting router RTP capabilities",stream._id)
        socketRef.current.emit("getRouterRtpCapabilities", { roomId: stream._id }, (data) => {
          if (data && data.error) {
            reject(new Error(data.error));
          } else if (!data) {
            reject(new Error("No RTP capabilities received"));
          } else {
            resolve(data);
          }
        });

        // Add timeout in case server doesn't respond
        setTimeout(() => {
          reject(new Error("Get RTP capabilities timeout"));
        }, 5000);
      });

      // Load device with router capabilities
      if (!(await loadDevice(routerRtpCapabilities))) {
        throw new Error("Failed to load device");
      }

      // Pre-process producer/seller mappings for better deduplication
      // This helps us avoid duplicates by tracking which sellers own which producers
      if (stream.producers) {
        for (const producer of stream.producers) {
          if (producer.videoProducerId) {
            producerTrackingRef.current.set(producer.videoProducerId, {
              sellerId: producer.sellerId,
              socketId: producer.socketId,
              isHost: producer === stream.producers[0] // Assume first producer is host
            });
          }
          if (producer.audioProducerId) {
            producerTrackingRef.current.set(producer.audioProducerId, {
              sellerId: producer.sellerId,
              socketId: producer.socketId,
              isHost: producer === stream.producers[0]
            });
          }
        }
      }

      // Get the active producers
      addLog("Getting active producers");
      const activeProducers = await new Promise((resolve, reject) => {
        socketRef.current.emit("getProducers", { roomId: stream._id }, (data) => {
          if (!data) {
            resolve([]);
          } else {
            resolve(data);
          }
        });

        // Add timeout in case server doesn't respond
        setTimeout(() => {
          reject(new Error("Get producers timeout"));
        }, 5000);
      });

      addLog(`Found ${activeProducers.length} active producers`);

      // Set watching state first so event handlers work
      setIsWatching(true);
      
      // Process video producers first
      const videoProducers = activeProducers.filter(p => p.kind === "video");
      for (const { producerId, kind } of videoProducers) {
        // Skip duplicate producers for the same seller
        const sellerInfo = getSellerFromProducerId(producerId);
        if (sellerInfo && hasVideoElementForSeller(sellerInfo.sellerId, sellerInfo.socketId)) {
          addLog(`Skipping duplicate video for seller ${sellerInfo.sellerId}`);
          continue;
        }
        await consumeProducer(stream._id, producerId, kind);
      }
      
      // Then process audio producers
      const audioProducers = activeProducers.filter(p => p.kind === "audio");
      for (const { producerId, kind } of audioProducers) {
        await consumeProducer(stream._id, producerId, kind);
      }

      // Double check for duplicates in our videoElements state
      setVideoElements(prev => {
        const uniqueElements = [];
        const seenSellerIds = new Set();
        
        for (const element of prev) {
          const sellerInfo = getSellerFromProducerId(element.producerId);
          
          if (!sellerInfo || !seenSellerIds.has(sellerInfo.socketId)) {
            // Only add if we don't already have this seller
            if (sellerInfo) {
              seenSellerIds.add(sellerInfo.socketId);
            }
            uniqueElements.push(element);
          }
        }
        
        return uniqueElements;
      });

      setStatusMessage("Connected to stream - Watching Live");
      addLog("Started watching stream successfully");
    } catch (error) {
      addLog(`Error watching stream: ${error.message}`);
      setStatusMessage(`Stream error: ${error.message}`);
      setIsWatching(false); // Reset watching state on error
    }
  };

  const handleStopWatching = () => {
    addLog("Stopping stream playback");

    // Exit PiP if active
    exitPictureInPicture();

    // Close all consumers
    consumers.forEach((consumer) => {
      if (consumer) {
        consumer.close();
      }
    });

    // Close all transports
    Object.values(consumerTransportsRef.current).forEach((transport) => {
      if (transport) {
        transport.close();
      }
    });

    // Clear all refs and state
    consumersRef.current.clear();
    consumerTransportsRef.current = {};
    consumedProducersRef.current.clear();
    producerTrackingRef.current.clear();
    videoRefsMap.current.clear();
    setVideoElements([]);
    setConsumers([]);
    setIsWatching(false);
    
    // Don't change status message if stream ended
    if (!streamEnded) {
      setStatusMessage("Disconnected from stream");
    }
    
    addLog("Stopped watching stream");
  };

  // Change quality level
  const changeQuality = async (index) => {
    setSelectedLayerIndex(index);
    addLog(`Changing quality to level ${index}`);
    
    // Update all video consumers
    for (const [consumerId, data] of consumersRef.current.entries()) {
      if (data.kind === 'video') {
        await setPreferredLayers(consumerId, data.consumer);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Handle Picture-in-Picture functionality
  const enterPictureInPicture = async (videoElement) => {
    try {
      if (!videoElement) {
        // If no specific video element is provided, use the main one
        if (videoElements.length > 0 && videoRefsMap.current.has(videoElements[0].producerId)) {
          videoElement = videoRefsMap.current.get(videoElements[0].producerId);
        } else {
          throw new Error("No video element available");
        }
      }

      // Set as active video for reference
      setActiveVideoRef(videoElement);

      // Check if already in PiP mode
      if (document.pictureInPictureElement === videoElement) {
        addLog("Already in Picture-in-Picture mode");
        return;
      }

      // Different implementations for different browsers
      if (videoElement.requestPictureInPicture) {
        await videoElement.requestPictureInPicture();
        addLog("Entered Picture-in-Picture mode");
      } else if (videoElement.webkitSetPresentationMode) {
        // Safari
        videoElement.webkitSetPresentationMode('picture-in-picture');
        addLog("Entered Picture-in-Picture mode (Safari)");
      } else {
        throw new Error("Picture-in-Picture not supported");
      }
    } catch (error) {
      addLog(`Error entering Picture-in-Picture: ${error.message}`);
    }
  };

  const exitPictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        addLog("Exited Picture-in-Picture mode");
      } else if (
        activeVideoRef && 
        activeVideoRef.webkitPresentationMode === 'picture-in-picture' && 
        activeVideoRef.webkitSetPresentationMode
      ) {
        // Safari
        activeVideoRef.webkitSetPresentationMode('inline');
        addLog("Exited Picture-in-Picture mode (Safari)");
      }
    } catch (error) {
      addLog(`Error exiting Picture-in-Picture: ${error.message}`);
    }
  };

  const togglePictureInPicture = async (videoElement) => {
    if (document.pictureInPictureElement || 
        (activeVideoRef && activeVideoRef.webkitPresentationMode === 'picture-in-picture')) {
      await exitPictureInPicture();
    } else {
      await enterPictureInPicture(videoElement);
    }
  };

  const toggleMute = () => {
    // Toggle mute state for all video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = !isMuted;
    });
    setIsMuted(!isMuted);
  };

  // Handle refreshing the stream
  const refreshStream = async () => {
    if (isWatching) {
      // Stop watching first
      handleStopWatching();
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Refetch the stream data and reconnect
    handleGetStream();
  };

  return (
    <div className="relative flex flex-col h-screen bg-black" ref={containerRef}>
      {/* Video container */}
      <div 
        className="relative flex-1 flex min-h-[400px] md:min-h-[500px] bg-black overflow-hidden"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Header gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-10"></div>
        
        {/* Footer gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
        
        {/* Stream ended overlay */}
        {streamEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
            <div className="text-white text-center p-8 rounded-lg">
              <div className="text-4xl mb-4">📺</div>
              <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
              <p className="text-lg mb-6">This live stream has ended.</p>
              <div className="flex space-x-4 justify-center">
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Back to Home
                </button>
                <button 
                  onClick={refreshStream}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Streams grid - layout based on number of videos */}
        <div className={`w-full h-full grid ${
          videoElements.length === 1 ? 'grid-cols-1' : 
          videoElements.length === 2 ? 'grid-cols-2' : 
          videoElements.length === 3 ? 'grid-cols-2 grid-rows-2' : 
          videoElements.length >= 4 ? 'grid-cols-2 grid-rows-2' : ''
        } gap-0.5 bg-black`}>
          {videoElements.length === 3 && (
            // Special layout for 3 videos - make first one span 2 columns
            <>
              <div className="col-span-2 relative bg-gray-900">
                <video
                  ref={(el) => {
                    if (el && videoElements[0]?.stream) {
                      videoRefsMap.current.set(videoElements[0].producerId, el);
                      if (el.srcObject !== videoElements[0].stream) {
                        el.srcObject = videoElements[0].stream;
                        el.muted = isMuted;
                        el.play().catch((e) => {
                          addLog(`Error playing video: ${e.message}`);
                          el.muted = true;
                          el.play().catch((err) => addLog(`Failed to play even with muted: ${err.message}`));
                        });
                      }
                    }
                  }}
                  data-producer-id={videoElements[0]?.producerId}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-sm rounded">
                  {videoElements[0]?.sellerId || "Broadcaster"}
                </div>
              </div>
              {videoElements.slice(1).map((video, idx) => (
                <div key={`video-${video.producerId}`} className="relative bg-gray-900">
                  <video
                    ref={(el) => {
                      if (el && video.stream) {
                        videoRefsMap.current.set(video.producerId, el);
                        if (el.srcObject !== video.stream) {
                          el.srcObject = video.stream;
                          el.muted = isMuted;
                          el.play().catch((e) => {
                            addLog(`Error playing video: ${e.message}`);
                            el.muted = true;
                            el.play().catch((err) => addLog(`Failed to play even with muted: ${err.message}`));
                          });
                        }
                      }
                    }}
                    data-producer-id={video.producerId}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-sm rounded">
                    {video.sellerId || "Co-host"}
                  </div>
                </div>
              ))}
            </>
          )}
          
          {videoElements.length !== 3 && videoElements.map((video) => (
            <div key={`video-${video.producerId}`} className="relative bg-gray-900">
              <video
                ref={(el) => {
                  if (el && video.stream) {
                    videoRefsMap.current.set(video.producerId, el);
                    if (el.srcObject !== video.stream) {
                      el.srcObject = video.stream;
                      el.muted = isMuted;
                      el.play().catch((e) => {
                        addLog(`Error playing video: ${e.message}`);
                        el.muted = true;
                        el.play().catch((err) => addLog(`Failed to play even with muted: ${err.message}`));
                      });
                    }
                  }
                }}
                data-producer-id={video.producerId}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-sm rounded">
                {video.sellerId || "Broadcaster"}
              </div>
            </div>
          ))}
          
          {videoElements.length === 0 && !streamEnded && (
            <div className="flex items-center justify-center text-white text-center">
              <div className="p-4">
                {isConnected ? (isWatching ? "Waiting for broadcast..." : "Connecting...") : "Connecting to server..."}
              </div>
            </div>
          )}
        </div>
        
        {/* Stream info header */}
        <div className={`absolute top-0 left-0 right-0 px-4 py-4 flex justify-between items-center z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {streamData?.sellerId?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="ml-2 text-white font-medium">{streamData?.sellerId || "Stream"}</span>
            <div className="ml-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
          <div className="flex space-x-2">
            {pipAvailable && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Use the first video element for PiP
                  const mainVideo = videoElements.length > 0 && videoRefsMap.current.get(videoElements[0].producerId);
                  togglePictureInPicture(mainVideo);
                }}
                className={`px-2 py-1 rounded bg-gray-800/80 text-white text-sm ${isPipActive ? 'bg-blue-500/80' : ''}`}
                title={isPipActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
              >
                PiP
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Stream controls */}
        <div className={`absolute bottom-4 left-0 right-0 px-4 flex justify-between items-center z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex space-x-2">
            <button 
              className={`px-2 py-1 rounded bg-gray-800/80 text-white text-sm ${selectedLayerIndex === 0 ? 'bg-blue-500/80' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                changeQuality(0);
              }}
              title="Low Quality"
            >
              SD
            </button>
            <button 
              className={`px-2 py-1 rounded bg-gray-800/80 text-white text-sm ${selectedLayerIndex === 1 ? 'bg-blue-500/80' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                changeQuality(1);
              }}
              title="Medium Quality"
            >
              HD
            </button>
            <button 
              className={`px-2 py-1 rounded bg-gray-800/80 text-white text-sm ${selectedLayerIndex === 2 ? 'bg-blue-500/80' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                changeQuality(2);
              }}
              title="High Quality"
            >
              Full
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Mute/unmute button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              )}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                isWatching ? handleStopWatching() : refreshStream();
              }}
              className={`w-10 h-10 rounded-full ${isWatching ? 'bg-red-600' : 'bg-blue-500'} flex items-center justify-center text-white`}
              title={isWatching ? "Stop Watching" : "Refresh Stream"}
            >
              {isWatching ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              )}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowLogs(!showLogs);
              }}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center text-white"
              title={showLogs ? "Hide Logs" : "Show Logs"}
            >
              {showLogs ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* Viewer count badge */}
        {isWatching && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full flex items-center z-20">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
            </svg>
            {viewerCount}
          </div>
        )}
      </div>

      {/* Status message bar */}
      <div className="bg-gray-800 text-white px-4 py-2 text-sm flex justify-between items-center">
        <span>Status: {statusMessage}</span>
        <span className="text-xs text-gray-400">
          {deviceType === "mobile" ? "Mobile" : "Desktop"} | 
          {selectedLayerIndex === 0 ? " Low" : selectedLayerIndex === 1 ? " Medium" : " High"} Quality
        </span>
      </div>

      {/* Logs panel - collapsible */}
      {showLogs && (
        <div className="border border-gray-700 bg-gray-900 text-gray-200 max-h-48">
          <div className="bg-gray-800 px-4 py-2 font-medium flex justify-between items-center">
            <span>Connection Logs</span>
            <button 
              onClick={() => setShowLogs(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div ref={logContainerRef} className="h-32 overflow-y-auto p-3 text-xs font-mono">
            {logs.map((log, index) => (
              <div key={index} className="pb-1 text-gray-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}