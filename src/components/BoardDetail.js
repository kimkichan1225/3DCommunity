import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaArrowLeft } from 'react-icons/fa';
import './BoardDetail.css';

function BoardDetail({ post, onBack }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(0);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'User01',
      content: '좋은 글 감사합니다!',
      createdAt: '2025-11-24 10:30'
    },
    {
      id: 2,
      author: 'User02',
      content: '유용한 정보네요',
      createdAt: '2025-11-24 11:15'
    }
  ]);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    setLikes(likes + 1);
    // TODO: API 호출
  };

  const handleDislike = () => {
    setDislikes(dislikes + 1);
    // TODO: API 호출
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      author: 'CurrentUser', // TODO: 실제 유저 정보
      content: newComment,
      createdAt: new Date().toLocaleString('ko-KR')
    };
    setComments([...comments, comment]);
    setNewComment('');
    // TODO: API 호출
  };

  return (
    <div className="board-detail">
      {/* 뒤로가기 버튼 */}
      <button className="board-detail-back" onClick={onBack}>
        <FaArrowLeft /> 목록으로
      </button>

      {/* 상단: 게시글 정보 */}
      <div className="board-detail-header">
        <h2 className="board-detail-title">{post.title}</h2>
        <div className="board-detail-info">
          <div className="board-detail-author-section">
            <div className="board-detail-author-avatar">
              {post.author.charAt(0)}
            </div>
            <div className="board-detail-author-info">
              <div className="board-detail-author">{post.author}</div>
              <div className="board-detail-meta">
                조회 {post.views} · 추천 {likes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 중단: 본문 */}
      <div className="board-detail-body">
        <div className="board-detail-content">
          {/* TODO: 실제 게시글 내용 렌더링 */}
          <p>
            이것은 게시글의 본문 내용입니다. 실제로는 백엔드에서 가져온 HTML 또는 마크다운 컨텐츠가
            표시됩니다.
          </p>
          <p>
            다양한 이미지와 텍스트가 포함될 수 있으며, 에디터를 통해 작성된 내용이 표시됩니다.
          </p>
          {/* 임시 이미지 예시 */}
          {post.id === 1 && (
            <div className="board-detail-image-placeholder">
              [이미지 영역]
            </div>
          )}
        </div>

        {/* 추천/비추천 버튼 */}
        <div className="board-detail-actions">
          <button className="board-action-btn like-btn" onClick={handleLike}>
            <FaThumbsUp /> 추천 ({likes})
          </button>
          <button className="board-action-btn dislike-btn" onClick={handleDislike}>
            <FaThumbsDown /> 비추천 ({dislikes})
          </button>
        </div>
      </div>

      {/* 하단: 댓글 */}
      <div className="board-detail-comments">
        <h3 className="comments-title">댓글 ({comments.length})</h3>

        {/* 댓글 목록 */}
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-author-avatar">
                {comment.author.charAt(0)}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{comment.createdAt}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                <button className="comment-reply-btn">답글 달기</button>
              </div>
            </div>
          ))}
        </div>

        {/* 댓글 작성 */}
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <textarea
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <button type="submit" className="comment-submit-btn">
            댓글 작성
          </button>
        </form>
      </div>
    </div>
  );
}

export default BoardDetail;
