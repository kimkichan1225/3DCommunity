import React, { useEffect, useState, useRef } from 'react';
import multiplayerService from '../../services/multiplayerService';

function PersonalRoomChat({ roomId, userProfile, onChatMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    console.log('[PersonalRoomChat] mounting, requesting subscription for room:', roomId);

    // Subscribe to server room topic (will be queued if client not active)
    multiplayerService.subscribeRoomChat(roomId);

    // Handler for incoming messages
    const onRoomChat = (chatData) => {
      if (chatData?.roomId !== roomId) return;
      console.log('[PersonalRoomChat] received message:', chatData);
      setMessages(prev => [...prev, chatData]);
      
      // 말풍선 표시를 위해 부모에게 알림
      if (onChatMessage) {
        onChatMessage(chatData);
      }
    };

    const unsub = multiplayerService.onRoomChat(onRoomChat);

    return () => {
      console.log('[PersonalRoomChat] unmounting, unsubscribing from room:', roomId);
      unsub?.();
      multiplayerService.unsubscribeRoomChat(roomId);
    };
  }, [roomId, onChatMessage]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !roomId) return;
    multiplayerService.sendRoomChat(roomId, input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // 채팅 입력 중엔 캐릭터 이동 방지 (키 이벤트 전파 중단)
    e.stopPropagation();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      left: 24,  // 좌측으로 변경
      bottom: 150, // 네비게이션 바(130px) 위로 배치
      width: 340, 
      maxHeight: '40vh', 
      background: 'rgba(0,0,0,0.78)', 
      color: '#fff', 
      borderRadius: 12, 
      padding: 12, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 10, 
      zIndex: 9999, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
        <span>💬 방 채팅</span>
        <span style={{ fontSize: 11, opacity: 0.7, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomId}</span>
      </div>
      <div ref={messagesRef} className="personal-room-chat-messages" style={{ 
        overflowY: 'auto', 
        flex: 1, 
        padding: '6px 4px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 6,
        minHeight: 100
      }}>
        {messages.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: 20 }}>
            채팅을 시작해보세요!
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
            <strong style={{ fontSize: 12, color: '#7dd3fc', flexShrink: 0 }}>{m.username}</strong>
            <span style={{ fontSize: 12, wordBreak: 'break-word', color: '#e5e5e5' }}>{m.message}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input 
          ref={inputRef}
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKey} 
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="메시지 입력..." 
          style={{ 
            flex: 1, 
            padding: '10px 12px', 
            borderRadius: 8, 
            border: isFocused ? '1px solid #4a90d9' : '1px solid transparent', 
            outline: 'none', 
            background: 'rgba(255,255,255,0.08)', 
            color: '#fff',
            fontSize: 13
          }} 
        />
        <button 
          onClick={handleSend} 
          style={{ 
            padding: '10px 16px', 
            borderRadius: 8, 
            border: 'none', 
            background: 'linear-gradient(135deg, #4a90d9, #357abd)', 
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default PersonalRoomChat;