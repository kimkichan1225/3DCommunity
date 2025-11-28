import React, { useState } from 'react';
import './GlobalChat.css';

function GlobalChat({ isVisible = true }) {
  const [messages, setMessages] = useState([
    { id: 1, username: 'Player1', text: '안녕하세요!', timestamp: '12:30' },
    { id: 2, username: 'Player2', text: '여기 사람 많네요', timestamp: '12:31' },
    { id: 3, username: 'Player3', text: '같이 게임하실 분?', timestamp: '12:32' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now(),
        username: 'You',
        text: inputText,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`global-chat-container ${isMinimized ? 'minimized' : ''}`}>
      {/* 헤더 */}
      <div className="global-chat-header">
        <div className="header-left">
          <span className="chat-icon">💬</span>
          <span className="chat-title">전체 채팅</span>
          <span className="online-count">• {messages.length} online</span>
        </div>
        <div className="header-buttons">
          <button
            className="minimize-button"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      {!isMinimized && (
        <>
          <div className="global-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-timestamp">{msg.timestamp}</span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* 입력 영역 */}
          <form className="global-chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="global-chat-input"
              placeholder="메시지를 입력하세요... (Enter)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={200}
            />
            <button type="submit" className="send-button">
              ➤
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default GlobalChat;
