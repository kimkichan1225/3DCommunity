import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class MinigameService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.userId = null;
    this.username = null;
    this.currentRoomId = null;

    // Callbacks
    this.onRoomsListCallback = null;
    this.onRoomUpdateCallback = null;
    this.onRoomJoinCallback = null;
    this.onRoomLeaveCallback = null;
    this.onRoomChatCallback = null;
    this.onRoomDeleteCallback = null;
    this.onGameInviteCallback = null; // 게임 초대 받음
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
      debug: () => {},
      onConnect: () => {
        console.log('✅ Minigame WebSocket Connected');
        this.connected = true;

        // 방 목록 업데이트 구독
        this.client.subscribe('/topic/minigame/rooms', (message) => {
          const data = JSON.parse(message.body);
          console.log('Room update:', data);

          if (data.action === 'create' || data.action === 'update' || data.action === 'join' || data.action === 'leave') {
            this.onRoomUpdateCallback?.(data);
          } else if (data.action === 'delete') {
            this.onRoomDeleteCallback?.(data);
          }
        });

        // 방 목록 전체 구독
        this.client.subscribe('/topic/minigame/rooms-list', (message) => {
          const data = JSON.parse(message.body);
          console.log('Rooms list:', data);
          this.onRoomsListCallback?.(data);
        });

        // 개인 게임 초대 구독
        this.client.subscribe('/topic/minigame/invite/' + this.userId, (message) => {
          const data = JSON.parse(message.body);
          console.log('Game invite received:', data);
          this.onGameInviteCallback?.(data);
        });

        // 초기 방 목록 요청
        this.requestRoomsList();
      },
      onStompError: (frame) => {
        console.error('❌ Minigame STOMP Error:', frame.headers['message']);
        console.error('Details:', frame.body);
      },
      onWebSocketClose: () => {
        console.log('⚠️ Minigame WebSocket Closed');
        this.connected = false;
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client && this.connected) {
      // 현재 방에 있다면 나가기
      if (this.currentRoomId) {
        this.leaveRoom(this.currentRoomId);
      }
      this.client.deactivate();
      this.connected = false;
      console.log('🔌 Minigame WebSocket Disconnected');
    }
  }

  /**
   * 방 목록 요청
   */
  requestRoomsList() {
    if (this.connected && this.client) {
      this.client.publish({
        destination: '/app/minigame.rooms.list'
      });
    }
  }

  /**
   * 방 생성
   */
  createRoom(roomName, gameName, maxPlayers, isLocked, hostLevel, selectedProfile, selectedOutline) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomName,
      gameName,
      hostId: this.userId,
      hostName: this.username,
      maxPlayers,
      isLocked,
      hostLevel: hostLevel || 1,
      selectedProfile: selectedProfile || null,
      selectedOutline: selectedOutline || null
    };

    this.client.publish({
      destination: '/app/minigame.room.create',
      body: JSON.stringify(payload)
    });

    console.log('방 생성 요청:', payload);
  }

  /**
   * 방 입장
   */
  joinRoom(roomId, level, selectedProfile, selectedOutline) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId,
      userId: this.userId,
      username: this.username,
      level,
      selectedProfile: selectedProfile || null,
      selectedOutline: selectedOutline || null
    };

    this.client.publish({
      destination: '/app/minigame.room.join',
      body: JSON.stringify(payload)
    });

    // 방 구독
    this.subscribeToRoom(roomId);
    this.currentRoomId = roomId;

    console.log('방 입장 요청:', payload);
  }

  /**
   * 방 구독
   */
  subscribeToRoom(roomId) {
    if (!this.connected || !this.client) {
      return;
    }

    // 방 업데이트 구독
    this.client.subscribe('/topic/minigame/room/' + roomId, (message) => {
      const data = JSON.parse(message.body);
      console.log('Room event:', data);
      this.onRoomJoinCallback?.(data);
    });

    // 방 채팅 구독
    this.client.subscribe('/topic/minigame/room/' + roomId + '/chat', (message) => {
      const data = JSON.parse(message.body);
      console.log('Room chat:', data);
      this.onRoomChatCallback?.(data);
    });
  }

  /**
   * 방 나가기
   */
  leaveRoom(roomId) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId,
      userId: this.userId
    };

    this.client.publish({
      destination: '/app/minigame.room.leave',
      body: JSON.stringify(payload)
    });

    this.currentRoomId = null;
    console.log('방 나가기 요청:', payload);
  }

  /**
   * 방 설정 변경
   */
  updateRoom(roomId, gameName, maxPlayers) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId,
      gameName,
      maxPlayers
    };

    this.client.publish({
      destination: '/app/minigame.room.update',
      body: JSON.stringify(payload)
    });

    console.log('방 설정 변경 요청:', payload);
  }

  /**
   * 준비 상태 토글
   */
  toggleReady(roomId) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId,
      userId: this.userId
    };

    this.client.publish({
      destination: '/app/minigame.room.ready',
      body: JSON.stringify(payload)
    });

    console.log('준비 상태 변경 요청:', payload);
  }

  /**
   * 게임 시작
   */
  startGame(roomId) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId
    };

    this.client.publish({
      destination: '/app/minigame.room.start',
      body: JSON.stringify(payload)
    });

    console.log('게임 시작 요청:', payload);
  }

  /**
   * 방 채팅 메시지 전송
   */
  sendRoomChat(roomId, message) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      roomId,
      userId: this.userId,
      username: this.username,
      message
    };

    this.client.publish({
      destination: '/app/minigame.room.chat',
      body: JSON.stringify(payload)
    });

    console.log('채팅 메시지 전송:', payload);
  }

  /**
   * 게임 초대 전송
   */
  sendGameInvite(targetUserId, targetUsername, roomId, gameName) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      inviterId: this.userId,
      inviterUsername: this.username,
      targetUserId,
      targetUsername,
      roomId,
      gameName
    };

    this.client.publish({
      destination: '/app/minigame.invite',
      body: JSON.stringify(payload)
    });

    console.log('게임 초대 전송:', payload);
  }

  /**
   * 콜백 등록
   */
  on(event, callback) {
    switch (event) {
      case 'roomsList':
        this.onRoomsListCallback = callback;
        break;
      case 'roomUpdate':
        this.onRoomUpdateCallback = callback;
        break;
      case 'roomJoin':
        this.onRoomJoinCallback = callback;
        break;
      case 'roomLeave':
        this.onRoomLeaveCallback = callback;
        break;
      case 'roomChat':
        this.onRoomChatCallback = callback;
        break;
      case 'roomDelete':
        this.onRoomDeleteCallback = callback;
        break;
      case 'gameInvite':
        this.onGameInviteCallback = callback;
        break;
      default:
        console.warn('Unknown event:', event);
    }
  }
}

const minigameService = new MinigameService();
export default minigameService;
