import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin', label: '대시보드', icon: '📊' },
    { path: '/admin/users', label: '사용자 관리', icon: '👥' },
    { path: '/admin/reports', label: '신고 관리', icon: '🚨' },
    { path: '/admin/notices', label: '공지사항', icon: '📢' },
    { path: '/admin/chat-logs', label: '채팅 로그', icon: '💬' },
    { path: '/admin/boards', label: '게시판 관리', icon: '📝' },
    { path: '/admin/rooms', label: '게임 방 관리', icon: '🎮' },
    { path: '/admin/shop', label: '상점 관리', icon: '🛒' },
    { path: '/admin/payments', label: '결제/환불', icon: '💳' },
    { path: '/admin/statistics', label: '통계', icon: '📈' },
    { path: '/admin/audit-logs', label: '감사 로그', icon: '📋' },
    { path: '/admin/system', label: '시스템', icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>MetaPlaza Admin</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className="nav-item"
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className={`admin-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="admin-header">
          <h1>관리자 페이지</h1>
          <div className="admin-user-info">
            <span>관리자</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
