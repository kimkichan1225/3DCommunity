import React, { useState, useEffect } from 'react';
import './ChatList.css';
import ChatRoom from './ChatRoom';
import messageService from '../../services/messageService';
import ProfileAvatar from '../ProfileAvatar';

function ChatList({ userId, username, onlinePlayers, onUnreadCountChange, initialFriend, onChatOpened }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);

  // 대화 목록 불러오기
  useEffect(() => {
    loadConversations();
  }, [userId]);

  // 총 읽지 않은 메시지 개수 계산 및 부모에게 알림
  useEffect(() => {
    const totalUnread = chatRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    if (onUnreadCountChange) {
      onUnreadCountChange(totalUnread);
    }
  }, [chatRooms, onUnreadCountChange]);

  // 초기 친구가 전달된 경우 해당 친구와의 채팅 자동 열기
  useEffect(() => {
    if (initialFriend) {
      setSelectedChat(initialFriend);
      if (onChatOpened) {
        onChatOpened();
      }
    }
  }, [initialFriend, onChatOpened]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const formattedData = data.map(conv => ({
        id: conv.friendId,
        friendId: conv.friendId,
        friendName: conv.friendUsername,
        lastMessage: conv.lastMessage || '대화를 시작해보세요!',
        lastMessageTime: conv.lastMessageTime ? new Date(conv.lastMessageTime) : null,
        unreadCount: conv.unreadCount || 0,
        isOnline: conv.friendIsOnline || false,
        profile: conv.friendProfile || 1,
        profileImagePath: conv.friendProfileImagePath,
        outlineImagePath: conv.friendOutlineImagePath,
      }));
      setChatRooms(formattedData);
    } catch (error) {
      console.error('대화 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';

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
    // 목록으로 돌아올 때 대화 목록 새로고침
    loadConversations();
  };

  const handleSendMessage = async (message) => {
    try {
      await messageService.sendDM(selectedChat.friendId, message);

      // 채팅방 목록 업데이트
      setChatRooms(prev =>
        prev.map(room =>
          room.id === selectedChat.id
            ? { ...room, lastMessage: message, lastMessageTime: new Date() }
            : room
        )
      );
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
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
      {loading ? (
        <div className="empty-state">
          <div className="empty-text">로딩 중...</div>
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-text">아직 대화 내역이 없습니다.</div>
          <div className="empty-subtext">친구 목록에서 친구를 추가한 후<br/>메시지를 보내보세요!</div>
        </div>
      ) : (
        <div className="chat-rooms">
          {chatRooms.map(chat => {
            // 멀티플레이어 데이터에서 실시간 온라인 상태 확인
            const isOnlineNow = onlinePlayers && Object.values(onlinePlayers).some(
              player => player.username === chat.friendName
            );

            return (
              <div
                key={chat.id}
                className="chat-room-item"
                onClick={() => handleChatClick(chat)}
              >
                <div className="chat-avatar-wrapper">
                  {isOnlineNow && <div className="online-indicator"></div>}
                  <ProfileAvatar
                    profileImage={{ imagePath: chat.profileImagePath }}
                    outlineImage={{ imagePath: chat.outlineImagePath }}
                    size={50}
                    className="chat-avatar-img"
                  />
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChatList;
