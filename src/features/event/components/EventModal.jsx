import React, { useState } from 'react';
import './EventModal.css';

/**
 * EventModal 컴포넌트
 * - 이벤트 목록 및 상세 정보 표시
 * - 탭 형식: 진행중 이벤트 / 종료된 이벤트
 * - UI만 구현 (기능은 추후 추가)
 */
function EventModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' or 'ended'

  // 더미 데이터 (추후 서버에서 가져올 예정)
  const ongoingEvents = [
    {
      id: 1,
      title: '신규 유저 환영 이벤트',
      description: '회원가입 시 골드 코인 100개 지급!',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing'
    },
    {
      id: 2,
      title: '크리스마스 특별 이벤트',
      description: '미니게임 클리어 시 실버 코인 2배 지급',
      startDate: '2025-12-20',
      endDate: '2025-12-26',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing'
    },
    {
      id: 3,
      title: '출석 체크 이벤트',
      description: '매일 접속 시 보상 획득',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing'
    }
  ];

  const endedEvents = [
    {
      id: 4,
      title: '오픈 기념 이벤트',
      description: '오픈 첫 주 특별 보상',
      startDate: '2025-11-01',
      endDate: '2025-11-07',
      image: '/resources/Icon/Event-icon.png',
      status: 'ended'
    },
    {
      id: 5,
      title: '추석 특별 이벤트',
      description: '추석 연휴 기념 아이템 지급',
      startDate: '2025-09-15',
      endDate: '2025-09-18',
      image: '/resources/Icon/Event-icon.png',
      status: 'ended'
    }
  ];

  const currentEvents = activeTab === 'ongoing' ? ongoingEvents : endedEvents;

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="event-modal-header">
          <h2>🎉 이벤트</h2>
          <button className="event-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="event-modal-tabs">
          <button
            className={`event-tab ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            진행중 ({ongoingEvents.length})
          </button>
          <button
            className={`event-tab ${activeTab === 'ended' ? 'active' : ''}`}
            onClick={() => setActiveTab('ended')}
          >
            종료됨 ({endedEvents.length})
          </button>
        </div>

        {/* 이벤트 목록 */}
        <div className="event-modal-content">
          {currentEvents.length === 0 ? (
            <div className="event-empty">
              <p>현재 {activeTab === 'ongoing' ? '진행중인' : '종료된'} 이벤트가 없습니다.</p>
            </div>
          ) : (
            <div className="event-list">
              {currentEvents.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-card-image">
                    <img src={event.image} alt={event.title} />
                    {event.status === 'ended' && (
                      <div className="event-card-badge ended">종료</div>
                    )}
                    {event.status === 'ongoing' && (
                      <div className="event-card-badge ongoing">진행중</div>
                    )}
                  </div>
                  <div className="event-card-content">
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-date">
                      <span>📅 {event.startDate} ~ {event.endDate}</span>
                    </div>
                    <button
                      className="event-detail-button"
                      disabled={event.status === 'ended'}
                    >
                      {event.status === 'ongoing' ? '참여하기' : '상세보기'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventModal;
