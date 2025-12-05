import React, { useState } from 'react';
import friendService from '../services/friendService';
import './MinigameSelectPage.css';

const minigames = [
  { id: 1, name: 'OX 퀴즈', desc: '정답을 맞히는 퀴즈 게임' },
  { id: 2, name: '달리기', desc: '누가 더 빠른지 겨루는 게임' },
  { id: 3, name: '기억력 테스트', desc: '카드 짝 맞추기 게임' },
];

const MinigameSelectPage = () => {
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInviteClick = async () => {
    setShowFriends(true);
    setLoading(true);
    setError('');
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (e) {
      setError('친구 목록을 불러오지 못했습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="minigame-select-bg">
      <div className="minigame-select-modal">
        <h2>미니게임 선택</h2>
        <div className="minigame-top-actions">
          <button className="minigame-action-btn">방 생성</button>
          <button className="minigame-action-btn" onClick={handleInviteClick}>친구 초대</button>
        </div>
        <div className="minigame-list">
          {minigames.map((game) => (
            <div className="minigame-item" key={game.id}>
              <div className="minigame-title">{game.name}</div>
              <div className="minigame-desc">{game.desc}</div>
              <button className="minigame-btn">참여하기</button>
            </div>
          ))}
        </div>
      </div>
      {showFriends && (
        <div className="friend-modal-bg">
          <div className="friend-modal">
            <h3>친구 목록</h3>
            {loading ? (
              <div>불러오는 중...</div>
            ) : error ? (
              <div className="friend-error">{error}</div>
            ) : (
              <ul className="friend-list">
                {friends.length === 0 ? (
                  <li>저장된 친구가 없습니다.</li>
                ) : (
                  friends.map((f) => (
                    <li key={f.id} className="friend-item">{f.username || f.name}</li>
                  ))
                )}
              </ul>
            )}
            <button className="minigame-action-btn" onClick={() => setShowFriends(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinigameSelectPage;
