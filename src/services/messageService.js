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
}

export default new MessageService();
