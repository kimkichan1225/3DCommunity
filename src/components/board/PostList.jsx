import React, { useState } from 'react';
import PostDetail from './PostDetail';
import PostForm from './PostForm';
import './PostList.css';

const PostList = ({ boardId }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      boardId: 'FREE',
      title: '게시판 테스트 게시글입니다',
      content: '게시글 내용입니다.',
      author: 'testuser',
      viewCount: 42,
      likeCount: 5,
      commentCount: 3,
      createdAt: '2025-11-20 10:30'
    },
    {
      id: 2,
      boardId: 'STRATEGY',
      title: '공략 게시글 예시',
      content: '공략 내용',
      author: 'player1',
      viewCount: 128,
      likeCount: 15,
      commentCount: 8,
      createdAt: '2025-11-19 15:20'
    }
  ]);

  const filteredPosts = posts.filter(post => post.boardId === boardId);

  const handleCreatePost = (newPost) => {
    const post = {
      ...newPost,
      id: posts.length + 1,
      boardId,
      author: 'currentUser',
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toLocaleString('ko-KR')
    };
    setPosts([post, ...posts]);
    setIsWriting(false);
  };

  if (selectedPost) {
    return <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />;
  }

  if (isWriting) {
    return <PostForm onSubmit={handleCreatePost} onCancel={() => setIsWriting(false)} />;
  }

  return (
    <div className="post-list-container">
      <div className="post-list-header">
        <h2>전체 글 {filteredPosts.length}개</h2>
        <button className="btn-write" onClick={() => setIsWriting(true)}>
          글쓰기
        </button>
      </div>
      <div className="post-list">
        {filteredPosts.length === 0 ? (
          <div className="empty-message">게시글이 없습니다.</div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="post-item" onClick={() => setSelectedPost(post)}>
              <div className="post-title">{post.title}</div>
              <div className="post-meta">
                <span className="post-author">{post.author}</span>
                <span className="post-date">{post.createdAt}</span>
              </div>
              <div className="post-stats">
                <span>조회 {post.viewCount}</span>
                <span>좋아요 {post.likeCount}</span>
                <span>댓글 {post.commentCount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostList;
