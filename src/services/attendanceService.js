import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Attendance Service
 * - 출석 체크 관련 API 호출
 */
const attendanceService = {
  /**
   * 특정 이벤트의 출석 기록 조회
   * @param {string} eventType - "DAILY" 또는 "EVENT"
   * @returns {Promise<Array>} 출석 기록 배열
   */
  getAttendanceHistory: async (eventType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/api/attendance/${eventType}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  },

  /**
   * 오늘 출석 체크 여부 확인
   * @param {string} eventType - "DAILY" 또는 "EVENT"
   * @returns {Promise<boolean>} 출석 여부
   */
  checkTodayAttendance: async (eventType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/api/attendance/${eventType}/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data.attended;
  },

  /**
   * 출석 체크 및 보상 수령
   * @param {string} eventType - "DAILY" 또는 "EVENT"
   * @returns {Promise<Object>} 출석 결과 { success, message, attendance, totalSilverCoins, totalGoldCoins }
   */
  claimAttendance: async (eventType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(`${API_URL}/api/attendance/${eventType}/claim`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  },

  /**
   * 두 이벤트 모두 오늘 출석했는지 확인
   * @returns {Promise<boolean>} 두 이벤트 모두 출석했으면 true
   */
  checkBothAttendedToday: async () => {
    try {
      const dailyAttended = await attendanceService.checkTodayAttendance('DAILY');
      const eventAttended = await attendanceService.checkTodayAttendance('EVENT');
      return dailyAttended && eventAttended;
    } catch (error) {
      console.error('Error checking attendance:', error);
      return false;
    }
  }
};

export default attendanceService;
