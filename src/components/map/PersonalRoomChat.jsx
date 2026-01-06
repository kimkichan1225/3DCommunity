import React, { useEffect, useState, useRef } from 'react';
import multiplayerService from '../../services/multiplayerService';

function PersonalRoomChat({ roomId, userProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to server room topic
    multiplayerService.subscribeRoomChat(roomId);

    // Handler for incoming messages
    const onRoomChat = (chatData) => {
      if (chatData?.roomId !== roomId) return;
      setMessages(prev => [...prev, chatData]);
    };

    const unsub = multiplayerService.onRoomChat(onRoomChat);

    return () => {
      unsub?.();
      multiplayerService.unsubscribeRoomChat(roomId);
    };
  }, [roomId]);

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
  };

  return (
    <div style={{ position: 'absolute', right: 16, bottom: 16, width: 320, maxHeight: '60vh', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏠 방 채팅</span>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{roomId}</span>
      </div>
      <div ref={messagesRef} className="personal-room-chat-messages" style={{ overflowY: 'auto', flex: 1, padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <strong style={{ fontSize: 13 }}>{m.username}:</strong>
            <span style={{ fontSize: 13, wordBreak: 'break-word' }}>{m.message}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="메시지 입력 (Enter로 전송)" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', outline: 'none' }} />
        <button onClick={handleSend} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#4a90d9', color: '#fff' }}>전송</button>
      </div>
    </div>
  );
}

export default PersonalRoomChat;