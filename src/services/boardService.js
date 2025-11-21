import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class BoardService {
  getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 게시판 목록 조회
  async getBoards() {
    const response = await axios.get(`${API_URL}/api/boards`);
    return response.data;
  }

  // 게시판 상세 조회
  async getBoard(boardId) {
    const response = await axios.get(`${API_URL}/api/boards/${boardId}`);
    return response.data;
  }

  // 게시판 생성 (관리자용)
  async createBoard(boardData) {
    const response = await axios.post(`${API_URL}/api/boards`, boardData, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // 게시글 목록 조회
  async getPosts(boardId, page = 0, size = 10) {
    const response = await axios.get(`${API_URL}/api/posts/board/${boardId}`, {
      params: { page, size }
    });
    return response.data;
  }

  // 게시글 상세 조회
  async getPost(postId) {
    const response = await axios.get(`${API_URL}/api/posts/${postId}`);
    return response.data;
  }

  // 게시글 작성
  async createPost(postData) {
    const response = await axios.post(`${API_URL}/api/posts`, postData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  // 게시글 수정
  async updatePost(postId, postData) {
    const response = await axios.put(`${API_URL}/api/posts/${postId}`, postData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  // 게시글 삭제
  async deletePost(postId) {
    const response = await axios.delete(`${API_URL}/api/posts/${postId}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }
}

export default new BoardService();
