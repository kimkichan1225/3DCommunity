import React, { useState, useEffect } from 'react';
import './NotificationModal.css';
import { FaTimes, FaBell, FaUserPlus, FaGamepad, FaComment, FaTrash, FaCheck } from 'react-icons/fa';
import notificationService from '../services/notificationService';

/**
 * 알림 목록 모달
 */
function NotificationModal({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'friend', 'game', 'chat'

  useEffect(() => {
    // 초기 알림 로드
    setNotifications(notificationService.getNotifications());

    // 알림 변경 구독
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDelete = (notificationId) => {
    notificationService.deleteNotification(notificationId);
  };

  const handleClearAll = () => {
    if (window.confirm('모든 알림을 삭제하시겠습니까?')) {
      notificationService.clearAll();
    }
  };

  const getIcon = (type) => {
    switch (type) {
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

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '방금 전';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(timestamp).toLocaleDateString('ko-KR');
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'friend') return notification.type === 'friend_request' || notification.type === 'friend_accepted';
    if (filter === 'game') return notification.type === 'game_invite';
    if (filter === 'chat') return notification.type === 'chat';
    return true;
  });

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="notification-modal-header">
          <h2>
            <FaBell /> 알림
            {notificationService.getUnreadCount() > 0 && (
              <span className="notification-modal-badge">
                {notificationService.getUnreadCount()}
              </span>
            )}
          </h2>
          <button className="notification-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* 필터 */}
        <div className="notification-modal-filters">
          <button
            className={`notification-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            className={`notification-filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            읽지 않음 ({notifications.filter(n => !n.read).length})
          </button>
          <button
            className={`notification-filter-btn ${filter === 'friend' ? 'active' : ''}`}
            onClick={() => setFilter('friend')}
          >
            친구
          </button>
          <button
            className={`notification-filter-btn ${filter === 'game' ? 'active' : ''}`}
            onClick={() => setFilter('game')}
          >
            게임
          </button>
          <button
            className={`notification-filter-btn ${filter === 'chat' ? 'active' : ''}`}
            onClick={() => setFilter('chat')}
          >
            채팅
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="notification-modal-actions">
          <button className="notification-action-btn" onClick={handleMarkAllAsRead}>
            <FaCheck /> 모두 읽음
          </button>
          <button className="notification-action-btn" onClick={handleClearAll}>
            <FaTrash /> 모두 삭제
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="notification-modal-list">
          {filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              {filter === 'all' ? '알림이 없습니다.' : '해당하는 알림이 없습니다.'}
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className={`notification-item-icon notification-icon-${notification.type}`}>
                  {getIcon(notification.type)}
                </div>

                <div className="notification-item-content">
                  <div className="notification-item-header">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-item-time">{getTimeAgo(notification.timestamp)}</div>
                  </div>
                  <div className="notification-item-message">{notification.message}</div>
                </div>

                <button
                  className="notification-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                >
                  <FaTrash />
                </button>

                {!notification.read && <div className="notification-unread-dot"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;
