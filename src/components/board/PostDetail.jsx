import React, { useState } from 'react';
import Comment from './Comment';
import './PostDetail.css';

const PostDetail = ({ post, onBack }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'user1',
      content: '좋은 글 감사합니다!',
      likeCount: 2,
      createdAt: '2025-11-20 11:00',
      replies: []
    },
    {
      id: 2,
      author: 'user2',
      content: '유용한 정보네요',
      likeCount: 1,
      createdAt: '2025-11-20 11:30',
      replies: [
        {
          id: 3,
          author: 'user3',
          content: '저도 동의합니다',
          likeCount: 0,
          createdAt: '2025-11-20 12:00'
        }
      ]
    }
  ]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleAddComment = (content) => {
    const newComment = {
      id: comments.length + 1,
      author: 'currentUser',
      content,
      likeCount: 0,
      createdAt: new Date().toLocaleString('ko-KR'),
      replies: []
    };
    setComments([...comments, newComment]);
  };

  return (
    <div className="post-detail-container">
      <button className="btn-back" onClick={onBack}>← 목록으로</button>

      <div className="post-detail-header">
        <h1>{post.title}</h1>
        <div className="post-info">
          <span className="author">{post.authorName}</span>
          <span className="date">{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
          <span>조회 {post.viewCount}</span>
        </div>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      <div className="post-actions">
        <button
          className={`btn-like ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          ❤️ 좋아요 {likeCount}
        </button>
        <button className="btn-report">🚨 신고</button>
      </div>

      <div className="comments-section">
        <h3>댓글 {comments.length}</h3>
        <Comment
          comments={comments}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  );
};

export default PostDetail;
