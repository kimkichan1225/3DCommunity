import React from 'react';
import './GameMenu.css';
import useAuthStore from '../../store/useAuthStore';

function GameMenu({ isOpen, onClose }) {
  const logout = useAuthStore((state) => state.logout);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleProfile = () => {
    // TODO: 프로필 기능 구현 예정
    alert('프로필 기능은 준비 중입니다.');
  };

  const handleSettings = () => {
    // TODO: 설정 기능 구현 예정
    alert('설정 기능은 준비 중입니다.');
  };

  return (
    <div className="game-menu-overlay" onClick={onClose}>
      <div className="game-menu-container" onClick={(e) => e.stopPropagation()}>
        <div className="game-menu-header">
          <h2>메뉴</h2>
          <button className="game-menu-close" onClick={onClose}>×</button>
        </div>

        <div className="game-menu-content">
          <button className="game-menu-button" onClick={handleProfile}>
            <span className="game-menu-icon">👤</span>
            <span className="game-menu-text">프로필 / 내 정보</span>
          </button>

          <button className="game-menu-button" onClick={handleSettings}>
            <span className="game-menu-icon">⚙️</span>
            <span className="game-menu-text">설정</span>
          </button>

          <button className="game-menu-button logout" onClick={handleLogout}>
            <span className="game-menu-icon">🚪</span>
            <span className="game-menu-text">로그아웃</span>
          </button>
        </div>

        <div className="game-menu-footer">
          <p>ESC 키를 눌러 메뉴를 닫을 수 있습니다</p>
        </div>
      </div>
    </div>
  );
}

export default GameMenu;
