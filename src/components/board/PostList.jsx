import React, { useState, useEffect } from 'react';
import PostDetail from './PostDetail';
import PostForm from './PostForm';
import boardService from '../../services/boardService';
import authService from '../../services/authService';
import './PostList.css';

const PostList = ({ boardId }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (boardId) {
      loadPosts();
    }
  }, [boardId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getPosts(boardId);
      // Page 객체에서 content 추출
      setPosts(data.content || data);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (newPost) => {
    try {
      if (!authService.isAuthenticated()) {
        alert('로그인이 필요합니다.');
        return;
      }

      const postData = {
        boardId: boardId,
        title: newPost.title,
        content: newPost.content,
        images: null
      };

      await boardService.createPost(postData);
      alert('게시글이 작성되었습니다.');
      setIsWriting(false);
      loadPosts(); // 목록 새로고침
    } catch (err) {
      console.error('게시글 작성 실패:', err);
      alert('게시글 작성에 실패했습니다: ' + (err.response?.data || err.message));
    }
  };

  const handlePostClick = async (post) => {
    try {
      // 상세 조회 API 호출 (조회수 증가)
      const detailData = await boardService.getPost(post.id);
      setSelectedPost(detailData);
    } catch (err) {
      console.error('게시글 조회 실패:', err);
      alert('게시글을 불러오는데 실패했습니다.');
    }
  };

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => {
          setSelectedPost(null);
          loadPosts(); // 목록 새로고침
        }}
      />
    );
  }

  if (isWriting) {
    return <PostForm onSubmit={handleCreatePost} onCancel={() => setIsWriting(false)} />;
  }

  if (loading) {
    return <div className="post-list-container"><p>로딩 중...</p></div>;
  }

  return (
    <div className="post-list-container">
      <div className="post-list-header">
        <h2>전체 글 {posts.length}개</h2>
        <button className="btn-write" onClick={() => setIsWriting(true)}>
          글쓰기
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="post-list">
        {posts.length === 0 ? (
          <div className="empty-message">게시글이 없습니다.</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-item" onClick={() => handlePostClick(post)}>
              <div className="post-title">{post.title}</div>
              <div className="post-meta">
                <span className="post-author">{post.authorName}</span>
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <div className="post-stats">
                <span>조회 {post.viewCount}</span>
                <span>좋아요 {post.likeCount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostList;
