import axios from 'axios';
import authService from '../../auth/services/authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class ProfileService {
  /**
   * 현재 사용자의 프로필 정보 가져오기 (Spring Boot API 사용)
   */
  async getCurrentUserProfile() {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * 프로필 업데이트 (Spring Boot API 사용)
   */
  async updateProfile(userId, profileData) {
    try {
      const token = authService.getToken();
      const response = await axios.put(`${API_URL}/api/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * 프로필 이미지 업로드 (Spring Boot API 사용)
   */
  async uploadProfileImage(userId, file) {
    try {
      const token = authService.getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/profile/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 프로필 조회 (다른 사용자 프로필 보기)
   */
  async getUserProfile(userId) {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/api/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }
}

export default new ProfileService();
