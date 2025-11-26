import React, { useState } from 'react';
import './BoardModal.css';
import BoardList from './BoardList';
import BoardDetail from './BoardDetail';
import PostForm from './PostForm';
import { FaPencilAlt, FaBars } from 'react-icons/fa';

function BoardModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'notice'
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  const handlePostSuccess = (newPost) => {
    setShowPostForm(false);
    setSelectedPost(null); // 목록 새로고침
    alert('게시글이 작성되었습니다!');
  };

  return (
    <div className="board-modal-overlay" onClick={onClose}>
      <div className={`board-modal ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* 사이드바 */}
        {!sidebarCollapsed && (
          <div className="board-sidebar">
            <div className="sidebar-header">
              <h3>메뉴</h3>
              <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(true)}>
                <FaBars />
              </button>
            </div>
            <div className="sidebar-menu">
              <button
                className={`sidebar-menu-item ${activeTab === 'board' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('board');
                  setSelectedPost(null);
                }}
              >
                게시판
              </button>
              <button
                className={`sidebar-menu-item ${activeTab === 'notice' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('notice');
                  setSelectedPost(null);
                }}
              >
                공지사항
              </button>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <div className="board-main">
          {/* 헤더 */}
          <div className="board-modal-header">
            <div className="board-header-left">
              {sidebarCollapsed && (
                <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(false)}>
                  <FaBars />
                </button>
              )}
              <h2>{activeTab === 'board' ? '게시판' : '공지사항'}</h2>
            </div>
            <div className="board-header-right">
              {!selectedPost && activeTab === 'board' && (
                <button className="write-post-btn" onClick={() => setShowPostForm(true)}>
                  <FaPencilAlt /> 글쓰기
                </button>
              )}
              <button className="board-modal-close" onClick={onClose}>
                ×
              </button>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="board-modal-content">
            {selectedPost ? (
              <BoardDetail post={selectedPost} onBack={handleBackToList} />
            ) : (
              <BoardList type={activeTab} onPostClick={handlePostClick} />
            )}
          </div>
        </div>

        {/* 글쓰기 폼 모달 */}
        {showPostForm && (
          <PostForm
            boardId={1} // TODO: 실제 게시판 ID로 변경
            onClose={() => setShowPostForm(false)}
            onSuccess={handlePostSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default BoardModal;
