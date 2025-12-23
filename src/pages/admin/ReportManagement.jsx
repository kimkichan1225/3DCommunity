import React, { useState, useEffect } from 'react';
import './ReportManagement.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    reportType: '',
    page: 0,
    size: 20
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // 처리 폼 상태
  const [processForm, setProcessForm] = useState({
    status: 'ACCEPTED',
    adminNote: ''
  });

  useEffect(() => {
    fetchReports();
    fetchPendingCount();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('size', filters.size);
      if (filters.status) params.append('status', filters.status);
      if (filters.reportType) params.append('reportType', filters.reportType);

      const response = await axios.get(`${API_URL}/api/reports/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReports(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('❌ 신고 목록 조회 실패:', error);
      alert('신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/reports/admin/pending-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCount(response.data);
    } catch (error) {
      console.error('❌ 대기 중인 신고 수 조회 실패:', error);
    }
  };

  const handleViewDetail = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/reports/admin/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedReport(response.data);
      setProcessForm({
        status: 'ACCEPTED',
        adminNote: ''
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ 신고 상세 조회 실패:', error);
      alert('신고 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleProcessReport = async () => {
    if (!processForm.adminNote.trim()) {
      alert('처리 메모를 입력하세요.');
      return;
    }

    if (!window.confirm(`신고를 ${processForm.status === 'ACCEPTED' ? '승인' : '반려'}하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/reports/admin/${selectedReport.id}/process`,
        processForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert('신고 처리가 완료되었습니다.');
      setShowDetailModal(false);
      setSelectedReport(null);
      fetchReports();
      fetchPendingCount();
    } catch (error) {
      console.error('❌ 신고 처리 실패:', error);
      alert('신고 처리에 실패했습니다: ' + (error.response?.data || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-badge pending';
      case 'ACCEPTED': return 'status-badge accepted';
      case 'REJECTED': return 'status-badge rejected';
      default: return 'status-badge';
    }
  };

  const getReasonBadgeClass = (reason) => {
    const severityMap = {
      'SPAM': 'low',
      'ABUSE': 'high',
      'SEXUAL': 'high',
      'ILLEGAL': 'high',
      'COPYRIGHT': 'medium',
      'PRIVACY': 'high',
      'FAKE_NEWS': 'medium',
      'ETC': 'low'
    };
    return `reason-badge ${severityMap[reason] || 'low'}`;
  };

  if (loading && reports.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="report-management">
      <div className="header">
        <h2>신고 관리</h2>
        <div className="header-stats">
          <span className="pending-count">
            대기 중: <strong>{pendingCount}</strong>건
          </span>
        </div>
      </div>

      {/* 필터 */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 0 })}
          className="filter-select"
        >
          <option value="">전체 상태</option>
          <option value="PENDING">대기 중</option>
          <option value="ACCEPTED">승인 (조치 완료)</option>
          <option value="REJECTED">반려 (문제 없음)</option>
        </select>

        <select
          value={filters.reportType}
          onChange={(e) => setFilters({ ...filters, reportType: e.target.value, page: 0 })}
          className="filter-select"
        >
          <option value="">전체 타입</option>
          <option value="POST">게시글</option>
          <option value="COMMENT">댓글</option>
          <option value="USER">사용자</option>
        </select>

        <div className="filter-group">
          <label>표시 개수:</label>
          <select
            value={filters.size}
            onChange={(e) => setFilters({ ...filters, size: Number(e.target.value), page: 0 })}
          >
            <option value={5}>5개씩</option>
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>

        <button className="btn-reset" onClick={() => setFilters({ status: '', reportType: '', page: 0, size: 20 })}>
          필터 초기화
        </button>
      </div>

      {/* 테이블 */}
      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>타입</th>
              <th>신고 대상</th>
              <th>신고자</th>
              <th>대상 사용자</th>
              <th>사유</th>
              <th>상태</th>
              <th>신고일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty">
                  신고가 없습니다.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>
                    <span className="type-badge">{report.reportTypeDescription}</span>
                  </td>
                  <td className="target-title">{report.targetTitle}</td>
                  <td>{report.reporterName}</td>
                  <td>{report.targetUserName || '-'}</td>
                  <td>
                    <span className={getReasonBadgeClass(report.reason)}>
                      {report.reasonDescription}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(report.status)}>
                      {report.statusDescription}
                    </span>
                  </td>
                  <td>{new Date(report.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetail(report.id)}
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={filters.page === 0}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            이전
          </button>
          <span>
            {filters.page + 1} / {totalPages}
          </span>
          <button
            disabled={filters.page >= totalPages - 1}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            다음
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>신고 상세 정보</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>신고 정보</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>신고 ID</label>
                    <span>{selectedReport.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>신고 타입</label>
                    <span>{selectedReport.reportTypeDescription}</span>
                  </div>
                  <div className="detail-item">
                    <label>신고 사유</label>
                    <span className={getReasonBadgeClass(selectedReport.reason)}>
                      {selectedReport.reasonDescription}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>신고 상태</label>
                    <span className={getStatusBadgeClass(selectedReport.status)}>
                      {selectedReport.statusDescription}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <label>신고 대상</label>
                    <span>{selectedReport.targetTitle}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>신고 상세 설명</label>
                    <p className="description">{selectedReport.description || '없음'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>관련 사용자</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>신고자</label>
                    <span>{selectedReport.reporterName}</span>
                  </div>
                  <div className="detail-item">
                    <label>대상 사용자</label>
                    <span>{selectedReport.targetUserName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>신고일</label>
                    <span>{new Date(selectedReport.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  {selectedReport.processedAt && (
                    <div className="detail-item">
                      <label>처리일</label>
                      <span>{new Date(selectedReport.processedAt).toLocaleString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.status !== 'PENDING' && (
                <div className="detail-section">
                  <h4>처리 정보</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>처리 관리자</label>
                      <span>{selectedReport.adminName || '-'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <label>관리자 메모</label>
                      <p className="description">{selectedReport.adminNote || '없음'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.status === 'PENDING' && (
                <div className="detail-section process-section">
                  <h4>신고 처리</h4>
                  <div className="process-form">
                    <div className="form-group">
                      <label>처리 결과</label>
                      <select
                        value={processForm.status}
                        onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                      >
                        <option value="ACCEPTED">승인 (조치 완료)</option>
                        <option value="REJECTED">반려 (문제 없음)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>처리 메모 (필수)</label>
                      <textarea
                        value={processForm.adminNote}
                        onChange={(e) => setProcessForm({ ...processForm, adminNote: e.target.value })}
                        placeholder="처리 사유 및 조치 내역을 입력하세요..."
                        rows={4}
                      />
                    </div>
                    <button className="btn-process" onClick={handleProcessReport}>
                      처리 완료
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportManagement;
