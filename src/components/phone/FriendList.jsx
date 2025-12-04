import React, { useState, useEffect } from 'react';
import './FriendList.css';
import friendService from '../../services/friendService';

function FriendList({ userId, username }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // 친구 목록 및 요청 불러오기
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
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
      alert('친구 요청을 수락했습니다.');
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      alert(error.response?.data?.message || '친구 수락에 실패했습니다.');
    }
  };

  const handleRejectFriend = async (friendshipId) => {
    try {
      await friendService.rejectFriendRequest(friendshipId);
      alert('친구 요청을 거절했습니다.');
      loadPendingRequests();
    } catch (error) {
      alert(error.response?.data?.message || '친구 거절에 실패했습니다.');
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm('정말 친구를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await friendService.removeFriend(friendshipId);
      alert('친구를 삭제했습니다.');
      loadFriends();
    } catch (error) {
      alert(error.response?.data?.message || '친구 삭제에 실패했습니다.');
    }
  };

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) {
      alert('사용자명을 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      await friendService.sendFriendRequest(searchQuery);
      alert(`${searchQuery}님에게 친구 요청을 보냈습니다.`);
      setSearchQuery('');
    } catch (error) {
      alert(error.response?.data?.message || '친구 요청에 실패했습니다.');
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
                <div className="friend-avatar" data-profile={request.selectedProfile || 1}>
                  {request.username.charAt(0)}
                </div>
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
            {filteredFriends.map(friend => (
              <div key={friend.friendshipId} className="friend-item">
                <div className="friend-avatar" data-profile={friend.selectedProfile || 1}>
                  {friend.isOnline && <div className="online-indicator"></div>}
                  {friend.username.charAt(0)}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{friend.username}</div>
                  <div className={`friend-status ${friend.isOnline ? 'online' : 'offline'}`}>
                    {friend.isOnline ? '온라인' : '오프라인'}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendList;
