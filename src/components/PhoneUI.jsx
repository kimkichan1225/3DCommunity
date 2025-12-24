import React, { useState, useEffect, useCallback } from 'react';
import './PhoneUI.css';
import FriendList from './phone/FriendList';
import ChatList from './phone/ChatList';

function PhoneUI({ isOpen, onClose, userId, username, onlinePlayers, initialFriend, onInitialFriendOpened }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'chats'
  const [isClosing, setIsClosing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // 애니메이션 시간과 동일
  };

  const handleUnreadCountChange = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const handleOpenChat = useCallback((friend) => {
    // 친구 정보를 ChatList 형식으로 변환
    setSelectedFriend({
      id: friend.userId,
      friendId: friend.userId,
      friendName: friend.username,
      profileImagePath: friend.profileImagePath,
      outlineImagePath: friend.outlineImagePath,
    });
    // 채팅 탭으로 전환
    setActiveTab('chats');
  }, []);

  // 외부에서 전달된 initialFriend 처리 (DM 알림 클릭 시)
  useEffect(() => {
    if (initialFriend && isOpen) {
      setSelectedFriend(initialFriend);
      setActiveTab('chats');
      // 부모에게 알림이 처리되었음을 통지
      if (onInitialFriendOpened) {
        onInitialFriendOpened();
      }
    }
  }, [initialFriend, isOpen, onInitialFriendOpened]);

  if (!isOpen) return null;

  return (
    <div className="phone-ui-overlay">
      <div className={`phone-container ${isClosing ? 'closing' : ''}`}>
        {/* 폰 상단 (노치) */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
        </div>

        {/* 폰 헤더 */}
        <div className="phone-header">
          <h2 className="phone-title">MetaPlaza</h2>
          <button className="phone-close-btn" onClick={handleClose}>×</button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="phone-tabs">
          <button
            className={`phone-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-text">친구</span>
          </button>
          <button
            className={`phone-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-text">채팅</span>
            {unreadCount > 0 && (
              <span className="tab-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="phone-content">
          {activeTab === 'friends' && (
            <FriendList
              userId={userId}
              username={username}
              onlinePlayers={onlinePlayers}
              onOpenChat={handleOpenChat}
            />
          )}
          {activeTab === 'chats' && (
            <ChatList
              userId={userId}
              username={username}
              onlinePlayers={onlinePlayers}
              onUnreadCountChange={handleUnreadCountChange}
              initialFriend={selectedFriend}
              onChatOpened={() => setSelectedFriend(null)}
            />
          )}
        </div>

        {/* 홈 버튼 */}
        <div className="phone-bottom">
          <div className="phone-home-button"></div>
        </div>
      </div>
    </div>
  );
}

export default PhoneUI;
