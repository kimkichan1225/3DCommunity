import React, { useState, useEffect } from 'react';
import './NotificationToast.css';
import { FaBell, FaUserPlus, FaGamepad, FaComment, FaTimes, FaCheck } from 'react-icons/fa';

/**
 * 실시간 알림 토스트 (화면 좌측 상단 아이콘들 밑에 표시)
 * @param {Object} notification - 표시할 알림 객체
 * @param {Function} onClose - 닫기 콜백
 * @param {Function} onAccept - 수락 버튼 콜백 (친구 요청, 게임 초대 등)
 * @param {Function} onReject - 거절 버튼 콜백 (친구 요청, 게임 초대 등)
 * @param {Function} onClick - 클릭 콜백 (채팅 알림 등)
 * @param {number} autoCloseDelay - 자동 닫기 시간 (ms, 기본 5000ms)
 */
function NotificationToast({ notification, onClose, onAccept, onReject, onClick, autoCloseDelay = 5000 }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    console.log('🔔 토스트 타이머 시작:', notification.id, autoCloseDelay + 'ms');

    // 자동 닫기 타이머
    const closeTimer = setTimeout(() => {
      console.log('🔔 토스트 자동 닫기:', notification.id);
      onClose();
    }, autoCloseDelay);

    // 프로그레스 바 애니메이션
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (autoCloseDelay / 100));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 100);

    return () => {
      console.log('🔔 토스트 타이머 정리:', notification.id);
      clearTimeout(closeTimer);
      clearInterval(interval);
    };
  }, [notification.id, autoCloseDelay]);

  const getIcon = () => {
    switch (notification.type) {
      case 'friend_request':
      case 'friend_accepted':
        return <FaUserPlus />;
      case 'game_invite':
        return <FaGamepad />;
      case 'chat':
        return <FaComment />;
      default:
        return <FaBell />;
    }
  };

  const showActionButtons = notification.type === 'friend_request' || notification.type === 'game_invite';
  const isClickable = notification.type === 'chat' && onClick;

  const handleToastClick = () => {
    if (isClickable) {
      onClick(notification);
      onClose();
    }
  };

  return (
    <div
      className={`notification-toast notification-toast-${notification.type} ${isClickable ? 'clickable' : ''}`}
      onClick={handleToastClick}
    >
      <div className="notification-toast-icon">
        {getIcon()}
      </div>

      <div className="notification-toast-content">
        <div className="notification-toast-title">{notification.title}</div>
        <div className="notification-toast-message">{notification.message}</div>
      </div>

      {showActionButtons && (
        <div className="notification-toast-actions">
          <button
            className="notification-toast-btn accept-btn"
            onClick={() => {
              onAccept(notification);
              onClose();
            }}
          >
            <FaCheck /> 수락
          </button>
          <button
            className="notification-toast-btn reject-btn"
            onClick={() => {
              onReject(notification);
              onClose();
            }}
          >
            <FaTimes /> 거절
          </button>
        </div>
      )}

      <button
        className="notification-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <FaTimes />
      </button>

      {/* 프로그레스 바 */}
      <div className="notification-toast-progress">
        <div
          className="notification-toast-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default NotificationToast;
