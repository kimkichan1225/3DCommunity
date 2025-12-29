import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayNewUsers: 0,
    totalPosts: 0,
    totalComments: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
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

        {/* 게시판 통계 */}
        <div className="stat-card">
          <div className="stat-icon post-icon">📝</div>
          <div className="stat-info">
            <h3>전체 게시글</h3>
            <p className="stat-value">{stats.totalPosts.toLocaleString()}</p>
            <p className="stat-detail">댓글: {stats.totalComments.toLocaleString()}</p>
          </div>
        </div>

        {/* 일반 게시글 */}
        <div className="stat-card small">
          <div className="stat-info">
            <h4>일반</h4>
            <p className="stat-value-small">{(stats.generalPosts || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* 질문 게시글 */}
        <div className="stat-card small">
          <div className="stat-info">
            <h4>❓ 질문</h4>
            <p className="stat-value-small">{(stats.questionPosts || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* 짤 게시글 */}
        <div className="stat-card small">
          <div className="stat-info">
            <h4>🖼️ 짤</h4>
            <p className="stat-value-small">{(stats.imagePosts || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* 영상 게시글 */}
        <div className="stat-card small">
          <div className="stat-info">
            <h4>🎬 영상</h4>
            <p className="stat-value-small">{(stats.videoPosts || 0).toLocaleString()}</p>
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
