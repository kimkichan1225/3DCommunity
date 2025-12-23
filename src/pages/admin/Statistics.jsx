import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import './Statistics.css';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const data = await adminService.getStatistics();
            setStats(data);
        } catch (err) {
            console.error('통계 로드 실패:', err);
            setError('통계 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">데이터 로딩 중...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!stats) return null;

    // 차트 최대값 계산 (Y축 스케일링용)
    const maxRevenue = Math.max(...(stats.dailyRevenue?.map(d => d.value) || [0]), 100);

    return (
        <div className="statistics-container">
            <div className="statistics-header">
                <h2>대시보드 통계</h2>
            </div>

            {/* 1. 요약 카드 섹션 */}
            <div className="stats-summary-grid">
                <div className="stat-card">
                    <div className="stat-title">👥 총 사용자</div>
                    <div className="stat-value">{stats.totalUsers.toLocaleString()}명</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">💰 총 누적 매출</div>
                    <div className="stat-value revenue">{stats.totalRevenue.toLocaleString()}원</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">🟢 활성 사용자 (7일)</div>
                    <div className="stat-value active">{stats.activeUsers.toLocaleString()}명</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">📝 총 게시글</div>
                    <div className="stat-value">{stats.totalPosts.toLocaleString()}개</div>
                </div>
            </div>

            {/* 2. 차트 섹션 */}
            <div className="charts-grid">
                {/* 매출 차트 */}
                <div className="chart-card">
                    <div className="chart-header">최근 7일 매출 추이</div>
                    <div className="css-bar-chart">
                        {stats.dailyRevenue?.map((day, index) => {
                            // 높이 비율 계산 (최대값 기준 백분율)
                            const heightPercent = (day.value / maxRevenue) * 100;
                            return (
                                <div key={index} className="bar-group">
                                    <div
                                        className="bar"
                                        style={{ height: `${Math.max(heightPercent, 1)}%` }} // 최소 1%
                                        data-value={`${day.value.toLocaleString()}원`}
                                    ></div>
                                    <div className="x-label">{day.date.substring(5)}</div> {/* MM-DD 만 표시 */}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 사용자 성장 (간단한 리스트나 다른 형태) - 현재 API 미구현 부분은 스킵하거나 기본 표시 */}
                <div className="chart-card">
                    <div className="chart-header">최근 7일 가입자</div>
                    <div className="css-bar-chart">
                        {/* 가입자 데이터가 있다면 표시 (현재 Service에서 Mocking 필요할 수 있음) */}
                        {stats.dailyUserGrowth?.map((day, index) => {
                            const maxUsers = Math.max(...(stats.dailyUserGrowth.map(d => d.value)), 10);
                            const heightPercent = (day.value / maxUsers) * 100;
                            return (
                                <div key={index} className="bar-group">
                                    <div
                                        className="bar"
                                        style={{ height: `${Math.max(heightPercent, 1)}%`, background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)' }}
                                        data-value={`${day.value}명`}
                                    ></div>
                                    <div className="x-label">{day.date.substring(5)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
