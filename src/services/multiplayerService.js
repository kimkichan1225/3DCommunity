import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class MultiplayerService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.userId = null;
    this.username = null;
    this.isObserver = false; // Observer mode (view-only, no join broadcast)

    // Callbacks
    this.onPlayerJoinCallback = null;
    this.onPlayerLeaveCallback = null;
    this.onPositionUpdateCallback = null;
    this.onChatMessageCallback = null;
    this.onDuplicateLoginCallback = null;
    this.onOnlineCountUpdateCallback = null;
    this.onFriendUpdateCallback = null;
    this.onDMMessageCallback = null;
  }

  connect(userId, username, isObserver = false) {
    this.userId = userId;
    this.username = username;
    this.isObserver = isObserver;

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

          // Handle all actions including 'duplicate'
          if (data.action === 'join' || data.action === 'duplicate') {
            this.onPlayerJoinCallback?.(data);
          } else if (data.action === 'leave') {
            // Always handle leave events (observer will see all, player will filter in App.js)
            this.onPlayerLeaveCallback?.(data);
          }
        });

        // Subscribe to online count updates
        this.client.subscribe('/topic/online-count', (message) => {
          const count = parseInt(message.body);
          this.onOnlineCountUpdateCallback?.(count);
        });

        // Subscribe to position updates
        this.client.subscribe('/topic/positions', (message) => {
          const data = JSON.parse(message.body);

          // In observer mode, show all position updates; in player mode, ignore own
          if (this.isObserver || String(data.userId) !== String(this.userId)) {
            this.onPositionUpdateCallback?.(data);
          }
        });

        // Subscribe to chat messages
        this.client.subscribe('/topic/chat', (message) => {
          const data = JSON.parse(message.body);
          console.log('Chat message:', data);
          this.onChatMessageCallback?.(data);
        });

        // Subscribe to friend updates (친구 요청, 수락 등)
        this.client.subscribe('/topic/friend-updates/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          console.log('Friend update:', data);
          this.onFriendUpdateCallback?.(data);
        });

        // Subscribe to DM messages
        this.client.subscribe('/topic/dm/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          console.log('DM message received:', data);
          this.onDMMessageCallback?.(data);
        });

        // Send join message only if not in observer mode
        if (!this.isObserver) {
          this.sendPlayerJoin();
        }
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

  onDuplicateLogin(callback) {
    this.onDuplicateLoginCallback = callback;
  }

  onOnlineCountUpdate(callback) {
    this.onOnlineCountUpdateCallback = callback;
  }

  onFriendUpdate(callback) {
    this.onFriendUpdateCallback = callback;
  }

  onDMMessage(callback) {
    this.onDMMessageCallback = callback;
  }
}

export default new MultiplayerService();
