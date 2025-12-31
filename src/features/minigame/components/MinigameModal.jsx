import React, { useState, useEffect } from 'react';
import './MinigameModal.css';
import ProfileAvatar from '../../../components/ProfileAvatar';
import { FaTimes, FaPlus, FaGamepad, FaUsers, FaCrown, FaLock, FaDoorOpen, FaComments, FaPaperPlane } from 'react-icons/fa';
import friendService from '../../../services/friendService';
import minigameService from '../../../services/minigameService';
import AimingGame from './AimingGame';
import OmokGame from './OmokGame';

function MinigameModal({ onClose, userProfile, onlinePlayers, initialMode = 'lobby', initialRoomId = null }) {
    const [currentView, setCurrentView] = useState(initialMode === 'create' ? 'create' : 'lobby');
    const [currentRoom, setCurrentRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [showFriendInviteModal, setShowFriendInviteModal] = useState(false);
    const [inviteNotification, setInviteNotification] = useState(null);
    const [roomForm, setRoomForm] = useState({ roomName: '', gameType: '오목', maxPlayers: 2, isPrivate: false });
    const [pendingRoomId, setPendingRoomId] = useState(initialRoomId);
    const [isEditingRoomSettings, setIsEditingRoomSettings] = useState(false);
    const [roomChatInput, setRoomChatInput] = useState('');
    const [roomChatMessages, setRoomChatMessages] = useState([]);
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false); // 재연결 중 상태
    const [showSpectatorList, setShowSpectatorList] = useState(false); // 관전자 목록 모달

    const gameTypes = [
        { id: 'omok', name: '오목', image: '/resources/GameIllust/Omok.png', maxPlayers: [2] },
        { id: 'word', name: '끝말잇기', image: '/resources/GameIllust/Word.png', maxPlayers: [2, 4, 6, 8] },
        { id: 'twenty', name: '스무고개', image: '/resources/GameIllust/Twenty.png', maxPlayers: [2, 4, 6] },
        { id: 'aim', name: '에임 맞추기', image: '/resources/GameIllust/Aim.png', maxPlayers: [2, 4] },
        { id: 'reaction', name: '반응속도', image: '/resources/GameIllust/Reactiontest.png', maxPlayers: [2, 4] },
        { id: 'liar', name: '라이어 게임', image: '/resources/GameIllust/Liar.png', maxPlayers: [4, 6] },
        { id: 'collection', name: '미니게임 모음', image: '/resources/GameIllust/Collection.png', maxPlayers: [4] }
    ];

    const formatProfileImage = (item) => {
        if (!item) return null;
        if (typeof item === 'object' && item.imagePath) return item;
        if (typeof item === 'string' && item.includes('/')) return { imagePath: item };
        return { imagePath: `/resources/Profile/base-profile${item}.png`, itemName: `프로필 ${item}` };
    };

    const formatOutlineImage = (item) => {
        if (!item) return null;
        if (typeof item === 'object' && item.imagePath) return item;
        if (typeof item === 'string' && item.includes('/')) return { imagePath: item };
        return { imagePath: `/resources/ProfileOutline/base-outline${item}.png`, itemName: `테두리 ${item}` };
    };

    const isFriendOnline = (friend) => {
        if (!onlinePlayers) return false;
        if (typeof friend === 'string') return Object.values(onlinePlayers).some(p => p.username === friend);
        if (friend.userId && onlinePlayers[String(friend.userId)]) return true;
        return Object.values(onlinePlayers).some(p => p.username === friend.username);
    };

    const handleClose = () => {
        if (minigameService.currentRoomId) {
            minigameService.leaveRoom(minigameService.currentRoomId);
        }
        onClose();
    };

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setIsLoadingFriends(true);
                const friendsData = await friendService.getFriends();
                setFriends(friendsData || []);
            } catch (error) {
                console.error('친구 목록 불러오기 실패:', error);
                setFriends([]);
            } finally {
                setIsLoadingFriends(false);
            }
        };
        fetchFriends();
    }, []);

    useEffect(() => {
        if (!minigameService.connected) {
            minigameService.connect(userProfile?.id || 'guest', userProfile?.username || '게스트');
        }
        const onRoomsList = (roomsList) => {
            console.log('Received rooms list:', roomsList);
            setRooms(roomsList || []);
        };
        const onRoomDelete = (deleteData) => {
            console.log('Room deleted:', deleteData);
            setRooms(prev => prev.filter(r => r.roomId !== deleteData.roomId));
            // 현재 방이 삭제된 경우
            if (currentRoom?.roomId === deleteData.roomId) {
                setCurrentRoom(null);
                setCurrentView('lobby');
            }
        };
        minigameService.on('roomsList', onRoomsList);
        minigameService.on('roomDelete', onRoomDelete);
        const handleBeforeUnload = () => {
            if (minigameService.currentRoomId) {
                minigameService.leaveRoom(minigameService.currentRoomId);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            minigameService.off('roomsList', onRoomsList);
            minigameService.off('roomDelete', onRoomDelete);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userProfile, currentRoom]);

    useEffect(() => {
        const onRoomUpdate = (roomData) => {
            // 방 목록 업데이트
            setRooms(prev => {
                const exists = prev.some(r => r.roomId === roomData.roomId);

                if (roomData.action === 'delete' || roomData.isDeleted) {
                    // 방 삭제
                    return prev.filter(r => r.roomId !== roomData.roomId);
                } else if (exists) {
                    // 기존 방 업데이트
                    return prev.map(r => r.roomId === roomData.roomId ? roomData : r);
                } else if (roomData.action === 'create') {
                    // 새로운 방 추가
                    return [...prev, roomData];
                } else {
                    // action이 'create'가 아니고 방이 존재하지 않으면 추가하지 않음
                    console.warn('Unknown room update without create action:', roomData);
                    return prev;
                }
            });

            // 현재 있는 방이 업데이트된 경우
            if (currentRoom && roomData.roomId === currentRoom.roomId) {
                setCurrentRoom(roomData);
            }

            // 방을 생성한 본인인 경우 대기방으로 이동
            if (roomData.action === 'create' && String(roomData.hostId) === String(userProfile?.id)) {
                minigameService.subscribeToRoom(roomData.roomId);
                setCurrentRoom(roomData);
                setCurrentView('waiting');
            }
        };
        const onRoomJoin = (roomPayload) => {
            const isInPlayers = (roomPayload?.players || []).some(p => String(p.userId) === String(userProfile?.id));
            const isInSpectators = (roomPayload?.spectators || []).some(s => String(s.userId) === String(userProfile?.id));

            if (isInPlayers || isInSpectators) {
                minigameService.subscribeToRoom(roomPayload.roomId);
                setCurrentRoom(roomPayload);
                setCurrentView('waiting');
            }
        };
        const onGameEvent = (evt) => {
            if (evt?.roomId === currentRoom?.roomId && (evt.type === 'gameStart' || evt.type === 'spawnTarget')) {
                setCurrentRoom(prev => ({ ...(prev || {}), playing: true }));
            }
        };
        const onRoomChat = (chatData) => {
            if (chatData?.roomId === currentRoom?.roomId) {
                setRoomChatMessages(prev => [...prev, chatData]);
            }
        };
        const onJoinResult = (result) => {
            console.log('joinResult received:', result);

            // success가 명시적으로 false인 경우에만 에러 처리
            if (result.success === false) {
                const errorMsg = result.error || result.message || '알 수 없는 오류';
                console.error('방 입장 실패:', errorMsg);
                alert(`게임 방 입장에 실패했습니다: ${errorMsg}`);

                // 방 목록에서 해당 방 제거 (서버에 존재하지 않는 방)
                if (errorMsg.includes('not found')) {
                    setRooms(prev => prev.filter(r => r.roomId !== result.roomId));
                }
            } else if (result.success === true) {
                console.log('방 입장 성공:', result);
            }
            // success가 undefined인 경우는 무시 (다른 타입의 이벤트일 수 있음)
        };
        minigameService.on('roomUpdate', onRoomUpdate);
        minigameService.on('roomJoin', onRoomJoin);
        minigameService.on('gameEvent', onGameEvent);
        minigameService.on('roomChat', onRoomChat);
        minigameService.on('joinResult', onJoinResult);
        return () => {
            minigameService.off('roomUpdate', onRoomUpdate);
            minigameService.off('roomJoin', onRoomJoin);
            minigameService.off('gameEvent', onGameEvent);
            minigameService.off('roomChat', onRoomChat);
            minigameService.off('joinResult', onJoinResult);
        };
    }, [currentRoom, userProfile]);

    useEffect(() => {
        if (initialRoomId && userProfile?.id) {
            minigameService.joinRoom(initialRoomId, userProfile.level || 1, userProfile.selectedProfile?.imagePath || null, userProfile.selectedOutline?.imagePath || null);
        }
    }, [initialRoomId]); // userProfile 제거하여 중복 입장 방지

    // 채팅 메시지 자동 스크롤
    useEffect(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, [roomChatMessages]);

    // WebSocket 재연결 감지 및 복구
    useEffect(() => {
        let hideTimer = null;

        const onConnectionStatus = (status) => {
            if (!status.connected) {
                // WebSocket 연결 끊김 - 즉시 로딩 화면 표시
                setIsReconnecting(true);
                // 기존 타이머가 있으면 취소
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
            } else {
                // WebSocket 재연결 성공 - 현재 방이 있으면 다시 구독
                if (currentRoom?.roomId) {
                    minigameService.subscribeToRoom(currentRoom.roomId);
                    minigameService.requestRoomsList(); // 방 목록도 다시 요청
                }

                // 5초 후에 로딩 화면 숨김
                hideTimer = setTimeout(() => {
                    setIsReconnecting(false);
                }, 5000);
            }
        };

        minigameService.on('connectionStatus', onConnectionStatus);

        return () => {
            minigameService.off('connectionStatus', onConnectionStatus);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [currentRoom]);

    const handleRoomClick = (room) => {
        if (room.isLocked) return alert('비공개 방입니다.');
        // 방이 가득 차도 관전자로 입장 가능
        minigameService.joinRoom(room.roomId, userProfile?.level || 1, userProfile.selectedProfile?.imagePath || null, userProfile.selectedOutline?.imagePath || null);
    };
    const handleCreateRoom = () => setCurrentView('create');
    const handleCancelCreateRoom = () => setCurrentView('lobby');
    const handleFormChange = (field, value) => {
        setRoomForm(prev => ({ ...prev, [field]: value, ...(field === 'gameType' && { maxPlayers: gameTypes.find(g => g.name === value)?.maxPlayers[0] || 2 }) }));
    };
    const getCurrentMaxPlayersOptions = () => gameTypes.find(g => g.name === roomForm.gameType)?.maxPlayers || [2, 4, 6, 8];
    const handleSubmitCreateRoom = () => {
        minigameService.createRoom(roomForm.roomName, roomForm.gameType, roomForm.maxPlayers, roomForm.isPrivate, userProfile?.level || 1, userProfile?.selectedProfile?.imagePath, userProfile?.selectedOutline?.imagePath);
    };
    const handleLeaveRoom = () => {
        if (currentRoom?.roomId) minigameService.leaveRoom(currentRoom.roomId);
        setCurrentRoom(null);
        setCurrentView('lobby');
        setRoomChatMessages([]); // 채팅 메시지 초기화
        setRoomChatInput(''); // 입력창 초기화
    };
    const handleInviteFriend = () => setShowFriendInviteModal(true);
    const handleInviteFriendToRoom = (friend) => {
        if (!isFriendOnline(friend)) {
            setInviteNotification({ type: 'error', message: '오프라인 상태의 친구는 초대할 수 없습니다.' });
        } else {
            minigameService.sendGameInvite(friend.userId, friend.username, currentRoom.roomId, currentRoom.gameName);
            setInviteNotification({ type: 'success', message: `${friend.username}님에게 초대를 보냈습니다!` });
        }
        setTimeout(() => setInviteNotification(null), 3000);
        setShowFriendInviteModal(false);
    };
    const handleGameStart = () => {
        if (currentRoom?.roomId) minigameService.startGame(currentRoom.roomId);
    };
    const handleReady = () => {
        if (currentRoom?.roomId) minigameService.toggleReady(currentRoom.roomId);
    };
    const handleSwitchRole = () => {
        if (currentRoom?.roomId && !isSwitchingRole) {
            setIsSwitchingRole(true);
            minigameService.switchRole(currentRoom.roomId);
            // 1초 후 다시 클릭 가능하도록 설정
            setTimeout(() => setIsSwitchingRole(false), 1000);
        }
    };
    const handleSendRoomChat = () => {
        if (roomChatInput.trim() && currentRoom?.roomId) {
            minigameService.sendRoomChat(currentRoom.roomId, roomChatInput.trim());
            setRoomChatInput('');
        }
    };
    const handleRoomChatKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendRoomChat();
        }
    };

    const isHost = String(currentRoom?.hostId) === String(userProfile?.id);
    const isPlayer = currentRoom?.players?.some(p => String(p.userId) === String(userProfile?.id));
    const isSpectator = currentRoom?.spectators?.some(s => String(s.userId) === String(userProfile?.id));
    const isRoomFull = currentRoom?.currentPlayers >= currentRoom?.maxPlayers;

    const renderContent = () => {
        if (currentRoom?.playing) {
            const spectatorCount = currentRoom.spectators?.length || 0;
            let gameComponent;

            if (currentRoom.gameName === '오목') {
                gameComponent = <OmokGame
                    roomId={currentRoom.roomId}
                    isHost={isHost}
                    userProfile={userProfile}
                    players={currentRoom.players}
                    onGameEnd={() => setCurrentRoom(prev => (prev ? { ...prev, playing: false } : null))}
                />;
            } else if (currentRoom.gameName === '에임 맞추기') {
                gameComponent = <AimingGame
                    roomId={currentRoom.roomId}
                    isHost={isHost}
                    userProfile={userProfile}
                    players={currentRoom.players}
                    onGameEnd={() => setCurrentRoom(prev => (prev ? { ...prev, playing: false } : null))}
                />;
            } else {
                return <div>선택된 게임({currentRoom.gameName})을 찾을 수 없습니다.</div>;
            }

            return (
                <div className="game-container">
                    <div className="game-spectator-info" onClick={() => setShowSpectatorList(true)}>
                        <FaUsers /> 관전자 {spectatorCount}명
                    </div>
                    {gameComponent}
                </div>
            );
        }

        switch (currentView) {
            case 'create':
                return (
                    <div className="create-room-form">
                        <div className="form-group"><label>방 이름</label><input type="text" placeholder="방 이름을 입력하세요" value={roomForm.roomName} onChange={(e) => handleFormChange('roomName', e.target.value)} maxLength={30} /></div>
                        <div className="form-group"><label>게임 종류</label><div className="game-type-grid">{gameTypes.map((game) => (<div key={game.id} className={`game-type-card ${roomForm.gameType === game.name ? 'selected' : ''}`} onClick={() => handleFormChange('gameType', game.name)}><img src={game.image} alt={game.name} className="game-type-image" /><div className="game-type-name">{game.name}</div></div>))}</div></div>
                        <div className="form-group"><label>최대 인원</label><select value={roomForm.maxPlayers} onChange={(e) => handleFormChange('maxPlayers', parseInt(e.target.value))}>{getCurrentMaxPlayersOptions().map((c) => (<option key={c} value={c}>{c}명</option>))}</select></div>
                        <div className="form-group"><label className="checkbox-label"><input type="checkbox" checked={roomForm.isPrivate} onChange={(e) => handleFormChange('isPrivate', e.target.checked)} /><FaLock /> 비공개 방</label></div>
                        <div className="form-actions"><button className="btn-cancel" onClick={handleCancelCreateRoom}>취소</button><button className="btn-submit" onClick={handleSubmitCreateRoom} disabled={!roomForm.roomName.trim()}>방 만들기</button></div>
                    </div>
                );
            case 'waiting':
                return (
                    <div className="waiting-room">
                        <div className="waiting-room-info">
                            <div className="waiting-room-info-left">
                                <div className="info-item"><FaGamepad /><span>게임: {currentRoom?.gameName}</span></div>
                                <div className="info-item"><FaCrown /><span>방장: {currentRoom?.hostName}</span></div>
                            </div>
                        </div>
                        <div className="waiting-room-section">
                            <h3>참가 인원 ({currentRoom?.players?.length || 0}/{currentRoom?.maxPlayers})</h3>
                            <div className="players-grid">
                                {currentRoom?.players?.map((p) => (
                                    <div key={p.userId} className={`player-card ${p.ready ? 'ready' : ''}`}>
                                        <ProfileAvatar profileImage={formatProfileImage(p.selectedProfile)} outlineImage={formatOutlineImage(p.selectedOutline)} size={50} />
                                        <div className="player-info">
                                            <div className="player-name">{p.host && <FaCrown className="host-icon" />}{p.username}</div>
                                            <div className="player-level">Lv. {p.level}</div>
                                        </div>
                                        {!p.host && (
                                            <div className={`player-ready-badge ${p.ready ? 'ready' : 'waiting'}`}>
                                                {p.ready ? '✓ 준비' : '대기'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
                            <div className="waiting-room-section">
                                <h3>관전자 ({currentRoom.spectators.length}명)</h3>
                                <div className="players-grid">
                                    {currentRoom.spectators.map((s) => (
                                        <div key={s.userId} className="player-card spectator">
                                            <ProfileAvatar profileImage={formatProfileImage(s.selectedProfile)} outlineImage={formatOutlineImage(s.selectedOutline)} size={50} />
                                            <div className="player-info">
                                                <div className="player-name">{s.host && <FaCrown className="host-icon" />}{s.username}</div>
                                                <div className="player-level">Lv. {s.level}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="waiting-room-actions">
                            <button className="invite-friend-btn" onClick={handleInviteFriend}><FaPlus /> 친구 초대</button>
                            {isHost ? (
                                <>
                                    <button className="game-start-btn" onClick={handleGameStart}><FaGamepad /> 게임 시작</button>
                                    {isPlayer ? (
                                        <button className="switch-role-btn" onClick={handleSwitchRole} disabled={isSwitchingRole}>
                                            {isSwitchingRole ? '전환 중...' : '관전자로 전환'}
                                        </button>
                                    ) : (
                                        <button className="switch-role-btn" onClick={handleSwitchRole} disabled={isRoomFull || isSwitchingRole}>
                                            {isSwitchingRole ? '전환 중...' : isRoomFull ? '방이 가득 참' : '참가자로 전환'}
                                        </button>
                                    )}
                                </>
                            ) : isPlayer ? (
                                <>
                                    <button className={`ready-btn ${currentRoom?.players?.find(p => p.userId === userProfile.id)?.ready ? 'ready' : ''}`} onClick={handleReady}>
                                        <FaUsers />{currentRoom?.players?.find(p => p.userId === userProfile.id)?.ready ? '준비 완료' : '준비'}
                                    </button>
                                    <button className="switch-role-btn" onClick={handleSwitchRole} disabled={isSwitchingRole}>
                                        {isSwitchingRole ? '전환 중...' : '관전자로 전환'}
                                    </button>
                                </>
                            ) : isSpectator ? (
                                <button className="switch-role-btn" onClick={handleSwitchRole} disabled={isRoomFull || isSwitchingRole}>
                                    {isSwitchingRole ? '전환 중...' : isRoomFull ? '방이 가득 참' : '참가자로 전환'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                );
            case 'lobby':
            default:
                return (
                    <div className="minigame-room-list">
                        {rooms.length === 0 ? (
                            <div className="no-rooms-message">
                                <div className="no-rooms-icon">🎮</div>
                                <h3>현재 생성된 방이 없습니다</h3>
                                <p>새로운 방을 만들어 게임을 시작해보세요!</p>
                            </div>
                        ) : (
                            rooms.map((room) => (
                            <div key={room.roomId} className={`room-item ${room.isPlaying ? 'playing' : ''} ${room.currentPlayers >= room.maxPlayers ? 'full' : ''}`} onClick={() => handleRoomClick(room)}>
                                <div className="room-header">
                                    <div className="room-title">
                                        {room.isLocked && <FaLock className="room-lock-icon" />}
                                        <h3>{room.roomName}</h3>
                                    </div>
                                    <div className="room-status">
                                        {room.isPlaying ? <span className="status-badge playing">게임 중</span> : <span className="status-badge waiting">대기 중</span>}
                                    </div>
                                </div>
                                <div className="room-info">
                                    <div className="room-game"><FaGamepad /><span>{room.gameName}</span></div>
                                    <div className="room-host"><FaCrown /><span>{room.hostName}</span></div>
                                    <div className="room-players">
                                        <FaUsers />
                                        <span>{room.currentPlayers}/{room.maxPlayers}</span>
                                        {room.spectators && room.spectators.length > 0 && (
                                            <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                                                (관전 {room.spectators.length})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="minigame-modal-overlay" onClick={handleClose}>
            <div className="minigame-modal" onClick={(e) => e.stopPropagation()}>
                <div className="minigame-main">
                    <div className="minigame-header">
                        <h2>
                            {currentView === 'create' ? <><FaPlus /> 방 만들기</> :
                                currentView === 'waiting' ? <><FaUsers /> {currentRoom?.roomName || '대기방'}</> :
                                    '미니게임 로비'}
                        </h2>
                        <button className="minigame-close-btn" onClick={handleClose}><FaTimes /></button>
                    </div>
                    {renderContent()}
                </div>
                <div className="minigame-sidebar">
                    <div className="sidebar-profile"><ProfileAvatar profileImage={userProfile?.selectedProfile} outlineImage={userProfile?.selectedOutline} size={100} /><div className="profile-username">{userProfile?.username || '게스트'}</div><div className="profile-level">Lv. {userProfile?.level || 1}</div></div>
                    {currentView !== 'waiting' ? (
                        <div className="sidebar-nav-buttons"><button className={`nav-btn ${currentView === 'lobby' ? 'active' : ''}`} onClick={() => setCurrentView('lobby')}><FaDoorOpen /><span>로비</span></button><button className={`nav-btn ${currentView === 'create' ? 'active' : ''}`} onClick={handleCreateRoom}><FaPlus /><span>방 만들기</span></button></div>
                    ) : (
                        <div className="sidebar-nav-buttons"><button className="leave-room-btn" onClick={handleLeaveRoom}><FaTimes /><span>방 나가기</span></button></div>
                    )}
                    {currentView === 'waiting' ? (
                        <div className="sidebar-room-chat">
                            <h3 className="room-chat-title"><FaComments /> 대기방 채팅</h3>
                            <div className="chat-messages">
                                {roomChatMessages.length === 0 ? (
                                    <div className="no-messages">채팅 메시지가 없습니다</div>
                                ) : (
                                    roomChatMessages.map((msg, idx) => (
                                        <div key={idx} className={`chat-message ${String(msg.userId) === String(userProfile?.id) ? 'my-message' : ''}`}>
                                            <span className="message-author">{msg.username}</span>
                                            <span className="message-separator"> : </span>
                                            <span className="message-content">{msg.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="chat-input-container">
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="메시지를 입력하세요..."
                                    value={roomChatInput}
                                    onChange={(e) => setRoomChatInput(e.target.value)}
                                    onKeyPress={handleRoomChatKeyPress}
                                />
                                <button className="chat-send-btn" onClick={handleSendRoomChat}>
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sidebar-friends"><h3 className="friends-title">친구 목록 ({friends.length})</h3><div className="friends-list">{isLoadingFriends ? <div>로딩 중...</div> : friends.length === 0 ? <div>친구가 없습니다</div> : friends.map((friend) => { const isOnline = isFriendOnline(friend); return (<div key={friend.friendshipId} className={`friend-item ${isOnline ? 'online' : 'offline'}`}><ProfileAvatar profileImage={{ imagePath: friend.profileImagePath }} outlineImage={{ imagePath: friend.outlineImagePath }} size={40} className="friend-avatar" /><div className="friend-info"><div className="friend-name">{friend.username}</div><div className="friend-level">Lv. {friend.level || 1}</div></div>{isOnline && <div className="friend-status-online">온라인</div>}<div className="friend-status-dot"></div></div>); })}</div></div>
                    )}
                </div>
            </div>
            {showFriendInviteModal && (
                <div className="friend-invite-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowFriendInviteModal(false); }}>
                    <div className="friend-invite-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="friend-invite-header">
                            <h3>친구 초대</h3>
                            <button className="close-btn" onClick={() => setShowFriendInviteModal(false)}>×</button>
                        </div>
                        <div className="friend-invite-body">
                            {isLoadingFriends ? <div className="loading">친구 목록을 불러오는 중...</div> : friends.length === 0 ? <div className="no-friends">친구가 없습니다.</div> : (
                                <div className="friend-invite-list">
                                    {friends.map((friend) => {
                                        const isOnline = isFriendOnline(friend);
                                        return (
                                            <div key={friend.friendshipId} className={`friend-invite-item ${isOnline ? 'online' : 'offline'}`} onClick={() => isOnline && handleInviteFriendToRoom(friend)}>
                                                <ProfileAvatar profileImage={{ imagePath: friend.profileImagePath }} outlineImage={{ imagePath: friend.outlineImagePath }} size={40} className="friend-avatar" />
                                                <div className="friend-info"><div className="friend-name">{friend.username}</div><div className="friend-level">Lv. {friend.level || 1}</div></div>
                                                {isOnline ? <div className="friend-status-online">온라인</div> : <div className="friend-status-offline">오프라인</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showSpectatorList && (
                <div className="spectator-list-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowSpectatorList(false); }}>
                    <div className="spectator-list-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="spectator-list-header">
                            <h3>관전자 목록</h3>
                            <button className="close-btn" onClick={() => setShowSpectatorList(false)}>×</button>
                        </div>
                        <div className="spectator-list-body">
                            {currentRoom?.spectators?.length === 0 ? (
                                <div className="no-spectators">관전자가 없습니다.</div>
                            ) : (
                                <div className="spectator-list">
                                    {currentRoom?.spectators?.map((spectator) => (
                                        <div key={spectator.userId} className="spectator-item">
                                            <ProfileAvatar
                                                profileImage={formatProfileImage(spectator.selectedProfile)}
                                                outlineImage={formatOutlineImage(spectator.selectedOutline)}
                                                size={50}
                                            />
                                            <div className="spectator-info">
                                                <div className="spectator-name">
                                                    {spectator.host && <FaCrown className="host-icon" />}
                                                    {spectator.username}
                                                </div>
                                                <div className="spectator-level">Lv. {spectator.level}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {inviteNotification && (<div className={`invite-notification ${inviteNotification.type}`}>{inviteNotification.message}</div>)}
            {isReconnecting && (
                <div
                    className="reconnecting-overlay"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.preventDefault()}
                    onKeyUp={(e) => e.preventDefault()}
                    onKeyPress={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    tabIndex={-1}
                >
                    <div className="reconnecting-spinner"></div>
                    <div className="reconnecting-message">재연결 중...</div>
                </div>
            )}
        </div>
    );
}

export default MinigameModal;