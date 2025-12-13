import React, { useState, useEffect } from 'react';
import './MinigameModal.css';
import ProfileAvatar from '../../../components/ProfileAvatar';
import { FaTimes, FaPlus, FaGamepad, FaUsers, FaCrown, FaLock, FaDoorOpen } from 'react-icons/fa';
import friendService from '../../../services/friendService';
import minigameService from '../../../services/minigameService';

function MinigameModal({ onClose, userProfile, onlinePlayers, initialMode = 'lobby' }) {
  // 뷰 전환 상태 ('lobby', 'create', 'waiting')
  const [currentView, setCurrentView] = useState(initialMode === 'create' ? 'create' : 'lobby');

  // 현재 참여 중인 방 정보
  const [currentRoom, setCurrentRoom] = useState(null);

  // 아이템을 ProfileAvatar에 맞는 형식으로 변환하는 헬퍼 함수
  const formatProfileImage = (item) => {
    if (!item) return null;
    // 이미 올바른 객체 형태면 그대로 반환
    if (typeof item === 'object' && item.imagePath) return item;
    // 경로 문자열이면 객체로 감싸기
    if (typeof item === 'string' && item.includes('/')) {
      return { imagePath: item };
    }
    // ID면 경로로 변환하여 객체 생성
    return {
      imagePath: `/resources/Profile/base-profile${item}.png`,
      itemName: `프로필 ${item}`
    };
  };

  const formatOutlineImage = (item) => {
    if (!item) return null;
    // 이미 올바른 객체 형태면 그대로 반환
    if (typeof item === 'object' && item.imagePath) return item;
    // 경로 문자열이면 객체로 감싸기
    if (typeof item === 'string' && item.includes('/')) {
      return { imagePath: item };
    }
    // ID면 경로로 변환하여 객체 생성
    return {
      imagePath: `/resources/ProfileOutline/base-outline${item}.png`,
      itemName: `테두리 ${item}`
    };
  };

  // 모달 닫기 핸들러 (방 나가기 포함)
  const handleClose = () => {
    // 방에 있으면 나가기
    if (minigameService.currentRoomId) {
      console.log('모달 닫기 - 방에서 나가기:', minigameService.currentRoomId);
      minigameService.leaveRoom(minigameService.currentRoomId);
    }
    onClose();
  };

  // 방 설정 변경 모드
  const [isEditingRoomSettings, setIsEditingRoomSettings] = useState(false);

  // 게임 종류 목록
  const gameTypes = [
    { id: 'omok', name: '오목', image: '/resources/GameIllust/Omok.png', maxPlayers: [2] },
    { id: 'word', name: '끝말잇기', image: '/resources/GameIllust/Word.png', maxPlayers: [2, 4, 6, 8] },
    { id: 'aim', name: '에임 맞추기', image: '/resources/GameIllust/Aim.png', maxPlayers: [2, 4] },
    { id: 'twenty', name: '스무고개', image: '/resources/GameIllust/Twenty.png', maxPlayers: [2, 4, 6] }
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

  // 방 목록 (WebSocket으로 받음)
  const [rooms, setRooms] = useState([]);

  // 실제 친구 목록
  const [friends, setFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // 친구 초대 모달
  const [showFriendInviteModal, setShowFriendInviteModal] = useState(false);

  // 친구 초대 알림 팝업
  const [inviteNotification, setInviteNotification] = useState(null);

  // WebSocket 연결 및 친구 목록 불러오기
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

    // Minigame WebSocket 연결
    if (!minigameService.connected) {
      minigameService.connect(
        userProfile?.id || 'guest',
        userProfile?.username || '게스트'
      );
    }

    // 방 목록 업데이트 이벤트
    minigameService.on('roomsList', (roomsList) => {
      console.log('방 목록 받음:', roomsList);
      setRooms(roomsList);
    });

    // 방 업데이트 이벤트
    minigameService.on('roomUpdate', (roomData) => {
      console.log('방 업데이트:', roomData);
      setRooms(prevRooms => {
        const existingIndex = prevRooms.findIndex(r => r.roomId === roomData.roomId);
        if (existingIndex >= 0) {
          // 기존 방 업데이트
          const newRooms = [...prevRooms];
          newRooms[existingIndex] = roomData;
          return newRooms;
        } else {
          // 새 방 추가
          return [...prevRooms, roomData];
        }
      });

      // 방 생성 이벤트인 경우, 내가 만든 방이면 자동으로 입장
      if (roomData.action === 'create' && String(roomData.hostId) === String(userProfile?.id || 'guest')) {
        console.log('내가 만든 방으로 자동 입장:', roomData.roomId);
        // 방 구독 (방 업데이트 받기 위해)
        minigameService.subscribeToRoom(roomData.roomId);
        minigameService.currentRoomId = roomData.roomId;
        setCurrentRoom(roomData);
        setCurrentView('waiting');
      }
    });

    // 방 삭제 이벤트
    minigameService.on('roomDelete', (roomData) => {
      console.log('방 삭제:', roomData);
      setRooms(prevRooms => prevRooms.filter(r => r.roomId !== roomData.roomId));

      // 내가 있던 방이 삭제되면 로비로 돌아가기
      if (currentRoom?.roomId === roomData.roomId) {
        setCurrentRoom(null);
        setCurrentView('lobby');
        setRoomChatMessages([]);
      }
    });

    // 방 입장/업데이트 이벤트
    minigameService.on('roomJoin', (roomData) => {
      console.log('🟢 방 이벤트 수신:', roomData.action, roomData);
      if (roomData.action === 'join' || roomData.action === 'update' || roomData.action === 'ready' || roomData.action === 'leave') {
        console.log('🟢 currentRoom 업데이트:', roomData);
        setCurrentRoom(roomData);
        // 내가 방에 있는지 확인 (join 액션일 때만 화면 전환)
        if (roomData.action === 'join') {
          const myUserId = String(userProfile?.id || 'guest');
          const isInRoom = roomData.players?.some(p => String(p.userId) === myUserId);
          if (isInRoom && currentView !== 'waiting') {
            setCurrentView('waiting');
          }
        }
      } else if (roomData.action === 'start') {
        // TODO: 게임 시작 처리
        console.log('게임 시작!');
      }
    });

    // 방 채팅 이벤트
    minigameService.on('roomChat', (chatData) => {
      console.log('방 채팅:', chatData);
      const newMessage = {
        id: chatData.timestamp,
        username: chatData.username,
        message: chatData.message,
        timestamp: new Date(chatData.timestamp)
      };
      setRoomChatMessages(prev => [...prev, newMessage]);
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      // ⚠️ React StrictMode에서 cleanup이 테스트 목적으로 실행될 수 있으므로
      // 여기서는 방 나가기를 하지 않음. handleClose에서만 처리.
      console.log('MinigameModal cleanup (StrictMode 테스트일 수 있음)');
    };
  }, []);

  // 브라우저 종료/새로고침 시 방에서 나가기
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (minigameService.currentRoomId) {
        console.log('브라우저 종료 - 방에서 나가기:', minigameService.currentRoomId);
        minigameService.leaveRoom(minigameService.currentRoomId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
    // 실제 방 입장 (서버 응답을 받으면 roomJoin 이벤트에서 화면 전환)
    minigameService.joinRoom(
      room.roomId,
      userProfile?.level || 1,
      userProfile?.selectedProfile?.imagePath || userProfile?.selectedProfile || null,
      userProfile?.selectedOutline?.imagePath || userProfile?.selectedOutline || null
    );
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
    if (field === 'gameType') {
      // 게임 종류 변경 시 해당 게임의 첫 번째 인원수 옵션으로 자동 설정
      const selectedGame = gameTypes.find(game => game.name === value);
      setRoomForm(prev => ({
        ...prev,
        gameType: value,
        maxPlayers: selectedGame?.maxPlayers[0] || 2
      }));
    } else {
      setRoomForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 현재 선택된 게임의 인원수 옵션 가져오기
  const getCurrentMaxPlayersOptions = () => {
    const selectedGame = gameTypes.find(game => game.name === roomForm.gameType);
    return selectedGame?.maxPlayers || [2, 4, 6, 8];
  };

  const handleSubmitCreateRoom = () => {
    console.log('방 생성:', roomForm);
    // 실제 방 생성
    minigameService.createRoom(
      roomForm.roomName,
      roomForm.gameType,
      roomForm.maxPlayers,
      roomForm.isPrivate,
      userProfile?.level || 1,
      userProfile?.selectedProfile?.imagePath,
      userProfile?.selectedOutline?.imagePath
    );

    // 폼 초기화 및 대기 (방 생성 완료 이벤트를 받으면 자동으로 입장)
    setRoomForm({
      roomName: '',
      gameType: '오목',
      maxPlayers: 2,
      isPrivate: false
    });
  };

  const handleLeaveRoom = () => {
    console.log('방 나가기');
    if (currentRoom?.roomId) {
      minigameService.leaveRoom(currentRoom.roomId);
    }
    setCurrentRoom(null);
    setCurrentView('lobby');
    setRoomChatMessages([]);
    setRoomChatInput('');
  };

  const handleSendRoomChat = () => {
    if (!roomChatInput.trim() || !currentRoom?.roomId) return;
    minigameService.sendRoomChat(currentRoom.roomId, roomChatInput);
    setRoomChatInput('');
  };

  const handleInviteFriend = () => {
    console.log('친구 초대 클릭');
    setShowFriendInviteModal(true);
  };

  const handleInviteFriendToRoom = (friend) => {
    const isOnline = isFriendOnline(friend.username);
    if (!isOnline) {
      setInviteNotification({
        type: 'error',
        message: '오프라인 상태의 친구는 초대할 수 없습니다.'
      });
      setTimeout(() => setInviteNotification(null), 3000);
      return;
    }

    // 게임 초대 전송
    const targetUserId = friend.userId; // FriendRequestDto의 userId 필드 사용
    const targetUsername = friend.username;
    const roomId = currentRoom.roomId;
    const gameName = currentRoom.gameName;

    minigameService.sendGameInvite(targetUserId, targetUsername, roomId, gameName);

    setInviteNotification({
      type: 'success',
      message: `${friend.username}님에게 초대를 보냈습니다!`
    });
    setTimeout(() => setInviteNotification(null), 3000);
    console.log('초대 전송:', { targetUserId, targetUsername, roomId, gameName });
    setShowFriendInviteModal(false);
  };

  const handleGameStart = () => {
    console.log('게임 시작 클릭');
    if (currentRoom?.roomId) {
      minigameService.startGame(currentRoom.roomId);
    }
  };

  const handleReady = () => {
    console.log('🔵 준비 버튼 클릭, roomId:', currentRoom?.roomId, 'userId:', userProfile?.id);
    if (currentRoom?.roomId) {
      minigameService.toggleReady(currentRoom.roomId);
      console.log('🔵 toggleReady 호출 완료');
    } else {
      console.error('❌ currentRoom.roomId가 없음:', currentRoom);
    }
  };

  // 현재 유저가 방장인지 확인
  const isHost = currentRoom?.hostName === (userProfile?.username || '게스트');

  const handleRoomSettingsClick = () => {
    setIsEditingRoomSettings(!isEditingRoomSettings);
  };

  const handleRoomSettingsChange = (field, value) => {
    if (field === 'gameName') {
      // 게임 종류 변경 시 해당 게임의 첫 번째 인원수로 자동 설정
      const selectedGame = gameTypes.find(game => game.name === value);
      setCurrentRoom(prev => ({
        ...prev,
        gameName: value,
        maxPlayers: selectedGame?.maxPlayers[0] || 2
      }));
    } else {
      setCurrentRoom(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveRoomSettings = () => {
    console.log('방 설정 저장:', currentRoom);
    if (currentRoom?.roomId) {
      minigameService.updateRoom(
        currentRoom.roomId,
        currentRoom.gameName,
        currentRoom.maxPlayers
      );
    }
    setIsEditingRoomSettings(false);
  };

  const handleFriendClick = (friend) => {
    console.log('친구 클릭:', friend);
    // 로비 화면에서는 친구 프로필 보기 등 다른 기능
    // (대기방 화면에서는 친구 목록이 관전자 목록으로 대체되므로 이 함수가 호출되지 않음)
  };

  // 친구의 온라인 상태 확인
  const isFriendOnline = (friendUsername) => {
    if (!onlinePlayers) return false;
    return Object.values(onlinePlayers).some(
      (player) => player.username === friendUsername
    );
  };

  return (
    <div className="minigame-modal-overlay" onClick={handleClose}>
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
            <button className="minigame-close-btn" onClick={handleClose}>
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
                  {getCurrentMaxPlayersOptions().map((playerCount) => (
                    <option key={playerCount} value={playerCount}>
                      {playerCount}명
                    </option>
                  ))}
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
                <div className="waiting-room-info-left">
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
                {isHost && (
                  <button className="room-settings-btn" onClick={handleRoomSettingsClick}>
                    {isEditingRoomSettings ? '닫기' : '방 설정'}
                  </button>
                )}
              </div>

              {/* 방 설정 변경 폼 */}
              {isEditingRoomSettings && isHost && (
                <div className="room-settings-form">
                  <div className="form-group">
                    <label>게임 종류</label>
                    <div className="game-type-grid">
                      {gameTypes.map((game) => (
                        <div
                          key={game.id}
                          className={`game-type-card ${currentRoom?.gameName === game.name ? 'selected' : ''}`}
                          onClick={() => handleRoomSettingsChange('gameName', game.name)}
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
                      value={currentRoom?.maxPlayers || 2}
                      onChange={(e) => handleRoomSettingsChange('maxPlayers', parseInt(e.target.value))}
                    >
                      {(() => {
                        const selectedGame = gameTypes.find(game => game.name === currentRoom?.gameName);
                        return (selectedGame?.maxPlayers || [2]).map((playerCount) => (
                          <option key={playerCount} value={playerCount}>
                            {playerCount}명
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <button className="save-settings-btn" onClick={handleSaveRoomSettings}>
                    저장
                  </button>
                </div>
              )}

              {/* 참가 인원 */}
              <div className="waiting-room-section">
                <h3>참가 인원 ({currentRoom?.players?.length || 0}/{currentRoom?.maxPlayers})</h3>
                <div className="players-grid">
                  {currentRoom?.players?.map((player) => (
                    <div key={player.userId} className={`player-card ${player.ready ? 'ready' : ''}`}>
                      <ProfileAvatar
                        profileImage={formatProfileImage(player.selectedProfile)}
                        outlineImage={formatOutlineImage(player.selectedOutline)}
                        size={50}
                      />
                      <div className="player-info">
                        <div className="player-name">
                          {player.host && <FaCrown className="host-icon" />}
                          {player.username}
                        </div>
                        <div className="player-level">Lv. {player.level}</div>
                      </div>
                      {!player.host && (
                        <div className={`player-ready-badge ${player.ready ? 'ready' : 'waiting'}`}>
                          {player.ready ? '✓ 준비' : '대기'}
                        </div>
                      )}
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

              {/* 대기방 버튼들 */}
              <div className="waiting-room-actions">
                <button className="invite-friend-btn" onClick={handleInviteFriend}>
                  <FaPlus />
                  친구 초대
                </button>
                {isHost ? (
                  <button className="game-start-btn" onClick={handleGameStart}>
                    <FaGamepad />
                    게임 시작
                  </button>
                ) : (
                  (() => {
                    // 현재 유저의 준비 상태 찾기
                    const myPlayer = currentRoom?.players?.find(
                      p => p.username === (userProfile?.username || '게스트')
                    );
                    const isReady = myPlayer?.ready || false;

                    return (
                      <button
                        className={`ready-btn ${isReady ? 'ready' : ''}`}
                        onClick={handleReady}
                      >
                        <FaUsers />
                        {isReady ? '준비 완료' : '준비'}
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          ) : (
            <div className="minigame-room-list">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className={`room-item ${room.isPlaying ? 'playing' : ''} ${
                  room.currentPlayers >= room.maxPlayers ? 'full' : ''
                }`}
                onClick={() => handleRoomClick(room)}
              >
                <div className="room-header">
                  <div className="room-title">
                    {room.isLocked && <FaLock className="room-lock-icon" />}
                    <h3>{room.roomName}</h3>
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

          {/* 친구 목록 / 관전자 목록 */}
          {currentView === 'waiting' ? (
            <div className="sidebar-friends">
              <h3 className="friends-title">관전자 ({currentRoom?.spectators?.length || 0})</h3>
              <div className="friends-list">
                {currentRoom?.spectators && currentRoom.spectators.length > 0 ? (
                  currentRoom.spectators.map((spectator, index) => (
                    <div
                      key={spectator.id || `spectator-${index}`}
                      className="friend-item"
                    >
                      <ProfileAvatar
                        profileImage={spectator.selectedProfile}
                        outlineImage={spectator.selectedOutline}
                        size={40}
                        className="friend-avatar"
                      />
                      <div className="friend-info">
                        <div className="friend-name">{spectator.username}</div>
                        <div className="friend-level">Lv. {spectator.level || 1}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="friends-empty">관전자가 없습니다</div>
                )}
              </div>
            </div>
          ) : (
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
                          profileImage={{ imagePath: friend.profileImagePath }}
                          outlineImage={{ imagePath: friend.outlineImagePath }}
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
          )}
        </div>
      </div>

      {/* 친구 초대 모달 */}
      {showFriendInviteModal && (
        <div className="friend-invite-modal-overlay" onClick={() => setShowFriendInviteModal(false)}>
          <div className="friend-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="friend-invite-header">
              <h3>친구 초대</h3>
              <button className="close-btn" onClick={() => setShowFriendInviteModal(false)}>×</button>
            </div>
            <div className="friend-invite-body">
              {isLoadingFriends ? (
                <div className="loading">친구 목록을 불러오는 중...</div>
              ) : friends.length === 0 ? (
                <div className="no-friends">친구가 없습니다.</div>
              ) : (
                <div className="friend-invite-list">
                  {friends.map((friend, index) => {
                    const isOnline = isFriendOnline(friend.username);
                    return (
                      <div
                        key={friend.friendshipId || friend.id || `friend-${index}`}
                        className={`friend-invite-item ${isOnline ? 'online' : 'offline'}`}
                        onClick={() => isOnline && handleInviteFriendToRoom(friend)}
                      >
                        <ProfileAvatar
                          profileImage={{ imagePath: friend.profileImagePath }}
                          outlineImage={{ imagePath: friend.outlineImagePath }}
                          size={40}
                          className="friend-avatar"
                        />
                        <div className="friend-info">
                          <div className="friend-name">{friend.username}</div>
                          <div className="friend-level">Lv. {friend.level || 1}</div>
                        </div>
                        {isOnline ? (
                          <div className="friend-status-online">온라인</div>
                        ) : (
                          <div className="friend-status-offline">오프라인</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 초대 알림 팝업 */}
      {inviteNotification && (
        <div className={`invite-notification ${inviteNotification.type}`}>
          {inviteNotification.message}
        </div>
      )}
    </div>
  );
}

export default MinigameModal;
