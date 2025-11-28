import axios from 'axios';
import authService from '../../auth/services/authService';

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

  // ===== 댓글 API =====

  // 댓글 목록 조회
  async getComments(postId) {
    const response = await axios.get(`${API_URL}/api/comments/post/${postId}`);
    return response.data;
  }

  // 댓글 작성
  async createComment(commentData) {
    const response = await axios.post(`${API_URL}/api/comments`, commentData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  // 댓글 수정
  async updateComment(commentId, commentData) {
    const response = await axios.put(`${API_URL}/api/comments/${commentId}`, commentData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  // 댓글 삭제
  async deleteComment(commentId) {
    const response = await axios.delete(`${API_URL}/api/comments/${commentId}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // 댓글 수 조회
  async getCommentCount(postId) {
    const response = await axios.get(`${API_URL}/api/comments/post/${postId}/count`);
    return response.data;
  }

  // ===== 좋아요 API =====

  // 좋아요 토글 (추가/취소)
  async toggleLike(targetType, targetId) {
    const response = await axios.post(
      `${API_URL}/api/likes/toggle`,
      { targetType, targetId },
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  // 좋아요 여부 확인
  async checkLike(targetType, targetId) {
    const response = await axios.get(`${API_URL}/api/likes/check`, {
      params: { targetType, targetId },
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // 좋아요 수 조회
  async getLikeCount(targetType, targetId) {
    const response = await axios.get(`${API_URL}/api/likes/count`, {
      params: { targetType, targetId }
    });
    return response.data;
  }

  // ===== 검색 API =====

  // 게시글 검색
  async searchPosts(boardId, keyword, searchType = 'title', page = 0, size = 10) {
    const response = await axios.get(`${API_URL}/api/posts/board/${boardId}/search`, {
      params: { keyword, searchType, page, size }
    });
    return response.data;
  }
}

export default new BoardService();
