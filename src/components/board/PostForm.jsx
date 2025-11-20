import React, { useState } from 'react';
import './PostForm.css';

const PostForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    onSubmit({ title, content });
  };

  return (
    <div className="post-form-container">
      <h2>글쓰기</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="제목을 입력하세요 (최대 200자)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="input-title"
          />
        </div>
        <div className="form-group">
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-content"
            rows={15}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="btn-submit">
            작성완료
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
