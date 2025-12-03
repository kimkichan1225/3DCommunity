import axios from 'axios';
import authService from '../../auth/services/authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class MinigameService {
  getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ===== 게임 로비 API =====

  // 게임 로비 생성
  async createRoom(roomData) {
    const response = await axios.post(`${API_URL}/api/minigame/rooms`, roomData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  // 게임 로비 목록 조회 (광장)
  async getPlazaRooms(page = 0, size = 10) {
    const response = await axios.get(`${API_URL}/api/minigame/rooms/plaza`, {
      params: { page, size }
    });
    return response.data;
  }

  // 게임 로비 목록 조회 (로컬)
  async getLocalRooms(latitude, longitude, radius = 5000, page = 0, size = 10) {
    const response = await axios.get(`${API_URL}/api/minigame/rooms/local`, {
      params: { latitude, longitude, radius, page, size }
    });
    return response.data;
  }

  // 게임 로비 상세 조회
  async getRoom(roomId) {
    const response = await axios.get(`${API_URL}/api/minigame/rooms/${roomId}`);
    return response.data;
  }

  // 게임 로비 입장
  async joinRoom(roomId) {
    const response = await axios.post(
      `${API_URL}/api/minigame/rooms/${roomId}/join`,
      {},
      {
        headers: this.getAuthHeader()
      }
    );
    return response.data;
  }

  // 게임 로비 퇴장
  async leaveRoom(roomId) {
    const response = await axios.post(
      `${API_URL}/api/minigame/rooms/${roomId}/leave`,
      {},
      {
        headers: this.getAuthHeader()
      }
    );
    return response.data;
  }

  // 게임 로비 삭제 (방장만)
  async deleteRoom(roomId) {
    const response = await axios.delete(`${API_URL}/api/minigame/rooms/${roomId}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // 게임 로비 설정 변경 (방장만)
  async updateRoom(roomId, roomData) {
    const response = await axios.put(
      `${API_URL}/api/minigame/rooms/${roomId}`,
      roomData,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  // ===== 게임 플레이 API =====

  // 게임 시작 (방장만)
  async startGame(roomId) {
    const response = await axios.post(
      `${API_URL}/api/minigame/rooms/${roomId}/start`,
      {},
      {
        headers: this.getAuthHeader()
      }
    );
    return response.data;
  }

  // 게임 종료
  async endGame(roomId) {
    const response = await axios.post(
      `${API_URL}/api/minigame/rooms/${roomId}/end`,
      {},
      {
        headers: this.getAuthHeader()
      }
    );
    return response.data;
  }

  // 게임 액션 전송
  async sendGameAction(roomId, actionData) {
    const response = await axios.post(
      `${API_URL}/api/minigame/rooms/${roomId}/action`,
      actionData,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  // ===== 게임 기록 API =====

  // 내 게임 기록 조회
  async getMyGameHistory(page = 0, size = 10) {
    const response = await axios.get(`${API_URL}/api/minigame/history/my`, {
      params: { page, size },
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // 게임 통계 조회
  async getGameStats(gameType) {
    const response = await axios.get(`${API_URL}/api/minigame/stats/${gameType}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }
}

export default new MinigameService();
