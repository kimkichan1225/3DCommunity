import React, { useState } from 'react';
import './EventModal.css';

/**
 * EventModal 컴포넌트
 * - 이벤트 목록 및 상세 정보 표시
 * - 탭 형식: 진행중 이벤트 / 업적 / 종료된 이벤트
 * - 왼쪽: 목록, 오른쪽: 상세 내용
 * - UI만 구현 (기능은 추후 추가)
 */
function EventModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing', 'achievements', or 'ended'
  const [selectedItem, setSelectedItem] = useState(null); // 선택된 이벤트/업적

  // 더미 데이터 (추후 서버에서 가져올 예정)
  const ongoingEvents = [
    {
      id: 3,
      title: '매일 출석 체크',
      description: '매일 접속 시 보상 획득',
      detailContent: '매일 접속하고 보상을 받아가세요!\n\n연속 출석 시 더 많은 보상을 받을 수 있습니다.\n\n7일 연속 출석: 골드 코인 50개\n30일 연속 출석: 골드 코인 200개',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing',
      rewards: ['일일 실버 코인 50개', '7일 골드 코인 50개', '30일 골드 코인 200개']
    },
    {
      id: 1,
      title: '오픈 기념 출석 체크',
      description: '오픈 기념 특별 출석 보상',
      detailContent: '메타플라자 오픈을 기념하여 특별 출석 보상을 드립니다!\n\n매일 접속하고 보상을 받아가세요!',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing',
      rewards: ['골드 코인 100개']
    },
    {
      id: 2,
      title: '플라자 패스',
      description: '시즌 미션을 완료하고 특별 보상을 받으세요!',
      detailContent: '플라자 패스를 통해 다양한 미션을 완료하고 풍성한 보상을 획득하세요.\n\n시즌 기간 동안 매일 새로운 미션이 제공되며, 미션을 완료할 때마다 경험치와 보상을 받을 수 있습니다.\n\n프리미엄 패스를 구매하면 추가 보상을 받을 수 있습니다!',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      image: '/resources/Icon/Event-icon.png',
      status: 'ongoing',
      rewards: ['골드 코인', '실버 코인', '특별 스킨', '아이템']
    }
  ];

  const achievements = [
    {
      id: 101,
      title: '첫 걸음',
      description: '첫 로그인 완료',
      detailContent: '메타플라자에 첫 발을 내딛었습니다.\n\n보상: 실버 코인 100개',
      image: '/resources/Icon/Event-icon.png',
      progress: 100,
      isCompleted: true,
      rewards: ['실버 코인 100개']
    },
    {
      id: 102,
      title: '게임 마스터',
      description: '미니게임 10회 클리어',
      detailContent: '미니게임을 10회 클리어하세요.\n\n현재 진행도: 3/10\n\n보상: 골드 코인 50개',
      image: '/resources/Icon/Event-icon.png',
      progress: 30,
      isCompleted: false,
      rewards: ['골드 코인 50개']
    },
    {
      id: 103,
      title: '친구 만들기',
      description: '친구 5명 추가',
      detailContent: '친구 5명을 추가하세요.\n\n현재 진행도: 2/5\n\n보상: 실버 코인 500개',
      image: '/resources/Icon/Event-icon.png',
      progress: 40,
      isCompleted: false,
      rewards: ['실버 코인 500개']
    }
  ];

  const endedEvents = [];

  const getCurrentItems = () => {
    if (activeTab === 'ongoing') return ongoingEvents;
    if (activeTab === 'achievements') return achievements;
    return endedEvents;
  };

  const currentItems = getCurrentItems();

  // 탭 변경 시 첫 번째 아이템 자동 선택
  React.useEffect(() => {
    if (currentItems.length > 0) {
      setSelectedItem(currentItems[0]);
    } else {
      setSelectedItem(null);
    }
  }, [activeTab]);

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
            진행중 이벤트 ({ongoingEvents.length})
          </button>
          <button
            className={`event-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            업적 ({achievements.length})
          </button>
          <button
            className={`event-tab ${activeTab === 'ended' ? 'active' : ''}`}
            onClick={() => setActiveTab('ended')}
          >
            종료된 이벤트 ({endedEvents.length})
          </button>
        </div>

        {/* 메인 컨텐츠: 왼쪽(목록) + 오른쪽(상세) */}
        <div className="event-modal-body">
          {/* 왼쪽: 목록 */}
          <div className="event-list-section">
            {currentItems.length === 0 ? (
              <div className="event-empty">
                <p>항목이 없습니다.</p>
              </div>
            ) : (
              <div className="event-list">
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`event-list-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="event-list-item-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                    <div className="event-list-item-info">
                      <h4>{item.title}</h4>
                      {/* 진행중 이벤트 탭이 아닐 때만 설명 표시 */}
                      {activeTab !== 'ongoing' && <p>{item.description}</p>}
                      {/* 업적의 경우 진행도 표시 */}
                      {activeTab === 'achievements' && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="progress-text">{item.progress}%</span>
                        </div>
                      )}
                      {/* 이벤트의 경우 상태 뱃지 */}
                      {activeTab !== 'achievements' && (
                        <div className="event-list-item-badge">
                          {item.status === 'ongoing' && <span className="badge ongoing">진행중</span>}
                          {item.status === 'ended' && <span className="badge ended">종료</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 내용 */}
          <div className="event-detail-section">
            {selectedItem ? (
              <>
                <div className="event-detail-header">
                  <img src={selectedItem.image} alt={selectedItem.title} />
                  <h3>{selectedItem.title}</h3>
                </div>
                <div className="event-detail-content">
                  {/* 플라자 패스의 경우 특별한 레이아웃 */}
                  {selectedItem.id === 2 ? (
                    <div className="plaza-pass-container">
                      <p className="detail-text">시즌 미션을 완료하고 특별 보상을 받으세요!</p>

                      {/* 플라자 패스 테이블 */}
                      <div className="plaza-pass-scroll">
                        <div className="plaza-pass-table">
                          {/* 1행: 레벨 번호들 */}
                          <div className="plaza-pass-level-row">
                            {Array.from({ length: 30 }, (_, index) => (
                              <div key={index} className="plaza-pass-level-cell">{index + 1}</div>
                            ))}
                          </div>

                          {/* 2행: 무료 보상들 */}
                          <div className="plaza-pass-free-row">
                            {Array.from({ length: 30 }, (_, index) => (
                              <div key={index} className="plaza-pass-reward-cell free">
                                <div className="reward-box">
                                  <img src="/resources/Icon/Silver-Coin.png" alt="coin" className="reward-icon" />
                                  <span>100</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 3행: 프리미엄 보상들 */}
                          <div className="plaza-pass-premium-row">
                            {Array.from({ length: 30 }, (_, index) => (
                              <div key={index} className="plaza-pass-reward-cell premium">
                                <div className="reward-box">
                                  <img src="/resources/Icon/Gold-Coin.png" alt="coin" className="reward-icon" />
                                  <span>50</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (selectedItem.id === 3 || selectedItem.id === 1) ? (
                    <div className="attendance-check-container">
                      <p className="detail-text">{selectedItem.id === 3 ? '매일 접속하고 보상을 받아가세요!' : '메타플라자 오픈을 기념하여 특별 출석 보상을 드립니다!'}</p>

                      {/* 출석 체크 그리드 (7x2) */}
                      <div className="attendance-grid">
                        {Array.from({ length: 14 }, (_, index) => {
                          const day = index + 1;
                          const isGoldDay = day === 7 || day === 14;
                          const coinImage = isGoldDay
                            ? '/resources/Icon/Gold-Coin.png'
                            : '/resources/Icon/Silver-Coin.png';
                          const coinAmount = isGoldDay
                            ? (selectedItem.id === 1 ? '100' : '50')
                            : (selectedItem.id === 1 ? '200' : '100');

                          return (
                            <div key={day} className={`attendance-box ${isGoldDay ? 'gold-box' : 'silver-box'}`}>
                              <div className="attendance-day">Day {day}</div>
                              <div className="attendance-reward">
                                <img src={coinImage} alt="coin" className="coin-icon" />
                                <span className={isGoldDay ? 'gold-text' : 'silver-text'}>
                                  {coinAmount}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="detail-text">{selectedItem.detailContent || selectedItem.description}</p>

                      {/* 기간 표시 (업적 제외) */}
                      {activeTab !== 'achievements' && selectedItem.startDate && (
                        <div className="detail-date">
                          <span>📅 {selectedItem.startDate} ~ {selectedItem.endDate}</span>
                        </div>
                      )}

                      {/* 보상 표시 */}
                      {selectedItem.rewards && selectedItem.rewards.length > 0 && (
                        <div className="detail-rewards">
                          <h4>🎁 보상</h4>
                          <ul>
                            {selectedItem.rewards.map((reward, index) => (
                              <li key={index}>{reward}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {/* 업적 진행도 */}
                  {activeTab === 'achievements' && (
                    <div className="detail-achievement-progress">
                      <h4>진행도</h4>
                      <div className="progress-bar-large">
                        <div
                          className="progress-fill"
                          style={{ width: `${selectedItem.progress}%` }}
                        />
                      </div>
                      <p className="progress-text-large">{selectedItem.progress}%</p>
                      {selectedItem.isCompleted && (
                        <div className="completed-badge">✅ 완료</div>
                      )}
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="detail-actions">
                    {activeTab === 'ongoing' && selectedItem.id !== 3 && selectedItem.id !== 1 && (
                      <button className="btn-participate">참여하기</button>
                    )}
                    {activeTab === 'achievements' && !selectedItem.isCompleted && (
                      <button className="btn-progress">진행중</button>
                    )}
                    {activeTab === 'achievements' && selectedItem.isCompleted && (
                      <button className="btn-claim">보상 받기</button>
                    )}
                    {activeTab === 'ended' && (
                      <button className="btn-ended" disabled>종료됨</button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="event-detail-empty">
                <p>항목을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventModal;
