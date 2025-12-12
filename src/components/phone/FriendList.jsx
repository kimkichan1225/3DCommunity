import React, { useState, useEffect } from 'react';
import './FriendList.css';
import friendService from '../../services/friendService';
import multiplayerService from '../../services/multiplayerService';
import Popup from '../Popup';
import ProfileAvatar from '../ProfileAvatar';

function FriendList({ userId, username, onlinePlayers }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // 친구 목록 및 요청 불러오기
  useEffect(() => {
    loadFriends();
    loadPendingRequests();

    // WebSocket: 친구 업데이트 구독 (목록 새로고침만 수행, 알림은 App.js에서 처리)
    const unsubscribe = multiplayerService.onFriendUpdate((data) => {
      console.log('Friend update received in FriendList:', data);

      if (data.type === 'FRIEND_REQUEST') {
        // 새 친구 요청 받음 - 목록만 새로고침
        setTimeout(() => {
          loadPendingRequests();
        }, 300);
      } else if (data.type === 'FRIEND_ACCEPTED') {
        // 친구 요청이 수락됨 - 목록만 새로고침
        setTimeout(() => {
          loadFriends();
        }, 300);
      }
    });

    // Cleanup
    return unsubscribe;
  }, [userId]);

  const loadFriends = async () => {
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await friendService.getReceivedRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error('친구 요청 로드 실패:', error);
    }
  };

  const handleAcceptFriend = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      setPopupMessage('친구 요청을 수락했습니다.');
      // 약간의 지연 후 목록 새로고침 (DB 트랜잭션 완료 확실히 대기)
      setTimeout(() => {
        loadFriends();
        loadPendingRequests();
      }, 300);
    } catch (error) {
      setPopupMessage(error.response?.data?.message || '친구 수락에 실패했습니다.');
    }
  };

  const handleRejectFriend = async (friendshipId) => {
    try {
      await friendService.rejectFriendRequest(friendshipId);
      setPopupMessage('친구 요청을 거절했습니다.');
      loadPendingRequests();
    } catch (error) {
      setPopupMessage(error.response?.data?.message || '친구 거절에 실패했습니다.');
    }
  };

  const handleRemoveFriend = (friendshipId) => {
    setConfirmAction({
      message: '정말 친구를 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          await friendService.removeFriend(friendshipId);
          setPopupMessage('친구를 삭제했습니다.');
          loadFriends();
        } catch (error) {
          setPopupMessage(error.response?.data?.message || '친구 삭제에 실패했습니다.');
        }
      }
    });
  };

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) {
      setPopupMessage('사용자명을 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      await friendService.sendFriendRequest(searchQuery);
      setPopupMessage(`${searchQuery}님에게 친구 요청을 보냈습니다.`);
      setSearchQuery('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || '친구 요청에 실패했습니다.';
      // SQL 오류 메시지를 사용자 친화적으로 변환
      if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
        setPopupMessage('이미 친구 요청을 보냈거나 친구 관계가 존재합니다.');
      } else {
        setPopupMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-list-container">
      {/* 친구 추가 검색 */}
      <div className="friend-search-box">
        <input
          type="text"
          className="friend-search-input"
          placeholder="닉네임으로 친구 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
        />
        <button className="friend-add-btn" onClick={handleAddFriend} disabled={loading}>
          {loading ? '...' : '추가'}
        </button>
      </div>

      {/* 받은 친구 요청 */}
      {pendingRequests.length > 0 && (
        <div className="friend-section">
          <h3 className="friend-section-title">
            친구 요청 <span className="badge">{pendingRequests.length}</span>
          </h3>
          <div className="friend-requests">
            {pendingRequests.map(request => (
              <div key={request.friendshipId} className="friend-request-item">
                <ProfileAvatar
                  profileImage={{ imagePath: request.profileImagePath }}
                  outlineImage={{ imagePath: request.outlineImagePath }}
                  size={50}
                  className="friend-avatar-img"
                />
                <div className="friend-info">
                  <div className="friend-name">{request.username}</div>
                  <div className="friend-status">친구 요청</div>
                </div>
                <div className="friend-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptFriend(request.friendshipId)}
                  >
                    수락
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRejectFriend(request.friendshipId)}
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 친구 목록 */}
      <div className="friend-section">
        <h3 className="friend-section-title">
          친구 <span className="badge">{friends.length}</span>
        </h3>
        {filteredFriends.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? '검색 결과가 없습니다.' : '아직 친구가 없습니다.'}
          </div>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map(friend => {
              // 멀티플레이어 데이터에서 실시간 온라인 상태 확인
              const isOnlineNow = onlinePlayers && Object.values(onlinePlayers).some(
                player => player.username === friend.username
              );

              return (
                <div key={friend.friendshipId} className="friend-item">
                  <div className="friend-avatar-wrapper">
                    {isOnlineNow && <div className="online-indicator"></div>}
                    <ProfileAvatar
                      profileImage={{ imagePath: friend.profileImagePath }}
                      outlineImage={{ imagePath: friend.outlineImagePath }}
                      size={50}
                      className="friend-avatar-img"
                    />
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">{friend.username}</div>
                    <div className={`friend-status ${isOnlineNow ? 'online' : 'offline'}`}>
                      {isOnlineNow ? '온라인' : '오프라인'}
                    </div>
                  </div>
                  <button
                    className="remove-friend-btn"
                    onClick={() => handleRemoveFriend(friend.friendshipId)}
                    title="친구 삭제"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 팝업 메시지 */}
      {popupMessage && (
        <Popup message={popupMessage} onClose={() => setPopupMessage(null)} />
      )}

      {/* 확인 팝업 */}
      {confirmAction && (
        <ConfirmPopup
          message={confirmAction.message}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// 확인 팝업 컴포넌트
function ConfirmPopup({ message, onConfirm, onCancel }) {
  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-content">
          <div className="popup-message">{message}</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="popup-close-btn" onClick={onConfirm}>
              확인
            </button>
            <button className="popup-close-btn" onClick={onCancel} style={{ background: 'linear-gradient(135deg, #999 0%, #666 100%)' }}>
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendList;
