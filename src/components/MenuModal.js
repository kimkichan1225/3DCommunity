import React from 'react';
import { FaCog, FaPlay, FaSignOutAlt } from 'react-icons/fa';
import './MenuModal.css';
import authService from '../services/authService';

function MenuModal({ onClose, onLogout }) {
  const handleLogout = () => {
    authService.logout();
    onLogout();
    onClose();
  };

  const handleContinue = () => {
    onClose();
  };

  const handleSettings = () => {
    // TODO: 설정 페이지 구현
    alert('설정 기능은 곧 구현될 예정입니다.');
  };

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="menu-modal-title">메뉴</h2>

        <div className="menu-modal-buttons">
          <button className="menu-modal-btn continue-btn" onClick={handleContinue}>
            <FaPlay />
            <span>계속하기</span>
          </button>

          <button className="menu-modal-btn settings-btn" onClick={handleSettings}>
            <FaCog />
            <span>설정</span>
          </button>

          <button className="menu-modal-btn logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>로그아웃</span>
          </button>
        </div>

        <p className="menu-modal-hint">ESC 키를 다시 누르면 닫힙니다</p>
      </div>
    </div>
  );
}

export default MenuModal;
