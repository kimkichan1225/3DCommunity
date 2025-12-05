import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class FriendService {
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  // 친구 요청 보내기 (닉네임으로)
  async sendFriendRequest(username) {
    const response = await axios.post(
      `${API_URL}/api/friends/request`,
      { username },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  // 받은 친구 요청 목록
  async getReceivedRequests() {
    const response = await axios.get(`${API_URL}/api/friends/requests/received`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 보낸 친구 요청 목록
  async getSentRequests() {
    const response = await axios.get(`${API_URL}/api/friends/requests/sent`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 친구 요청 수락
  async acceptFriendRequest(friendshipId) {
    const response = await axios.post(
      `${API_URL}/api/friends/accept/${friendshipId}`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  // 친구 요청 거절
  async rejectFriendRequest(friendshipId) {
    const response = await axios.post(
      `${API_URL}/api/friends/reject/${friendshipId}`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  // 친구 목록 조회
  async getFriends() {
    const response = await axios.get(`${API_URL}/api/friends`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 친구 삭제
  async removeFriend(friendshipId) {
    const response = await axios.delete(`${API_URL}/api/friends/${friendshipId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // 사용자 검색 (닉네임으로)
  async searchUser(username) {
    const response = await axios.get(`${API_URL}/api/friends/search`, {
      params: { username },
      headers: this.getAuthHeader(),
    });
    return response.data;
  }
}

export default new FriendService();
