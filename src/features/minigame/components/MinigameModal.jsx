import React, { useState, useEffect } from 'react';
import './MinigameModal.css';
import ProfileAvatar from '../../../components/ProfileAvatar';
import { FaTimes, FaPlus, FaGamepad, FaUsers, FaCrown, FaLock, FaDoorOpen } from 'react-icons/fa';
import friendService from '../../../services/friendService';

function MinigameModal({ onClose, userProfile, onlinePlayers, initialMode = 'lobby' }) {
  // 뷰 전환 상태 ('lobby', 'create', 'waiting')
  const [currentView, setCurrentView] = useState(initialMode === 'create' ? 'create' : 'lobby');

  // 현재 참여 중인 방 정보
  const [currentRoom, setCurrentRoom] = useState(null);

  // 게임 종류 목록
  const gameTypes = [
    { id: 'omok', name: '오목', image: '/resources/GameIllust/Omok.png' },
    { id: 'word', name: '끝말잇기', image: '/resources/GameIllust/Word.png' },
    { id: 'aim', name: '에임 맞추기', image: '/resources/GameIllust/Aim.png' },
    { id: 'twenty', name: '스무고개', image: '/resources/GameIllust/Twenty.png' }
  ];

  // 방 생성 폼 데이터
  const [roomForm, setRoomForm] = useState({
    roomName: '',
    gameType: '오목',
    maxPlayers: 4,
    isPrivate: false
  });

  // 대기방 채팅 메시지
  const [roomChatMessages, setRoomChatMessages] = useState([]);
  const [roomChatInput, setRoomChatInput] = useState('');

  // 더미 데이터 - 방 목록
  const [rooms] = useState([
    {
      id: 1,
      name: '친구들과 즐기는 미니게임',
      gameName: '오목',
      hostName: '플레이어123',
      currentPlayers: 3,
      maxPlayers: 4,
      isLocked: false,
      isPlaying: false
    },
    {
      id: 2,
      name: '초보 환영 방',
      gameName: '끝말잇기',
      hostName: '게임마스터',
      currentPlayers: 2,
      maxPlayers: 6,
      isLocked: false,
      isPlaying: false
    },
    {
      id: 3,
      name: '고수들의 대결',
      gameName: '에임 맞추기',
      hostName: 'SpeedKing',
      currentPlayers: 4,
      maxPlayers: 4,
      isLocked: true,
      isPlaying: true
    },
    {
      id: 4,
      name: '누구나 참여 가능!',
      gameName: '스무고개',
      hostName: 'QuizMaster',
      currentPlayers: 1,
      maxPlayers: 8,
      isLocked: false,
      isPlaying: false
    }
  ]);

  // 실제 친구 목록
  const [friends, setFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // 친구 목록 불러오기
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoadingFriends(true);
        const friendsData = await friendService.getFriends();
        setFriends(friendsData);
        console.log('친구 목록:', friendsData);
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
        setFriends([]);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    fetchFriends();
  }, []);

  const handleRoomClick = (room) => {
    if (room.isLocked) {
      alert('비공개 방입니다.');
      return;
    }
    if (room.currentPlayers >= room.maxPlayers) {
      alert('방이 가득 찼습니다.');
      return;
    }
    console.log('방 입장:', room);
    // 방 입장 - 대기방으로 전환
    setCurrentRoom({
      ...room,
      players: [
        { id: 1, username: room.hostName, isHost: true, level: 10 },
        { id: 2, username: userProfile?.username || '게스트', isHost: false, level: userProfile?.level || 1 }
      ],
      spectators: []
    });
    setCurrentView('waiting');
  };

  const handleCreateRoom = () => {
    setCurrentView('create');
  };

  const handleCancelCreateRoom = () => {
    setCurrentView('lobby');
    setRoomForm({
      roomName: '',
      gameType: '오목',
      maxPlayers: 4,
      isPrivate: false
    });
  };

  const handleFormChange = (field, value) => {
    setRoomForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitCreateRoom = () => {
    console.log('방 생성:', roomForm);
    // TODO: 실제 방 생성 API 호출
    // 방 생성 후 대기방으로 이동
    const newRoom = {
      id: Date.now(),
      name: roomForm.roomName,
      gameName: roomForm.gameType,
      hostName: userProfile?.username || '게스트',
      currentPlayers: 1,
      maxPlayers: roomForm.maxPlayers,
      isLocked: roomForm.isPrivate,
      isPlaying: false,
      players: [
        { id: 1, username: userProfile?.username || '게스트', isHost: true, level: userProfile?.level || 1 }
      ],
      spectators: []
    };
    setCurrentRoom(newRoom);
    setCurrentView('waiting');
    setRoomForm({
      roomName: '',
      gameType: '오목',
      maxPlayers: 4,
      isPrivate: false
    });
  };

  const handleLeaveRoom = () => {
    console.log('방 나가기');
    setCurrentRoom(null);
    setCurrentView('lobby');
    setRoomChatMessages([]);
    setRoomChatInput('');
  };

  const handleSendRoomChat = () => {
    if (!roomChatInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      username: userProfile?.username || '게스트',
      message: roomChatInput,
      timestamp: new Date()
    };
    setRoomChatMessages(prev => [...prev, newMessage]);
    setRoomChatInput('');
  };

  const handleFriendClick = (friend) => {
    console.log('친구 클릭:', friend);
    // TODO: 친구 프로필 보기 또는 초대 등
  };

  // 친구의 온라인 상태 확인
  const isFriendOnline = (friendUsername) => {
    if (!onlinePlayers) return false;
    return Object.values(onlinePlayers).some(
      (player) => player.username === friendUsername
    );
  };

  return (
    <div className="minigame-modal-overlay" onClick={onClose}>
      <div className="minigame-modal" onClick={(e) => e.stopPropagation()}>
        {/* 왼쪽: 방 목록 */}
        <div className="minigame-main">
          {/* 헤더 */}
          <div className="minigame-header">
            <h2>
              {currentView === 'create' ? (
                <>
                  <FaPlus /> 방 만들기
                </>
              ) : currentView === 'waiting' ? (
                <>
                  <FaUsers /> {currentRoom?.name || '대기방'}
                </>
              ) : (
                <>
                  <FaDoorOpen /> 미니게임 로비
                </>
              )}
            </h2>
            <button className="minigame-close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* 방 목록 / 방 만들기 폼 / 대기방 */}
          {currentView === 'create' ? (
            <div className="create-room-form">
              <div className="form-group">
                <label>방 이름</label>
                <input
                  type="text"
                  placeholder="방 이름을 입력하세요"
                  value={roomForm.roomName}
                  onChange={(e) => handleFormChange('roomName', e.target.value)}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label>게임 종류</label>
                <div className="game-type-grid">
                  {gameTypes.map((game) => (
                    <div
                      key={game.id}
                      className={`game-type-card ${roomForm.gameType === game.name ? 'selected' : ''}`}
                      onClick={() => handleFormChange('gameType', game.name)}
                    >
                      <img src={game.image} alt={game.name} className="game-type-image" />
                      <div className="game-type-name">{game.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>최대 인원</label>
                <select
                  value={roomForm.maxPlayers}
                  onChange={(e) => handleFormChange('maxPlayers', parseInt(e.target.value))}
                >
                  <option value={2}>2명</option>
                  <option value={4}>4명</option>
                  <option value={6}>6명</option>
                  <option value={8}>8명</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={roomForm.isPrivate}
                    onChange={(e) => handleFormChange('isPrivate', e.target.checked)}
                  />
                  <FaLock /> 비공개 방 (잠금)
                </label>
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancelCreateRoom}>
                  취소
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmitCreateRoom}
                  disabled={!roomForm.roomName.trim()}
                >
                  방 만들기
                </button>
              </div>
            </div>
          ) : currentView === 'waiting' ? (
            <div className="waiting-room">
              {/* 게임 정보 */}
              <div className="waiting-room-info">
                <div className="info-item">
                  <FaGamepad />
                  <span>게임: {currentRoom?.gameName}</span>
                </div>
                <div className="info-item">
                  <FaCrown />
                  <span>방장: {currentRoom?.hostName}</span>
                </div>
                <div className="info-item">
                  <FaLock />
                  <span>{currentRoom?.isLocked ? '비공개' : '공개'}</span>
                </div>
              </div>

              {/* 참가 인원 */}
              <div className="waiting-room-section">
                <h3>참가 인원 ({currentRoom?.players?.length || 0}/{currentRoom?.maxPlayers})</h3>
                <div className="players-grid">
                  {currentRoom?.players?.map((player) => (
                    <div key={player.id} className="player-card">
                      <ProfileAvatar
                        profileImage={player.selectedProfile}
                        outlineImage={player.selectedOutline}
                        size={50}
                      />
                      <div className="player-info">
                        <div className="player-name">
                          {player.isHost && <FaCrown className="host-icon" />}
                          {player.username}
                        </div>
                        <div className="player-level">Lv. {player.level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 관전자 */}
              {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
                <div className="waiting-room-section">
                  <h3>관전자 ({currentRoom.spectators.length})</h3>
                  <div className="spectators-list">
                    {currentRoom.spectators.map((spectator) => (
                      <div key={spectator.id} className="spectator-item">
                        <span>{spectator.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 대기방 채팅 */}
              <div className="waiting-room-chat">
                <h3>채팅</h3>
                <div className="chat-messages">
                  {roomChatMessages.map((msg) => (
                    <div key={msg.id} className="chat-message">
                      <span className="chat-username">{msg.username}:</span>
                      <span className="chat-text">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={roomChatInput}
                    onChange={(e) => setRoomChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendRoomChat()}
                  />
                  <button onClick={handleSendRoomChat}>전송</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="minigame-room-list">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`room-item ${room.isPlaying ? 'playing' : ''} ${
                  room.currentPlayers >= room.maxPlayers ? 'full' : ''
                }`}
                onClick={() => handleRoomClick(room)}
              >
                <div className="room-header">
                  <div className="room-title">
                    {room.isLocked && <FaLock className="room-lock-icon" />}
                    <h3>{room.name}</h3>
                  </div>
                  <div className="room-status">
                    {room.isPlaying ? (
                      <span className="status-badge playing">게임 중</span>
                    ) : (
                      <span className="status-badge waiting">대기 중</span>
                    )}
                  </div>
                </div>

                <div className="room-info">
                  <div className="room-game">
                    <FaGamepad />
                    <span>{room.gameName}</span>
                  </div>
                  <div className="room-host">
                    <FaCrown />
                    <span>{room.hostName}</span>
                  </div>
                  <div className="room-players">
                    <FaUsers />
                    <span>
                      {room.currentPlayers}/{room.maxPlayers}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* 오른쪽: 프로필 + 방 생성 + 친구 목록 */}
        <div className="minigame-sidebar">
          {/* 내 프로필 */}
          <div className="sidebar-profile">
            <ProfileAvatar
              profileImage={userProfile?.selectedProfile}
              outlineImage={userProfile?.selectedOutline}
              size={100}
            />
            <div className="profile-username">{userProfile?.username || '게스트'}</div>
            <div className="profile-level">Lv. {userProfile?.level || 1}</div>
          </div>

          {/* 네비게이션 버튼들 - 대기방이 아닐 때만 표시 */}
          {currentView !== 'waiting' ? (
            <div className="sidebar-nav-buttons">
              <button
                className={`nav-btn ${currentView === 'lobby' ? 'active' : ''}`}
                onClick={() => setCurrentView('lobby')}
              >
                <FaDoorOpen />
                <span>로비</span>
              </button>
              <button
                className={`nav-btn ${currentView === 'create' ? 'active' : ''}`}
                onClick={handleCreateRoom}
              >
                <FaPlus />
                <span>방 만들기</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-nav-buttons">
              <button className="leave-room-btn" onClick={handleLeaveRoom}>
                <FaTimes />
                <span>방 나가기</span>
              </button>
            </div>
          )}

          {/* 친구 목록 */}
          <div className="sidebar-friends">
            <h3 className="friends-title">친구 목록 ({friends.length})</h3>
            <div className="friends-list">
              {isLoadingFriends ? (
                <div className="friends-loading">로딩 중...</div>
              ) : friends.length === 0 ? (
                <div className="friends-empty">친구가 없습니다</div>
              ) : (
                friends.map((friend, index) => {
                  const isOnline = isFriendOnline(friend.username);
                  return (
                    <div
                      key={friend.friendshipId || friend.id || `friend-${index}`}
                      className={`friend-item ${isOnline ? 'online' : 'offline'}`}
                      onClick={() => handleFriendClick(friend)}
                    >
                      <ProfileAvatar
                        profileImage={friend.selectedProfile}
                        outlineImage={friend.selectedOutline}
                        size={40}
                        className="friend-avatar"
                      />
                      <div className="friend-info">
                        <div className="friend-name">{friend.username}</div>
                        <div className="friend-level">Lv. {friend.level || 1}</div>
                      </div>
                      {isOnline && (
                        <div className="friend-status-online">온라인</div>
                      )}
                      <div className="friend-status-dot"></div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MinigameModal;
