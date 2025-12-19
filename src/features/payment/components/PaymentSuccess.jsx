import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import paymentService from '../services/paymentService';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const approvePaymentRef = useRef(false);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    if (orderId && paymentKey && amount && !approvePaymentRef.current) {
      approvePaymentRef.current = true;

      console.log('[PaymentSuccess] 팝업 내 결제 승인 시작:', { orderId, paymentKey, amount });

      // 결제 승인 API 호출
      paymentService.approvePayment(orderId, paymentKey, parseInt(amount))
        .then(response => {
          console.log('[PaymentSuccess] 결제 승인 성공, 부모 창으로 데이터 전송');

          // 부모 창(window.opener)에 결과 전달
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'PAYMENT_SUCCESS',
              data: response
            }, window.location.origin);
          } else {
            console.warn('[PaymentSuccess] 부모 창을 찾을 수 없습니다.');
          }

          // 전송 후 창 닫기
          setTimeout(() => {
            window.close();
          }, 500);
        })
        .catch(error => {
          console.error('[PaymentSuccess] 결제 승인 실패:', error);

          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'PAYMENT_ERROR',
              error: error.response?.data?.message || error.message || '결제 승인 중 오류가 발생했습니다.'
            }, window.location.origin);
          }

          setTimeout(() => {
            window.close();
          }, 500);
        });
    }
  }, [searchParams]);

  return (
    <div className="payment-success-modal-overlay">
      <div className="payment-success-modal">
        <div className="payment-success-content">
          <div className="loading-animation">
            <div className="spinner"></div>
          </div>
          <h2>결제가 완료되었습니다</h2>
          <p>상태를 업데이트하고 있습니다...</p>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.close()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3182f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              창 닫기
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            (창이 자동으로 닫히지 않으면 버튼을 눌러주세요)
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
