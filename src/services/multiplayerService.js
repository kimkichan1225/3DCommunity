import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class MultiplayerService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.userId = null;
    this.username = null;
    this.isObserver = false; // Observer mode (view-only, no join broadcast)

    // Callbacks (배열로 변경하여 여러 리스너 지원)
    this.onPlayerJoinCallbacks = [];
    this.onPlayerLeaveCallbacks = [];
    this.onPositionUpdateCallbacks = [];
    this.onChatMessageCallbacks = [];
    this.onDuplicateLoginCallbacks = [];
    this.onOnlineCountUpdateCallbacks = [];
    this.onFriendUpdateCallbacks = [];
    this.onDMMessageCallbacks = [];
  }

  connect(userId, username, isObserver = false) {
    this.userId = userId;
    this.username = username;
    this.isObserver = isObserver;

    const wsUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';
    const socket = new SockJS(`${wsUrl}/ws`);

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
            this.onPlayerJoinCallbacks.forEach(cb => cb?.(data));
          } else if (data.action === 'leave') {
            // Always handle leave events (observer will see all, player will filter in App.js)
            this.onPlayerLeaveCallbacks.forEach(cb => cb?.(data));
          }
        });

        // Subscribe to online count updates
        this.client.subscribe('/topic/online-count', (message) => {
          const count = parseInt(message.body);
          this.onOnlineCountUpdateCallbacks.forEach(cb => cb?.(count));
        });

        // Subscribe to position updates
        this.client.subscribe('/topic/positions', (message) => {
          const data = JSON.parse(message.body);

          // In observer mode, show all position updates; in player mode, ignore own
          if (this.isObserver || String(data.userId) !== String(this.userId)) {
            this.onPositionUpdateCallbacks.forEach(cb => cb?.(data));
          }
        });

        // Subscribe to chat messages
        this.client.subscribe('/topic/chat', (message) => {
          const data = JSON.parse(message.body);
          console.log('Chat message:', data);
          this.onChatMessageCallbacks.forEach(cb => cb?.(data));
        });

        // Subscribe to friend updates (친구 요청, 수락 등)
        this.client.subscribe('/topic/friend-updates/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          console.log('Friend update:', data);
          this.onFriendUpdateCallbacks.forEach(cb => cb?.(data));
        });

        // Subscribe to DM messages
        this.client.subscribe('/topic/dm/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          console.log('DM message received:', data);
          this.onDMMessageCallbacks.forEach(cb => cb?.(data));
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

  sendPositionUpdate(position, rotationY, animation, modelPath, isChangingAvatar = false) {
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
          animation: animation,
          modelPath: modelPath,
          isChangingAvatar: isChangingAvatar
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

  // 플레이어 정보 업데이트 (닉네임 변경 등)
  updatePlayerInfo({ username }) {
    if (username) {
      this.username = username;
      console.log('✅ MultiplayerService username updated:', username);
    }
  }

  isConnected() {
    return this.connected;
  }

  // Callback setters (여러 리스너 지원)
  onPlayerJoin(callback) {
    if (callback) {
      this.onPlayerJoinCallbacks.push(callback);
      return () => {
        this.onPlayerJoinCallbacks = this.onPlayerJoinCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onPlayerLeave(callback) {
    if (callback) {
      this.onPlayerLeaveCallbacks.push(callback);
      return () => {
        this.onPlayerLeaveCallbacks = this.onPlayerLeaveCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onPositionUpdate(callback) {
    if (callback) {
      this.onPositionUpdateCallbacks.push(callback);
      return () => {
        this.onPositionUpdateCallbacks = this.onPositionUpdateCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onChatMessage(callback) {
    if (callback) {
      this.onChatMessageCallbacks.push(callback);
      return () => {
        this.onChatMessageCallbacks = this.onChatMessageCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onDuplicateLogin(callback) {
    if (callback) {
      this.onDuplicateLoginCallbacks.push(callback);
      return () => {
        this.onDuplicateLoginCallbacks = this.onDuplicateLoginCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onOnlineCountUpdate(callback) {
    if (callback) {
      this.onOnlineCountUpdateCallbacks.push(callback);
      return () => {
        this.onOnlineCountUpdateCallbacks = this.onOnlineCountUpdateCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onFriendUpdate(callback) {
    if (callback) {
      this.onFriendUpdateCallbacks.push(callback);
      return () => {
        this.onFriendUpdateCallbacks = this.onFriendUpdateCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  onDMMessage(callback) {
    if (callback) {
      this.onDMMessageCallbacks.push(callback);
      return () => {
        this.onDMMessageCallbacks = this.onDMMessageCallbacks.filter(cb => cb !== callback);
      };
    }
  }
}

export default new MultiplayerService();
