import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import paymentService from '../services/paymentService';
import './GoldChargeModal.css';

function GoldChargeModal({ onClose, onChargeSuccess }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  // 결제 결과 상태
  const [paymentResult, setPaymentResult] = useState(null); // 'success' | 'fail' | null
  const [resultData, setResultData] = useState(null);
  const [resultError, setResultError] = useState(null);
  const approvePaymentRef = useRef(false); // 중복 호출 방지

  // 금화 충전 옵션
  const goldOptions = [
    { gold: 100, price: 1000, popular: false },
    { gold: 500, price: 5000, popular: true },
    { gold: 1000, price: 10000, popular: false },
    { gold: 5000, price: 50000, popular: false },
    { gold: 10000, price: 100000, popular: false },
  ];

  // URL 파라미터 확인 및 결제 승인 처리
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    // 결제 성공 처리
    if (orderId && paymentKey && amount && !approvePaymentRef.current) {
      approvePaymentRef.current = true;
      setProcessing(true);
      approvePayment(orderId, paymentKey, parseInt(amount));
    }
    // 결제 실패 처리
    else if (code && message) {
      setPaymentResult('fail');
      setResultError(message);
      setProcessing(false);
      // URL 파라미터 제거
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // 결제 승인 API 호출
  const approvePayment = async (orderId, paymentKey, amount) => {
    try {
      console.log('[GoldChargeModal] 결제 승인 요청:', { orderId, paymentKey, amount });

      const response = await paymentService.approvePayment(orderId, paymentKey, amount);

      console.log('[GoldChargeModal] 결제 승인 응답:', response);

      if (response.success) {
        console.log('[GoldChargeModal] 결제 성공 - 결과 화면 표시');
        setPaymentResult('success');
        setResultData(response);

        // 부모 컴포넌트에 성공 알림
        if (onChargeSuccess) {
          onChargeSuccess(response);
        }
      } else {
        console.log('[GoldChargeModal] 결제 실패:', response.message);
        setPaymentResult('fail');
        setResultError(response.message || '결제 승인에 실패했습니다.');
      }
    } catch (err) {
      console.error('[GoldChargeModal] Payment approval error:', err);
      setPaymentResult('fail');
      setResultError('결제 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
      // URL 파라미터 제거
      setSearchParams({});
    }
  };


  // 금액 선택
  const handleSelectAmount = (option) => {
    setSelectedAmount(option);
    setReady(true);
  };

  // 결제 요청
  const handleCharge = async () => {
    if (!selectedAmount) {
      alert('충전할 금화를 선택해주세요.');
      return;
    }

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = localStorage.getItem('username') || 'Guest';

      console.log('[GoldChargeModal] 결제 요청 데이터:', {
        goldAmount: selectedAmount.gold,
        orderId: orderId,
        amount: selectedAmount.price
      });

      const paymentRequestResult = await paymentService.createDirectPaymentRequest(
        selectedAmount.gold,
        orderId,
        selectedAmount.price
      );

      console.log('[GoldChargeModal] 결제 요청 결과:', paymentRequestResult);

      // 토스페이먼츠 결제창 열기
      const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_DnyRpQWGrNDQv6ZKaMPe3Kwv1M9E';
      const tossPayments = window.TossPayments(clientKey);

      // 현재 URL을 successUrl/failUrl로 사용 (모달로 돌아오기)
      const currentUrl = window.location.origin + window.location.pathname;

      // 토스 결제창 열기 (동기 함수 - 바로 리턴됨)
      tossPayments.requestPayment('카드', {
        amount: selectedAmount.price,
        orderId: orderId,
        orderName: `금화 ${selectedAmount.gold.toLocaleString()}개`,
        customerName: username,
        successUrl: currentUrl,
        failUrl: currentUrl,
      });

      // 결제창이 열리면 이 함수는 종료되고, 사용자가 결제를 완료하면 successUrl로 리다이렉트됨

    } catch (error) {
      console.error('[GoldChargeModal] Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  };

  // 결제 결과 화면에서 닫기
  const handleResultClose = () => {
    setPaymentResult(null);
    setResultData(null);
    setResultError(null);
    setSelectedAmount(null);
    setReady(false);
    approvePaymentRef.current = false;
    onClose();
  };

  // 결제 결과 화면에서 다시 충전하기
  const handleChargeAgain = () => {
    setPaymentResult(null);
    setResultData(null);
    setResultError(null);
    setSelectedAmount(null);
    setReady(false);
    approvePaymentRef.current = false;
  };

  // 결제 처리 중 화면
  if (processing) {
    return (
      <div className="gold-charge-modal-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="gold-charge-modal" onClick={(e) => e.stopPropagation()}>
          <div className="gold-charge-modal__header">
            <h2>💰 금화 충전</h2>
          </div>
          <div className="gold-charge-modal__content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <h2>결제를 처리하고 있습니다...</h2>
              <p>잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 결제 성공 화면
  if (paymentResult === 'success' && resultData) {
    return (
      <div className="gold-charge-modal-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="gold-charge-modal payment-result success" onClick={(e) => e.stopPropagation()}>
          <div className="gold-charge-modal__header">
            <h2>✅ 충전 완료!</h2>
            <button className="close-button" onClick={handleResultClose}>×</button>
          </div>
          <div className="gold-charge-modal__content">
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">충전된 금화:</span>
                <span className="detail-value gold">💰 {resultData.goldAmount.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">현재 보유 금화:</span>
                <span className="detail-value">💎 {resultData.remainingGoldCoins.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">주문번호:</span>
                <span className="detail-value small">{resultData.orderId}</span>
              </div>
            </div>
            <p className="success-message">금화가 성공적으로 충전되었습니다!</p>
          </div>
          <div className="gold-charge-modal__footer">
            <button className="charge-button" onClick={handleResultClose}>
              게임으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 결제 실패 화면
  if (paymentResult === 'fail') {
    return (
      <div className="gold-charge-modal-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="gold-charge-modal payment-result error" onClick={(e) => e.stopPropagation()}>
          <div className="gold-charge-modal__header">
            <h2>❌ 결제 실패</h2>
            <button className="close-button" onClick={handleResultClose}>×</button>
          </div>
          <div className="gold-charge-modal__content">
            <p className="error-message">{resultError || '결제에 실패했습니다.'}</p>
          </div>
          <div className="gold-charge-modal__footer">
            <button className="cancel-button" onClick={handleResultClose}>
              닫기
            </button>
            <button className="charge-button" onClick={handleChargeAgain}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 기본 금화 선택 화면
  return (
    <div className="gold-charge-modal-overlay" onClick={onClose}>
      <div className="gold-charge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gold-charge-modal__header">
          <h2>💰 금화 충전</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="gold-charge-modal__content">
          <div className="info-section">
            <p className="info-text">💰 금화는 프리미엄 아이템 구매에 사용됩니다</p>
            <p className="info-text">💳 1골드 = 1원 (부가세 포함)</p>
          </div>

          {/* 금화 선택 옵션 */}
          <div className="packages-grid">
            {goldOptions.map((option, index) => (
              <div
                key={index}
                className={`package-card ${selectedAmount?.gold === option.gold ? 'selected' : ''} ${option.popular ? 'popular' : ''}`}
                onClick={() => handleSelectAmount(option)}
              >
                {option.popular && <div className="popular-badge">인기</div>}

                <div className="gold-display">
                  <div className="gold-amount">
                    <span className="gold-icon">💰</span>
                    <span className="gold-value">{option.gold.toLocaleString()}</span>
                  </div>
                  <div className="gold-label">금화</div>
                </div>

                <div className="package-price">
                  ₩{option.price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* 안내 문구 */}
          {selectedAmount && (
            <div className="payment-info">
              <p>✅ <strong>{selectedAmount.gold.toLocaleString()}금화</strong>를 선택하셨습니다.</p>
              <p>결제하기 버튼을 클릭하면 토스페이먼츠 결제창이 열립니다.</p>
            </div>
          )}
        </div>

        <div className="gold-charge-modal__footer">
          <button className="cancel-button" onClick={onClose} disabled={processing}>
            취소
          </button>
          <button
            className="charge-button"
            onClick={handleCharge}
            disabled={!selectedAmount || processing}
          >
            {processing ? '처리 중...' : selectedAmount ? `₩${selectedAmount.price.toLocaleString()} 결제하기` : '금액 선택'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoldChargeModal;
