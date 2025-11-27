import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayNewUsers: 0,
    onlineUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    pendingReports: 0,
    activeRooms: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="dashboard">
      <h2>대시보드</h2>

      <div className="stats-grid">
        {/* 사용자 통계 */}
        <div className="stat-card">
          <div className="stat-icon user-icon">👥</div>
          <div className="stat-info">
            <h3>전체 사용자</h3>
            <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
            <p className="stat-detail">
              오늘 가입: <span className="highlight">{stats.todayNewUsers}</span>명
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon online-icon">🟢</div>
          <div className="stat-info">
            <h3>실시간 접속자</h3>
            <p className="stat-value">{stats.onlineUsers.toLocaleString()}</p>
            <p className="stat-detail">현재 온라인</p>
          </div>
        </div>

        {/* 게시판 통계 */}
        <div className="stat-card">
          <div className="stat-icon post-icon">📝</div>
          <div className="stat-info">
            <h3>게시글</h3>
            <p className="stat-value">{stats.totalPosts.toLocaleString()}</p>
            <p className="stat-detail">댓글: {stats.totalComments.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon report-icon">🚨</div>
          <div className="stat-info">
            <h3>미처리 신고</h3>
            <p className="stat-value">{stats.pendingReports}</p>
            <p className="stat-detail">
              {stats.pendingReports > 0 ? '확인 필요' : '처리 완료'}
            </p>
          </div>
        </div>

        {/* 게임 통계 */}
        <div className="stat-card">
          <div className="stat-icon room-icon">🎮</div>
          <div className="stat-info">
            <h3>활성 게임 방</h3>
            <p className="stat-value">{stats.activeRooms}</p>
            <p className="stat-detail">현재 진행 중</p>
          </div>
        </div>

        {/* 매출 통계 */}
        <div className="stat-card">
          <div className="stat-icon revenue-icon">💰</div>
          <div className="stat-info">
            <h3>오늘 매출</h3>
            <p className="stat-value">₩{stats.todayRevenue.toLocaleString()}</p>
            <p className="stat-detail">
              이번 달: ₩{stats.monthlyRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 최근 활동 섹션 (향후 구현) */}
      <div className="recent-activities">
        <h3>최근 활동</h3>
        <p className="placeholder">최근 관리자 활동 및 시스템 로그가 여기 표시됩니다.</p>
      </div>
    </div>
  );
};

export default Dashboard;
