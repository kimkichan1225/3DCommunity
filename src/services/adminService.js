import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// API 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const adminService = {
  /**
   * 사용자 목록 조회 (검색, 필터, 페이지네이션)
   */
  getUsers: async (params = {}) => {
    const { search, role, isSuspended, page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC' } = params;

    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);
    if (isSuspended !== null && isSuspended !== undefined) queryParams.append('isSuspended', isSuspended);
    queryParams.append('page', page);
    queryParams.append('size', size);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortDirection', sortDirection);

    const response = await api.get(`/api/admin/users?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 사용자 상세 조회
   */
  getUserDetail: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  /**
   * 사용자 제재
   */
  suspendUser: async (userId, suspensionData) => {
    const response = await api.post(`/api/admin/users/${userId}/suspend`, suspensionData);
    return response.data;
  },

  /**
   * 역할 변경
   */
  changeUserRole: async (userId, roleData) => {
    const response = await api.post(`/api/admin/users/${userId}/role`, roleData);
    return response.data;
  },

  /**
   * 사용자 제재 이력 조회
   */
  getUserSuspensionHistory: async (userId, page = 0, size = 10) => {
    const response = await api.get(`/api/admin/users/${userId}/suspension-history?page=${page}&size=${size}`);
    return response.data;
  },

  /**
   * 대시보드 통계 조회
   */
  getDashboardStats: async () => {
    const response = await api.get('/api/admin/dashboard/stats');
    return response.data;
  },

  /**
   * 감사 로그 조회
   */
  getAuditLogs: async (params = {}) => {
    const { page = 0, size = 50, action, adminId } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);
    if (action) queryParams.append('action', action);
    if (adminId) queryParams.append('adminId', adminId);

    const response = await api.get(`/api/admin/audit-logs?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 관리자 권한으로 게시글 삭제
   */
  deletePost: async (postId) => {
    const response = await api.delete(`/api/admin/posts/${postId}`);
    return response.data;
  },
};

export default adminService;
