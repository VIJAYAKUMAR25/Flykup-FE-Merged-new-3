// socket.js
import io from 'socket.io-client';
import { socketurl } from '../../../config.js'; 

const socket = io.connect(socketurl, {
  transports: ['websocket'], // Force WebSocket transport
  autoConnect: false, // Prevents automatic connection until explicitly called
});

export default socket;