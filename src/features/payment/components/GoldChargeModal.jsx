import React, { useState, useEffect, useRef } from 'react';
import paymentService from '../services/paymentService';
import './GoldChargeModal.css';

function GoldChargeModal({ onClose, onChargeSuccess }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [processing, setProcessing] = useState(false);

  // 결제 결과 상태
  const [paymentResult, setPaymentResult] = useState(null); // 'success' | 'fail' | null
  const [resultData, setResultData] = useState(null);
  const [resultError, setResultError] = useState(null);
  const pollingRef = useRef(null); // 팝업 닫힘 감지용 타이머
  const timeoutRef = useRef(null); // 결제 전체 타임아웃용 타이머
  const currentOrderIdRef = useRef(null); // 현재 진행 중인 주문 ID

  // 금화 충전 옵션
  const goldOptions = [
    { gold: 100, price: 1000, popular: false },
    { gold: 500, price: 5000, popular: true },
    { gold: 1000, price: 10000, popular: false },
    { gold: 5000, price: 50000, popular: false },
    { gold: 10000, price: 100000, popular: false },
  ];

  // 타이머 정리 함수
  const clearTimers = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollingRef.current = null;
    timeoutRef.current = null;
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => clearTimers();
  }, []);

  // 서버 상태 교차 확인 (Cross-check)
  const verifyPaymentStatus = async (orderId) => {
    try {
      console.log('[GoldChargeModal] 서버 상태 확인 중 (Cross-check):', orderId);
      const response = await paymentService.getPaymentStatus(orderId);
      console.log('[GoldChargeModal] 서버 상태 응답:', response);

      if (response.success) {
        if (response.status === 'APPROVED') {
          console.log('[GoldChargeModal] 교차 확인 결과: 결제 성공');
          setPaymentResult('success');
          setResultData(response);
          if (onChargeSuccess) onChargeSuccess(response);
          return true;
        } else if (response.status === 'FAILED') {
          console.log('[GoldChargeModal] 교차 확인 결과: 결제 실패');
          setPaymentResult('fail');
          setResultError(response.message || '결제에 실패했습니다.');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[GoldChargeModal] 상태 확인 중 오류:', err);
      return false;
    }
  };



  // 팝업으로부터 메시지 수신 (window.opener.postMessage)
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('[GoldChargeModal] 팝업 메시지 수신 시도 - Origin:', event.origin);
      // 보안: origin 확인
      if (event.origin !== window.location.origin) {
        console.warn('[GoldChargeModal] 허용되지 않은 Origin으로부터의 메시지 차단:', event.origin);
        return;
      }

      console.log('[GoldChargeModal] 팝업 데이터 확인:', event.data);

      if (event.data.type === 'PAYMENT_SUCCESS') {
        console.log('[GoldChargeModal] ✅ 결제 성공 완료 메시지 수신');
        clearTimers(); // 성공 시 타이머 해제
        setPaymentResult('success');
        setResultData(event.data.data);
        setProcessing(false);
        if (onChargeSuccess) onChargeSuccess(event.data.data);
      } else if (event.data.type === 'PAYMENT_ERROR') {
        console.error('[GoldChargeModal] ❌ 결제 실패 메시지 수신:', event.data.error);
        clearTimers(); // 실패 시 타이머 해제
        setPaymentResult('fail');
        setResultError(event.data.error || '결제에 실패했습니다.');
        setProcessing(false);
      } else {
        console.log('[GoldChargeModal] 기타 메시지 무시:', event.data.type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChargeSuccess]);

  // 금액 선택
  const handleSelectAmount = (option) => {
    setSelectedAmount(option);
  };

  // 결제 요청
  const handleCharge = async () => {
    if (!selectedAmount) {
      alert('충전할 금화를 선택해주세요.');
      return;
    }

    // [CRITICAL] 팝업 차단을 피하기 위해 비동기 작업(API 호출) 전, 사용자 클릭 직후에 즉시 창을 확보합니다.
    console.log('[GoldChargeModal] 팝업창(payment_popup) 예약 확보...');
    const popupWindow = window.open('about:blank', 'payment_popup', 'width=500,height=700');

    if (!popupWindow) {
      alert('팝업창이 차단되었습니다. 팝업 허용을 설정해 주세요.');
      return;
    }

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = localStorage.getItem('username') || 'Guest';
      currentOrderIdRef.current = orderId;

      console.log('[GoldChargeModal] 백엔드 주문 생성 시작...');
      await paymentService.createDirectPaymentRequest(
        selectedAmount.gold,
        orderId,
        selectedAmount.price
      );
      console.log('[GoldChargeModal] 주문 생성 완료:', orderId);

      // 토스페이먼츠 결제창 열기
      const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_DnyRpQWGrNDQv6ZKaMPe3Kwv1M9E';
      const tossPayments = window.TossPayments(clientKey);

      // 리다이렉트될 전용 페이지 URL
      const successUrl = `${window.location.origin}/payment/success`;
      const failUrl = `${window.location.origin}/payment/fail`;

      clearTimers();

      // 3. 0.5초마다 팝업 닫힘 감시 (폴링) + 2초마다 서버 상태 강제 확인
      let lastServerCheck = Date.now();
      pollingRef.current = setInterval(async () => {
        // 팝업이 닫혔는지 확인
        const isClosed = !popupWindow || popupWindow.closed;

        // 팝업이 열려있더라도 2초마다 한 번씩 서버 상태를 체크 (opener가 끊겼을 때 대비)
        const now = Date.now();
        if (!isClosed && (now - lastServerCheck > 2000)) {
          lastServerCheck = now;
          console.log('[GoldChargeModal] 팝업 진행 중 - 서버 상태 선제적 확인...');
          const verified = await verifyPaymentStatus(currentOrderIdRef.current);
          if (verified) {
            console.log('[GoldChargeModal] ✅ 팝업이 열려있지만 서버에서 승인됨을 확인. 흐름 종료.');
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setProcessing(false);
            if (popupWindow && !popupWindow.closed) popupWindow.close();
            return;
          }
        }

        if (isClosed) {
          console.log('[GoldChargeModal] ⚠️ 팝업창이 닫혔습니다 (Closed 감지)');
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          // postMessage 유입을 대기하기 위해 잠시 대기 후 최종 상태 확인
          setTimeout(async () => {
            setPaymentResult(prev => {
              if (prev === null) {
                console.log('[GoldChargeModal] 메시지 수신 기록 없음 - 최종 상태 교차 확인 시작');
                verifyPaymentStatus(currentOrderIdRef.current).then(verified => {
                  if (!verified) {
                    console.error('[GoldChargeModal] 교차 확인 결과: 결제 미완료 (사용자 취소로 처리)');
                    setResultError('사용자에 의해 결제가 중단되었습니다.');
                    setPaymentResult('fail');
                    setProcessing(false);
                  }
                });
                return prev;
              }
              console.log('[GoldChargeModal] 이미 결과가 처리되어 교차 확인을 생략합니다.');
              return prev;
            });
          }, 1000);
        }
      }, 500);

      // 10분 타임아웃 설정
      timeoutRef.current = setTimeout(() => {
        if (pollingRef.current) {
          console.log('[GoldChargeModal] 결제 시간 초과');
          clearTimers();
          setPaymentResult('fail');
          setResultError('결제 시간이 초과되었습니다. 다시 시도해 주세요.');
          setProcessing(false);
          if (popupWindow && !popupWindow.closed) popupWindow.close();
        }
      }, 10 * 60 * 1000);

      // 토스 결제창 열기
      tossPayments.requestPayment('카드', {
        amount: selectedAmount.price,
        orderId: orderId,
        orderName: `금화 ${selectedAmount.gold.toLocaleString()}개`,
        customerName: username,
        successUrl: successUrl,
        failUrl: failUrl,
        windowTarget: 'payment_popup'
      });

    } catch (error) {
      console.error('[GoldChargeModal] Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setProcessing(false);
      clearTimers();
    }
  };

  // 결제 결과 화면에서 닫기
  const handleResultClose = () => {
    setPaymentResult(null);
    setResultData(null);
    setResultError(null);
    setSelectedAmount(null);
    onClose();
  };

  // 결제 결과 화면에서 다시 충전하기
  const handleChargeAgain = () => {
    setPaymentResult(null);
    setResultData(null);
    setResultError(null);
    setSelectedAmount(null);
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
