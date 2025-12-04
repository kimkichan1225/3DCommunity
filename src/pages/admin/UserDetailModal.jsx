import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './UserDetailModal.css';

const UserDetailModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'suspension', 'role', 'history'
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);

  // 제재 양식 상태
  const [suspensionType, setSuspensionType] = useState('TEMPORARY');
  const [durationDays, setDurationDays] = useState(1);
  const [suspensionReason, setSuspensionReason] = useState('');

  // 역할 변경 양식 상태
  const [newRole, setNewRole] = useState(user.role);
  const [roleChangeReason, setRoleChangeReason] = useState('');

  // 로딩 및 에러 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 제재 사유 템플릿
  const suspensionReasonTemplates = [
    { value: '', label: '직접 입력' },
    { value: '욕설 및 비방', label: '욕설 및 비방' },
    { value: '스팸 및 도배', label: '스팸 및 도배' },
    { value: '부적절한 게시물', label: '부적절한 게시물' },
    { value: '사기 및 허위 정보', label: '사기 및 허위 정보' },
    { value: '계정 도용 시도', label: '계정 도용 시도' },
    { value: '기타 커뮤니티 규정 위반', label: '기타 커뮤니티 규정 위반' },
  ];

  // 제재 이력 조회
  const fetchSuspensionHistory = async (page = 0) => {
    try {
      const response = await adminService.getUserSuspensionHistory(user.id, page, 10);
      setSuspensionHistory(response.content || []);
      setHistoryTotalPages(response.totalPages || 0);
      setHistoryPage(page);
    } catch (err) {
      console.error('Failed to fetch suspension history:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSuspensionHistory();
    }
  }, [activeTab]);

  // 제재 신청
  const handleSuspend = async (e) => {
    e.preventDefault();

    if (!suspensionReason.trim()) {
      setError('제재 사유를 입력해주세요.');
      return;
    }

    // 2단계 확인 (영구 정지인 경우)
    if (suspensionType === 'PERMANENT') {
      if (!window.confirm(`정말로 이 사용자를 영구 정지하시겠습니까?\n\n사용자: ${user.email}\n사유: ${suspensionReason}`)) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        suspensionType,
        durationDays: suspensionType === 'TEMPORARY' ? durationDays : undefined,
        reason: suspensionReason,
      };

      await adminService.suspendUser(user.id, requestData);

      setSuccess(
        suspensionType === 'UNSUSPEND'
          ? '제재가 해제되었습니다.'
          : '제재가 적용되었습니다.'
      );

      setSuspensionReason('');

      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || '제재 적용에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 역할 변경
  const handleRoleChange = async (e) => {
    e.preventDefault();

    if (newRole === user.role) {
      setError('동일한 역할로 변경할 수 없습니다.');
      return;
    }

    // 2단계 확인
    const roleLabels = {
      ROLE_USER: '일반',
      ROLE_ADMIN: '관리자',
      ROLE_DEVELOPER: '개발자',
    };

    if (!window.confirm(`정말로 이 사용자의 역할을 변경하시겠습니까?\n\n${roleLabels[user.role]} → ${roleLabels[newRole]}`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        newRole,
        reason: roleChangeReason || undefined,
      };

      await adminService.changeUserRole(user.id, requestData);

      setSuccess('역할이 변경되었습니다.');
      setRoleChangeReason('');

      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || '역할 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 제재 타입 라벨
  const getSuspensionTypeLabel = (type) => {
    const labels = {
      TEMPORARY: '일시 정지',
      PERMANENT: '영구 정지',
      UNSUSPEND: '정지 해제',
    };
    return labels[type] || type;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>사용자 관리</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            상세 정보
          </button>
          <button
            className={`tab-btn ${activeTab === 'suspension' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspension')}
          >
            제재 관리
          </button>
          <button
            className={`tab-btn ${activeTab === 'role' ? 'active' : ''}`}
            onClick={() => setActiveTab('role')}
          >
            역할 변경
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            제재 이력
          </button>
        </div>

        <div className="modal-body">
          {/* 알림 메시지 */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* 상세 정보 탭 */}
          {activeTab === 'info' && (
            <div className="info-section">
              <div className="info-row">
                <span className="label">ID:</span>
                <span className="value">{user.id}</span>
              </div>
              <div className="info-row">
                <span className="label">사용자명:</span>
                <span className="value">{user.username}</span>
              </div>
              <div className="info-row">
                <span className="label">이메일:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="label">역할:</span>
                <span className="value">
                  {user.role === 'ROLE_USER' && '일반'}
                  {user.role === 'ROLE_ADMIN' && '관리자'}
                  {user.role === 'ROLE_DEVELOPER' && '개발자'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">가입일:</span>
                <span className="value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="label">마지막 로그인:</span>
                <span className="value">{formatDate(user.lastLoginAt)}</span>
              </div>
              <div className="info-row">
                <span className="label">제재 상태:</span>
                <span className="value">
                  {user.isPermanentlySuspended && (
                    <span className="status-label permanent">영구 정지</span>
                  )}
                  {!user.isPermanentlySuspended && user.isSuspended && (
                    <span className="status-label suspended">일시 정지 (해제: {formatDate(user.suspendedUntil)})</span>
                  )}
                  {!user.isSuspended && <span className="status-label active">정상</span>}
                </span>
              </div>
              {user.suspensionReason && (
                <div className="info-row">
                  <span className="label">제재 사유:</span>
                  <span className="value">{user.suspensionReason}</span>
                </div>
              )}
            </div>
          )}

          {/* 제재 관리 탭 */}
          {activeTab === 'suspension' && (
            <form className="suspension-form" onSubmit={handleSuspend}>
              <div className="form-group">
                <label>제재 유형</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="TEMPORARY"
                      checked={suspensionType === 'TEMPORARY'}
                      onChange={(e) => setSuspensionType(e.target.value)}
                    />
                    일시 정지
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="PERMANENT"
                      checked={suspensionType === 'PERMANENT'}
                      onChange={(e) => setSuspensionType(e.target.value)}
                    />
                    영구 정지
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="UNSUSPEND"
                      checked={suspensionType === 'UNSUSPEND'}
                      onChange={(e) => setSuspensionType(e.target.value)}
                    />
                    정지 해제
                  </label>
                </div>
              </div>

              {suspensionType === 'TEMPORARY' && (
                <div className="form-group">
                  <label>제재 기간</label>
                  <div className="duration-buttons">
                    <button
                      type="button"
                      className={`duration-btn ${durationDays === 1 ? 'active' : ''}`}
                      onClick={() => setDurationDays(1)}
                    >
                      1일
                    </button>
                    <button
                      type="button"
                      className={`duration-btn ${durationDays === 7 ? 'active' : ''}`}
                      onClick={() => setDurationDays(7)}
                    >
                      7일
                    </button>
                    <button
                      type="button"
                      className={`duration-btn ${durationDays === 30 ? 'active' : ''}`}
                      onClick={() => setDurationDays(30)}
                    >
                      30일
                    </button>
                    <input
                      type="number"
                      className="duration-input"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      min="1"
                      max="365"
                      placeholder="직접 입력"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>제재 사유 템플릿</label>
                <select
                  value=""
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="form-select"
                >
                  {suspensionReasonTemplates.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>제재 사유 (필수)</label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="제재 사유를 입력해주세요..."
                  rows="4"
                  required
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '처리 중...' : suspensionType === 'UNSUSPEND' ? '정지 해제' : '제재 적용'}
              </button>
            </form>
          )}

          {/* 역할 변경 탭 */}
          {activeTab === 'role' && (
            <form className="role-form" onSubmit={handleRoleChange}>
              <div className="form-group">
                <label>현재 역할</label>
                <div className="current-role">
                  {user.role === 'ROLE_USER' && '일반'}
                  {user.role === 'ROLE_ADMIN' && '관리자'}
                  {user.role === 'ROLE_DEVELOPER' && '개발자'}
                </div>
              </div>

              <div className="form-group">
                <label>새로운 역할</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-select"
                >
                  <option value="ROLE_USER">일반</option>
                  <option value="ROLE_ADMIN">관리자</option>
                  <option value="ROLE_DEVELOPER">개발자</option>
                </select>
              </div>

              <div className="form-group">
                <label>변경 사유 (선택)</label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="역할 변경 사유를 입력해주세요..."
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading || newRole === user.role}>
                {loading ? '처리 중...' : '역할 변경'}
              </button>
            </form>
          )}

          {/* 제재 이력 탭 */}
          {activeTab === 'history' && (
            <div className="history-section">
              {suspensionHistory.length === 0 ? (
                <p className="no-history">제재 이력이 없습니다.</p>
              ) : (
                <div className="history-list">
                  {suspensionHistory.map((history) => (
                    <div key={history.id} className="history-item">
                      <div className="history-header">
                        <span className={`history-type ${history.suspensionType.toLowerCase()}`}>
                          {getSuspensionTypeLabel(history.suspensionType)}
                        </span>
                        <span className="history-date">{formatDate(history.createdAt)}</span>
                      </div>
                      <div className="history-body">
                        <p>
                          <strong>관리자:</strong> {history.adminName}
                        </p>
                        {history.suspendedUntil && (
                          <p>
                            <strong>정지 해제일:</strong> {formatDate(history.suspendedUntil)}
                          </p>
                        )}
                        <p>
                          <strong>사유:</strong> {history.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {historyTotalPages > 1 && (
                <div className="history-pagination">
                  <button
                    onClick={() => fetchSuspensionHistory(historyPage - 1)}
                    disabled={historyPage === 0}
                  >
                    이전
                  </button>
                  <span>
                    {historyPage + 1} / {historyTotalPages}
                  </span>
                  <button
                    onClick={() => fetchSuspensionHistory(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages - 1}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
