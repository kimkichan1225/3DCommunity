import React, { useState, useEffect } from 'react';
import './FriendList.css';

function FriendList({ userId, username }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: 백엔드 API 연동 후 실제 데이터 가져오기
  useEffect(() => {
    // 임시 더미 데이터
    setFriends([
      { id: 1, username: '김철수', isOnline: true, profile: 1 },
      { id: 2, username: '이영희', isOnline: false, profile: 2 },
      { id: 3, username: '박민수', isOnline: true, profile: 3 },
    ]);

    setPendingRequests([
      { id: 4, username: '최지은', profile: 1 },
    ]);
  }, [userId]);

  const handleAcceptFriend = (friendId) => {
    // TODO: 백엔드 API 호출
    console.log('친구 수락:', friendId);
    setPendingRequests(prev => prev.filter(req => req.id !== friendId));
  };

  const handleRejectFriend = (friendId) => {
    // TODO: 백엔드 API 호출
    console.log('친구 거절:', friendId);
    setPendingRequests(prev => prev.filter(req => req.id !== friendId));
  };

  const handleRemoveFriend = (friendId) => {
    // TODO: 백엔드 API 호출
    if (window.confirm('정말 친구를 삭제하시겠습니까?')) {
      console.log('친구 삭제:', friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
    }
  };

  const handleAddFriend = () => {
    if (!searchQuery.trim()) {
      alert('사용자명을 입력하세요.');
      return;
    }
    // TODO: 백엔드 API 호출
    console.log('친구 추가 요청:', searchQuery);
    alert(`${searchQuery}님에게 친구 요청을 보냈습니다.`);
    setSearchQuery('');
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
          placeholder="사용자명으로 친구 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
        />
        <button className="friend-add-btn" onClick={handleAddFriend}>
          추가
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
              <div key={request.id} className="friend-request-item">
                <div className="friend-avatar" data-profile={request.profile}>
                  {request.username.charAt(0)}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{request.username}</div>
                  <div className="friend-status">친구 요청</div>
                </div>
                <div className="friend-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptFriend(request.id)}
                  >
                    수락
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRejectFriend(request.id)}
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
              <div key={friend.id} className="friend-item">
                <div className="friend-avatar" data-profile={friend.profile}>
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
                  onClick={() => handleRemoveFriend(friend.id)}
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
