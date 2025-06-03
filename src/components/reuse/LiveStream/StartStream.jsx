"use client"
import { useState, useRef, useEffect } from "react"
import { io } from "socket.io-client"
import * as mediasoupClient from "mediasoup-client"
import axios from "axios"
import {
  CREATE_NEW_STREAM,
  END_LIVE_STREAM,
  GET_ALL_AVAILABLE_STREAMS,
  GET_SINGLE_STREAM_DATA,
  START_LIVE_STREAM ,
  COHOST_INVITE
} from "../../api/apiDetails";
import moment from "moment/moment"
import { mediaSoupServerUrl } from "../../../../config.js"
import CohostManager from "./cohost-manager"
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import CohostSearchInvite from "./CohostSearchInvite.jsx"


export default function StartStream(showId) {
  // State variables remain the same
  const [sellerId, setSellerId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Not connected")
  const [logs, setLogs] = useState([])
  const [streamSocketId, setStreamSocketId] = useState("")
  const [availableStreams, setAvailableStreams] = useState([])
  const [selectedStreamId, setSelectedStreamId] = useState("")
  const [mode, setMode] = useState("create") // "create" or "join"
  const [isHost, setIsHost] = useState(false)
  const [isCohost, setIsCohost] = useState(false)
  const [cohosts, setCohosts] = useState([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteTarget, setInviteTarget] = useState("")
  const [showControls, setShowControls] = useState(true) // Control visibility of controls
  const [showLogs, setShowLogs] = useState(false) // Control visibility of logs
  const [isCameraOn, setIsCameraOn] = useState(true) // Track camera status
  const [isMicrophoneMuted, setIsMicrophoneMuted] = useState(false) // Track microphone status
  const [viewerCount, setViewerCount] = useState(0) // Track viewer count
  const [orientation, setOrientation] = useState('portrait') // Track device orientation
  const [isFullscreen, setIsFullscreen] = useState(false) // Track fullscreen state
  const [videoPlaying, setVideoPlaying] = useState(false) // Track video playback state

  // Refs
  const socketRef = useRef(null)
  const deviceRef = useRef(null)
  const localStreamRef = useRef(null)
  const producerTransportRef = useRef(null)
  const videoProducerRef = useRef(null)
  const audioProducerRef = useRef(null)
  const videoRef = useRef(null)
  const logContainerRef = useRef(null)
  const roomIdRef = useRef(null)
  const cohostManagerRef = useRef(null)
  const targetSellerIdRef = useRef("")
  const containerRef = useRef(null)
  const heartbeatIntervalRef = useRef(null) // For stream heartbeats

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

  // Detect device orientation
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    // Initial check
    handleOrientationChange();

    // Add event listener for orientation changes
    window.addEventListener('resize', handleOrientationChange);
    
    // For mobile devices that support the orientation change event
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
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
      addLog(`Socket connected: ${socketRef.current.id}`)
      setIsConnected(true)
      setStatusMessage("Connected to server")

      // Load available streams when connected
      fetchAvailableStreams()
    })

    socketRef.current.on("connect_error", (err) => {
      addLog(`Connection error: ${err.message}`)
      setStatusMessage(`Connection error: ${err.message}`)
    })

    socketRef.current.on("disconnect", () => {
      addLog("Disconnected from server")
      setIsConnected(false)
      setStatusMessage("Disconnected from server")
      handleStopStream()
    })

    // Listen for viewer count updates - ENHANCED
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
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Setup heartbeat for active streams to detect crashes
  useEffect(() => {
    if (isStreaming && roomIdRef.current) {
      // Send heartbeats every 30 seconds to keep the stream active
      heartbeatIntervalRef.current = setInterval(() => {
        if (socketRef.current && socketRef.current.connected) {
          // Send heartbeat for the stream
          socketRef.current.emit('stream:heartbeat', { 
            streamId: roomIdRef.current
          });
          
          // Also ping the backend API to update the lastHeartbeat
          axios.get(`${GET_SINGLE_STREAM_DATA}/${roomIdRef.current}`)
            .catch(err => {
              console.error("Error sending stream heartbeat to API:", err);
            });
        }
      }, 30000);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [isStreaming, roomIdRef.current]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Update fullscreen state
      setIsFullscreen(!!document.fullscreenElement);
      
      // Toggle controls visibility when fullscreen changes
      if (document.fullscreenElement) {
        setShowControls(false);
      } else {
        setShowControls(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Monitor video element for playback and autoplay-blocking issues
  // useEffect(() => {
  //   if (videoRef.current && localStreamRef.current) {
  //     const videoElement = videoRef.current;
      
  //     // Try to play the video whenever the stream changes
  //     const playVideo = async () => {
  //       try {
  //         await videoElement.play();
  //         setVideoPlaying(true);
  //         addLog("Local video playback started successfully");
  //       } catch (err) {
  //         setVideoPlaying(false);
  //         addLog(`Autoplay prevented: ${err.message}. Click to start video.`);
  //       }
  //     };
      
  //     // When we have a new stream, try to play it
  //     if (videoElement.srcObject !== localStreamRef.current) {
  //       videoElement.srcObject = localStreamRef.current;
  //       playVideo();
  //     }
      
  //     // Also set up event listeners to monitor playback state
  //     const handlePlay = () => {
  //       setVideoPlaying(true);
  //       addLog("Video playback started");
  //     };
      
  //     const handlePause = () => {
  //       setVideoPlaying(false);
  //       addLog("Video playback paused");
  //     };
      
  //     videoElement.addEventListener('play', handlePlay);
  //     videoElement.addEventListener('pause', handlePause);
      
  //     return () => {
  //       videoElement.removeEventListener('play', handlePlay);
  //       videoElement.removeEventListener('pause', handlePause);
  //     };
  //   }
  // }, [localStreamRef.current]);

  // Initialize co-host manager
  useEffect(() => {
    if (socketRef.current && isConnected && sellerId && roomIdRef.current) {
      const cohostManager = new CohostManager({
        socket: socketRef.current,
        streamId: roomIdRef.current,
        sellerId,
        mediasoup: mediasoupClient,
        onStatusChange: (status) => {
          // Update UI based on status changes
          console.log('Co-host status:', status);
          addLog(`Co-host status update: ${JSON.stringify(status)}`)
          
          // Handle different status updates
          if (status.role === 'host') {
            setIsHost(true)
          } else if (status.role === 'cohost') {
            setIsCohost(true)
          }
          
          // Handle cohost updates
          if (status.type === 'cohostActive') {
            // Add or update a co-host
            setCohosts(prev => {
              const exists = prev.some(ch => ch.socketId === status.socketId)
              if (exists) {
                return prev.map(ch => 
                  ch.socketId === status.socketId 
                    ? { ...ch, ...status, status: 'active' } 
                    : ch
                )
              } else {
                return [...prev, { 
                  socketId: status.socketId, 
                  sellerId: status.sellerId,
                  videoProducerId: status.videoProducerId,
                  audioProducerId: status.audioProducerId,
                  status: 'active'
                }]
              }
            })
          } else if (status.type === 'cohostDisconnected' || status.type === 'cohostRemoved') {
            // Remove a co-host
            setCohosts(prev => prev.filter(ch => ch.socketId !== status.socketId))
          } else if (status.type === 'cohostConnecting') {
            // Update co-host status to connecting
            setCohosts(prev => {
              const exists = prev.some(ch => ch.socketId === status.socketId)
              if (exists) {
                return prev.map(ch => 
                  ch.socketId === status.socketId 
                    ? { ...ch, status: 'connecting' } 
                    : ch
                )
              } else {
                return [...prev, { 
                  socketId: status.socketId, 
                  sellerId: status.sellerId,
                  status: 'connecting'
                }]
              }
            })
          } else if (status.type === 'inviteReceived') {
            // Show notification for received invite
            addLog(`Received co-host invitation from ${status.hostSellerId}`)
            
            // We could show a notification UI here
            const acceptInvite = window.confirm(`${status.hostSellerId} invited you to be a co-host. Accept?`)
            if (status.respond) {
              status.respond(acceptInvite)
            }
          }
        },
        onError: (err) => {
          console.error('Co-host error:', err)
          addLog(`Co-host error: ${err.message}`)
        }
      })
      
      // Store reference
      cohostManagerRef.current = cohostManager
      
      // Initialize as host if starting a new stream
      if (mode === 'create' && isStreaming) {
        cohostManager.initAsHost()
        setIsHost(true)
      }
      
      return () => {
        if (cohostManagerRef.current) {
          cohostManagerRef.current.dispose()
        }
      }
    }
  }, [socketRef.current, isStreaming, roomIdRef.current, sellerId, isConnected, mode])

  // Fetch available streams
  const fetchAvailableStreams = async () => {
    try {
      const response = await axios.get(GET_ALL_AVAILABLE_STREAMS)
      if (response.data.status && response.data.data) {
        // Filter to only show live streams
        const liveStreams = response.data.data.filter(stream => stream.streamStatus === 'live');
        setAvailableStreams(liveStreams)
        addLog(`Found ${liveStreams.length} active streams`)
      }
    } catch (error) {
      addLog(`Error fetching streams: ${error.message}`)
    }
  }

  // Load mediasoup client device
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

  // Get user media stream - UPDATED with better error handling and direct video attaching
  const getUserMedia = async () => {
    try {
      addLog("Requesting camera and microphone access")
      
      // Request media streams
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      })

      // Attach to video element and attempt to play
      if (videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
        
        try {
          // Try to play immediately
          // await videoRef.current.play();
          setVideoPlaying(true);
          addLog("Local video playback started automatically");
        } catch (err) {
          // Handle autoplay restrictions
          addLog(`Autoplay prevented: ${err.message}. User interaction may be needed.`);
          setVideoPlaying(false);
          // Add a click handler to the video container to help with autoplay restrictions
          // if (containerRef.current) {
          //   const tryPlayOnInteraction = async () => {
          //     try {
          //       await videoRef.current.play();
          //       setVideoPlaying(true);
          //       addLog("Video playback started after user interaction");
          //     } catch (playErr) {
          //       addLog(`Still failed to play: ${playErr.message}`);
          //     }
          //   };
            
          //   containerRef.current.addEventListener('click', tryPlayOnInteraction, { once: true });
          // }
        }
      }

      addLog("Media access granted successfully");
      return true;
    } catch (error) {
      addLog(`Media access error: ${error.message}`);
      setStatusMessage(`Media error: ${error.message}`);
      return false;
    }
  }

  // Create producer transport
  const createProducerTransport = async (roomId) => {
    try {
      addLog(`Requesting producer transport for room: ${roomId}`)
      // Request the server to create a producer transport
      const transportOptions = await new Promise((resolve, reject) => {
        socketRef.current.emit("createProducerTransport", { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response)
          }
        })
      })
      addLog("Creating producer transport")
      // Create the transport on client side
      producerTransportRef.current = deviceRef.current.createSendTransport(transportOptions)
      // Handle transport events
      producerTransportRef.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
        addLog("Producer transport connect event")
        try {
          await new Promise((resolve, reject) => {
            socketRef.current.emit("connectProducerTransport", { dtlsParameters, roomId }, (response) => {
              if (response.error) {
                reject(new Error(response.error))
              } else {
                resolve(response)
              }
            })
          })
          addLog("Producer transport connected")
          callback()
        } catch (error) {
          addLog(`Producer transport connect error: ${error.message}`)
          errback(error)
        }
      })
      producerTransportRef.current.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        addLog(`Producer transport produce event for ${kind}`)
        try {
          const { id } = await new Promise((resolve, reject) => {
            socketRef.current.emit("produce", { kind, rtpParameters, roomId }, (response) => {
              if (response.error) {
                reject(new Error(response.error))
              } else {
                resolve(response)
              }
            })
          })
          addLog(`${kind} producer created with ID: ${id}`)
          callback({ id })
        } catch (error) {
          addLog(`Producer transport produce error: ${error.message}`)
          errback(error)
        }
      })
      // Add ICE connection monitoring
      producerTransportRef.current.on("connectionstatechange", (state) => {
        addLog(`Producer transport connection state: ${state}`)
        // Add detailed state logging
        if (state === "connecting") {
          addLog("Establishing WebRTC connection...")
        } else if (state === "connected") {
          addLog("WebRTC connection established successfully")
        } else if (state === "failed") {
          addLog("WebRTC connection failed - likely a NAT traversal issue")
          // Attempt reconnection or notify user
          setStatusMessage("Connection failed - check network settings")
        } else if (state === "disconnected") {
          addLog("WebRTC temporarily disconnected - attempting to recover")
        } else if (state === "closed") {
          addLog("WebRTC connection closed")
        }
      })
      addLog("Producer transport created successfully")
      return true
    } catch (error) {
      addLog(`Error creating producer transport: ${error.message}`)
      setStatusMessage(`Transport error: ${error.message}`)
      return false
    }
  }
  // Join an existing stream as a co-broadcaster
  const handleJoinStream = async () => {
    
    if (!selectedStreamId) {
      addLog("No stream selected to join")
      return
    }
    try {
      setStatusMessage("Joining stream as co-broadcaster...")

      // Get stream details
      const response = await axios.get(`${GET_SINGLE_STREAM_DATA}/${selectedStreamId}`)
      const streamData = response.data.data

      if (!streamData) {
        throw new Error("Stream not found")
      }

      addLog(`Joining stream: ${streamData._id}`)
      roomIdRef.current = streamData._id

      // Join the room
      await new Promise((resolve, reject) => {
        socketRef.current.emit("joinRoom", { roomId: streamData._id }, (response) => {
          if (response.joined) {
            resolve()
          } else {
            reject(new Error("Failed to join room"))
          }
        })
      })

      // Get router capabilities
      const routerRtpCapabilities = await new Promise((resolve, reject) => {
        socketRef.current.emit("getRouterRtpCapabilities", { roomId: streamData._id }, (data) => {
          if (data.error) {
            reject(new Error(data.error))
          } else {
            resolve(data)
          }
        })
      })

      // Load device with router capabilities
      if (!(await loadDevice(routerRtpCapabilities))) {
        throw new Error("Failed to load device")
      }

      // Get local media
      if (!(await getUserMedia())) {
        throw new Error("Failed to get user media")
      }

      // Create producer transport
      if (!(await createProducerTransport(streamData._id))) {
        throw new Error("Failed to create producer transport")
      }

      // Produce audio and video
      addLog("Creating audio producer")
      const audioProducer = await producerTransportRef.current.produce({
        track: localStreamRef.current.getAudioTracks()[0],
        codecOptions: {
          opusStereo: true,
          opusDtx: true,
        },
      })

      audioProducerRef.current = audioProducer

      addLog("Creating video producer with simulcast support")
      const videoProducer = await producerTransportRef.current.produce({
        track: localStreamRef.current.getVideoTracks()[0],
        encodings: [
          { scaleResolutionDownBy: 4, maxBitrate: 500000 },
          { scaleResolutionDownBy: 2, maxBitrate: 1000000 },
          { scaleResolutionDownBy: 1, maxBitrate: 2500000 }
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000,
        },
      })
      videoProducerRef.current = videoProducer

      // Add this producer to the stream in the database
      await axios.post(`${GET_SINGLE_STREAM_DATA}/${streamData._id}/producers`, {
        sellerId: sellerId || `co-host-${Math.random().toString(36).substring(2, 10)}`,
        socketId: socketRef.current.id,
        videoProducerId: videoProducer.id,
        audioProducerId: audioProducer.id,
      })

      setIsStreaming(true)
      setIsCohost(true)
      setStatusMessage("Joined stream as co-broadcaster - LIVE")
      addLog("Successfully joined stream as co-broadcaster")
    } catch (error) {
      addLog(`Error joining stream: ${error.message}`)
      setStatusMessage(`Join error: ${error.message}`)
    }
  }

  const handleStartStream = async () => {
    try {
      if (isStreaming) return

      setStatusMessage("Initializing stream...")

      try {
        // Create a new stream in the database first to get the ID
        const streamResponse = await axios.post(CREATE_NEW_STREAM, {
          streamStartTime: moment().format("HH:mm:ss"),
          streamDate: moment().format("YYYY-MM-DD"),
          sellerId: sellerId === "" ? Math.random().toString(36).substring(2, 10) : sellerId,
          streamSocketId: socketRef.current.id,
        })

        const streamData = streamResponse.data.data
        const roomId = streamData._id
        roomIdRef.current = roomId

        addLog(`Created new stream with ID: ${roomId}`)

        // Join the room
        await new Promise((resolve, reject) => {
          socketRef.current.emit("joinRoom", { roomId }, (response) => {
            if (response.joined) {
              resolve()
              addLog(`Successfully joined room: ${roomId}`)
            } else {
              reject(new Error("Failed to join room"))
            }
          })
        })

        // Get router capabilities
        addLog("Getting router RTP capabilities")
        const routerRtpCapabilities = await new Promise((resolve, reject) => {
          socketRef.current.emit("getRouterRtpCapabilities", { roomId }, (data) => {
            if (data.error) {
              reject(new Error(data.error))
            } else {
              resolve(data)
            }
          })
        })

        // Load device with router capabilities
        if (!(await loadDevice(routerRtpCapabilities))) {
          throw new Error("Failed to load device")
        }

        // Get local media
        if (!(await getUserMedia())) {
          throw new Error("Failed to get user media")
        }

        // Create producer transport with the room ID
        if (!(await createProducerTransport(roomId))) {
          throw new Error("Failed to create producer transport")
        }

        // Produce audio and video
        addLog("Creating audio producer")
        const audioProducer = await producerTransportRef.current.produce({
          track: localStreamRef.current.getAudioTracks()[0],
          codecOptions: {
            opusStereo: true,
            opusDtx: true,
          },
        })

        audioProducerRef.current = audioProducer

        addLog("Creating video producer with simulcast support")
        const videoProducer = await producerTransportRef.current.produce({
          track: localStreamRef.current.getVideoTracks()[0],
          encodings: [
            { scaleResolutionDownBy: 4, maxBitrate: 500000 },
            { scaleResolutionDownBy: 2, maxBitrate: 1000000 },
            { scaleResolutionDownBy: 1, maxBitrate: 2500000 }
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000,
          },
        })
        videoProducerRef.current = videoProducer

        // Set up producer event listeners
        audioProducerRef.current.on("transportclose", () => {
          addLog("Audio producer transport closed")
        })

        videoProducerRef.current.on("transportclose", () => {
          addLog("Video producer transport closed")
        })

        // Add this producer to the stream in the database
        await axios.post(`${GET_SINGLE_STREAM_DATA}/${roomId}/producers`, {
          sellerId: sellerId || `host-${Math.random().toString(36).substring(2, 10)}`,
          socketId: socketRef.current.id,
          videoProducerId: videoProducer.id,
          audioProducerId: audioProducer.id,
        })

        setIsStreaming(true)
        setIsHost(true)
        setStatusMessage("Stream started - LIVE")
        addLog("Stream started successfully")
        
        // Initialize with self as viewer
        setViewerCount(1)


        console.log("starting Stream started successfully")
        // change show status to live & save stream id
        console.log("showId", showId)
        const startRes = await axiosInstance.patch(
          START_LIVE_STREAM.replace(":id", showId.showId),
          { liveStreamId: roomId }
        );
        if (startRes?.data?.data?.status) {
          toast.success("Show is Live & Id is stored successfully!.");
        }
        console.log("ending Stream started successfully")

      } catch (error) {
        addLog(`Error starting stream: ${error.message}`)
        setStatusMessage(`Stream error: ${error.message}`)
      }
    } catch (err) {
      console.log("err", err)
    }
  }

  const handleStopStream = async () => {
    try {
      if (!isStreaming) return
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Close producers
      if (videoProducerRef.current) {
        videoProducerRef.current.close()
        videoProducerRef.current = null
      }
      if (audioProducerRef.current) {
        audioProducerRef.current.close()
        audioProducerRef.current = null
      }
      // Close transport
      if (producerTransportRef.current) {
        producerTransportRef.current.close()
        producerTransportRef.current = null
      }
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      // Update stream status in the backend when stream ends
      if (roomIdRef.current) {
        try {
          // Make API call to update the stream status to 'notLive'
          await axios.post(`${GET_SINGLE_STREAM_DATA}/${roomIdRef.current}/end`)
          addLog(`Stream ended successfully in backend for ID: ${roomIdRef.current}`)
        } catch (error) {
          addLog(`Error updating stream status in backend: ${error.message}`)
          // Continue with local cleanup even if backend update fails
        }
        
        // Notify other users via socket that the stream has ended
        if (socketRef.current) {
          socketRef.current.emit('stream:end', { 
            streamId: roomIdRef.current,
            sellerId: sellerId
          })
        }
      }

      setIsStreaming(false)
      setIsHost(false)
      setIsCohost(false)
      setCohosts([])
      setStatusMessage("Stream stopped")
      addLog("Stream stopped")
      // Reset viewer count
      setViewerCount(0)
      const endRes = await axiosInstance.patch(
        END_LIVE_STREAM.replace(":id", showId.showId),
        {}
      );
      if (endRes?.data?.data?.status) {
        toast.success("Show is Ended.");
      }


    } catch (err) {
      console.log("err", err)
      addLog(`Error stopping stream: ${err.message}`)
    }
  }

  const handleInviteCohost = () => {
    setShowInviteDialog(true)
  }

 // In your StartStream component
const sendInvitation = async (userId) => {

  try {
    const response = await axiosInstance.post(COHOST_INVITE.replace(":showId", showId.showId), 
      { cohostUserId: userId }
    );    
    console.log("Testing 1")
    if (response.data) {
      toast.success('Invitation sent successfully!');
      console.log("Testing 2")
      
      // if (cohostManagerRef.current) {
      //   await cohostManagerRef.current.inviteCohost(userId);
      // }
    } else {
      toast.error(response.data.message || 'Failed to send invitation');
    }
  } catch (error) {
    console.error('Invitation error:', error);
    toast.error(error.response?.data?.message || 'Failed to send invitation');
  }
};

  const handleRemoveCohost = async (cohostSocketId) => {
    if (!cohostManagerRef.current) return
    
    try {
      addLog(`Removing co-host: ${cohostSocketId}`)
      await cohostManagerRef.current.removeCohost(cohostSocketId)
    } catch (error) {
      addLog(`Error removing co-host: ${error.message}`)
    }
  }

  const handleLeaveAsCohost = async () => {
    if (!cohostManagerRef.current) return
    
    try {
      addLog(`Leaving as co-host`)
      await cohostManagerRef.current.leaveAsCohost()
      handleStopStream()
    } catch (error) {
      addLog(`Error leaving as co-host: ${error.message}`)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen()
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen()
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  // Toggle camera on/off
  const toggleCamera = async () => {
    if (!localStreamRef.current) return;
    
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const isCurrentlyEnabled = videoTracks[0].enabled;
      videoTracks[0].enabled = !isCurrentlyEnabled;
      setIsCameraOn(!isCurrentlyEnabled);
      addLog(`Camera turned ${!isCurrentlyEnabled ? 'on' : 'off'}`);
    }
  };

  // Toggle microphone on/off
  const toggleMicrophone = async () => {
    if (!localStreamRef.current) return;
    
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const isCurrentlyEnabled = audioTracks[0].enabled;
      audioTracks[0].enabled = !isCurrentlyEnabled;
      setIsMicrophoneMuted(isCurrentlyEnabled);
      addLog(`Microphone ${isCurrentlyEnabled ? 'muted' : 'unmuted'}`);
    }
  };

  // Handle manual video play attempt
  const handleManualPlay = async () => {
    if (videoRef.current && !videoPlaying) {
      try {
        await videoRef.current.play();
        setVideoPlaying(true);
        addLog("Video playback started manually");
      } catch (err) {
        addLog(`Failed to play video manually: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMode("create")}
          className={`px-4 py-2 rounded-lg ${
            mode === "create" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Create New Stream
        </button>
        <button
          onClick={() => {
            setMode("join")
            fetchAvailableStreams()
          }}
          className={`px-4 py-2 rounded-lg ${mode === "join" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          Join Existing Stream
        </button>
      </div>
  
      {mode === "create" ? (
        <>
          <div className="mb-4">
            <label className="block mb-2">Your Name or ID</label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="border border-gray-300 w-full h-10 bg-white text-black rounded-lg px-3"
              placeholder="Enter your name or ID"
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block mb-2">Your Name or ID</label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="border border-gray-300 w-full h-10 bg-white text-black rounded-lg px-3"
              placeholder="Enter your name or ID"
            />
          </div>
  
          <div className="mb-4">
            <label className="block mb-2">Select Stream to Join</label>
            <select
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
              className="border border-gray-300 w-full h-10 bg-white text-black rounded-lg px-3"
            >
              <option value="">Select a stream...</option>
              {availableStreams.map((stream) => (
                <option key={stream._id} value={stream._id}>
                  {stream.sellerId || "Untitled Stream"} - {new Date(stream.streamDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
  
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video" ref={containerRef}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center space-x-3 z-10">
            <div className="bg-red-600 text-white font-bold py-1 px-3 rounded-md flex items-center">
              <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse"></div>
              LIVE
            </div>
            <div className="bg-black/60 text-white py-1 px-3 rounded-md flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
              {viewerCount}
            </div>
            
            {/* Role indicator */}
            <div className={`py-1 px-3 rounded-md text-xs font-bold text-white ${isHost ? 'bg-blue-500' : isCohost ? 'bg-green-500' : ''}`}>
              {isHost ? 'Host' : isCohost ? 'Co-Host' : ''}
            </div>
          </div>
        )}
        
        {/* Co-hosts grid */}
        {isStreaming && isHost && cohosts.length > 0 && (
          <div className={`absolute z-20 grid gap-2 ${orientation === 'portrait' ? 'bottom-24 right-4 w-24' : 'top-16 right-4 w-28'}`}>
            {cohosts.map((cohost) => (
              <div key={cohost.socketId} className="relative rounded-lg overflow-hidden bg-black/60 aspect-square">
                {cohost.status === 'connecting' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-sm">
                    {cohost.sellerId?.substring(0, 6) || "Co-host"}
                  </div>
                )}
                
                <button 
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  onClick={() => handleRemoveCohost(cohost.socketId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            {isConnected ? "Ready to stream" : "Connecting..."}
          </div>
        )}
        
        {isStreaming && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 z-10">
            <button 
              onClick={toggleCamera}
              className={`rounded-full w-12 h-12 flex items-center justify-center ${isCameraOn ? 'bg-white text-black' : 'bg-red-600 text-white'}`}
              title={isCameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {isCameraOn ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v1"></path>
                  <path d="M21 12l-7-5v10l7-5z"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
            
            <button 
              onClick={toggleMicrophone}
              className={`rounded-full w-12 h-12 flex items-center justify-center ${isMicrophoneMuted ? 'bg-red-600 text-white' : 'bg-white text-black'}`}
              title={isMicrophoneMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMicrophoneMuted ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l22 22"></path>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </button>
            
            <button 
              onClick={toggleFullscreen}
              className="rounded-full w-12 h-12 bg-white/20 flex items-center justify-center text-white"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>
            
            {/* Invite co-host button (for host only) */}
            {isHost && (
              <button 
                onClick={handleInviteCohost}
                className="rounded-full bg-blue-500 text-white px-4 py-2 text-sm font-medium"
                title="Invite co-host"
              >
                + Co-host
              </button>
            )}
          </div>
        )}
      </div>
  
      <div className="flex gap-4 justify-center mb-6">

              <button
                onClick={handleStartStream}
                disabled={!isConnected || isStreaming || sellerId === ""}
                className={`px-6 py-3 rounded-lg font-medium ${
                  !isConnected || isStreaming || sellerId === ""
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                Start New Stream
              </button>
               <button
                onClick={handleJoinStream}
                disabled={!isConnected || isStreaming || !selectedStreamId || sellerId === ""}
                className={`px-6 py-3 rounded-lg font-medium ${
                  !isConnected || isStreaming || !selectedStreamId || sellerId === ""
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Join as Co-Broadcaster
              </button> 

         
          <button
            onClick={isCohost ? handleLeaveAsCohost : handleStopStream}
            className="px-6 py-3 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
          >
            {isCohost ? "Leave Stream" : "Stop Streaming"}
          </button>
        
      </div>
  
      <div className="border border-gray-200 rounded-lg text-black">
        <div className="bg-gray-100 px-4 py-2 font-medium border-b border-gray-200 flex justify-between">
          <span>Connection Logs</span>
          <span className="text-blue-500">Status: {statusMessage}</span>
        </div>
        <div ref={logContainerRef} className="h-48 overflow-y-auto p-3 bg-gray-50 text-xs font-mono">
          {logs.map((log, index) => (
            <div key={index} className="pb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
      
      {/* Invite co-host dialog */}
      
     {showInviteDialog && (
  <>
    <div 
      className="fixed inset-0 bg-black/60 z-50" 
      onClick={() => setShowInviteDialog(false)}
    />
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md z-50"
      onClick={(e) => e.stopPropagation()} // Prevent backdrop click propagation
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Invite Co-host</h3>
        <button 
          onClick={() => setShowInviteDialog(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <CohostSearchInvite 
          showId={showId}
          onInvite={(userId) => {
          console.log('Invite button clicked for:', userId);
          sendInvitation(userId);
          setShowInviteDialog(false);
        }}
      />
    </div>
  </>
)}

    </div>
  );
}