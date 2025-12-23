import React, { useState, useEffect } from 'react';
import './BoardList.css';
import boardService from '../services/boardService';

function BoardList({ type, onPostClick, refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPostType, setSelectedPostType] = useState(null); // null = 전체
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const postTypeOptions = [
    { value: null, label: '전체' },
    { value: 'QUESTION', label: '질문', icon: '❓' },
    { value: 'IMAGE', label: '짤', icon: '🖼️' },
    { value: 'VIDEO', label: '영상', icon: '🎬' }
  ];

  const getPostTypeIcon = (postType) => {
    const option = postTypeOptions.find(opt => opt.value === postType);
    return option?.icon || '';
  };

  useEffect(() => {
    loadPosts();
  }, [type, refreshKey, selectedPostType, currentPage, pageSize]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      // 게시판 ID: 1 = 일반 게시판, 2 = 공지사항 (백엔드에서 설정된 ID에 따라 조정)
      const boardId = type === 'notice' ? 2 : 1;

      const response = await boardService.getPosts(boardId, currentPage, pageSize, selectedPostType);

      // 페이징된 데이터 처리
      if (response.content) {
        setPosts(response.content);
        setTotalPages(response.totalPages);
      } else if (Array.isArray(response)) {
        setPosts(response);
        setTotalPages(1);
      } else {
        setPosts([]);
        setTotalPages(0);
      }

      console.log(`✅ ${type === 'notice' ? '공지사항' : '게시판'} 데이터 로드 성공 (타입: ${selectedPostType || '전체'}):`, response);
    } catch (err) {
      console.error('❌ 게시글 로드 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
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
      <div className="board-list-filters">
        {/* 타입 필터 탭 (공지사항이 아닌 경우만 표시) */}
        {type !== 'notice' && (
          <div className="board-type-tabs">
            {postTypeOptions.map(option => (
              <button
                key={option.value || 'all'}
                className={`board-type-tab ${selectedPostType === option.value ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPostType(option.value);
                  setCurrentPage(0);
                }}
              >
                {option.icon && `${option.icon} `}{option.label}
              </button>
            ))}
          </div>
        )}

        <div className="page-size-selector">
          <label>표시 개수:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
          >
            <option value={5}>5개씩</option>
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>
      </div>

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
              <div className="board-list-col-title">
                {post.postType && post.postType !== 'GENERAL' && (
                  <span className="post-type-badge">
                    {getPostTypeIcon(post.postType)}
                  </span>
                )}
                {post.title}
              </div>
              <div className="board-list-col-author">{post.authorName || post.author}</div>
              <div className="board-list-col-views">{post.viewCount || post.views || 0}</div>
              <div className="board-list-col-comments">{post.commentCount || 0}</div>
              <div className="board-list-col-likes">{post.likeCount || post.likes || 0}</div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button onClick={() => handlePageChange(0)} disabled={currentPage === 0}>처음</button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>이전</button>
        <span className="page-info">{currentPage + 1} / {totalPages || 1} 페이지</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}>다음</button>
        <button onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>마지막</button>
      </div>
    </div>
  );
}

export default BoardList;
