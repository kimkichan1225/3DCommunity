import React, { useState } from 'react';
import axios from 'axios';
import './PostForm.css';

function PostForm({ boardId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title.trim()) {
      setError('제목을 입력하세요.');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력하세요.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      const response = await axios.post(
        `${API_URL}/api/posts`,
        {
          boardId: boardId,
          title: formData.title,
          content: formData.content,
          images: formData.images || null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-overlay" onClick={onClose}>
      <div className="post-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-form-header">
          <h2>글쓰기</h2>
          <button className="post-form-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="post-form-group">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              className="post-form-title-input"
              required
            />
          </div>

          <div className="post-form-group">
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="내용을 입력하세요"
              className="post-form-content-input"
              rows={15}
              required
            />
          </div>

          <div className="post-form-group">
            <input
              type="text"
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="이미지 URL (선택사항)"
              className="post-form-image-input"
            />
          </div>

          {error && <div className="post-form-error">{error}</div>}

          <div className="post-form-actions">
            <button type="button" className="post-form-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="post-form-submit" disabled={loading}>
              {loading ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostForm;
