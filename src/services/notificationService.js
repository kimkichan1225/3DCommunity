/**
 * 알림 관리 서비스
 * - 알림 저장/조회/삭제
 * - 읽음/읽지 않음 상태 관리
 * - WebSocket으로 실시간 알림 수신
 */

class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = this.loadNotifications();
  }

  /**
   * 로컬 스토리지에서 알림 불러오기
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  }

  /**
   * 로컬 스토리지에 알림 저장
   */
  saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  /**
   * 새 알림 추가
   * @param {Object} notification - { type, title, message, data, timestamp }
   * type: 'friend_request', 'friend_accepted', 'game_invite', 'chat', 'system'
   */
  addNotification(notification) {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      timestamp: notification.timestamp || Date.now(),
      read: false
    };

    this.notifications.unshift(newNotification);

    // 최대 100개까지만 저장
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifyListeners();

    return newNotification;
  }

  /**
   * 모든 알림 가져오기
   */
  getNotifications() {
    return [...this.notifications];
  }

  /**
   * 읽지 않은 알림 개수
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * 알림을 읽음으로 표시
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * 모든 알림을 읽음으로 표시
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * 알림 삭제
   */
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * 모든 알림 삭제
   */
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * 알림 변경사항 구독
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 구독자들에게 알림
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.notifications, this.getUnreadCount());
    });
  }

  /**
   * 친구 요청 알림 생성
   */
  createFriendRequestNotification(requesterUsername) {
    return this.addNotification({
      type: 'friend_request',
      title: '친구 요청',
      message: `${requesterUsername}님이 친구 요청을 보냈습니다.`,
      data: { requesterUsername }
    });
  }

  /**
   * 친구 수락 알림 생성
   */
  createFriendAcceptedNotification(acceptorUsername) {
    return this.addNotification({
      type: 'friend_accepted',
      title: '친구 수락',
      message: `${acceptorUsername}님이 친구 요청을 수락했습니다.`,
      data: { acceptorUsername }
    });
  }

  /**
   * 게임 초대 알림 생성
   */
  createGameInviteNotification(inviterUsername, gameName) {
    return this.addNotification({
      type: 'game_invite',
      title: '게임 초대',
      message: `${inviterUsername}님이 ${gameName} 게임에 초대했습니다.`,
      data: { inviterUsername, gameName }
    });
  }

  /**
   * 채팅 알림 생성
   */
  createChatNotification(senderUsername, message) {
    return this.addNotification({
      type: 'chat',
      title: '새 메시지',
      message: `${senderUsername}: ${message.length > 30 ? message.substring(0, 30) + '...' : message}`,
      data: { senderUsername, message }
    });
  }

  /**
   * 시스템 알림 생성
   */
  createSystemNotification(title, message) {
    return this.addNotification({
      type: 'system',
      title,
      message,
      data: {}
    });
  }
}

const notificationService = new NotificationService();
export default notificationService;
