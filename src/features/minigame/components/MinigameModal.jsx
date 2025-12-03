import React, { useState } from 'react';
import './MinigameModal.css';
import { FaGamepad, FaUsers, FaLock, FaUnlock } from 'react-icons/fa';

function MinigameModal({ onClose }) {
  const [formData, setFormData] = useState({
    gameType: 'tictactoe',
    roomTitle: '',
    maxPlayers: 2,
    isPublic: true,
    location: 'plaza' // 'plaza' 또는 'local'
  });

  const gameTypes = [
    { value: 'tictactoe', label: '틱택토' },
    { value: 'omok', label: '오목' },
    { value: 'chess', label: '체스' },
    { value: 'checkers', label: '체커' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.roomTitle.trim()) {
      alert('방 제목을 입력해주세요.');
      return;
    }

    // TODO: 서비스 함수 연결
    console.log('게임 방 생성:', formData);
    alert('게임 방이 생성되었습니다!');
    onClose();
  };

  return (
    <div className="minigame-modal-overlay" onClick={onClose}>
      <div className="minigame-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="minigame-modal-header">
          <div className="minigame-header-left">
            <FaGamepad className="minigame-icon" />
            <h2>게임 로비 생성</h2>
          </div>
          <button className="minigame-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="minigame-modal-content">
          <form onSubmit={handleSubmit} className="minigame-form">
            {/* 게임 종류 선택 */}
            <div className="form-group">
              <label htmlFor="gameType">
                <FaGamepad /> 게임 종류
              </label>
              <select
                id="gameType"
                value={formData.gameType}
                onChange={(e) => handleChange('gameType', e.target.value)}
                className="form-select"
              >
                {gameTypes.map(game => (
                  <option key={game.value} value={game.value}>
                    {game.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 방 제목 */}
            <div className="form-group">
              <label htmlFor="roomTitle">방 제목</label>
              <input
                type="text"
                id="roomTitle"
                value={formData.roomTitle}
                onChange={(e) => handleChange('roomTitle', e.target.value)}
                placeholder="게임 방 제목을 입력하세요"
                className="form-input"
                maxLength={50}
              />
            </div>

            {/* 최대 인원 */}
            <div className="form-group">
              <label htmlFor="maxPlayers">
                <FaUsers /> 최대 인원
              </label>
              <select
                id="maxPlayers"
                value={formData.maxPlayers}
                onChange={(e) => handleChange('maxPlayers', parseInt(e.target.value))}
                className="form-select"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    {num}명
                  </option>
                ))}
              </select>
            </div>

            {/* 공개/비공개 설정 */}
            <div className="form-group">
              <label>공개 설정</label>
              <div className="radio-group">
                <label className={`radio-option ${formData.isPublic ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={() => handleChange('isPublic', true)}
                  />
                  <FaUnlock className="radio-icon" />
                  <span>공개</span>
                </label>
                <label className={`radio-option ${!formData.isPublic ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="isPublic"
                    checked={!formData.isPublic}
                    onChange={() => handleChange('isPublic', false)}
                  />
                  <FaLock className="radio-icon" />
                  <span>비공개</span>
                </label>
              </div>
            </div>

            {/* 위치 설정 */}
            <div className="form-group">
              <label>방 위치</label>
              <div className="radio-group">
                <label className={`radio-option ${formData.location === 'plaza' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="location"
                    checked={formData.location === 'plaza'}
                    onChange={() => handleChange('location', 'plaza')}
                  />
                  <span>광장</span>
                </label>
                <label className={`radio-option ${formData.location === 'local' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="location"
                    checked={formData.location === 'local'}
                    onChange={() => handleChange('location', 'local')}
                  />
                  <span>로컬 방</span>
                </label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-cancel">
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                방 만들기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MinigameModal;
