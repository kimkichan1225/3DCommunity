import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';
import messageService from '../../services/messageService';
import multiplayerService from '../../services/multiplayerService';
import Popup from '../Popup';
import ProfileAvatar from '../ProfileAvatar';

function ChatRoom({ chat, currentUserId, currentUsername, onBack, onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const messagesEndRef = useRef(null);

  // 대화 내역 불러오기 및 WebSocket 구독
  useEffect(() => {
    loadMessages();

    // WebSocket: DM 메시지 구독
    multiplayerService.onDMMessage((data) => {
      console.log('DM message received in ChatRoom:', data);

      // 현재 채팅방의 친구로부터 온 메시지인지 확인
      if (data.senderId === chat.friendId) {
        const newMessage = {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderUsername,
          content: data.content,
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          isMine: false,
        };

        setMessages(prev => [...prev, newMessage]);
      }
    });

    // Cleanup
    return () => {
      multiplayerService.onDMMessage(null);
    };
  }, [chat.friendId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getDMHistory(chat.friendId, 50);

      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderUsername,
        content: msg.content,
        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        isMine: msg.senderId === currentUserId,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('메시지 로드 실패:', error);
      // 에러 시 빈 배열로 설정
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // 새 메시지가 추가되면 스크롤 하단으로
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const messageContent = inputMessage.trim();

    try {
      // 백엔드에 메시지 전송
      await onSendMessage(messageContent);

      // 즉시 UI에 메시지 추가 (낙관적 업데이트)
      const newMessage = {
        id: Date.now(), // 임시 ID
        senderId: currentUserId,
        senderName: currentUsername,
        content: messageContent,
        timestamp: new Date(),
        isMine: true,
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setPopupMessage('메시지 전송에 실패했습니다.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-room-container">
      {/* 헤더 */}
      <div className="chat-room-header">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <ProfileAvatar
          profileImage={{ imagePath: chat.profileImagePath }}
          outlineImage={{ imagePath: chat.outlineImagePath }}
          size={45}
          className="chat-room-avatar-img"
        />
        <div className="chat-room-info">
          <div className="chat-room-name">{chat.friendName}</div>
          <div className={`chat-room-status ${chat.isOnline ? 'online' : 'offline'}`}>
            {chat.isOnline ? '온라인' : '오프라인'}
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="messages-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-text">메시지를 불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-text">아직 대화 내역이 없습니다.</div>
            <div className="empty-subtext">첫 메시지를 보내보세요!</div>
          </div>
        ) : (
          messages.map((message, index) => {
          // 날짜 구분선 표시 (전 메시지와 날짜가 다르면)
          const showDateDivider =
            index === 0 ||
            new Date(messages[index - 1].timestamp).toDateString() !==
              new Date(message.timestamp).toDateString();

          return (
            <React.Fragment key={message.id}>
              {showDateDivider && (
                <div className="date-divider">
                  {new Date(message.timestamp).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
              <div className={`message-wrapper ${message.isMine ? 'mine' : 'theirs'}`}>
                {!message.isMine && (
                  <ProfileAvatar
                    profileImage={{ imagePath: chat.profileImagePath }}
                    outlineImage={{ imagePath: chat.outlineImagePath }}
                    size={35}
                    className="message-avatar-img"
                  />
                )}
                <div className="message-content">
                  {!message.isMine && (
                    <div className="message-sender">{message.senderName}</div>
                  )}
                  <div className="message-bubble">
                    <div className="message-text">{message.content}</div>
                  </div>
                  <div className="message-time">{formatMessageTime(message.timestamp)}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          placeholder="메시지를 입력하세요..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputMessage.trim()}
        >
          ➤
        </button>
      </div>

      {/* 팝업 메시지 */}
      {popupMessage && (
        <Popup message={popupMessage} onClose={() => setPopupMessage(null)} />
      )}
    </div>
  );
}

export default ChatRoom;
