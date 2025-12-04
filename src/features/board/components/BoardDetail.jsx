import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaThumbsDown, FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import './BoardDetail.css';
import boardService from '../services/boardService';
import authService from '../../auth/services/authService';

function BoardDetail({ post, onBack, onEdit, onDelete }) {
  const [postData, setPostData] = useState(post);
  const [likes, setLikes] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // 댓글 목록 로드
    loadComments();

    // 좋아요 여부 확인
    checkLikeStatus();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const response = await boardService.getComments(post.id);
      setComments(response);
    } catch (err) {
      console.error('❌ 댓글 로드 실패:', err);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const liked = await boardService.checkLike('POST', post.id);
        setIsLiked(liked);
      }
    } catch (err) {
      console.error('좋아요 상태 확인 실패:', err);
    }
  };

  const handleLike = async () => {
    try {
      const response = await boardService.toggleLike('POST', post.id);
      setIsLiked(response.isLiked);
      setLikes(response.likeCount);
    } catch (err) {
      console.error('❌ 좋아요 실패:', err);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const commentData = {
        postId: post.id,
        parentCommentId: null,
        content: newComment
      };

      await boardService.createComment(commentData);
      setNewComment('');
      await loadComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await boardService.deleteComment(commentId);
      await loadComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error('❌ 댓글 삭제 실패:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handleReplySubmit = async (parentCommentId, replyContent) => {
    if (!replyContent.trim()) return;

    try {
      const commentData = {
        postId: post.id,
        parentCommentId: parentCommentId,
        content: replyContent
      };

      await boardService.createComment(commentData);
      await loadComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error('❌ 대댓글 작성 실패:', err);
      alert('대댓글 작성에 실패했습니다.');
    }
  };

  // 작성자 본인 여부 확인
  const isAuthor = currentUser && post.authorId === currentUser.id;

  // 관리자 권한 확인 (ROLE_ADMIN 또는 ROLE_DEVELOPER)
  const isAdmin = currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_DEVELOPER');

  // 수정/삭제 버튼 표시 여부: 작성자 본인이거나 관리자
  const canEdit = isAuthor || isAdmin;

  return (
    <div className="board-detail">
      {/* 뒤로가기 버튼 */}
      <button className="board-detail-back" onClick={onBack}>
        <FaArrowLeft /> 목록으로
      </button>

      {/* 상단: 게시글 정보 */}
      <div className="board-detail-header">
        <div className="board-detail-title-row">
          <h2 className="board-detail-title">{post.title}</h2>
          {canEdit && (
            <div className="board-detail-actions-top">
              <button className="board-action-btn-small edit-btn" onClick={() => onEdit && onEdit(post)}>
                <FaEdit /> 수정
              </button>
              <button className="board-action-btn-small delete-btn" onClick={() => onDelete && onDelete(post.id)}>
                <FaTrash /> 삭제
              </button>
              {isAdmin && !isAuthor && (
                <span className="admin-badge">🛡️ 관리자</span>
              )}
            </div>
          )}
        </div>
        <div className="board-detail-info">
          <div className="board-detail-author-section">
            <div className="board-detail-author-avatar">
              {(post.authorName || post.author || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="board-detail-author-info">
              <div className="board-detail-author">{post.authorName || post.author}</div>
              <div className="board-detail-meta">
                조회 {post.viewCount || 0} · 추천 {likes} · 댓글 {comments.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 중단: 본문 */}
      <div className="board-detail-body">
        <div className="board-detail-content">
          {/* 실제 게시글 내용 렌더링 */}
          <div dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br/>') || '' }} />

          {/* 이미지가 있는 경우 표시 */}
          {post.images && (
            <div className="board-detail-images">
              <img src={post.images} alt="게시글 이미지" />
            </div>
          )}
        </div>

        {/* 추천/비추천 버튼 */}
        <div className="board-detail-actions">
          <button
            className={`board-action-btn like-btn ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
          >
            <FaThumbsUp /> 추천 ({likes})
          </button>
        </div>
      </div>

      {/* 하단: 댓글 */}
      <div className="board-detail-comments">
        <h3 className="comments-title">댓글 ({comments.length})</h3>

        {/* 댓글 목록 */}
        <div className="comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onDelete={handleCommentDelete}
              onReply={handleReplySubmit}
            />
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
          <button type="submit" className="comment-submit-btn" disabled={loading}>
            {loading ? '작성 중...' : '댓글 작성'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 댓글 아이템 컴포넌트
function CommentItem({ comment, currentUser, onDelete, onReply }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  const isCommentAuthor = currentUser && comment.authorId === currentUser.id;
  const isAdmin = currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_DEVELOPER');
  const canDeleteComment = isCommentAuthor || isAdmin;

  return (
    <div className="comment-item">
      <div className="comment-author-avatar">
        {(comment.authorName || 'U').charAt(0).toUpperCase()}
      </div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.authorName}</span>
          <span className="comment-date">
            {new Date(comment.createdAt).toLocaleString('ko-KR')}
          </span>
          {isAdmin && !isCommentAuthor && (
            <span className="admin-badge-small">🛡️</span>
          )}
        </div>
        <div className="comment-content">{comment.content}</div>
        <div className="comment-actions">
          <button className="comment-reply-btn" onClick={() => setShowReplyInput(!showReplyInput)}>
            답글 달기
          </button>
          {canDeleteComment && (
            <button className="comment-delete-btn" onClick={() => onDelete(comment.id)}>
              삭제
            </button>
          )}
        </div>

        {/* 답글 입력 폼 */}
        {showReplyInput && (
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <input
              type="text"
              className="reply-input"
              placeholder="답글을 입력하세요..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button type="submit" className="reply-submit-btn">등록</button>
          </form>
        )}

        {/* 대댓글 목록 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-list">
            {comment.replies.map((reply) => {
              const isReplyAuthor = currentUser && reply.authorId === currentUser.id;
              const canDeleteReply = isReplyAuthor || isAdmin;

              return (
                <div key={reply.id} className="reply-item">
                  <div className="comment-author-avatar">
                    {(reply.authorName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{reply.authorName}</span>
                      <span className="comment-date">
                        {new Date(reply.createdAt).toLocaleString('ko-KR')}
                      </span>
                      {isAdmin && !isReplyAuthor && (
                        <span className="admin-badge-small">🛡️</span>
                      )}
                    </div>
                    <div className="comment-content">{reply.content}</div>
                    {canDeleteReply && (
                      <button className="comment-delete-btn" onClick={() => onDelete(reply.id)}>
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardDetail;
