import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class MultiplayerService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.userId = null;
    this.username = null;

    // Callbacks
    this.onPlayerJoinCallback = null;
    this.onPlayerLeaveCallback = null;
    this.onPositionUpdateCallback = null;
    this.onChatMessageCallback = null;
  }

  connect(userId, username) {
    this.userId = userId;
    this.username = username;

    const socket = new SockJS('http://localhost:8080/ws');

    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {}, // Empty function to disable debug logging
      onConnect: () => {
        console.log('✅ WebSocket Connected');
        this.connected = true;

        // Subscribe to player join/leave events
        this.client.subscribe('/topic/players', (message) => {
          const data = JSON.parse(message.body);
          console.log('Player event:', data);

          // Compare as strings to handle type differences
          if (data.action === 'join' && String(data.userId) !== String(this.userId)) {
            this.onPlayerJoinCallback?.(data);
          } else if (data.action === 'leave' && String(data.userId) !== String(this.userId)) {
            this.onPlayerLeaveCallback?.(data);
          }
        });

        // Subscribe to position updates
        this.client.subscribe('/topic/positions', (message) => {
          const data = JSON.parse(message.body);

          // Ignore own position updates (compare as strings)
          if (String(data.userId) !== String(this.userId)) {
            this.onPositionUpdateCallback?.(data);
          }
        });

        // Subscribe to chat messages
        this.client.subscribe('/topic/chat', (message) => {
          const data = JSON.parse(message.body);
          console.log('Chat message:', data);
          this.onChatMessageCallback?.(data);
        });

        // Send join message
        this.sendPlayerJoin();
      },
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame.headers['message']);
        console.error('Details:', frame.body);
      },
      onWebSocketClose: () => {
        console.log('⚠️ WebSocket Closed');
        this.connected = false;
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  sendPlayerJoin() {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/player.join',
        body: JSON.stringify({
          userId: this.userId,
          username: this.username
        })
      });
    }
  }

  sendPositionUpdate(position, rotationY, animation) {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/player.position',
        body: JSON.stringify({
          userId: this.userId,
          username: this.username,
          x: position[0],
          y: position[1],
          z: position[2],
          rotationY: rotationY,
          animation: animation
        })
      });
    }
  }

  sendChatMessage(message) {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.message',
        body: JSON.stringify({
          userId: this.userId,
          username: this.username,
          message: message
        })
      });
    }
  }

  // Callback setters
  onPlayerJoin(callback) {
    this.onPlayerJoinCallback = callback;
  }

  onPlayerLeave(callback) {
    this.onPlayerLeaveCallback = callback;
  }

  onPositionUpdate(callback) {
    this.onPositionUpdateCallback = callback;
  }

  onChatMessage(callback) {
    this.onChatMessageCallback = callback;
  }
}

export default new MultiplayerService();
