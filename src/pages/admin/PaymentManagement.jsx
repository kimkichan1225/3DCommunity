import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './PaymentManagement.css';

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 필터 및 검색
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // 환불 관련 상태
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const [refunding, setRefunding] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                size: pageSize
            };
            const response = await adminService.getAllPayments(params);
            setPayments(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            setError('결제 내역을 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [currentPage, pageSize]);

    const handleRefundClick = (payment) => {
        setSelectedPayment(payment);
        setRefundReason('');
        setIsRefundModalOpen(true);
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayment || !refundReason.trim()) return;

        setRefunding(true);
        try {
            const result = await adminService.cancelPayment(selectedPayment.orderId, refundReason);
            if (result.success) {
                alert('환불 처리가 완료되었습니다.');
                setIsRefundModalOpen(false);
                fetchPayments(); // 목록 새로고침
            } else {
                alert('환불 실패: ' + result.message);
            }
        } catch (err) {
            alert('환불 처리 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setRefunding(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadge = (status) => {
        const statusLabels = {
            APPROVED: '승인됨',
            PENDING: '대기중',
            CANCELED: '취소됨',
            FAILED: '실패'
        };
        return <span className={`status-badge ${status.toLowerCase()}`}>{statusLabels[status] || status}</span>;
    };

    // 필터링된 결과 (프론트엔드 검색은 전체 데이터를 가져오지 않으므로 한계가 있음. 
    // 나중에 프로덕션에서는 서버 검색으로 전환하는 것이 좋음)
    const filteredPayments = payments.filter(p => {
        const matchesStatus = statusFilter === '' || p.status === statusFilter;
        const matchesSearch = searchTerm === '' ||
            p.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="payment-management">
            <div className="payment-management-header">
                <div className="header-left">
                    <h1>결제/환불 관리</h1>
                    <p className="payment-count">총 {totalElements}건의 결제 내역 (현재 페이지 {filteredPayments.length}건)</p>
                </div>
                <button className="btn-refresh" onClick={fetchPayments} title="새로고침">
                    🔄 새로고침
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="주문 ID 또는 사용자명 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <label>상태</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">전체 상태</option>
                        <option value="APPROVED">승인 완료</option>
                        <option value="PENDING">대기중</option>
                        <option value="CANCELED">취소/환불</option>
                        <option value="FAILED">결제 실패</option>
                    </select>
                </div>
                <div className="filter-group page-size-selector">
                    <label>표시 개수</label>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(0);
                        }}
                    >
                        <option value={5}>5개씩</option>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">데이터 로딩 중...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <>
                    <div className="payments-table-container">
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>주문일시</th>
                                    <th>사용자</th>
                                    <th>상품명</th>
                                    <th>금액</th>
                                    <th>금화</th>
                                    <th>상태</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">내역이 없습니다.</td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{formatDate(p.createdAt)}</td>
                                            <td>{p.username}</td>
                                            <td>{p.goldPackage ? p.goldPackage.name : '직접 충전'}</td>
                                            <td>{p.amount.toLocaleString()}원</td>
                                            <td>{p.goldAmount.toLocaleString()}G</td>
                                            <td>{getStatusBadge(p.status)}</td>
                                            <td>
                                                {p.status === 'APPROVED' && (
                                                    <button className="btn-refund" onClick={() => handleRefundClick(p)}>
                                                        환불
                                                    </button>
                                                )}
                                                {p.status === 'CANCELED' && (
                                                    <span className="cancel-reason" title={p.failReason}>사유 보기</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <button onClick={() => handlePageChange(0)} disabled={currentPage === 0}>처음</button>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>이전</button>
                        <span className="page-info">{currentPage + 1} / {totalPages || 1} 페이지</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}>다음</button>
                        <button onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>마지막</button>
                    </div>
                </>
            )}

            {/* 환불 사유 입력 모달 */}
            {isRefundModalOpen && (
                <div className="modal-overlay" onClick={() => setIsRefundModalOpen(false)}>
                    <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>결제 취소/환불</h2>
                            <button className="close-button" onClick={() => setIsRefundModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleRefundSubmit}>
                            <div className="payment-info-summary">
                                <p><strong>사용자:</strong> {selectedPayment.username}</p>
                                <p><strong>금액:</strong> {selectedPayment.amount.toLocaleString()}원</p>
                                <p><strong>주문ID:</strong> {selectedPayment.orderId}</p>
                            </div>
                            <div className="form-group">
                                <label>환불 사유</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="환불 사유를 입력하세요 (사용자에게 노출될 수 있습니다)"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-confirm-refund" disabled={refunding}>
                                    {refunding ? '처리 중...' : '환불 확인'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setIsRefundModalOpen(false)}>
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;
