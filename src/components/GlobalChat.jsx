import React, { useState, useEffect, useRef } from 'react';
import './GlobalChat.css';
import multiplayerService from '../services/multiplayerService';

function GlobalChat({ isVisible = true, username, userId, onlineCount: externalOnlineCount }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);

  // 외부에서 전달받은 온라인 카운트 사용
  useEffect(() => {
    if (externalOnlineCount !== undefined) {
      setOnlineCount(externalOnlineCount);
    }
  }, [externalOnlineCount]);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket 채팅 메시지 수신
  useEffect(() => {
    const handleChatMessage = (data) => {
      const newMessage = {
        id: data.timestamp || Date.now(),
        username: data.username,
        userId: data.userId,
        text: data.message,
        timestamp: new Date(data.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages(prev => [...prev, newMessage]);
    };

    // 플레이어 입장 알림
    const handlePlayerJoin = (data) => {
      const systemMessage = {
        id: Date.now(),
        username: 'System',
        userId: 'system',
        text: `${data.username}님이 입장하셨습니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isSystem: true
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    // 플레이어 퇴장 알림
    const handlePlayerLeave = (data) => {
      const systemMessage = {
        id: Date.now(),
        username: 'System',
        userId: 'system',
        text: `${data.username}님이 퇴장하셨습니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isSystem: true
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    multiplayerService.onChatMessage(handleChatMessage);
    multiplayerService.onPlayerJoin(handlePlayerJoin);
    multiplayerService.onPlayerLeave(handlePlayerLeave);

    return () => {
      // Cleanup
      multiplayerService.onChatMessage(null);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() && multiplayerService.connected) {
      // WebSocket으로 메시지 전송
      multiplayerService.sendChatMessage(inputText.trim());
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
          <span className="online-count">• {onlineCount} online</span>
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
            {messages.length === 0 && (
              <div className="chat-empty-message">
                채팅 메시지가 없습니다. 첫 메시지를 보내보세요!
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.isSystem ? 'system-message' : ''} ${String(msg.userId) === String(userId) ? 'my-message' : ''}`}
              >
                {!msg.isSystem && (
                  <div className="message-header">
                    <span className="message-username">
                      {String(msg.userId) === String(userId) ? '나' : msg.username}
                    </span>
                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
