/**
 * @fileoverview Co-host manager for handling invitations, approvals, and stream coordination
 * @modular Isolated co-host management module with no direct dependencies on core files
 * @errorhandling Includes comprehensive error handling and timeout mechanisms
 * @boundaries Maintains strict boundaries between host and co-host communication
 */

/**
 * Co-host Manager - Client-side implementation for handling co-host invitations and coordination
 * This operates as an isolated module with no direct modifications to the core code.
 */
class CohostManager {
  /**
   * Creates a new CohostManager instance
   * @param {Object} options Configuration options
   * @param {Object} options.socket The socket.io connection
   * @param {string} options.streamId The current stream ID
   * @param {string} options.sellerId The current seller/broadcaster ID
   * @param {Function} options.onStatusChange Callback for status changes
   * @param {Function} options.onError Callback for errors
   * @param {Object} options.mediasoup MediaSoup client object
   */
  constructor(options) {
    // Core references (provided externally)
    this.socket = options.socket;
    this.streamId = options.streamId;
    this.sellerId = options.sellerId;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onError = options.onError || ((err) => console.error(err));
    this.mediasoup = options.mediasoup;
    
    // Co-host state management
    this.isHost = false;
    this.isCohost = false;
    this.activeInvites = new Map(); // Map of pendingUserId -> {timestamp, timeout}
    this.cohosts = new Map(); // Map of cohostId -> {sellerId, status, videoProducerId, audioProducerId}
    this.inviteTimeoutMs = 30000; // 30 seconds for invite timeout
    this.maxCohosts = 2; // Maximum number of co-hosts allowed
    
    // Transport references
    this.device = null;
    this.producerTransport = null;
    this.videoProducer = null;
    this.audioProducer = null;
    this.localStream = null;
    
    // Bind socket event listeners
    this._bindEvents();
  }
  
  /**
   * Initialize as the stream host
   * @returns {Promise<boolean>} True if successfully initialized as host
   */
  async initAsHost() {
    try {
      this.isHost = true;
      this.onStatusChange({ role: 'host', status: 'active' });
      return true;
    } catch (err) {
      this.onError(err);
      return false;
    }
  }
  
  /**
   * Bind all necessary socket events for co-host coordination
   * @private
   */
  _bindEvents() {
    // Handle co-host invite requests (as host)
    this.socket.on('cohost:requestInvite', async (data, callback) => {
      if (!this.isHost) return;
      
      const { sellerId, socketId } = data;
      
      // Check if we've reached the maximum number of co-hosts
      if (this.cohosts.size >= this.maxCohosts) {
        callback({ success: false, reason: 'maxCohost' });
        return;
      }
      
      // Create an invitation with timeout
      const inviteId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const timeout = setTimeout(() => {
        this._handleInviteTimeout(inviteId, socketId);
      }, this.inviteTimeoutMs);
      
      this.activeInvites.set(socketId, { 
        inviteId, 
        sellerId, 
        timestamp: Date.now(), 
        timeout 
      });
      
      callback({ 
        success: true, 
        inviteId, 
        timeoutMs: this.inviteTimeoutMs 
      });
      
      // Trigger UI update
      this.onStatusChange({ 
        type: 'inviteSent', 
        sellerId, 
        socketId, 
        inviteId 
      });
    });
    
    // Handle co-host invite responses (as host)
    this.socket.on('cohost:inviteResponse', async (data) => {
      const { inviteId, accepted, socketId } = data;
      
      // Check if this invite exists
      const invite = Array.from(this.activeInvites.values())
        .find(inv => inv.inviteId === inviteId);
      
      if (!invite) return;
      
      // Clear timeout for this invite
      clearTimeout(invite.timeout);
      this.activeInvites.delete(socketId);
      
      if (accepted) {
        // Add to co-hosts list with pending status
        this.cohosts.set(socketId, {
          sellerId: invite.sellerId,
          status: 'connecting',
          joined: Date.now()
        });
        
        // Notify UI
        this.onStatusChange({ 
          type: 'cohostConnecting', 
          sellerId: invite.sellerId, 
          socketId 
        });
      } else {
        // Notify UI that invite was declined
        this.onStatusChange({ 
          type: 'inviteDeclined', 
          sellerId: invite.sellerId, 
          socketId 
        });
      }
    });
    
    // Handle co-host connected event (as host)
    this.socket.on('cohost:connected', (data) => {
      const { socketId, videoProducerId, audioProducerId } = data;
      
      if (this.cohosts.has(socketId)) {
        const cohostData = this.cohosts.get(socketId);
        cohostData.status = 'active';
        cohostData.videoProducerId = videoProducerId;
        cohostData.audioProducerId = audioProducerId;
        
        // Notify UI
        this.onStatusChange({ 
          type: 'cohostActive', 
          sellerId: cohostData.sellerId, 
          socketId,
          videoProducerId,
          audioProducerId
        });
      }
    });
    
    // Handle co-host disconnection (as host)
    this.socket.on('cohost:disconnected', (data) => {
      const { socketId } = data;
      
      if (this.cohosts.has(socketId)) {
        const cohostData = this.cohosts.get(socketId);
        
        // Remove from co-hosts list
        this.cohosts.delete(socketId);
        
        // Notify UI
        this.onStatusChange({ 
          type: 'cohostDisconnected', 
          sellerId: cohostData.sellerId, 
          socketId 
        });
      }
    });
    
    // Handle invite received (as potential co-host)
    this.socket.on('cohost:inviteReceived', (data, callback) => {
      const { inviteId, hostSellerId, timeoutMs } = data;
      
      // Notify UI about invite
      this.onStatusChange({ 
        type: 'inviteReceived', 
        hostSellerId, 
        inviteId,
        timeoutMs,
        respond: (accepted) => {
          this._respondToInvite(inviteId, accepted);
          callback({ received: true });
        }
      });
    });
    
    // Handle accepted as co-host (as co-host)
    this.socket.on('cohost:accepted', async (data) => {
      const { roomId, hostSellerId } = data;
      
      this.isCohost = true;
      
      // Notify UI
      this.onStatusChange({ 
        role: 'cohost', 
        status: 'connecting',
        hostSellerId 
      });
      
      // Connect as co-host
      await this._connectAsCohost(roomId);
    });
  }
  
  /**
   * Handle an invite timing out
   * @param {string} inviteId The ID of the invitation that timed out
   * @param {string} socketId The socket ID of the invited user
   * @private
   */
  _handleInviteTimeout(inviteId, socketId) {
    if (this.activeInvites.has(socketId)) {
      const invite = this.activeInvites.get(socketId);
      
      // Remove the invite
      this.activeInvites.delete(socketId);
      
      // Notify the socket that the invite expired
      this.socket.emit('cohost:inviteExpired', { 
        inviteId, 
        socketId 
      });
      
      // Notify UI
      this.onStatusChange({ 
        type: 'inviteExpired', 
        sellerId: invite.sellerId, 
        socketId 
      });
    }
  }
  
  /**
   * Respond to a co-host invitation
   * @param {string} inviteId The ID of the invitation
   * @param {boolean} accepted Whether the invitation was accepted
   * @private
   */
  _respondToInvite(inviteId, accepted) {
    this.socket.emit('cohost:inviteResponse', {
      inviteId,
      accepted,
      socketId: this.socket.id
    });
  }
  
  /**
   * Connect to the stream as a co-host
   * @param {string} roomId The room ID to connect to
   * @private
   */
  async _connectAsCohost(roomId) {
    try {
      // Get router capabilities
      const routerRtpCapabilities = await new Promise((resolve, reject) => {
        this.socket.emit('getRouterRtpCapabilities', { roomId }, (data) => {
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data);
          }
        });
      });
      
      // Load mediasoup device
      this.device = new this.mediasoup.Device();
      await this.device.load({ routerRtpCapabilities });
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      // Create producer transport with simulcast support
      await this._createProducerTransport(roomId);
      
      // Update UI
      this.onStatusChange({ 
        role: 'cohost', 
        status: 'active'
      });
      
      return true;
    } catch (err) {
      this.onError(err);
      
      // Disconnect as co-host
      this._disconnectAsCohost();
      
      // Update UI
      this.onStatusChange({ 
        role: 'viewer', 
        status: 'error',
        error: err.message
      });
      
      return false;
    }
  }
  
  /**
   * Create a producer transport with simulcast support
   * @param {string} roomId The room ID
   * @private
   */
  async _createProducerTransport(roomId) {
    // Request the server to create a producer transport
    const transportOptions = await new Promise((resolve, reject) => {
      this.socket.emit('createProducerTransport', { roomId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
    
    // Create the transport on client side
    this.producerTransport = this.device.createSendTransport(transportOptions);
    
    // Handle transport events
    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await new Promise((resolve, reject) => {
          this.socket.emit('connectProducerTransport', { dtlsParameters, roomId }, (response) => {
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
    
    this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = await new Promise((resolve, reject) => {
          this.socket.emit('produce', { kind, rtpParameters, roomId }, (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });
        
        callback({ id });
      } catch (error) {
        errback(error);
      }
    });
    
    // Add connection state change monitoring
    this.producerTransport.on('connectionstatechange', (state) => {
      if (state === 'connected') {
        // Successfully connected
        this.onStatusChange({ 
          type: 'transport', 
          state: 'connected' 
        });
      } else if (state === 'failed' || state === 'closed') {
        // Connection failed
        this._disconnectAsCohost();
        
        this.onStatusChange({ 
          type: 'transport', 
          state: 'failed' 
        });
      }
    });
    
    // Produce audio with standard parameters
    this.audioProducer = await this.producerTransport.produce({
      track: this.localStream.getAudioTracks()[0],
      codecOptions: {
        opusStereo: true,
        opusDtx: true,
      },
    });
    
    // Produce video with simulcast parameters
    this.videoProducer = await this.producerTransport.produce({
      track: this.localStream.getVideoTracks()[0],
      encodings: [
        { scaleResolutionDownBy: 4, maxBitrate: 500000 },
        { scaleResolutionDownBy: 2, maxBitrate: 1000000 },
        { scaleResolutionDownBy: 1, maxBitrate: 2500000 }
      ],
      codecOptions: {
        videoGoogleStartBitrate: 1000,
      },
    });
    
    // Notify server that we're connected as co-host
    this.socket.emit('cohost:connected', {
      roomId,
      socketId: this.socket.id,
      sellerId: this.sellerId,
      videoProducerId: this.videoProducer.id,
      audioProducerId: this.audioProducer.id
    });
  }
  
  /**
   * Disconnect as a co-host
   * @private
   */
  _disconnectAsCohost() {
    // Close producers
    if (this.videoProducer) {
      this.videoProducer.close();
      this.videoProducer = null;
    }
    
    if (this.audioProducer) {
      this.audioProducer.close();
      this.audioProducer = null;
    }
    
    // Close transport
    if (this.producerTransport) {
      this.producerTransport.close();
      this.producerTransport = null;
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.isCohost = false;
    
    // Notify server
    if (this.socket && this.socket.connected) {
      this.socket.emit('cohost:disconnected', {
        socketId: this.socket.id,
        streamId: this.streamId
      });
    }
  }
  
  /**
   * Send an invitation to become a co-host
   * @param {string} targetSellerId The seller ID to invite
   * @returns {Promise<Object>} Response object with success status
   */
  async inviteCohost(targetSellerId) {
    if (!this.isHost) {
      throw new Error('Only the host can send co-host invitations');
    }
    
    if (this.cohosts.size >= this.maxCohosts) {
      throw new Error(`Maximum of ${this.maxCohosts} co-hosts already reached`);
    }
    
    return new Promise((resolve, reject) => {
      this.socket.emit('cohost:sendInvite', {
        targetSellerId,
        hostSellerId: this.sellerId,
        streamId: this.streamId,
        timeoutMs: this.inviteTimeoutMs
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  /**
   * Remove a co-host from the stream
   * @param {string} cohostSocketId The socket ID of the co-host to remove
   * @returns {Promise<Object>} Response object with success status
   */
  async removeCohost(cohostSocketId) {
    if (!this.isHost) {
      throw new Error('Only the host can remove co-hosts');
    }
    
    if (!this.cohosts.has(cohostSocketId)) {
      throw new Error('Co-host not found');
    }
    
    return new Promise((resolve, reject) => {
      this.socket.emit('cohost:remove', {
        cohostSocketId,
        streamId: this.streamId
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          // Remove from local tracking
          this.cohosts.delete(cohostSocketId);
          
          // Notify UI
          this.onStatusChange({ 
            type: 'cohostRemoved', 
            socketId: cohostSocketId 
          });
          
          resolve(response);
        }
      });
    });
  }
  
  /**
   * Leave the stream as a co-host
   * @returns {Promise<boolean>} True if successfully left
   */
  async leaveAsCohost() {
    if (!this.isCohost) {
      return false;
    }
    
    this._disconnectAsCohost();
    
    // Update UI
    this.onStatusChange({ 
      role: 'viewer', 
      status: 'active' 
    });
    
    return true;
  }
  
  /**
   * Clean up resources when done with the manager
   */
  dispose() {
    // Clear all timeouts
    for (const invite of this.activeInvites.values()) {
      clearTimeout(invite.timeout);
    }
    
    // Disconnect as co-host if needed
    if (this.isCohost) {
      this._disconnectAsCohost();
    }
    
    // Clear maps
    this.activeInvites.clear();
    this.cohosts.clear();
    
    // Remove socket listeners
    this.socket.off('cohost:requestInvite');
    this.socket.off('cohost:inviteResponse');
    this.socket.off('cohost:connected');
    this.socket.off('cohost:disconnected');
    this.socket.off('cohost:inviteReceived');
    this.socket.off('cohost:accepted');
  }
}

// Export the CohostManager class
export default CohostManager;

/**
 * REGRESSION TESTS
 * 
 * Test cases:
 * 
 * 1. Host successfully invites a co-host
 *    - Check that activeInvites contains the invitation
 *    - Verify timeout is set
 *    - Simulate acceptance and verify cohosts map is updated
 * 
 * 2. Invitation timeout
 *    - Set up an invitation
 *    - Manually trigger timeout function
 *    - Verify invitation is removed and proper events are emitted
 * 
 * 3. Co-host connection
 *    - Simulate invitation acceptance
 *    - Mock all signaling responses
 *    - Verify transport creation and producer setup
 * 
 * 4. Maximum co-host limit
 *    - Add two co-hosts to the manager
 *    - Attempt to add a third and verify it fails
 * 
 * 5. Co-host removal
 *    - Add a co-host
 *    - Simulate removal
 *    - Verify co-host is removed from tracking
 * 
 * 6. Error handling for failed connections
 *    - Simulate transport connection failure
 *    - Verify proper clean-up and state changes
 */