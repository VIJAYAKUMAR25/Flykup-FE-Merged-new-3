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
  START_LIVE_STREAM,
  COHOST_INVITE
} from "../../api/apiDetails";
import moment from "moment/moment"
import { mediaSoupServerUrl } from "../../../../config.js"
import CohostManager from "./cohost-manager"
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import CohostSearchInvite from "./CohostSearchInvite.jsx"
import StreamPreviewModal from "./StreamPreviewModal.jsx"


export default function StartStream(showId) {
  console.log("StartStream component initialized with showId:", showId)
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
  const consumerTransportRef = useRef(null)
  const consumersRef = useRef(new Map())

  const [showPreviewModal, setShowPreviewModal] = useState(true)
  const [previewStreamData, setPreviewStreamData] = useState(null)

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


  // ADD THIS FUNCTION to handle stream start from modal
  const handleStreamStartFromModal = async (streamData) => {
    console.log('Starting stream from modal with data:', streamData)

    // Store the preview data
    setPreviewStreamData(streamData)

    // Update local stream if available
    if (streamData.videoStream || streamData.audioStream) {
      const combinedStream = new MediaStream()

      if (streamData.videoStream) {
        streamData.videoStream.getTracks().forEach(track => combinedStream.addTrack(track))
      }
      if (streamData.audioStream) {
        streamData.audioStream.getTracks().forEach(track => combinedStream.addTrack(track))
      }

      localStreamRef.current = combinedStream

      // Update video element
      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream
      }
    }

    // Start the actual stream based on mode
    if (streamData.config.mode === "create") {
      await handleStartStream()
    } else {
      await handleJoinStream()
    }
  }


  // Initialize socket connection - ENHANCED with better error handling
  useEffect(() => {
    const serverUrl = mediaSoupServerUrl
    addLog(`Connecting to server: ${serverUrl}`)

    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // ENHANCED: Add timeout settings to match server
      timeout: 30000,
      forceNew: true, // ENHANCED: Force new connection to prevent stale connections
    })

    socketRef.current.on("connect", () => {
      addLog(`Socket connected: ${socketRef.current.id}`)
      setIsConnected(true)
      setStatusMessage("Connected to server")

      // Load available streams when connected
      fetchAvailableStreams()
    })

    // ENHANCED: Enhanced connection error handling
    socketRef.current.on("connect_error", (error) => {
      addLog(`Connection error: ${error.message}`)
      setStatusMessage(`Connection error: ${error.message}`)
      setIsConnected(false)
    })

    // ENHANCED: Handle disconnection properly
    socketRef.current.on("disconnect", (reason) => {
      addLog(`Socket disconnected: ${reason}`)
      setIsConnected(false)
      setStatusMessage(`Disconnected: ${reason}`)

      // If we were streaming, stop the stream
      if (isStreaming) {
        addLog("Stream interrupted by disconnection")
        handleStopStream()
      }
    })

    // ENHANCED: Handle server heartbeat requests properly
    socketRef.current.on("heartbeat", (data, callback) => {
      addLog("Received heartbeat from server")
      if (typeof callback === "function") {
        callback({ received: true, timestamp: Date.now() });
      }
    })

    // ENHANCED: Handle reconnection
    socketRef.current.on("reconnect", (attemptNumber) => {
      addLog(`Reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
      setStatusMessage("Reconnected to server")
    })

    socketRef.current.on("reconnect_attempt", (attemptNumber) => {
      addLog(`Reconnection attempt ${attemptNumber}`)
      setStatusMessage(`Reconnecting... (${attemptNumber})`)
    })

    socketRef.current.on("reconnect_error", (error) => {
      addLog(`Reconnection error: ${error.message}`)
    })

    socketRef.current.on("reconnect_failed", () => {
      addLog("Reconnection failed - max attempts reached")
      setStatusMessage("Connection failed")
      setIsConnected(false)

      if (isStreaming) {
        handleStopStream()
      }
    })

    // ENHANCED: Listen for co-host events
    socketRef.current.on("cohost:connected", (data) => {
      if (data.streamId === roomIdRef.current) {
        addLog(`Co-host ${data.sellerId} joined the stream`)
        setCohosts(prev => [...prev, {
          socketId: data.socketId,
          sellerId: data.sellerId,
          videoProducerId: data.videoProducerId,
          audioProducerId: data.audioProducerId
        }])
      }
    })

    socketRef.current.on("cohost:disconnected", (data) => {
      if (data.streamId === roomIdRef.current) {
        addLog(`Co-host disconnected`)
        setCohosts(prev => prev.filter(ch => ch.socketId !== data.socketId))
      }
    })

    // ENHANCED: Listen for producer closed events
    socketRef.current.on("producerClosed", ({ producerId }) => {
      addLog(`Producer ${producerId} closed - cleaning up`)

      // Remove co-host video elements (for host view)
      const cohostVideo = document.getElementById(`cohost-video-${producerId}`);
      if (cohostVideo && cohostVideo.parentElement) {
        cohostVideo.parentElement.remove();
        addLog(`Removed co-host video element for producer ${producerId}`);
      }

      // Remove host video elements (for co-host view)
      const hostVideo = document.getElementById(`host-video-${producerId}`);
      if (hostVideo && hostVideo.parentElement) {
        hostVideo.parentElement.remove();
        addLog(`Removed host video element for producer ${producerId}`);
      }

      // Close and remove consumers
      if (consumersRef.current.has(producerId)) {
        const consumer = consumersRef.current.get(producerId);
        consumer.close();
        consumersRef.current.delete(producerId);
        addLog(`Closed consumer for producer ${producerId}`);
      }
    })

    // Listen for viewer count updates - ENHANCED
    socketRef.current.on("viewerCountUpdate", ({ streamId, count }) => {
      if (roomIdRef.current === streamId) {
        addLog(`Viewer count updated: ${count} viewers`);
        setViewerCount(count);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, []) // ENHANCED: Empty dependency array to prevent recreation

  // ENHANCED: Enhanced stream heartbeat mechanism with proper socket heartbeat handling
  useEffect(() => {
    if (isStreaming && roomIdRef.current) {
      let heartbeatFailures = 0;
      const MAX_FAILURES = 5; // ENHANCED: Increased from 3 to 5 to be more tolerant

      // Send heartbeats every 25 seconds (ENHANCED: Reduced from 30 to ensure it's within server timeout)
      const heartbeatInterval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected) {
          // ENHANCED: Respond to server heartbeat first
          socketRef.current.emit('heartbeat', { timestamp: Date.now() }, (ack) => {
            if (ack && ack.success) {
              heartbeatFailures = 0; // Reset on successful heartbeat response
              addLog("Socket heartbeat successful");
            } else {
              heartbeatFailures++;
              addLog(`Socket heartbeat failed (${heartbeatFailures}/${MAX_FAILURES})`);
            }
          });

          // Send stream-specific heartbeat
          socketRef.current.emit('stream:heartbeat', {
            streamId: roomIdRef.current,
            timestamp: Date.now()
          }, (response) => {
            if (response && response.error) {
              heartbeatFailures++;
              addLog(`Stream heartbeat failed: ${response.error}`);
            } else {
              addLog("Stream heartbeat successful");
            }

            if (heartbeatFailures >= MAX_FAILURES) {
              addLog("Too many heartbeat failures, stopping stream");
              handleStopStream();
            }
          });

          // Also ping the backend API to update the lastHeartbeat
          axios.get(`${GET_SINGLE_STREAM_DATA}/${roomIdRef.current}`)
            .then(() => {
              addLog("Backend heartbeat successful");
            })
            .catch(err => {
              console.error("Error sending stream heartbeat to API:", err);
              addLog(`Backend heartbeat failed: ${err.message}`);
              // Don't increment heartbeatFailures for API errors
            });
        } else {
          heartbeatFailures++;
          addLog(`Socket disconnected (${heartbeatFailures}/${MAX_FAILURES})`);

          if (heartbeatFailures >= MAX_FAILURES) {
            addLog("Socket connection lost, stopping stream");
            handleStopStream();
          }
        }
      }, 25000); // ENHANCED: 25 seconds instead of 30

      // ENHANCED: Also listen for server heartbeat requests
      const handleServerHeartbeat = (data, callback) => {
        addLog("Received server heartbeat request");
        if (typeof callback === "function") {
          callback({ received: true, timestamp: Date.now() });
        }
        heartbeatFailures = 0; // Reset failures on server heartbeat
      };

      socketRef.current.on('heartbeat', handleServerHeartbeat);

      return () => {
        clearInterval(heartbeatInterval);
        if (socketRef.current) {
          socketRef.current.off('heartbeat', handleServerHeartbeat);
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

  // ENHANCED: Monitor video element for playback and autoplay-blocking issues
  useEffect(() => {
    if (videoRef.current && localStreamRef.current) {
      const videoElement = videoRef.current;

      // Try to play the video whenever the stream changes
      const playVideo = async () => {
        try {
          await videoElement.play();
          setVideoPlaying(true);
          addLog("Local video playback started successfully");
        } catch (err) {
          setVideoPlaying(false);
          addLog(`Autoplay prevented: ${err.message}. Click to start video.`);
        }
      };

      // Initial play attempt
      playVideo();

      // Set up event listeners for better error handling
      videoElement.addEventListener('playing', () => {
        setVideoPlaying(true);
        addLog("Video is now playing");
      });

      videoElement.addEventListener('pause', () => {
        setVideoPlaying(false);
        addLog("Video is paused");
      });

      videoElement.addEventListener('error', (e) => {
        const error = videoElement.error;
        addLog(`Video error: ${error.message}`);
        setVideoPlaying(false);
      });

      return () => {
        videoElement.removeEventListener('playing', () => { });
        videoElement.removeEventListener('pause', () => { });
        videoElement.removeEventListener('error', () => { });
      };
    }
  }, [localStreamRef.current]);

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

  // ENHANCED: Enhanced newProducer handler for BOTH host AND co-host to consume streams
  useEffect(() => {
    if (socketRef.current && isConnected && (isHost || isCohost)) {
      // Listen for new producers (when host or other co-hosts join)
      socketRef.current.on("newProducer", async ({ producerId, kind }) => {
        try {
          addLog(`New producer available: ${producerId} (${kind})`);

          // Create consumer transport if needed
          if (!consumerTransportRef.current) {
            const transportOptions = await new Promise((resolve, reject) => {
              socketRef.current.emit("createConsumerTransport", { roomId: roomIdRef.current }, (response) => {
                if (response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response);
                }
              });
            });

            consumerTransportRef.current = deviceRef.current.createRecvTransport(transportOptions);

            // Handle transport events
            consumerTransportRef.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
              try {
                await new Promise((resolve, reject) => {
                  socketRef.current.emit("connectConsumerTransport", {
                    dtlsParameters,
                    roomId: roomIdRef.current,
                    transportId: consumerTransportRef.current.id
                  }, (response) => {
                    if (response.error) {
                      reject(new Error(response.error));
                    } else {
                      resolve(response);
                    }
                  });
                });
                callback();
              } catch (error) {
                errback(error);
              }
            });
          }

          // Consume the producer
          const response = await new Promise((resolve, reject) => {
            socketRef.current.emit("consume", {
              producerId,
              transportId: consumerTransportRef.current.id,
              roomId: roomIdRef.current,
              rtpCapabilities: deviceRef.current.rtpCapabilities
            }, (response) => {
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            });
          });

          const consumer = await consumerTransportRef.current.consume({
            id: response.id,
            producerId,
            kind,
            rtpParameters: response.rtpParameters
          });

          // Store the consumer
          consumersRef.current.set(consumer.id, consumer);

          // Resume the consumer
          await consumer.resume();

          // ENHANCED: Create video element for both host and co-host views
          if (isHost) {
            createCohostVideoElement(consumer, producerId, kind);
          } else if (isCohost) {
            createHostVideoElement(consumer, producerId, kind);
          }

          addLog(`Successfully consuming ${kind} from ${isHost ? 'co-host' : 'host'}: ${producerId}`);
        } catch (error) {
          addLog(`Error consuming stream: ${error.message}`);
        }
      });

      return () => {
        socketRef.current.off("newProducer");
      };
    }
  }, [socketRef.current, isConnected, isHost, isCohost]);

  // ENHANCED: Function to create video element for HOST streams (for co-host to see host)
  const createHostVideoElement = (consumer, producerId, kind) => {
    console.log(`Creating host video element for producer ${producerId}, kind: ${kind}`);

    // ENHANCED: Check if we already have a video element for ANY host producer to prevent duplicates
    const existingHostVideo = document.querySelector(`[id^="host-video-"]`);

    // Get or create container for host videos (for co-host's view)
    let hostContainer = document.getElementById('host-videos-container');
    if (!hostContainer) {
      hostContainer = document.createElement('div');
      hostContainer.id = 'host-videos-container';
      hostContainer.style.position = 'absolute';
      hostContainer.style.top = '10px';
      hostContainer.style.right = '10px'; // ENHANCED: Moved to right corner
      hostContainer.style.zIndex = '20';
      hostContainer.style.display = 'flex';
      hostContainer.style.flexDirection = 'column';
      hostContainer.style.gap = '10px';

      // Add to main container
      if (containerRef.current) {
        containerRef.current.appendChild(hostContainer);
      } else {
        document.body.appendChild(hostContainer);
      }
    }

    // For video tracks, create or update video element
    if (kind === 'video') {
      let videoElement = existingHostVideo || document.getElementById(`host-video-${producerId}`);

      if (!videoElement) {
        // Create new video element only if none exists
        videoElement = document.createElement('video');
        videoElement.id = `host-video-${producerId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = false; // Host audio should be heard by co-host
        videoElement.style.width = '200px';
        videoElement.style.height = '150px';
        videoElement.style.objectFit = 'cover';
        videoElement.style.border = '3px solid #dc3545'; // Red border for host
        videoElement.style.borderRadius = '8px';
        videoElement.style.backgroundColor = '#000';

        // Create wrapper with label
        const wrapper = document.createElement('div');
        wrapper.id = `host-wrapper-${producerId}`;
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        const label = document.createElement('div');
        label.textContent = `Host`;
        label.style.position = 'absolute';
        label.style.bottom = '5px';
        label.style.left = '5px';
        label.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
        label.style.color = 'white';
        label.style.padding = '2px 8px';
        label.style.fontSize = '12px';
        label.style.borderRadius = '4px';
        label.style.fontWeight = 'bold';

        wrapper.appendChild(videoElement);
        wrapper.appendChild(label);
        hostContainer.appendChild(wrapper);

        // Create a new MediaStream for this video
        videoElement.srcObject = new MediaStream();
        console.log(`Created new host video element: ${videoElement.id}`);
      }

      // Add the video track to the stream
      if (videoElement && consumer.track) {
        const stream = videoElement.srcObject;

        // Remove existing video tracks
        if (stream) {
          stream.getTracks().forEach(track => {
            if (track.kind === 'video') {
              stream.removeTrack(track);
            }
          });

          // Add the new video track
          stream.addTrack(consumer.track);
          console.log(`Added video track to host stream`);

          // Try to play the video
          videoElement.play().catch(err => {
            console.log('Host video autoplay prevented:', err);
          });
        }
      }
    }
    // For audio tracks, find existing video element and add audio
    else if (kind === 'audio') {
      const videoElement = existingHostVideo || document.getElementById(`host-video-${producerId}`);

      if (videoElement && videoElement.srcObject && consumer.track) {
        const stream = videoElement.srcObject;

        // Remove existing audio tracks
        stream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            stream.removeTrack(track);
          }
        });

        // Add the new audio track
        stream.addTrack(consumer.track);
        console.log(`Added audio track to host stream`);
      }
    }
  };

  // ENHANCED: Function to create video element for CO-HOST streams (for host to see co-host)
  const createCohostVideoElement = (consumer, producerId, kind) => {
    // Get or create container for co-host videos
    let cohostContainer = document.getElementById('cohost-videos-container');
    if (!cohostContainer) {
      cohostContainer = document.createElement('div');
      cohostContainer.id = 'cohost-videos-container';
      cohostContainer.style.position = 'absolute';
      cohostContainer.style.top = '10px';
      cohostContainer.style.right = '10px';
      cohostContainer.style.zIndex = '20';
      cohostContainer.style.display = 'flex';
      cohostContainer.style.flexDirection = 'column';
      cohostContainer.style.gap = '10px';

      // Add to main container
      if (containerRef.current) {
        containerRef.current.appendChild(cohostContainer);
      } else {
        document.body.appendChild(cohostContainer);
      }
    }

    // Check if we already have a video element for this producer
    let videoElement = document.getElementById(`cohost-video-${producerId}`);

    if (!videoElement && kind === 'video') {
      // Create new video element for video producers
      videoElement = document.createElement('video');
      videoElement.id = `cohost-video-${producerId}`;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = false; // Co-host audio should be heard
      videoElement.style.width = '200px';
      videoElement.style.height = '150px';
      videoElement.style.objectFit = 'cover';
      videoElement.style.border = '3px solid #28a745'; // Green border for co-host
      videoElement.style.borderRadius = '8px';
      videoElement.style.backgroundColor = '#000';

      // Create wrapper with label
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';

      const label = document.createElement('div');
      label.textContent = `Co-host ${producerId.substring(0, 8)}`;
      label.style.position = 'absolute';
      label.style.bottom = '5px';
      label.style.left = '5px';
      label.style.backgroundColor = 'rgba(40, 167, 69, 0.9)'; // Green background for co-host
      label.style.color = 'white';
      label.style.padding = '2px 8px';
      label.style.fontSize = '12px';
      label.style.borderRadius = '4px';
      label.style.fontWeight = 'bold';

      wrapper.appendChild(videoElement);
      wrapper.appendChild(label);
      cohostContainer.appendChild(wrapper);

      // Create a new MediaStream for this video
      videoElement.srcObject = new MediaStream();
    }

    // Add the track to the appropriate video element
    if (videoElement && consumer.track) {
      const stream = videoElement.srcObject;

      // Remove existing tracks of the same kind
      if (stream) {
        stream.getTracks().forEach(track => {
          if (track.kind === consumer.track.kind) {
            stream.removeTrack(track);
          }
        });

        // Add the new track
        stream.addTrack(consumer.track);

        // Try to play the video
        videoElement.play().catch(err => {
          console.log('Co-host video autoplay prevented:', err);
        });
      }
    } else if (kind === 'audio') {
      // For audio tracks, find the corresponding video element and add audio
      const correspondingVideo = document.querySelector(`[id^="cohost-video-"]`);
      if (correspondingVideo && correspondingVideo.srcObject && consumer.track) {
        const stream = correspondingVideo.srcObject;

        // Remove existing audio tracks
        stream.getTracks().forEach(track => {
          if (track.kind === 'audio') {
            stream.removeTrack(track);
          }
        });

        // Add the new audio track
        stream.addTrack(consumer.track);
      }
    }
  };

  // ENHANCED: Add useEffect to consume existing producers when joining as co-host
  useEffect(() => {
    if (socketRef.current && isConnected && isCohost && deviceRef.current && roomIdRef.current) {
      // When co-host joins, consume existing producers (host's stream)
      const consumeExistingProducers = async () => {
        try {
          addLog("Co-host getting existing producers to consume...");

          // ENHANCED: Clear any existing host video elements to prevent duplicates
          const existingHostContainer = document.getElementById('host-videos-container');
          if (existingHostContainer) {
            existingHostContainer.remove();
            addLog("Removed existing host video container to prevent duplicates");
          }

          // Create consumer transport if not exists
          if (!consumerTransportRef.current) {
            const transportOptions = await new Promise((resolve, reject) => {
              socketRef.current.emit("createConsumerTransport", { roomId: roomIdRef.current }, (response) => {
                if (response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response);
                }
              });
            });

            consumerTransportRef.current = deviceRef.current.createRecvTransport(transportOptions);

            // Handle transport events
            consumerTransportRef.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
              try {
                await new Promise((resolve, reject) => {
                  socketRef.current.emit("connectConsumerTransport", {
                    dtlsParameters,
                    roomId: roomIdRef.current,
                    transportId: consumerTransportRef.current.id
                  }, (response) => {
                    if (response.error) {
                      reject(new Error(response.error));
                    } else {
                      resolve(response);
                    }
                  });
                });
                callback();
              } catch (error) {
                errback(error);
              }
            });
          }

          // Get existing producers
          const producers = await new Promise((resolve, reject) => {
            socketRef.current.emit("getProducers", { roomId: roomIdRef.current }, (response) => {
              if (response && response.error) {
                reject(new Error(response.error));
              } else {
                resolve(Array.isArray(response) ? response : []);
              }
            });
          });

          addLog(`Found ${producers.length} existing producers to consume`);

          // ENHANCED: Group producers by socket to avoid duplicates
          const producersBySocket = new Map();
          producers.forEach(producer => {
            if (!producersBySocket.has(producer.socketId)) {
              producersBySocket.set(producer.socketId, []);
            }
            producersBySocket.get(producer.socketId).push(producer);
          });

          // Consume only one set of producers per socket (to avoid duplicates)
          for (const [socketId, socketProducers] of producersBySocket.entries()) {
            addLog(`Consuming producers from socket: ${socketId}`);

            for (const producer of socketProducers) {
              try {
                addLog(`Consuming existing ${producer.kind} producer: ${producer.producerId}`);

                const response = await new Promise((resolve, reject) => {
                  socketRef.current.emit("consume", {
                    producerId: producer.producerId,
                    transportId: consumerTransportRef.current.id,
                    roomId: roomIdRef.current,
                    rtpCapabilities: deviceRef.current.rtpCapabilities
                  }, (response) => {
                    if (response.error) {
                      reject(new Error(response.error));
                    } else {
                      resolve(response);
                    }
                  });
                });

                const consumer = await consumerTransportRef.current.consume({
                  id: response.id,
                  producerId: producer.producerId,
                  kind: producer.kind,
                  rtpParameters: response.rtpParameters
                });

                // Store the consumer
                consumersRef.current.set(consumer.id, consumer);

                // Resume the consumer
                await consumer.resume();

                // Create host video element (since co-host is consuming host's stream)
                createHostVideoElement(consumer, producer.producerId, producer.kind);

                addLog(`Successfully consumed ${producer.kind} from host: ${producer.producerId}`);
              } catch (error) {
                addLog(`Error consuming producer ${producer.producerId}: ${error.message}`);
              }
            }
          }
        } catch (error) {
          addLog(`Error consuming existing producers: ${error.message}`);
        }
      };

      // Delay to ensure everything is ready
      setTimeout(consumeExistingProducers, 1000);
    }
  }, [isCohost, isConnected, deviceRef.current, roomIdRef.current]);

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

  // MODIFY YOUR getUserMedia FUNCTION to use preview data (replace existing function)
  const getUserMedia = async () => {
    try {
      addLog("Requesting camera and microphone access")

      // Use preview data if available, otherwise request fresh media
      if (previewStreamData && (previewStreamData.videoStream || previewStreamData.audioStream)) {
        addLog("Using media streams from preview modal")

        const combinedStream = new MediaStream()

        if (previewStreamData.videoStream) {
          previewStreamData.videoStream.getTracks().forEach(track => combinedStream.addTrack(track))
        }
        if (previewStreamData.audioStream) {
          previewStreamData.audioStream.getTracks().forEach(track => combinedStream.addTrack(track))
        }

        localStreamRef.current = combinedStream

        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
          setVideoPlaying(true);
          addLog("Local video set from preview data");
        }

        return true;
      } else {
        // Your existing getUserMedia logic
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = localStreamRef.current;
          try {
            setVideoPlaying(true);
            addLog("Local video playback started automatically");
          } catch (err) {
            addLog(`Autoplay prevented: ${err.message}. User interaction may be needed.`);
            setVideoPlaying(false);
          }
        }

        addLog("Media access granted successfully");
        return true;
      }
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

        // ENHANCED: Emit stream start event
        socketRef.current.emit("stream:start", {
          streamId: roomId,
          sellerId: sellerId,
          isHost: true
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

        // ENHANCED: Notify all viewers that stream has started
        socketRef.current.emit("stream:status", {
          streamId: roomId,
          status: "started",
          sellerId: sellerId
        })

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

  // useEffect(() => {
  //   handleStartStream()
  // }, [])

  // ENHANCED: Enhanced handleStopStream with proper state cleanup and role-based logic
  const handleStopStream = async () => {
    try {
      addLog("Stopping stream...");

      // ENHANCED: Different behavior for host vs co-host
      if (isHost) {
        // HOST: End the entire stream
        addLog("Host ending stream - will end entire stream");

        // Update stream status in the backend
        if (roomIdRef.current) {
          try {
            await axios.post(`${GET_SINGLE_STREAM_DATA}/${roomIdRef.current}/end`);
            addLog(`Stream ended successfully in backend for ID: ${roomIdRef.current}`);

            // Emit stream end event to notify all participants
            socketRef.current.emit('stream:end', {
              streamId: roomIdRef.current,
              sellerId: sellerId,
              isHostEnding: true
            });
          } catch (error) {
            addLog(`Error updating stream status in backend: ${error.message}`);
          }
        }
      } else if (isCohost) {
        // CO-HOST: Only disconnect self, don't end the stream
        addLog("Co-host leaving stream - stream will continue");

        // Emit co-host disconnect event
        socketRef.current.emit('cohost:disconnected', {
          socketId: socketRef.current.id,
          streamId: roomIdRef.current,
          sellerId: sellerId,
          isCohost: true
        });
      }

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // ENHANCED: Clean up host video elements (for co-host view)
      const hostContainer = document.getElementById('host-videos-container');
      if (hostContainer) {
        hostContainer.remove();
        addLog("Removed host video container");
      }

      // ENHANCED: Clean up co-host video elements (for host view)
      const cohostContainer = document.getElementById('cohost-videos-container');
      if (cohostContainer) {
        cohostContainer.remove();
        addLog("Removed co-host video container");
      }

      // ENHANCED: Close all consumers
      if (consumersRef.current) {
        consumersRef.current.forEach(consumer => {
          consumer.close();
        });
        consumersRef.current.clear();
        addLog("Closed all consumers");
      }

      // ENHANCED: Close consumer transport
      if (consumerTransportRef.current) {
        consumerTransportRef.current.close();
        consumerTransportRef.current = null;
        addLog("Closed consumer transport");
      }

      // Close producers
      if (videoProducerRef.current) {
        videoProducerRef.current.close()
        videoProducerRef.current = null
        addLog("Closed video producer");
      }

      if (audioProducerRef.current) {
        audioProducerRef.current.close()
        audioProducerRef.current = null
        addLog("Closed audio producer");
      }

      // Close transport
      if (producerTransportRef.current) {
        producerTransportRef.current.close()
        producerTransportRef.current = null
        addLog("Closed producer transport");
      }

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
        addLog("Stopped local media stream");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
        addLog("Cleared video element");
      }

      // ENHANCED: Clear device reference to allow fresh initialization
      if (deviceRef.current) {
        deviceRef.current = null;
        addLog("Cleared MediaSoup device reference");
      }

      // ENHANCED: Reset all state variables properly
      setIsStreaming(false);
      setIsHost(false);
      setIsCohost(false);
      setCohosts([]);
      setViewerCount(0);
      setVideoPlaying(false);
      setIsCameraOn(true);
      setIsMicrophoneMuted(false);

      // ENHANCED: Clear room reference
      roomIdRef.current = null;

      // Clear co-host manager
      if (cohostManagerRef.current) {
        cohostManagerRef.current.dispose();
        cohostManagerRef.current = null;
      }

      // Set appropriate status message
      if (isHost) {
        setStatusMessage("Stream ended");
        addLog("Host stream ended successfully");
      } else {
        setStatusMessage("Left co-host session");
        addLog("Co-host disconnected successfully");
      }

      // Production-specific logic: End show
      const endRes = await axiosInstance.patch(
        END_LIVE_STREAM.replace(":id", showId.showId),
        {}
      );
      if (endRes?.data?.data?.status) {
        toast.success("Show is Ended.");
      }

    } catch (err) {
      console.log("Error in handleStopStream:", err);
      addLog(`Error stopping stream: ${err.message}`);

      // Even if there's an error, reset the state to prevent UI issues
      setIsStreaming(false);
      setIsHost(false);
      setIsCohost(false);
      setCohosts([]);
      setViewerCount(0);
      roomIdRef.current = null;
      deviceRef.current = null;

      if (cohostManagerRef.current) {
        cohostManagerRef.current.dispose();
        cohostManagerRef.current = null;
      }
    }
  }

  const handleInviteCohost = async () => {
    if (!inviteTarget.trim()) {
      addLog("Please enter a valid seller ID");
      return;
    }

    try {
      const response = await axios.post(`${CREATE_NEW_STREAM}/invite-cohost`, {
        streamId: roomIdRef.current,
        targetSellerId: inviteTarget.trim()
      });

      if (response.data.success) {
        addLog(`Invitation sent to seller ${inviteTarget}`);
        setShowInviteDialog(false);
        setInviteTarget("");
      } else {
        addLog(`Failed to send invitation: ${response.data.message}`);
      }
    } catch (error) {
      addLog(`Error sending invitation: ${error.message}`);
    }
  };

  // Production-specific logic: Enhanced invitation system
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
    <div className="flex flex-col max-w-4xl mx-auto h-screen">
      <div className="flex gap-4">
        {/* <button
          onClick={() => setMode("create")}
          className={`px-4 py-2 rounded-lg ${mode === "create" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
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
        </button> */}
      </div>

      {mode === "create" ? (
        <>
          {/* <div className="mb-4">
            <label className="block mb-2">Your Name or ID</label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="border border-gray-300 w-full h-10 bg-white text-black rounded-lg px-3"
              placeholder="Enter your name or ID"
            />
          </div> */}
        </>
      ) : (
        <>
          {/* <div className="mb-4">
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
          </div> */}
        </>
      )}

      <div className="relative bg-black rounded-lg h-screen overflow-hidden aspect-video" ref={containerRef} id="video-container">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

        {isStreaming && (
          <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
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
            {/* <div className={`py-1 px-3 rounded-md text-xs font-bold text-white ${isHost ? 'bg-blue-500' : isCohost ? 'bg-green-500' : ''}`}>
              {isHost ? 'Host' : isCohost ? 'Co-Host' : ''}
            </div> */}
          </div>
        )}

        {/* Co-hosts grid - Now handled by createCohostVideoElement function */}
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

            {/* <button
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
            </button> */}

            {isHost && (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="rounded-full bg-blue-500 text-white px-4 py-2 text-sm font-medium"
                title="Invite co-host"
              >
                + Co-host
              </button>
            )}

            <button onClick={isCohost ? handleLeaveAsCohost : handleStopStream} className="rounded-full bg-red-500 text-white px-4 py-2 text-sm font-medium"  >Stop</button>
          </div>
        )}
      </div>

      {/* <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={handleStartStream}
          // disabled={!isConnected || isStreaming || sellerId === ""}
          className={`px-6 py-3 rounded-lg font-medium ${!isConnected || isStreaming || sellerId === ""
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
        >
          Start New Stream
        </button>
        <button
          onClick={handleJoinStream}
          disabled={!isConnected || isStreaming || !selectedStreamId || sellerId === ""}
          className={`px-6 py-3 rounded-lg font-medium ${!isConnected || isStreaming || !selectedStreamId || sellerId === ""
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
      </div> */}

      {/* <div className="border border-gray-200 rounded-lg text-black">
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
      </div> */}

      {/* Enhanced Invite co-host dialog with production logic */}
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

      <StreamPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onStartStream={handleStreamStartFromModal}
        streamConfig={{
          sellerId,
          mode,
          selectedStreamId
        }}
      />
    </div>
  );
}