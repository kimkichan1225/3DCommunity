import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 게임 페이지 */}
        <Route path="/" element={<App />} />
        <Route path="/game" element={<App />} />

        {/* 관리자 페이지 (DEVELOPER 권한 필요) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ROLE_DEVELOPER">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<div>사용자 관리 (준비 중)</div>} />
          <Route path="reports" element={<div>신고 관리 (준비 중)</div>} />
          <Route path="notices" element={<div>공지사항 관리 (준비 중)</div>} />
          <Route path="chat-logs" element={<div>채팅 로그 (준비 중)</div>} />
          <Route path="boards" element={<div>게시판 관리 (준비 중)</div>} />
          <Route path="rooms" element={<div>게임 방 관리 (준비 중)</div>} />
          <Route path="shop" element={<div>상점 관리 (준비 중)</div>} />
          <Route path="payments" element={<div>결제/환불 (준비 중)</div>} />
          <Route path="statistics" element={<div>통계 (준비 중)</div>} />
          <Route path="audit-logs" element={<div>감사 로그 (준비 중)</div>} />
          <Route path="system" element={<div>시스템 (준비 중)</div>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
