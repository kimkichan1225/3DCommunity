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
    this.onConnectCallbacks = []; // 연결 성공 리스너
    this.roomSubscriptions = new Map(); // Track room subscriptions
  }

  connect(userId, username, isObserver = false) {
    // 이미 연결되어 있으면 재연결하지 않음
    if (this.connected && this.client && this.client.active) {
      // observer에서 player로 전환되는 경우는 재연결 필요
      if (this.isObserver && !isObserver) {
        console.log('🔄 Switching from observer to player, reconnecting...');
        this.disconnect();
      } else {
        console.log('⚠️ Already connected, skipping reconnect');
        return;
      }
    }

    // 기존 연결이 있으면 먼저 정리
    if (this.client) {
      this.disconnect();
    }

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
      debug: () => { }, // Empty function to disable debug logging
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
          this.onChatMessageCallbacks.forEach(cb => cb?.(data));
        });

        // Subscribe to friend updates (친구 요청, 수락 등)
        this.client.subscribe('/topic/friend-updates/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          this.onFriendUpdateCallbacks.forEach(cb => cb?.(data));
        });

        // Subscribe to DM messages
        this.client.subscribe('/topic/dm/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          this.onDMMessageCallbacks.forEach(cb => cb?.(data));
        });

        // Send join message only if not in observer mode
        if (!this.isObserver) {
          this.sendPlayerJoin();
        }

        // Notify connection listeners
        this.onConnectCallbacks.forEach(cb => cb?.(true));
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

  // --- Messenger Methods ---

  // --- Messenger Methods ---

  subscribeToRoom(roomId, callback) {
    if (!this.connected || !this.client) {
      console.warn(`[MultiplayerService] subscribeToRoom failed: Not connected. (roomId: ${roomId})`);
      return null;
    }

    const roomIdStr = String(roomId); // Force string
    const destination = `/topic/chat/room/${roomIdStr}`;
    console.log(`[MultiplayerService] Subscribing to: ${destination}`);

    // Unsubscribe if already subscribed to this room
    if (this.roomSubscriptions.has(roomIdStr)) {
      console.log(`[MultiplayerService] Already subscribed to ${roomIdStr}, resubscribing...`);
      this.roomSubscriptions.get(roomIdStr).unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message) => {
      console.log(`[MultiplayerService] Message received on ${destination}:`, message.body);
      const data = JSON.parse(message.body);
      callback(data);
    });

    this.roomSubscriptions.set(roomIdStr, subscription);
    return subscription;
  }

  unsubscribeFromRoom(roomId) {
    const roomIdStr = String(roomId);
    const subscription = this.roomSubscriptions.get(roomIdStr);
    if (subscription) {
      console.log(`[MultiplayerService] Unsubscribing from: /topic/chat/room/${roomIdStr}`);
      subscription.unsubscribe();
      this.roomSubscriptions.delete(roomIdStr);
    }
  }

  sendRoomMessage(roomId, content) {
    console.log(`[MultiplayerService] sendRoomMessage attempt - Connected: ${this.connected}, Client: ${!!this.client}, RoomId: ${roomId}, UserId: ${this.userId}`);

    if (this.connected && this.client) {
      // userId가 없으면 전송하지 않음 (안전장치)
      if (!this.userId) {
        console.error('[MultiplayerService] Cannot send message: User ID is missing.');
        return false;
      }

      try {
        const payload = {
          roomId: roomId,
          userId: this.userId,
          content: content
        };
        console.log('[MultiplayerService] Publishing to /app/chat.send with payload:', payload);

        this.client.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(payload)
        });
        console.log('[MultiplayerService] WebSocket publish success');
        return true;
      } catch (e) {
        console.error('[MultiplayerService] WebSocket publish failed:', e);
        return false;
      }
    }
    console.warn('[MultiplayerService] WebSocket not connected, falling back to REST');
    return false;
  }

  sendTypingIndicator(roomId, isTyping) {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          roomId,
          userId: this.userId,
          isTyping
        })
      });
    }
  }

  subscribeToUserUpdates(userId, callback) {
    if (!this.connected || !this.client) return null;
    return this.client.subscribe(`/topic/user/${userId}/updates`, (message) => {
      callback(JSON.parse(message.body));
    });
  }

  // --- End Messenger Methods ---

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

  onConnect(callback) {
    if (callback) {
      this.onConnectCallbacks.push(callback);
      // 이미 연결된 상태면 즉시 호출
      if (this.connected) {
        callback(true);
      }
      return () => {
        this.onConnectCallbacks = this.onConnectCallbacks.filter(cb => cb !== callback);
      };
    }
  }
}

export default new MultiplayerService();
