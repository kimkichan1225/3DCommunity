import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentResult.css';

function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    navigate('/');
    // TODO: 금화 충전 모달 다시 열기
  };

  return (
    <div className="payment-result-page">
      <div className="payment-result-card error">
        <div className="result-icon">❌</div>
        <h2>결제 실패</h2>

        <div className="error-details">
          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}
          {errorCode && (
            <p className="error-code">오류 코드: {errorCode}</p>
          )}
        </div>

        <p className="fail-description">
          결제가 정상적으로 처리되지 않았습니다.<br />
          다시 시도해주세요.
        </p>

        <div className="button-group">
          <button className="retry-button" onClick={handleRetry}>
            다시 시도
          </button>
          <button className="home-button secondary" onClick={handleGoHome}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFail;
