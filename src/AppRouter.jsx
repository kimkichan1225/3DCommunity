import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ProfileItemManager from './pages/admin/ProfileItemManager';
import NoticeManagement from './pages/admin/NoticeManagement';
import BoardManagement from './pages/admin/BoardManagement';
import ChatLogManagement from './pages/admin/ChatLogManagement';
import ProtectedRoute from './components/ProtectedRoute';
import MinigameSelectPage from './pages/MinigameSelectPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 게임 페이지 (로그인 화면 포함) */}
        <Route path="/" element={<App />} />
        <Route path="/game" element={<App />} />

        {/* 관리자 페이지 (ADMIN 또는 DEVELOPER 권한 필요) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_DEVELOPER"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<div>신고 관리 (준비 중)</div>} />
          <Route path="notices" element={<NoticeManagement />} />
          <Route path="chat-logs" element={<ChatLogManagement />} />
          <Route path="boards" element={<BoardManagement />} />
          <Route path="rooms" element={<div>게임 방 관리 (준비 중)</div>} />
          <Route path="shop" element={<div>상점 관리 (준비 중)</div>} />
          <Route path="payments" element={<div>결제/환불 (준비 중)</div>} />
          <Route path="statistics" element={<div>통계 (준비 중)</div>} />
          <Route path="audit-logs" element={<div>감사 로그 (준비 중)</div>} />
          <Route path="profile-items" element={<ProfileItemManager />} />
          <Route path="system" element={<div>시스템 (준비 중)</div>} />
        </Route>

        <Route path="/minigame-select" element={<MinigameSelectPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
