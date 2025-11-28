import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Axios 인터셉터 설정 (JWT 토큰 자동 포함)
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const profileItemService = {
  /**
   * 사용자의 모든 프로필 아이템 조회
   */
  getUserProfileItems: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/items`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile items:', error);
      throw error;
    }
  },

  /**
   * 특정 타입의 프로필 아이템 조회
   * @param {string} type - 'PROFILE' or 'OUTLINE'
   */
  getUserProfileItemsByType: async (type) => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/items/${type}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${type} items:`, error);
      throw error;
    }
  },

  /**
   * 아이템 잠금해제
   * @param {number} itemId - 아이템 ID
   */
  unlockItem: async (itemId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/profile/items/${itemId}/unlock`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to unlock item:', error);
      throw error;
    }
  },

  /**
   * 프로필 이미지/테두리 선택
   * @param {object} selection - { selectedProfileId, selectedOutlineId }
   */
  selectProfileItems: async (selection) => {
    try {
      await axios.put(
        `${API_URL}/api/profile/select`,
        selection,
        { headers: getAuthHeader() }
      );
      return true;
    } catch (error) {
      console.error('Failed to select profile items:', error);
      throw error;
    }
  }
};

export default profileItemService;
