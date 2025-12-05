import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './ChatLogManagement.css';

const ChatLogManagement = () => {
  const [chatLogs, setChatLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 필터
  const [messageTypeFilter, setMessageTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // 로딩 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 채팅 로그 조회
  const fetchChatLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (keywordSearch) {
        // 키워드 검색
        response = await adminService.searchChatLogs({
          keyword: keywordSearch,
          page: currentPage,
          size: pageSize,
        });
      } else if (messageTypeFilter) {
        // 메시지 타입별 조회
        response = await adminService.getChatLogsByType(messageTypeFilter, {
          page: currentPage,
          size: pageSize,
        });
      } else if (userIdFilter) {
        // 사용자별 조회
        response = await adminService.getChatLogsByUser(userIdFilter, {
          page: currentPage,
          size: pageSize,
        });
      } else {
        // 전체 조회
        response = await adminService.getAllChatLogs({
          page: currentPage,
          size: pageSize,
        });
      }

      setChatLogs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || '채팅 로그를 불러오는 데 실패했습니다.');
      console.error('Failed to fetch chat logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 핸들러 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      fetchChatLogs();
    }, 500);

    return () => clearTimeout(timer);
  }, [keywordSearch]);

  // 필터, 페이지 변경 시 즉시 조회
  useEffect(() => {
    fetchChatLogs();
  }, [messageTypeFilter, userIdFilter, currentPage, pageSize]);

  // 초기 로드
  useEffect(() => {
    fetchChatLogs();
  }, []);

  // 메시지 삭제 (소프트 삭제)
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('이 메시지를 삭제하시겠습니까?')) return;

    try {
      await adminService.deleteMessage(messageId);
      alert('메시지가 삭제되었습니다.');
      fetchChatLogs();
    } catch (err) {
      alert(err.response?.data?.message || '메시지 삭제에 실패했습니다.');
    }
  };

  // 메시지 복구
  const handleRestoreMessage = async (messageId) => {
    if (!window.confirm('이 메시지를 복구하시겠습니까?')) return;

    try {
      await adminService.restoreMessage(messageId);
      alert('메시지가 복구되었습니다.');
      fetchChatLogs();
    } catch (err) {
      alert(err.response?.data?.message || '메시지 복구에 실패했습니다.');
    }
  };

  // 메시지 영구 삭제
  const handlePermanentDelete = async (messageId) => {
    if (!window.confirm('이 메시지를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await adminService.permanentlyDeleteMessage(messageId);
      alert('메시지가 영구 삭제되었습니다.');
      fetchChatLogs();
    } catch (err) {
      alert(err.response?.data?.message || '메시지 영구 삭제에 실패했습니다.');
    }
  };

  // 오래된 메시지 수동 삭제
  const handleManualCleanup = async () => {
    if (!window.confirm('7일 이상 된 메시지를 모두 삭제하시겠습니까?')) return;

    try {
      const response = await adminService.manualCleanupMessages();
      alert(response.data);
      fetchChatLogs();
    } catch (err) {
      alert(err.response?.data?.message || '메시지 정리에 실패했습니다.');
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setMessageTypeFilter('');
    setUserIdFilter('');
    setKeywordSearch('');
    setCurrentPage(0);
  };

  // 메시지 타입 한글 변환
  const getMessageTypeLabel = (type) => {
    switch (type) {
      case 'PLAZA':
        return '광장';
      case 'DM':
        return 'DM';
      case 'LOCAL_ROOM':
        return '로컬 방';
      default:
        return type;
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="chat-log-management">
      <div className="header">
        <h1>채팅 로그 관리</h1>
        <button className="cleanup-button" onClick={handleManualCleanup}>
          오래된 메시지 삭제 (7일 이상)
        </button>
      </div>

      <div className="info-box">
        <p>📌 모든 메시지는 자동으로 7일 후 삭제됩니다 (매일 새벽 3시 실행)</p>
        <p>📊 총 {totalElements.toLocaleString()}개의 메시지</p>
      </div>

      {/* 필터 영역 */}
      <div className="filters">
        <div className="filter-group">
          <label>메시지 타입:</label>
          <select value={messageTypeFilter} onChange={(e) => setMessageTypeFilter(e.target.value)}>
            <option value="">전체</option>
            <option value="PLAZA">광장</option>
            <option value="DM">DM</option>
            <option value="LOCAL_ROOM">로컬 방</option>
          </select>
        </div>

        <div className="filter-group">
          <label>사용자 ID:</label>
          <input
            type="number"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="사용자 ID 입력"
          />
        </div>

        <div className="filter-group">
          <label>키워드 검색:</label>
          <input
            type="text"
            value={keywordSearch}
            onChange={(e) => setKeywordSearch(e.target.value)}
            placeholder="메시지 내용 검색"
          />
        </div>

        <button className="reset-button" onClick={handleResetFilters}>
          필터 초기화
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && <div className="error-message">{error}</div>}

      {/* 채팅 로그 테이블 */}
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="table-container">
          <table className="chat-log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>타입</th>
                <th>발신자</th>
                <th>수신자</th>
                <th>내용</th>
                <th>방 ID</th>
                <th>작성일</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {chatLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    조회된 채팅 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                chatLogs.map((log) => (
                  <tr key={log.messageId} className={log.isDeleted ? 'deleted-row' : ''}>
                    <td>{log.messageId}</td>
                    <td>
                      <span className={`message-type ${log.messageType.toLowerCase()}`}>
                        {getMessageTypeLabel(log.messageType)}
                      </span>
                    </td>
                    <td>
                      {log.senderUsername}
                      <br />
                      <small>({log.senderId})</small>
                    </td>
                    <td>
                      {log.receiverUsername || '-'}
                      {log.receiverId && (
                        <>
                          <br />
                          <small>({log.receiverId})</small>
                        </>
                      )}
                    </td>
                    <td className="message-content">{log.content}</td>
                    <td>{log.roomId || '-'}</td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <span className={`status ${log.isDeleted ? 'deleted' : 'active'}`}>
                        {log.isDeleted ? '삭제됨' : '활성'}
                      </span>
                    </td>
                    <td className="actions">
                      {log.isDeleted ? (
                        <>
                          <button
                            className="restore-button"
                            onClick={() => handleRestoreMessage(log.messageId)}
                          >
                            복구
                          </button>
                          <button
                            className="permanent-delete-button"
                            onClick={() => handlePermanentDelete(log.messageId)}
                          >
                            영구삭제
                          </button>
                        </>
                      ) : (
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteMessage(log.messageId)}
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="pagination">
        <button onClick={() => handlePageChange(0)} disabled={currentPage === 0}>
          처음
        </button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
          이전
        </button>
        <span className="page-info">
          {currentPage + 1} / {totalPages || 1} 페이지
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          다음
        </button>
        <button
          onClick={() => handlePageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
        >
          마지막
        </button>
      </div>
    </div>
  );
};

export default ChatLogManagement;
