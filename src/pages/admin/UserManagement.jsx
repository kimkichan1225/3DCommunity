import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import UserDetailModal from './UserDetailModal';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 검색 및 필터
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [suspensionFilter, setSuspensionFilter] = useState('');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // 정렬
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');

  // 모달
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 로딩 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isSuspended: suspensionFilter === '' ? undefined : suspensionFilter === 'true',
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDirection,
      };

      const response = await adminService.getUsers(params);

      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || '사용자 목록을 불러오는 데 실패했습니다.');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 핸들러 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // 검색 시 첫 페이지로 이동
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 필터, 페이지, 정렬 변경 시 즉시 조회
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, suspensionFilter, currentPage, pageSize, sortBy, sortDirection]);

  // 초기 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 정렬 변경
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDirection('DESC');
    }
  };

  // 사용자 상세 보기
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    // 자동 새로고침 제거 - 수동 새로고침 버튼으로 대체
  };

  // 페이지 번호 생성
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5; // 표시할 최대 페이지 번호 개수
    let startPage = Math.max(0, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // 제재 상태 뱃지
  const getSuspensionBadge = (user) => {
    if (user.isPermanentlySuspended) {
      return <span className="status-badge suspended permanent">영구 정지</span>;
    } else if (user.isSuspended) {
      return <span className="status-badge suspended">일시 정지</span>;
    } else {
      return <span className="status-badge active">정상</span>;
    }
  };

  // 역할 뱃지
  const getRoleBadge = (role) => {
    const roleLabels = {
      ROLE_USER: '일반',
      ROLE_ADMIN: '관리자',
      ROLE_DEVELOPER: '개발자',
    };
    const roleClass = role.toLowerCase().replace('role_', '');
    return <span className={`role-badge ${roleClass}`}>{roleLabels[role] || role}</span>;
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

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-left">
          <h1>사용자 관리</h1>
          <p className="user-count">총 {totalElements}명의 사용자</p>
        </div>
        <button className="btn-refresh" onClick={fetchUsers} title="새로고침">
          🔄 새로고침
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="이메일 또는 사용자명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>역할</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">전체</option>
            <option value="ROLE_USER">일반</option>
            <option value="ROLE_ADMIN">관리자</option>
            <option value="ROLE_DEVELOPER">개발자</option>
          </select>
        </div>

        <div className="filter-group">
          <label>상태</label>
          <select value={suspensionFilter} onChange={(e) => setSuspensionFilter(e.target.value)}>
            <option value="">전체</option>
            <option value="false">정상</option>
            <option value="true">제재 중</option>
          </select>
        </div>

        <div className="filter-group">
          <label>표시 개수</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}>
            <option value={5}>5개씩</option>
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>
      </div>

      {/* 사용자 테이블 */}
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">
                  ID {sortBy === 'id' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('username')} className="sortable">
                  사용자명 {sortBy === 'username' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  이메일 {sortBy === 'email' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('role')} className="sortable">
                  역할 {sortBy === 'role' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th>상태</th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  가입일 {sortBy === 'createdAt' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('lastLoginAt')} className="sortable">
                  마지막 로그인 {sortBy === 'lastLoginAt' && (sortDirection === 'ASC' ? '▲' : '▼')}
                </th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">사용자가 없습니다.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={user.isSuspended ? 'suspended-row' : ''}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getSuspensionBadge(user)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLoginAt)}</td>
                    <td>
                      <button className="btn-detail" onClick={() => handleUserClick(user)}>
                        상세
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
          >
            처음
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            이전
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum + 1}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            다음
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
          >
            마지막
          </button>

          <span className="page-info">
            {currentPage + 1} / {totalPages} 페이지
          </span>
        </div>
      )}

      {/* 사용자 상세 모달 */}
      {isModalOpen && (
        <UserDetailModal user={selectedUser} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default UserManagement;
