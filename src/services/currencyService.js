import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Currency Service
 * - 재화 관련 API 호출
 */
const currencyService = {
  /**
   * 현재 사용자의 재화 정보 조회
   */
  getCurrency: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/api/currency`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data; // { silverCoins: number, goldCoins: number }
  },

  /**
   * Silver Coin 추가
   */
  addSilverCoins: async (amount) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(`${API_URL}/api/currency/silver/add`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data; // { silverCoins: number, goldCoins: number }
  },

  /**
   * Gold Coin 추가
   */
  addGoldCoins: async (amount) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(`${API_URL}/api/currency/gold/add`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data; // { silverCoins: number, goldCoins: number }
  },

  /**
   * Silver Coin 차감
   */
  subtractSilverCoins: async (amount) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(`${API_URL}/api/currency/silver/subtract`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data; // { silverCoins: number, goldCoins: number }
  },

  /**
   * Gold Coin 차감
   */
  subtractGoldCoins: async (amount) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(`${API_URL}/api/currency/gold/subtract`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data; // { silverCoins: number, goldCoins: number }
  }
};

export default currencyService;
