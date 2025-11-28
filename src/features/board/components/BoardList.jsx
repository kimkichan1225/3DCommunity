import React, { useState, useEffect } from 'react';
import './BoardList.css';
import boardService from '../services/boardService';

function BoardList({ type, onPostClick, refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, [type, refreshKey]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      // 게시판 ID: 1 = 일반 게시판, 2 = 공지사항 (백엔드에서 설정된 ID에 따라 조정)
      const boardId = type === 'notice' ? 2 : 1;

      const response = await boardService.getPosts(boardId);

      // 페이징된 데이터 처리
      if (response.content) {
        setPosts(response.content);
      } else if (Array.isArray(response)) {
        setPosts(response);
      } else {
        setPosts([]);
      }

      console.log(`✅ ${type === 'notice' ? '공지사항' : '게시판'} 데이터 로드 성공:`, response);
    } catch (err) {
      console.error('❌ 게시글 로드 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      // 에러 시 더미 데이터 표시
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="board-list-loading">
        <p>게시글을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-list-error">
        <p>{error}</p>
        <button onClick={loadPosts}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="board-list">
      <div className="board-list-header">
        <div className="board-list-col-no">번호</div>
        <div className="board-list-col-title">제목</div>
        <div className="board-list-col-author">작성자</div>
        <div className="board-list-col-views">조회수</div>
        <div className="board-list-col-comments">댓글수</div>
        <div className="board-list-col-likes">추천수</div>
      </div>
      <div className="board-list-body">
        {posts.length === 0 ? (
          <div className="board-list-empty">
            <p>게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="board-list-row"
              onClick={() => onPostClick(post)}
            >
              <div className="board-list-col-no">{post.id}</div>
              <div className="board-list-col-title">{post.title}</div>
              <div className="board-list-col-author">{post.authorName || post.author}</div>
              <div className="board-list-col-views">{post.viewCount || post.views || 0}</div>
              <div className="board-list-col-comments">{post.commentCount || 0}</div>
              <div className="board-list-col-likes">{post.likeCount || post.likes || 0}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BoardList;
