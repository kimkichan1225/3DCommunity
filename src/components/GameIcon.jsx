import React from 'react';
import './GameIcon.css';

/**
 * GameIcon 컴포넌트
 * - 화면 중앙 하단에 게임 아이콘 표시
 * - 클릭 시 게임 진입 또는 다른 동작 수행
 */
function GameIcon({ onClick, onCreateRoom, visible = true }) {
  if (!visible) return null;

  return (
    <div className="game-icon-container">
      <button className="game-icon-button" onClick={onClick} title="미니게임 로비">
        <img src="/resources/Icon/Game-icon.png" alt="Game" />
        <div className="game-icon-label">미니게임 로비</div>
      </button>
      <button className="game-icon-button create-room" onClick={onCreateRoom} title="방 생성">
        <img src="/resources/Icon/Event-icon.png" alt="Create Room" />
        <div className="game-icon-label">방 생성</div>
      </button>
    </div>
  );
}

export default GameIcon;
