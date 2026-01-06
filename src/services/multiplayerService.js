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
    this.onRoomUpdateCallbacks = []; // 방 생성/삭제 콜백 추가
    this.onRoomChatCallbacks = []; // 개인 룸 채팅 콜백
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

            // Subscribe to room updates (방 생성/삭제)
        this.client.subscribe('/topic/rooms', (message) => {
          const data = JSON.parse(message.body);
          console.log('🏠 Room update:', data);
          this.onRoomUpdateCallbacks.forEach(cb => cb?.(data));
        });

        // room chat subscriptions map initialization
        if (!this.roomChatSubscriptions) this.roomChatSubscriptions = new Map();

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

  sendPositionUpdate(position, rotationY, animation, modelPath, isChangingAvatar = false, currentRoomId = null) {
    // 연결 상태 확인 - connected만 체크 (client.connected는 일시적으로 false일 수 있음)
    if (!this.connected || !this.client) {
      // console.warn('Not connected - skipping position update');
      return;
    }
    
    try {
      // client.active 체크 (STOMP 클라이언트가 활성화되어 있는지)
      if (!this.client.active) {
        // console.warn('STOMP client not active - skipping position update');
        return;
      }
      
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
          isChangingAvatar: isChangingAvatar,
          currentRoomId: currentRoomId
        })
      });
    } catch (error) {
      // 에러 발생 시 로그만 출력 (재연결 시 자동 복구)
      if (error.message && !error.message.includes('Cannot read')) {
        console.warn('Failed to send position update:', error.message);
      }
      // 연결 상태는 유지 (일시적인 오류일 수 있음)
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

  onRoomUpdate(callback) {
    if (callback) {
      this.onRoomUpdateCallbacks.push(callback);
      return () => {
        this.onRoomUpdateCallbacks = this.onRoomUpdateCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  // 개인 룸 채팅 리스너 등록
  onRoomChat(callback) {
    if (callback) {
      this.onRoomChatCallbacks.push(callback);
      return () => {
        this.onRoomChatCallbacks = this.onRoomChatCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  // 특정 방의 채팅 토픽 구독
  subscribeRoomChat(roomId) {
    if (!roomId) return;
    if (!this.client || !this.client.active) {
      console.warn('STOMP client not active - cannot subscribe to room chat yet');
      return;
    }

    if (!this.roomChatSubscriptions) this.roomChatSubscriptions = new Map();
    if (this.roomChatSubscriptions.has(roomId)) return; // already subscribed

    const sub = this.client.subscribe(`/topic/room/${roomId}/chat`, (message) => {
      try {
        const data = JSON.parse(message.body);
        this.onRoomChatCallbacks.forEach(cb => cb?.(data));
      } catch (e) {
        console.error('Failed to parse room chat message:', e);
      }
    });

    this.roomChatSubscriptions.set(roomId, sub);
    console.log('Subscribed to room chat:', roomId);
  }

  unsubscribeRoomChat(roomId) {
    if (!roomId || !this.roomChatSubscriptions) return;
    const sub = this.roomChatSubscriptions.get(roomId);
    if (sub) {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.warn('Failed to unsubscribe from room chat:', e);
      }
      this.roomChatSubscriptions.delete(roomId);
      console.log('Unsubscribed from room chat:', roomId);
    }
  }

  // 방 생성 브로드캐스트
  sendRoomCreate(roomData) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket 연결되지 않음 - 방 생성 브로드캐스트 불가');
      return;
    }
    
    try {
      if (!this.client.active) {
        console.warn('STOMP client not active - 방 생성 브로드캐스트 불가');
        return;
      }
      
      this.client.publish({
        destination: '/app/room.create',
        body: JSON.stringify(roomData)
      });
      console.log('📢 방 생성 브로드캐스트 전송 성공:', roomData.roomName);
    } catch (error) {
      console.error('방 생성 브로드캐스트 실패:', error.message);
    }
  }

  // 방 삭제 브로드캐스트
  sendRoomDelete(roomId) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket 연결되지 않음 - 방 삭제 브로드캐스트 불가');
      return;
    }
    
    try {
      if (!this.client.active) {
        console.warn('STOMP client not active - 방 삭제 브로드캐스트 불가');
        return;
      }
      
      this.client.publish({
        destination: '/app/room.delete',
        body: JSON.stringify({ roomId })
      });
      console.log('📢 방 삭제 브로드캐스트 전송 성공:', roomId);
    } catch (error) {
      console.error('방 삭제 브로드캐스트 실패:', error.message);
    }
  }

  // 개인 룸 채팅 전송
  sendRoomChat(roomId, message) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket 연결되지 않음 - 방 채팅 전송 불가');
      return;
    }

    try {
      if (!this.client.active) {
        console.warn('STOMP client not active - 방 채팅 전송 불가');
        return;
      }

      this.client.publish({
        destination: '/app/room.chat',
        body: JSON.stringify({ roomId, userId: this.userId, username: this.username, message })
      });
      console.log('📩 방 채팅 전송:', { roomId, message });
    } catch (error) {
      console.error('방 채팅 전송 실패:', error.message);
    }
  }
}

export default new MultiplayerService();
