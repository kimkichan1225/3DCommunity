import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const paymentService = {
  /**
   * 금화 패키지 목록 조회
   */
  async getGoldPackages() {
    try {
      const response = await axios.get(`${API_URL}/api/payment/packages`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gold packages:', error);
      throw error;
    }
  },

  /**
   * 금화 패키지 상세 조회
   */
  async getGoldPackageById(id) {
    try {
      const response = await axios.get(`${API_URL}/api/payment/packages/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gold package:', error);
      throw error;
    }
  },

  /**
   * 결제 요청 생성 (패키지 방식)
   */
  async createPaymentRequest(goldPackageId, orderId, amount) {
    try {
      const response = await axios.post(
        `${API_URL}/api/payment/request`,
        { goldPackageId, orderId, amount },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create payment request:', error);
      throw error;
    }
  },

  /**
   * 결제 요청 생성 (직접 수량 지정)
   */
  async createDirectPaymentRequest(goldAmount, orderId, amount) {
    try {
      const response = await axios.post(
        `${API_URL}/api/payment/direct-request`,
        { goldAmount, orderId, amount },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create direct payment request:', error);
      throw error;
    }
  },

  /**
   * 결제 승인
   */
  async approvePayment(orderId, paymentKey, amount) {
    try {
      const response = await axios.post(
        `${API_URL}/api/payment/approve`,
        { orderId, paymentKey, amount },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to approve payment:', error);
      throw error;
    }
  },

  /**
   * 결제 상태 조회
   */
  async getPaymentStatus(orderId) {
    try {
      const response = await axios.get(`${API_URL}/api/payment/status/${orderId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      throw error;
    }
  },

  /**
   * 결제 내역 조회
   */
  async getPaymentHistory() {
    try {
      const response = await axios.get(`${API_URL}/api/payment/history`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  }
};

export default paymentService;
