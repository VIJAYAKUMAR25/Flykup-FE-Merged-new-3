"use client"

import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { GET_SINGLE_STREAM_DATA } from "../../api/apiDetails.js"
import { io } from "socket.io-client"
import * as mediasoupClient from "mediasoup-client"
import { mediaSoupServerUrl } from "../../../../config.js"
import { RiLiveLine } from "react-icons/ri"

export default function ViewLiveStream(liveStreamId) {
  // const { seller_id } = useParams()
  const navigate = useNavigate()
  const [streamData, setStreamData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Not connected")
  const [logs, setLogs] = useState([])
  const [videoStreams, setVideoStreams] = useState([]) // ENHANCED: Changed from videoElements to videoStreams
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
  const consumerTransportsRef = useRef(new Map()) // ENHANCED: Changed to Map
  const consumersRef = useRef(new Map()) // Changed to Map for better tracking
  const logContainerRef = useRef(null)
  const roomIdRef = useRef(null)
  const consumedProducersRef = useRef(new Set()) // Track consumed producers to prevent duplicates
  const containerRef = useRef(null)
  const producerTrackingRef = useRef(new Map()) // Store producer info for deduplication
  const videoRefsMap = useRef(new Map()) // Store refs to video elements
  const hostVideoRef = useRef(null) // Specific ref for host video
  const heartbeatIntervalRef = useRef(null) // For viewer heartbeats
  const streamsBySocketRef = useRef(new Map()) // ENHANCED: Track streams by socket

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

    // ENHANCED: Improved socket connection with timeout
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, // ENHANCED: Added timeout
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

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    }
  }, [navigate])

  // ENHANCED: Separate useEffect for newProducer handler that depends on isWatching
  useEffect(() => {
    if (!socketRef.current) return;

    const handleNewProducer = async ({ producerId, kind, socketId }) => {
      addLog(`New ${kind} producer available: ${producerId} from socket: ${socketId || 'unknown'}`)
      addLog(`Current state - isWatching: ${isWatching}, roomId: ${roomIdRef.current}`)

      // ENHANCED: More specific condition checking
      if (!isWatching) {
        addLog(`Not watching stream, skipping producer ${producerId}`)
        return
      }

      if (!roomIdRef.current) {
        addLog(`No room ID set, skipping producer ${producerId}`)
        return
      }

      if (consumedProducersRef.current.has(producerId)) {
        addLog(`Already consuming producer ${producerId}, skipping`)
        return
      }

      addLog(`✅ All conditions met - consuming new producer ${producerId} (${kind}) from socket ${socketId}`)
      try {
        await consumeProducer(roomIdRef.current, producerId, kind, socketId)
        addLog(`✅ Successfully consumed new producer ${producerId}`)
      } catch (error) {
        addLog(`❌ Failed to consume new producer ${producerId}: ${error.message}`)
      }
    }

    // Remove old listener and add new one
    socketRef.current.off("newProducer");
    socketRef.current.on("newProducer", handleNewProducer);

    // Log when the handler is set up
    addLog(`🔄 newProducer handler set up with isWatching: ${isWatching}, roomId: ${roomIdRef.current}`)

    return () => {
      if (socketRef.current) {
        socketRef.current.off("newProducer", handleNewProducer);
      }
    };
  }, [isWatching, roomIdRef.current]) // Added roomIdRef.current as dependency

  // ENHANCED: Add other socket event handlers in separate useEffect
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("producerClosed", ({ producerId, socketId }) => {
      addLog(`Producer ${producerId} closed from socket ${socketId}`)

      consumedProducersRef.current.delete(producerId)
      producerTrackingRef.current.delete(producerId)

      // ENHANCED: Remove from socket tracking
      if (socketId && streamsBySocketRef.current.has(socketId)) {
        const socketStream = streamsBySocketRef.current.get(socketId);

        if (socketStream.videoProducerId === producerId || socketStream.audioProducerId === producerId) {
          streamsBySocketRef.current.delete(socketId);
          setVideoStreams(prev => prev.filter(stream => stream.socketId !== socketId));
        }
      }

      // Remove from video streams
      setVideoStreams(prev => prev.filter(stream =>
        stream.videoProducerId !== producerId && stream.audioProducerId !== producerId
      ))

      // Close any associated consumers
      for (const [consumerId, consumerData] of consumersRef.current.entries()) {
        if (consumerData.producerId === producerId) {
          if (consumerData.consumer) {
            consumerData.consumer.close()
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
      if (socketRef.current) {
        socketRef.current.off("producerClosed");
        socketRef.current.off("streamEnded");
        socketRef.current.off("viewerCountUpdate");
        socketRef.current.off("heartbeat");
      }
    };
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

  // ENHANCED: Enhanced socket communication with proper timeout and retry
  const socketEmitWithTimeout = (event, data, timeoutMs = 10000, retries = 2) => {
    return new Promise((resolve, reject) => {
      let currentRetry = 0;

      const tryEmit = () => {
        const timeout = setTimeout(() => {
          if (currentRetry < retries) {
            currentRetry++;
            addLog(`Retrying ${event} (attempt ${currentRetry + 1}/${retries + 1})`);
            tryEmit();
          } else {
            reject(new Error(`${event} timeout after ${retries + 1} attempts`));
          }
        }, timeoutMs);

        socketRef.current.emit(event, data, (response) => {
          clearTimeout(timeout);
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      };

      tryEmit();
    });
  };

  // ENHANCED: Create consumer transport with better management
  const createConsumerTransport = async (roomId, transportKey = 'default') => {
    try {
      addLog(`Requesting consumer transport for room: ${roomId}`)

      const transportOptions = await socketEmitWithTimeout("createConsumerTransport", { roomId });

      addLog("Creating consumer transport")
      const transport = deviceRef.current.createRecvTransport(transportOptions)

      // ENHANCED: Store in Map with key
      consumerTransportsRef.current.set(transportKey, transport)

      // Handle transport events
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        addLog(`Consumer transport connect event for transport: ${transport.id}`)
        try {
          await socketEmitWithTimeout("connectConsumerTransport", {
            dtlsParameters,
            transportId: transport.id,
            roomId,
          });

          addLog(`Consumer transport connected: ${transport.id}`)
          callback()
        } catch (error) {
          addLog(`Consumer transport connect error: ${error.message}`)
          errback(error)
        }
      })

      transport.on("connectionstatechange", (state) => {
        addLog(`Consumer transport connection state for transport ${transport.id}: ${state}`)
        if (state === "failed") {
          addLog(`Transport ${transport.id} failed - closing`)
          transport.close()
          consumerTransportsRef.current.delete(transportKey)
        }
      })

      addLog(`Consumer transport created successfully: ${transport.id}`)
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

  // ENHANCED: Find the seller associated with a producer with socketId support
  const getSellerFromProducerId = (producerId, providedSocketId = null) => {
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
      const isHost = streamData?.producers.indexOf(producer) === 0; // ENHANCED: Better host detection
      const sellerInfo = {
        sellerId: producer.sellerId,
        socketId: producer.socketId || providedSocketId,
        isHost
      };
      producerTrackingRef.current.set(producerId, sellerInfo);
      return sellerInfo;
    }

    // ENHANCED: Fallback with provided socketId
    if (providedSocketId) {
      const sellerInfo = {
        sellerId: `Producer ${producerId.substring(0, 8)}`,
        socketId: providedSocketId,
        isHost: false
      };
      producerTrackingRef.current.set(producerId, sellerInfo);
      return sellerInfo;
    }

    return null;
  };

  // ENHANCED: Consume a producer's stream with socket tracking
  const consumeProducer = async (roomId, producerId, kind, providedSocketId = null) => {
    try {
      addLog(`Consuming ${kind} producer: ${producerId} from socket: ${providedSocketId || 'unknown'}`)

      // Mark this producer as being consumed
      consumedProducersRef.current.add(producerId)

      // ENHANCED: Use shared transport or create new one
      let transport = consumerTransportsRef.current.get('default')
      if (!transport) {
        addLog(`Creating new consumer transport for producer ${producerId}`)
        transport = await createConsumerTransport(roomId, 'default')
        if (!transport) {
          throw new Error(`Failed to create transport for producer: ${producerId}`)
        }
      }

      // Request consumption from the server with preferred layers for video
      const preferredLayers = kind === 'video' ? { spatialLayer: selectedLayerIndex, temporalLayer: 2 } : null;

      // ENHANCED: Use improved socket communication
      const { id, rtpParameters } = await socketEmitWithTimeout("consume", {
        transportId: transport.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        roomId,
        preferredLayers
      });

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
        sellerInfo: getSellerFromProducerId(producerId, providedSocketId)
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
          await socketEmitWithTimeout("resumeConsumer", {
            roomId,
            consumerId: consumer.id,
          });

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

      // ENHANCED: Update video streams with socket-based tracking
      updateVideoStreams(producerId, consumer, kind, providedSocketId)

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

  // ENHANCED: Update video streams with socket-based tracking instead of individual video elements
  const updateVideoStreams = (producerId, consumer, kind, providedSocketId = null) => {
    const sellerInfo = getSellerFromProducerId(producerId, providedSocketId);
    const socketId = sellerInfo?.socketId || providedSocketId || `producer-${producerId}`;

    addLog(`Updating video streams for producer ${producerId} (${kind}) from socket ${socketId}`)

    // Check if we already have a stream for this socket
    let existingSocketStream = streamsBySocketRef.current.get(socketId);

    if (existingSocketStream) {
      // Update existing stream
      addLog(`Updating existing stream for socket ${socketId}`)
      if (kind === 'video') {
        existingSocketStream.videoProducerId = producerId;
        existingSocketStream.videoConsumer = consumer;
        existingSocketStream.videoTrack = consumer.track;
      } else if (kind === 'audio') {
        existingSocketStream.audioProducerId = producerId;
        existingSocketStream.audioConsumer = consumer;
        existingSocketStream.audioTrack = consumer.track;
      }

      // Recreate the MediaStream with both tracks
      existingSocketStream.stream = createMediaStream(existingSocketStream.audioTrack, existingSocketStream.videoTrack);

      // Update the state
      setVideoStreams(prev => {
        const existingIndex = prev.findIndex(stream => stream.socketId === socketId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...existingSocketStream };
          addLog(`Updated existing video stream at index ${existingIndex}`)
          return updated;
        }
        return prev;
      });
    } else {
      // Create new stream
      addLog(`Creating new stream for socket ${socketId}`)
      const newStream = {
        id: socketId,
        socketId: socketId,
        sellerId: sellerInfo?.sellerId || `Producer ${producerId.substring(0, 8)}`,
        isHost: sellerInfo?.isHost || false,
        videoProducerId: kind === 'video' ? producerId : null,
        audioProducerId: kind === 'audio' ? producerId : null,
        videoConsumer: kind === 'video' ? consumer : null,
        audioConsumer: kind === 'audio' ? consumer : null,
        videoTrack: kind === 'video' ? consumer.track : null,
        audioTrack: kind === 'audio' ? consumer.track : null,
        stream: kind === 'video' ? new MediaStream([consumer.track]) : null
      };

      streamsBySocketRef.current.set(socketId, newStream);

      setVideoStreams(prev => {
        const updated = [...prev, newStream];
        addLog(`Added new video stream, total streams: ${updated.length}`)
        return updated;
      });
    }
  }

  // ENHANCED: Helper function to create MediaStream from tracks
  const createMediaStream = (audioTrack, videoTrack) => {
    const stream = new MediaStream();
    if (audioTrack) stream.addTrack(audioTrack);
    if (videoTrack) stream.addTrack(videoTrack);
    return stream;
  }

  const handleGetStream = async () => {
    try {
      addLog(`Fetching stream data for ID: ${liveStreamId.liveStreamId}`)
      const response = await axios.get(`${GET_SINGLE_STREAM_DATA}/${liveStreamId.liveStreamId}`)

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
    if (liveStreamId.liveStreamId) {
      handleGetStream()
    }

    return () => {
      // Cleanup when component unmounts
      handleStopWatching();
    };
  }, [liveStreamId.liveStreamId])

  // ENHANCED: Start watching function with improved error handling
  const handleWatchStream = async (stream) => {
    if (isWatching || !stream || streamEnded) return;

    setStatusMessage("Connecting to stream...");
    addLog(`Starting to watch stream: ${stream._id}`);

    try {
      // Clear any previous state to avoid duplicates
      setVideoStreams([]);
      setConsumers([]);
      consumedProducersRef.current.clear();
      consumersRef.current.clear();
      producerTrackingRef.current.clear(); // Clear producer tracking
      videoRefsMap.current.clear(); // Clear video refs
      streamsBySocketRef.current.clear(); // ENHANCED: Clear socket tracking

      // Close any existing transports
      consumerTransportsRef.current.forEach(transport => {
        if (transport) transport.close();
      });
      consumerTransportsRef.current.clear();

      // Join the room first
      addLog(`Joining room: ${stream._id}`);
      await socketEmitWithTimeout("joinRoom", { roomId: stream._id });
      addLog(`Successfully joined room: ${stream._id}`);

      // Get router capabilities
      addLog("Getting router RTP capabilities");
      const routerRtpCapabilities = await socketEmitWithTimeout("getRouterRtpCapabilities", { roomId: stream._id });

      // Load device with router capabilities
      if (!(await loadDevice(routerRtpCapabilities))) {
        throw new Error("Failed to load device");
      }

      // Pre-process producer/seller mappings for better deduplication
      // This helps us avoid duplicates by tracking which sellers own which producers
      if (stream.producers) {
        for (const producer of stream.producers) {
          const isHost = stream.producers.indexOf(producer) === 0; // ENHANCED: Better host detection
          if (producer.videoProducerId) {
            producerTrackingRef.current.set(producer.videoProducerId, {
              sellerId: producer.sellerId,
              socketId: producer.socketId,
              isHost
            });
          }
          if (producer.audioProducerId) {
            producerTrackingRef.current.set(producer.audioProducerId, {
              sellerId: producer.sellerId,
              socketId: producer.socketId,
              isHost
            });
          }
        }
      }

      // Set watching state first so event handlers work
      setIsWatching(true);

      // Get the active producers
      addLog("Getting active producers");
      const activeProducers = await socketEmitWithTimeout("getProducers", { roomId: stream._id });

      addLog(`Found ${activeProducers.length} active producers`);

      // ENHANCED: Process producers with socket information
      for (const producer of activeProducers) {
        try {
          const sellerInfo = getSellerFromProducerId(producer.producerId, producer.socketId);
          const socketId = sellerInfo?.socketId || producer.socketId || 'unknown';

          addLog(`Consuming existing producer: ${producer.producerId} (${producer.kind}) from socket: ${socketId}`);
          await consumeProducer(stream._id, producer.producerId, producer.kind, socketId);
        } catch (error) {
          addLog(`Error consuming existing producer ${producer.producerId}: ${error.message}`);
        }
      }

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

    // ENHANCED: Close all transports using Map
    consumerTransportsRef.current.forEach((transport) => {
      if (transport) {
        transport.close();
      }
    });

    // Clear all refs and state
    consumersRef.current.clear();
    consumerTransportsRef.current.clear();
    consumedProducersRef.current.clear();
    producerTrackingRef.current.clear();
    videoRefsMap.current.clear();
    streamsBySocketRef.current.clear(); // ENHANCED: Clear socket tracking
    setVideoStreams([]);
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
        // ENHANCED: Use videoStreams instead of videoElements
        if (videoStreams.length > 0 && videoRefsMap.current.has(videoStreams[0].id)) {
          videoElement = videoRefsMap.current.get(videoStreams[0].id);
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

  // ENHANCED: Get grid layout based on stream count
  const getGridLayout = () => {
    const streamCount = videoStreams.length;
    if (streamCount === 1) return 'grid-cols-1';
    if (streamCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (streamCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (streamCount === 4) return 'grid-cols-2 md:grid-cols-2';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
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

        {/* ENHANCED: Streams grid with responsive layout */}
        <div className={`w-full h-full grid ${getGridLayout()} gap-1 bg-black p-2`}>
          {videoStreams.map((stream, index) => (
            <div key={stream.id} className="relative bg-gray-900 rounded-lg overflow-hidden">
              {/* Video element */}
              <video
                ref={(el) => {
                  if (el && stream.stream) {
                    videoRefsMap.current.set(stream.id, el);
                    if (el.srcObject !== stream.stream) {
                      el.srcObject = stream.stream;
                      el.muted = isMuted;
                      el.play().catch((e) => {
                        addLog(`Error playing video: ${e.message}`);
                        el.muted = true;
                        el.play().catch((err) => addLog(`Failed to play even with muted: ${err.message}`));
                      });
                    }
                  }
                }}
                data-stream-id={stream.id}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* ENHANCED: Stream info overlay with role indicators */}
              {/* <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-sm rounded flex items-center space-x-2">
                {stream.isHost && (
                  <span className="px-2 py-0.5 bg-red-500 text-xs font-bold rounded">HOST</span>
                )}
                {!stream.isHost && (
                  <span className="px-2 py-0.5 bg-green-500 text-xs font-bold rounded">CO-HOST</span>
                )}
                <span className="font-medium">{stream.sellerId}</span>
              </div> */}

              {/* ENHANCED: Quality indicator */}
              {stream.videoConsumer && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                  {selectedLayerIndex === 0 ? 'SD' : selectedLayerIndex === 1 ? 'HD' : 'Full'}
                </div>
              )}
            </div>
          ))}

          {videoStreams.length === 0 && !streamEnded && (
            <div className="flex items-center justify-center text-white text-center col-span-full">
              <div className="p-4">
                {isConnected ? (isWatching ? "Waiting for broadcast..." : "Connecting...") : "Connecting to server..."}
              </div>
            </div>
          )}
        </div>

        {/* Stream info header */}
        <div className={`absolute top-0 left-0 right-0 px-4 py-4 flex justify-between items-center z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between w-full">
            {/* <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {streamData?.sellerId?.charAt(0)?.toUpperCase() || '?'}
            </div> */}
            <span></span>
            {/* <span className="ml-2 text-white font-medium">{streamData?.sellerId || "Stream"}</span> */}
            <div className="flex justify-between" >
              {/* <div className="ml-3 bg-red-600 text-white text-xs font-bold px-2 py-0 rounded flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse"></div>
                <span>LIVE</span>
              </div> */}
              {/* Viewer count badge */}
              {/* {isWatching && ( */}
                <div className="flex ml-2 items-center space-x-2 bg-black/60 text-white px-3 py-1.5 rounded-full z-30 backdrop-blur-sm border border-stone-700/30">
                  <RiLiveLine className="text-red-500" size={18} />
                  <p className="font-medium text-sm">{viewerCount}</p>
                </div>
              {/* )} */}
            </div>

          </div>
          <div className="flex space-x-2">
            {/* {pipAvailable && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // ENHANCED: Use videoStreams instead of videoElements
                  const mainVideo = videoStreams.length > 0 && videoRefsMap.current.get(videoStreams[0].id);
                  togglePictureInPicture(mainVideo);
                }}
                className={`px-2 py-1 rounded bg-gray-800/80 text-white text-sm ${isPipActive ? 'bg-blue-500/80' : ''}`}
                title={isPipActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
              >
                PiP
              </button>
            )} */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-white"
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
          {/* <div className="flex space-x-2">
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
          </div> */}

          <div className="flex items-center space-x-3">
            {/* Mute/unmute button */}
            {/* <button
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
            </button> */}

            {/* <button 
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
            </button> */}

            {/* <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowLogs(!showLogs);
              }}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center text-white"
              title={showLogs ? "Hide Logs" : "Show Logs"}
            >
              {showLogs ? '↑' : '↓'}
            </button> */}
          </div>
        </div>



        {/* ENHANCED: Stream count info */}
        {/* {videoStreams.length > 0 && (
          <div className="absolute top-16 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs z-20">
            {videoStreams.length} stream{videoStreams.length !== 1 ? 's' : ''}
          </div>
        )} */}
      </div>

      {/* Status message bar */}
      {/* <div className="bg-gray-800 text-white px-4 py-2 text-sm flex justify-between items-center">
        <span>Status: {statusMessage}</span>
        <span className="text-xs text-gray-400">
          {deviceType === "mobile" ? "Mobile" : "Desktop"} | 
          {selectedLayerIndex === 0 ? " Low" : selectedLayerIndex === 1 ? " Medium" : " High"} Quality
        </span>
      </div> */}

      {/* Logs panel - collapsible */}
      {/* {showLogs && (
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
      )} */}
    </div>
  );
}