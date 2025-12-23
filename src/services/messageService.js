import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class MessageService {
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  // DM 대화 목록 조회 (채팅방 목록)
  async getConversations() {
    const response = await axios.get(`${API_URL}/api/messages/conversations`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 특정 사용자와의 DM 내역 조회
  async getDMHistory(friendId, limit = 50) {
    const response = await axios.get(`${API_URL}/api/messages/dm/${friendId}`, {
      params: { limit },
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // DM 전송
  async sendDM(receiverId, content) {
    const response = await axios.post(
      `${API_URL}/api/messages/dm`,
      { receiverId, content },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  // 안 읽은 DM 개수 조회
  async getUnreadCount() {
    const response = await axios.get(`${API_URL}/api/messages/unread-count`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 특정 사용자와의 메시지 읽음 처리
  async markMessagesAsRead(friendId) {
    try {
      const response = await axios.post(
        `${API_URL}/api/messages/mark-read/${friendId}`,
        {},
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // 에러가 나도 계속 진행 (읽음 처리는 optional)
      return null;
    }
  }
}

export default new MessageService();
