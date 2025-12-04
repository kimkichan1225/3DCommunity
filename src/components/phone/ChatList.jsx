import React, { useState, useEffect } from 'react';
import './ChatList.css';
import ChatRoom from './ChatRoom';

function ChatList({ userId, username }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // TODO: 백엔드 API 연동 후 실제 데이터 가져오기
  useEffect(() => {
    // 임시 더미 데이터
    setChatRooms([
      {
        id: 1,
        friendId: 1,
        friendName: '김철수',
        lastMessage: '안녕하세요! 오늘 광장에서 봤어요',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
        unreadCount: 2,
        isOnline: true,
        profile: 1,
      },
      {
        id: 2,
        friendId: 2,
        friendName: '이영희',
        lastMessage: '내일 같이 미니게임 할래요?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
        unreadCount: 0,
        isOnline: false,
        profile: 2,
      },
      {
        id: 3,
        friendId: 3,
        friendName: '박민수',
        lastMessage: '좋아요! 그럼 그때 봐요~',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
        unreadCount: 0,
        isOnline: true,
        profile: 3,
      },
    ]);
  }, [userId]);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    // 읽음 처리
    setChatRooms(prev =>
      prev.map(room =>
        room.id === chat.id ? { ...room, unreadCount: 0 } : room
      )
    );
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const handleSendMessage = (message) => {
    // TODO: 백엔드 API 호출
    console.log('메시지 전송:', message);

    // 채팅방 목록 업데이트
    setChatRooms(prev =>
      prev.map(room =>
        room.id === selectedChat.id
          ? { ...room, lastMessage: message, lastMessageTime: new Date() }
          : room
      )
    );
  };

  // 채팅방이 선택되면 ChatRoom 컴포넌트 표시
  if (selectedChat) {
    return (
      <ChatRoom
        chat={selectedChat}
        currentUserId={userId}
        currentUsername={username}
        onBack={handleBackToList}
        onSendMessage={handleSendMessage}
      />
    );
  }

  // 채팅 목록 표시
  return (
    <div className="chat-list-container">
      {chatRooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-text">아직 대화 내역이 없습니다.</div>
          <div className="empty-subtext">친구에게 메시지를 보내보세요!</div>
        </div>
      ) : (
        <div className="chat-rooms">
          {chatRooms.map(chat => (
            <div
              key={chat.id}
              className="chat-room-item"
              onClick={() => handleChatClick(chat)}
            >
              <div className="chat-avatar" data-profile={chat.profile}>
                {chat.isOnline && <div className="online-indicator"></div>}
                {chat.friendName.charAt(0)}
              </div>
              <div className="chat-content">
                <div className="chat-header">
                  <div className="chat-name">{chat.friendName}</div>
                  <div className="chat-time">{formatTime(chat.lastMessageTime)}</div>
                </div>
                <div className="chat-preview">
                  <div className="chat-last-message">{chat.lastMessage}</div>
                  {chat.unreadCount > 0 && (
                    <div className="chat-unread-badge">{chat.unreadCount}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList;
