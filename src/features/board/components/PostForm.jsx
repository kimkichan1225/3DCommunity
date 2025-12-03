import React, { useState } from 'react';
import axios from 'axios';
import './PostForm.css';

function PostForm({ boardId, post, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    images: post?.images || '',
    postType: post?.postType || 'GENERAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!post;

  const postTypeOptions = [
    { value: 'GENERAL', label: '일반', icon: '' },
    { value: 'QUESTION', label: '질문', icon: '❓' },
    { value: 'IMAGE', label: '짤', icon: '🖼️' },
    { value: 'VIDEO', label: '영상', icon: '🎬' }
  ];

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

      let response;
      if (isEditMode) {
        // 수정 모드
        const updateData = {
          title: formData.title,
          content: formData.content,
          images: formData.images || null,
          postType: formData.postType
        };
        console.log('📤 수정 요청:', updateData);

        response = await axios.put(
          `${API_URL}/api/posts/${post.id}`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // 작성 모드
        const createData = {
          boardId: boardId,
          title: formData.title,
          content: formData.content,
          images: formData.images || null,
          postType: formData.postType
        };
        console.log('📤 작성 요청:', createData);

        response = await axios.post(
          `${API_URL}/api/posts`,
          createData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      console.log('✅ 응답:', response.data);
      onSuccess(response.data);
    } catch (err) {
      console.error('❌ 에러 상세:', err.response?.data);
      setError(err.response?.data || `게시글 ${isEditMode ? '수정' : '작성'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-overlay" onClick={onClose}>
      <div className="post-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-form-header">
          <h2>{isEditMode ? '글 수정' : '글쓰기'}</h2>
          <button className="post-form-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="post-form-group">
            <label className="post-form-label">
              게시글 타입
            </label>
            <select
              name="postType"
              value={formData.postType}
              onChange={handleChange}
              className="post-form-type-select"
            >
              {postTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

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
              {loading ? (isEditMode ? '수정 중...' : '작성 중...') : (isEditMode ? '수정 완료' : '작성 완료')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostForm;
