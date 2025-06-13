import React, { useState, useRef, useEffect } from 'react';

const StreamPreviewModal = ({ 
  isOpen, 
  onClose, 
  onStartStream,
  streamConfig = {} // { sellerId, mode, selectedStreamId }
}) => {
  // Device states
  const [devices, setDevices] = useState({
    cameras: [],
    microphones: [],
    speakers: []
  });
  
  // Selected devices
  const [selectedDevices, setSelectedDevices] = useState({
    camera: null,
    microphone: null,
    speaker: null
  });
  
  // Stream states
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  // Quality settings
  const [videoQuality, setVideoQuality] = useState('720p');
  const [audioQuality, setAudioQuality] = useState('high');
  
  // Permission states
  const [permissions, setPermissions] = useState({
    camera: 'prompt',
    microphone: 'prompt'
  });
  
  // Testing states
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [testResults, setTestResults] = useState({
    camera: null,
    microphone: null,
    connection: null
  });
  
  // Error states
  const [errors, setErrors] = useState({});
  const [logs, setLogs] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationRef = useRef(null);
  
  // Logging function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type,
      id: Date.now()
    };
    setLogs(prev => [...prev.slice(-49), logEntry]);
    console.log(`[StreamPreview] ${message}`);
  };
  
  // Quality presets
  const videoQualityPresets = {
    '480p': { width: 854, height: 480, frameRate: 30 },
    '720p': { width: 1280, height: 720, frameRate: 30 },
    '1080p': { width: 1920, height: 1080, frameRate: 30 },
    '4K': { width: 3840, height: 2160, frameRate: 30 }
  };
  
  const audioQualityPresets = {
    'low': { sampleRate: 22050, bitrate: 64000 },
    'medium': { sampleRate: 44100, bitrate: 128000 },
    'high': { sampleRate: 48000, bitrate: 192000 }
  };
  
  // Get available devices
  const getDevices = async () => {
    try {
      addLog('Enumerating media devices...');
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const microphones = deviceList.filter(device => device.kind === 'audioinput');
      const speakers = deviceList.filter(device => device.kind === 'audiooutput');
      
      setDevices({ cameras, microphones, speakers });
      
      // Auto-select first available devices
      if (cameras.length > 0 && !selectedDevices.camera) {
        setSelectedDevices(prev => ({ ...prev, camera: cameras[0].deviceId }));
      }
      if (microphones.length > 0 && !selectedDevices.microphone) {
        setSelectedDevices(prev => ({ ...prev, microphone: microphones[0].deviceId }));
      }
      if (speakers.length > 0 && !selectedDevices.speaker) {
        setSelectedDevices(prev => ({ ...prev, speaker: speakers[0].deviceId }));
      }
      
      addLog(`Found ${cameras.length} cameras, ${microphones.length} microphones, ${speakers.length} speakers`);
      
    } catch (error) {
      addLog(`Error enumerating devices: ${error.message}`, 'error');
      setErrors(prev => ({ ...prev, devices: error.message }));
    }
  };
  
  // Check permissions
  const checkPermissions = async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
      
      setPermissions({
        camera: cameraPermission.state,
        microphone: microphonePermission.state
      });
      
      addLog(`Permissions - Camera: ${cameraPermission.state}, Microphone: ${microphonePermission.state}`);
      
    } catch (error) {
      addLog(`Error checking permissions: ${error.message}`, 'warn');
    }
  };
  
  // Request permissions and get user media
  const requestUserMedia = async () => {
    try {
      addLog('Requesting user media access...');
      
      const constraints = {
        video: selectedDevices.camera ? {
          deviceId: { exact: selectedDevices.camera },
          ...videoQualityPresets[videoQuality]
        } : false,
        audio: selectedDevices.microphone ? {
          deviceId: { exact: selectedDevices.microphone },
          ...audioQualityPresets[audioQuality]
        } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Separate video and audio tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      if (videoTracks.length > 0) {
        const videoStream = new MediaStream([videoTracks[0]]);
        setVideoStream(videoStream);
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
        setTestResults(prev => ({ ...prev, camera: 'success' }));
        addLog('Camera stream started successfully');
      }
      
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream([audioTracks[0]]);
        setAudioStream(audioStream);
        setupAudioAnalyzer(audioStream);
        setTestResults(prev => ({ ...prev, microphone: 'success' }));
        addLog('Microphone stream started successfully');
      }
      
      setIsPreviewActive(true);
      setErrors(prev => ({ ...prev, media: null }));
      
    } catch (error) {
      addLog(`Error accessing media devices: ${error.message}`, 'error');
      setErrors(prev => ({ ...prev, media: error.message }));
      setTestResults(prev => ({ 
        ...prev, 
        camera: error.name === 'NotAllowedError' ? 'denied' : 'error',
        microphone: error.name === 'NotAllowedError' ? 'denied' : 'error'
      }));
    }
  };
  
  // Setup audio analyzer for level monitoring
  const setupAudioAnalyzer = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      // Start monitoring audio levels
      monitorAudioLevel();
      
    } catch (error) {
      addLog(`Error setting up audio analyzer: ${error.message}`, 'error');
    }
  };
  
  // Monitor audio level
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = average / 255;
    
    setAudioLevel(normalizedLevel);
    
    animationRef.current = requestAnimationFrame(monitorAudioLevel);
  };
  
  // Stop all streams
  const stopStreams = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsPreviewActive(false);
    setAudioLevel(0);
    addLog('All streams stopped');
  };
  
  // Test audio playback
  const testAudioPlayback = async () => {
    try {
      setIsTestingAudio(true);
      addLog('Testing audio playback...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        setIsTestingAudio(false);
        addLog('Audio playback test completed');
      }, 1000);
      
    } catch (error) {
      addLog(`Error testing audio playback: ${error.message}`, 'error');
      setIsTestingAudio(false);
    }
  };
  
  // Test network connection
  const testConnection = async () => {
    try {
      addLog('Testing network connection...');
      const startTime = Date.now();
      
      const response = await fetch('https://httpbin.org/delay/0', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, connection: 'success' }));
        addLog(`Network test successful - Latency: ${latency}ms`);
      } else {
        throw new Error('Network test failed');
      }
      
    } catch (error) {
      setTestResults(prev => ({ ...prev, connection: 'error' }));
      addLog(`Network test failed: ${error.message}`, 'error');
    }
  };
  
  // Toggle video mute
  const toggleVideoMute = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoMuted;
        setIsVideoMuted(!isVideoMuted);
        addLog(`Video ${isVideoMuted ? 'unmuted' : 'muted'}`);
      }
    }
  };
  
  // Toggle audio mute
  const toggleAudioMute = () => {
    if (audioStream) {
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
        setIsAudioMuted(!isAudioMuted);
        addLog(`Audio ${isAudioMuted ? 'unmuted' : 'muted'}`);
      }
    }
  };

  // Handle start stream
  const handleStartStream = async () => {
    setIsStarting(true);
    addLog('Starting stream with preview settings...');
    
    try {
      // Prepare stream data to pass back to parent
      const streamData = {
        videoStream,
        audioStream,
        selectedDevices,
        videoQuality,
        audioQuality,
        settings: { isVideoMuted, isAudioMuted },
        config: streamConfig
      };
      
      // Call parent's start stream function
      await onStartStream(streamData);
      
      // Close modal after successful start
      onClose();
      
    } catch (error) {
      addLog(`Error starting stream: ${error.message}`, 'error');
      setErrors(prev => ({ ...prev, stream: error.message }));
    } finally {
      setIsStarting(false);
    }
  };
  
  // Initialize component when modal opens
  useEffect(() => {
    if (isOpen) {
      checkPermissions();
      getDevices();
    } else {
      // Clean up when modal closes
      stopStreams();
      setLogs([]);
      setErrors({});
      setTestResults({ camera: null, microphone: null, connection: null });
    }
    
    return () => {
      stopStreams();
    };
  }, [isOpen]);
  
  // Update stream when devices change
  useEffect(() => {
    if (isPreviewActive && (selectedDevices.camera || selectedDevices.microphone)) {
      stopStreams();
      setTimeout(() => {
        requestUserMedia();
      }, 100);
    }
  }, [selectedDevices.camera, selectedDevices.microphone, videoQuality, audioQuality]);
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'denied': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'denied': return '🚫';
      default: return '⏳';
    }
  };
  
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="bg-gray-900 text-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold">Stream Preview & Setup</h2>
              <p className="text-gray-400 mt-1">Test your camera, microphone, and stream settings before going live</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Preview */}
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {!isPreviewActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <p className="text-gray-400">Camera preview will appear here</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video controls overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={toggleVideoMute}
                        className={`p-2 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition`}
                        title={isVideoMuted ? 'Unmute Video' : 'Mute Video'}
                      >
                        {isVideoMuted ? '🚫' : '📹'}
                      </button>
                      <button
                        onClick={toggleAudioMute}
                        className={`p-2 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition`}
                        title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {isAudioMuted ? '🔇' : '🎤'}
                      </button>
                    </div>
                    
                    {/* Audio Level Indicator */}
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                      <span className="text-xs">🎵</span>
                      <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stream Quality Settings */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Quality Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Video Quality</label>
                      <select
                        value={videoQuality}
                        onChange={(e) => setVideoQuality(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.keys(videoQualityPresets).map(quality => (
                          <option key={quality} value={quality}>
                            {quality} ({videoQualityPresets[quality].width}x{videoQualityPresets[quality].height})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Audio Quality</label>
                      <select
                        value={audioQuality}
                        onChange={(e) => setAudioQuality(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.keys(audioQualityPresets).map(quality => (
                          <option key={quality} value={quality}>
                            {quality.charAt(0).toUpperCase() + quality.slice(1)} ({audioQualityPresets[quality].sampleRate}Hz)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Device Settings & Tests */}
              <div className="space-y-4">
                {/* Device Selection */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Device Selection</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Camera</label>
                      <select
                        value={selectedDevices.camera || ''}
                        onChange={(e) => setSelectedDevices(prev => ({ ...prev, camera: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Camera</option>
                        {devices.cameras.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Microphone</label>
                      <select
                        value={selectedDevices.microphone || ''}
                        onChange={(e) => setSelectedDevices(prev => ({ ...prev, microphone: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Microphone</option>
                        {devices.microphones.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* System Tests */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">System Tests</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Camera Test</span>
                      <span className={`text-sm ${getStatusColor(testResults.camera)}`}>
                        {getStatusIcon(testResults.camera)} {testResults.camera || 'Not tested'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Microphone Test</span>
                      <span className={`text-sm ${getStatusColor(testResults.microphone)}`}>
                        {getStatusIcon(testResults.microphone)} {testResults.microphone || 'Not tested'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network Test</span>
                      <span className={`text-sm ${getStatusColor(testResults.connection)}`}>
                        {getStatusIcon(testResults.connection)} {testResults.connection || 'Not tested'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={testAudioPlayback}
                      disabled={isTestingAudio}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md text-sm font-medium transition"
                    >
                      {isTestingAudio ? 'Testing...' : 'Test Audio'}
                    </button>
                    <button
                      onClick={testConnection}
                      className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition"
                    >
                      Test Network
                    </button>
                  </div>
                </div>
                
                {/* Permissions Status */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Permissions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Camera Access</span>
                      <span className={`text-sm ${
                        permissions.camera === 'granted' ? 'text-green-500' : 
                        permissions.camera === 'denied' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {permissions.camera === 'granted' ? '✅ Granted' : 
                         permissions.camera === 'denied' ? '❌ Denied' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Microphone Access</span>
                      <span className={`text-sm ${
                        permissions.microphone === 'granted' ? 'text-green-500' : 
                        permissions.microphone === 'denied' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {permissions.microphone === 'granted' ? '✅ Granted' : 
                         permissions.microphone === 'denied' ? '❌ Denied' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Error Display */}
                {Object.keys(errors).length > 0 && (
                  <div className="bg-red-900 border border-red-700 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-red-300">Errors</h3>
                    <div className="space-y-1">
                      {Object.entries(errors).map(([key, error]) => error && (
                        <p key={key} className="text-sm text-red-300">
                          {key}: {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-center space-x-4">
              <button
                onClick={isPreviewActive ? stopStreams : requestUserMedia}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  isPreviewActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPreviewActive ? 'Stop Preview' : 'Start Preview'}
              </button>
              
              <button
                onClick={handleStartStream}
                disabled={!isPreviewActive || isStarting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
              >
                {isStarting ? 'Starting Stream...' : 'Start Stream'}
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
            
            {/* Logs (Collapsible) */}
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-gray-300 hover:text-white">
                View Logs ({logs.length})
              </summary>
              <div className="mt-2 max-h-32 overflow-y-auto bg-gray-800 p-3 rounded-lg">
                {logs.map(log => (
                  <div key={log.id} className={`text-xs mb-1 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  );
};

export default StreamPreviewModal;