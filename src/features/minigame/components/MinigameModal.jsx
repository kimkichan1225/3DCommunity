import React, { useState, useEffect } from 'react';
import './MinigameModal.css';
import ProfileAvatar from '../../../components/ProfileAvatar';
import { FaTimes, FaPlus, FaGamepad, FaUsers, FaCrown, FaLock } from 'react-icons/fa';
import friendService from '../../../services/friendService';

function MinigameModal({ onClose, userProfile, onlinePlayers }) {
  // 더미 데이터 - 방 목록
  const [rooms] = useState([
    {
      id: 1,
      name: '친구들과 즐기는 미니게임',
      gameName: '두더지 잡기',
      hostName: '플레이어123',
      currentPlayers: 3,
      maxPlayers: 4,
      isLocked: false,
      isPlaying: false
    },
    {
      id: 2,
      name: '초보 환영 방',
      gameName: '숨바꼭질',
      hostName: '게임마스터',
      currentPlayers: 2,
      maxPlayers: 6,
      isLocked: false,
      isPlaying: false
    },
    {
      id: 3,
      name: '고수들의 대결',
      gameName: '레이싱',
      hostName: 'SpeedKing',
      currentPlayers: 4,
      maxPlayers: 4,
      isLocked: true,
      isPlaying: true
    },
    {
      id: 4,
      name: '누구나 참여 가능!',
      gameName: '퀴즈쇼',
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
    // TODO: 방 입장 로직 구현
  };

  const handleCreateRoom = () => {
    console.log('방 생성 클릭');
    // TODO: 방 생성 모달 열기
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
              <FaGamepad /> 미니게임 로비
            </h2>
            <button className="minigame-close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* 방 목록 */}
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

          {/* 방 생성 버튼 */}
          <button className="create-room-btn" onClick={handleCreateRoom}>
            <FaPlus />
            <span>방 만들기</span>
          </button>

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
