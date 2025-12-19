import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PaymentSuccess.css'; // 공유 스타일 사용

function PaymentFail() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message') || '결제에 실패했습니다.';

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'PAYMENT_ERROR',
        error: message
      }, window.location.origin);
    }

    setTimeout(() => {
      window.close();
    }, 500);
  }, [searchParams]);

  return (
    <div className="payment-success-modal-overlay">
      <div className="payment-success-modal">
        <h2 style={{ color: '#ff4444' }}>결제 실패</h2>
        <p>요청을 처리할 수 없습니다.</p>
      </div>
    </div>
  );
}

export default PaymentFail;
