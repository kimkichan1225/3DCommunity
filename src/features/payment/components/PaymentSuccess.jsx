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
      console.log('결제 승인 요청 시작:', { orderId, paymentKey, amount });

      const response = await paymentService.approvePayment(orderId, paymentKey, amount);

      console.log('결제 승인 응답:', response);

      if (response.success) {
        setResult(response);
      } else {
        // 실패 응답이지만 "Payment already processed" 메시지인 경우
        // 이미 처리된 결제일 수 있으므로 결제 내역 조회
        if (response.message && response.message.includes('already processed')) {
          console.warn('이미 처리된 결제입니다. 결제 내역을 조회합니다.');
          await checkPaymentHistory();
        } else {
          setError(response.message || '결제 승인에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('Payment approval error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status
      });

      // 네트워크 오류나 타임아웃 발생 시 결제 내역 확인
      console.log('오류 발생으로 결제 내역을 확인합니다...');
      await checkPaymentHistory();
    } finally {
      setProcessing(false);
    }
  };

  // 결제 내역 조회하여 실제 결제 성공 여부 확인
  const checkPaymentHistory = async () => {
    try {
      const history = await paymentService.getPaymentHistory();
      const orderId = searchParams.get('orderId');

      // 현재 주문 ID에 해당하는 결제 내역 찾기
      const currentPayment = history.find(h => h.orderId === orderId);

      if (currentPayment && currentPayment.status === 'APPROVED') {
        // 결제가 실제로 성공했다면 성공 화면 표시
        console.log('결제 내역 확인 결과: 성공', currentPayment);
        setResult({
          success: true,
          orderId: currentPayment.orderId,
          goldAmount: currentPayment.goldAmount,
          remainingGoldCoins: currentPayment.goldAmount, // 정확한 값은 백엔드에서 제공해야 함
          message: 'Payment approved successfully'
        });
      } else {
        // 여전히 PENDING이거나 FAILED인 경우
        setError('결제 승인 중 오류가 발생했습니다. 고객센터에 문의해주세요.');
      }
    } catch (historyErr) {
      console.error('결제 내역 조회 실패:', historyErr);
      setError('결제 승인 중 오류가 발생했습니다. 결제 내역을 확인해주세요.');
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
