import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ position, playerData, onClose, onViewProfile, onAddFriend }) => {
  const menuRef = useRef(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!playerData) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="context-menu-header">
        <span className="player-name">{playerData.username}</span>
      </div>
      <div className="context-menu-divider"></div>
      <button
        className="context-menu-item"
        onClick={() => {
          onViewProfile(playerData);
          onClose();
        }}
      >
        <span className="menu-icon">👤</span>
        프로필 보기
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onAddFriend(playerData);
          onClose();
        }}
      >
        <span className="menu-icon">➕</span>
        친구 추가
      </button>
    </div>
  );
};

export default ContextMenu;
