import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';

function ChatRoom({ chat, currentUserId, currentUsername, onBack, onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // TODO: 백엔드 API 연동 후 실제 대화 내역 가져오기
  useEffect(() => {
    // 임시 더미 데이터
    setMessages([
      {
        id: 1,
        senderId: chat.friendId,
        senderName: chat.friendName,
        content: '안녕하세요!',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isMine: false,
      },
      {
        id: 2,
        senderId: currentUserId,
        senderName: currentUsername,
        content: '안녕하세요! 반가워요',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        isMine: true,
      },
      {
        id: 3,
        senderId: chat.friendId,
        senderName: chat.friendName,
        content: '오늘 광장에서 봤어요',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isMine: false,
      },
    ]);
  }, [chat, currentUserId, currentUsername]);

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

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      senderId: currentUserId,
      senderName: currentUsername,
      content: inputMessage.trim(),
      timestamp: new Date(),
      isMine: true,
    };

    setMessages(prev => [...prev, newMessage]);
    onSendMessage(inputMessage.trim());
    setInputMessage('');
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
        <div className="chat-room-avatar" data-profile={chat.profile}>
          {chat.isOnline && <div className="online-indicator"></div>}
          {chat.friendName.charAt(0)}
        </div>
        <div className="chat-room-info">
          <div className="chat-room-name">{chat.friendName}</div>
          <div className={`chat-room-status ${chat.isOnline ? 'online' : 'offline'}`}>
            {chat.isOnline ? '온라인' : '오프라인'}
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="messages-container">
        {messages.map((message, index) => {
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
                  <div className="message-avatar" data-profile={chat.profile}>
                    {chat.friendName.charAt(0)}
                  </div>
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
        })}
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
    </div>
  );
}

export default ChatRoom;
