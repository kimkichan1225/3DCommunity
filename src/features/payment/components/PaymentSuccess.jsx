import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import paymentService from '../services/paymentService';
import './PaymentResult.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    approvePayment();
  }, []);

  const approvePayment = async () => {
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = parseInt(searchParams.get('amount'));

    if (!orderId || !paymentKey || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
      setProcessing(false);
      return;
    }

    try {
      const response = await paymentService.approvePayment(orderId, paymentKey, amount);

      if (response.success) {
        setResult(response);
      } else {
        setError(response.message || '결제 승인에 실패했습니다.');
      }
    } catch (err) {
      console.error('Payment approval error:', err);
      setError('결제 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (processing) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <h2>결제를 처리하고 있습니다...</h2>
            <p>잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card error">
          <div className="result-icon">❌</div>
          <h2>결제 실패</h2>
          <p className="error-message">{error}</p>
          <button className="home-button" onClick={handleGoHome}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-card success">
        <div className="result-icon">✅</div>
        <h2>충전 완료!</h2>
        <div className="result-details">
          <div className="detail-item">
            <span className="detail-label">충전된 금화:</span>
            <span className="detail-value gold">💰 {result.goldAmount.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">현재 보유 금화:</span>
            <span className="detail-value">💎 {result.remainingGoldCoins.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">주문번호:</span>
            <span className="detail-value small">{result.orderId}</span>
          </div>
        </div>
        <p className="success-message">금화가 성공적으로 충전되었습니다!</p>
        <button className="home-button" onClick={handleGoHome}>
          게임으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
