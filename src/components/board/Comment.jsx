import React, { useState } from 'react';
import './Comment.css';

const CommentItem = ({ comment, onReply }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-date">{comment.createdAt}</span>
      </div>
      <div className="comment-content">{comment.content}</div>
      <div className="comment-actions">
        <button className={`btn-comment-like ${liked ? 'liked' : ''}`} onClick={handleLike}>
          ❤️ {likeCount}
        </button>
        <button className="btn-reply" onClick={() => setShowReplyInput(!showReplyInput)}>
          답글
        </button>
      </div>

      {showReplyInput && (
        <div className="reply-input-wrapper">
          <input
            type="text"
            placeholder="답글을 입력하세요"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit()}
          />
          <button onClick={handleReplySubmit}>등록</button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map(reply => (
            <div key={reply.id} className="reply-item">
              <div className="comment-header">
                <span className="comment-author">{reply.author}</span>
                <span className="comment-date">{reply.createdAt}</span>
              </div>
              <div className="comment-content">{reply.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Comment = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const handleReply = (commentId, content) => {
    console.log('Reply to comment', commentId, content);
  };

  return (
    <div className="comments-container">
      <div className="comment-input-wrapper">
        <textarea
          placeholder="댓글을 입력하세요"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <button onClick={handleSubmit}>댓글 등록</button>
      </div>

      <div className="comments-list">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
        ))}
      </div>
    </div>
  );
};

export default Comment;
