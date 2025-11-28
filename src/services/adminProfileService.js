import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Axios 인터셉터 설정 (JWT 토큰 자동 포함)
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const adminProfileService = {
  /**
   * 모든 프로필 아이템 조회 (관리자용)
   */
  getAllProfileItems: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/profile-items`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile items:', error);
      throw error;
    }
  },

  /**
   * 프로필 아이템 생성
   */
  createProfileItem: async (itemData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/profile-items`,
        itemData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create profile item:', error);
      throw error;
    }
  },

  /**
   * 프로필 아이템 수정
   */
  updateProfileItem: async (itemId, itemData) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/profile-items/${itemId}`,
        itemData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update profile item:', error);
      throw error;
    }
  },

  /**
   * 프로필 아이템 삭제
   */
  deleteProfileItem: async (itemId) => {
    try {
      await axios.delete(`${API_URL}/api/admin/profile-items/${itemId}`, {
        headers: getAuthHeader()
      });
      return true;
    } catch (error) {
      console.error('Failed to delete profile item:', error);
      throw error;
    }
  },

  /**
   * 잠금해제 조건 타입 목록 조회
   */
  getUnlockConditionTypes: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/profile-items/unlock-conditions`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unlock condition types:', error);
      throw error;
    }
  },

  /**
   * 모든 사용자에게 기본 아이템 지급
   */
  grantDefaultItemsToAllUsers: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/profile-items/grant-default-items`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to grant default items:', error);
      throw error;
    }
  }
};

export default adminProfileService;
