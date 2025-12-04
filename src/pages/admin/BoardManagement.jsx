import React, { useState, useEffect } from 'react';
import './BoardManagement.css';
import BoardList from '../../features/board/components/BoardList';
import BoardDetail from '../../features/board/components/BoardDetail';
import PostForm from '../../features/board/components/PostForm';
import boardService from '../../features/board/services/boardService';
import adminService from '../../services/adminService';
import authService from '../../features/auth/services/authService';
import { FaPencilAlt, FaBars, FaTrash } from 'react-icons/fa';

function BoardManagement() {
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'notice'
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    setRefreshKey(prev => prev + 1);
  };

  const handlePostSuccess = (newPost) => {
    setShowPostForm(false);
    setEditingPost(null);
    setSelectedPost(null);
    setRefreshKey(prev => prev + 1);
    alert(editingPost ? '게시글이 수정되었습니다!' : '게시글이 작성되었습니다!');
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowPostForm(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await boardService.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      setSelectedPost(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ 게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  // 관리자 권한으로 게시글 삭제
  const handleAdminDeletePost = async (postId) => {
    if (!window.confirm('⚠️ 관리자 권한으로 게시글을 삭제하시겠습니까?\n이 작업은 감사 로그에 기록됩니다.')) return;

    try {
      await adminService.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      setSelectedPost(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ 관리자 게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="board-management-container">
      <div className={`board-management-modal ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 사이드바 */}
        {!sidebarCollapsed && (
          <div className="board-sidebar">
            <div className="sidebar-header">
              <h3>게시판 메뉴</h3>
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
                  setShowPostForm(false);
                }}
              >
                일반 게시판
              </button>
              <button
                className={`sidebar-menu-item ${activeTab === 'notice' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('notice');
                  setSelectedPost(null);
                  setShowPostForm(false);
                }}
              >
                공지사항
              </button>
            </div>
            <div className="sidebar-info">
              <p className="admin-notice">🛡️ 관리자 모드</p>
              <p className="admin-description">
                일반 사용자와 동일한 UI이지만<br/>
                관리자 전용 버튼이 표시됩니다.
              </p>
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
              <h2>{activeTab === 'board' ? '일반 게시판 관리' : '공지사항 관리'}</h2>
            </div>
            <div className="board-header-right">
              {!selectedPost && !showPostForm && (
                <button className="board-write-btn" onClick={() => setShowPostForm(true)}>
                  <FaPencilAlt /> 글쓰기
                </button>
              )}
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="board-modal-content">
            {showPostForm ? (
              <PostForm
                boardId={activeTab === 'notice' ? 2 : 1}
                editingPost={editingPost}
                onSuccess={handlePostSuccess}
                onCancel={() => {
                  setShowPostForm(false);
                  setEditingPost(null);
                }}
              />
            ) : selectedPost ? (
              <div className="board-detail-wrapper">
                <BoardDetail
                  post={selectedPost}
                  onBack={handleBackToList}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />

                {/* 관리자 전용 버튼 */}
                {currentUser && (currentUser.role === 'ROLE_DEVELOPER' || currentUser.role === 'ROLE_ADMIN') && (
                  <div className="admin-actions">
                    <hr />
                    <div className="admin-actions-header">
                      <h3>🛡️ 관리자 전용 기능</h3>
                    </div>
                    <div className="admin-actions-buttons">
                      <button
                        className="btn-admin-delete"
                        onClick={() => handleAdminDeletePost(selectedPost.id)}
                      >
                        <FaTrash /> 관리자 권한으로 삭제
                      </button>
                      <p className="admin-warning">
                        ⚠️ 이 작업은 감사 로그에 기록됩니다
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <BoardList
                type={activeTab}
                onPostClick={handlePostClick}
                refreshKey={refreshKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardManagement;
