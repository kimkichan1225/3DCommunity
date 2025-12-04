import React, { useState } from 'react';
import './PhoneUI.css';
import FriendList from './phone/FriendList';
import ChatList from './phone/ChatList';

function PhoneUI({ isOpen, onClose, userId, username }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'chats'

  if (!isOpen) return null;

  return (
    <div className="phone-ui-overlay" onClick={onClose}>
      <div className="phone-container" onClick={(e) => e.stopPropagation()}>
        {/* 폰 상단 (노치) */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
        </div>

        {/* 폰 헤더 */}
        <div className="phone-header">
          <h2 className="phone-title">MetaPlaza</h2>
          <button className="phone-close-btn" onClick={onClose}>×</button>
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
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="phone-content">
          {activeTab === 'friends' && (
            <FriendList userId={userId} username={username} />
          )}
          {activeTab === 'chats' && (
            <ChatList userId={userId} username={username} />
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
