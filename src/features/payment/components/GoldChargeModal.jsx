import React, { useState, useEffect, useRef } from 'react';
import paymentService from '../services/paymentService';
import CurrencyExchangeModal from './CurrencyExchangeModal';
import './GoldChargeModal.css';

function GoldChargeModal({ onClose, onChargeSuccess, initialTab = 'charge' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'charge' | 'exchange'
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
  const isApprovingRef = useRef(false);

  useEffect(() => {
    const handleMessage = async (event) => {
      console.log('[GoldChargeModal] 메시지 수신 시도 - Origin:', event.origin);
      if (event.origin !== window.location.origin) return;

      console.log('[GoldChargeModal] 수신 데이터:', event.data);

      // 1. 위젯 인증 완료 (paymentKey 획득) -> 메인 창에서 직접 승인 진행
      if (event.data.type === 'PAYMENT_AUTHORIZED') {
        if (isApprovingRef.current) {
          console.warn('[GoldChargeModal] 이미 승인 처리 중입니다. 중복 요청을 무시합니다.');
          return;
        }

        console.log('[GoldChargeModal] ✅ 결제 인증 완료 수신 - 최종 승인 진행');
        isApprovingRef.current = true;
        clearTimers();
        setProcessing(true); // 승인 처리 중 표시

        const { paymentKey, orderId, amount } = event.data.data;

        try {
          const response = await paymentService.approvePayment(orderId, paymentKey, parseInt(amount));
          console.log('[GoldChargeModal] 최종 승인 결과:', response);

          if (response.success) {
            setPaymentResult('success');
            setResultData(response);
            if (onChargeSuccess) onChargeSuccess(response);
          } else {
            setPaymentResult('fail');
            setResultError(response.message || '결제 승인에 실패했습니다.');
          }
        } catch (error) {
          console.error('[GoldChargeModal] 승인 요청 중 오류:', error);
          setPaymentResult('fail');
          setResultError('서버 통신 중 오류가 발생했습니다.');
        } finally {
          isApprovingRef.current = false;
          setProcessing(false);
        }
      }
      // 2. 결제 에러 처리
      else if (event.data.type === 'PAYMENT_ERROR') {
        console.error('[GoldChargeModal] ❌ 결제 에러 메시지 수신:', event.data.error);
        clearTimers();
        setPaymentResult('fail');
        setResultError(event.data.error || '결제 중 오류가 발생했습니다.');
        setProcessing(false);
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

    // [CRITICAL] 팝업 차단을 피하기 위해 즉시 창을 확보합니다.
    console.log('[GoldChargeModal] 위젯 팝업창 예약 확보...');

    // 화면 중앙 계산
    const width = 800;
    const height = 900;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const popupWindow = window.open(
      'about:blank',
      'payment_popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popupWindow) {
      alert('팝업창이 차단되었습니다. 팝업 허용을 설정해 주세요.');
      return;
    }

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = localStorage.getItem('username') || 'Guest';
      currentOrderIdRef.current = orderId;

      setProcessing(true);

      // 백엔드 결제 요청 예약 (주문 생성)
      await paymentService.createDirectPaymentRequest(
        selectedAmount.gold,
        orderId,
        selectedAmount.price
      );

      // 팝업 페이지 이동 (금액, 주문번호 등 전달)
      const checkoutUrl = `${window.location.origin}/payment/checkout?` +
        `amount=${selectedAmount.price}&` +
        `orderId=${orderId}&` +
        `orderName=금화 ${selectedAmount.gold.toLocaleString()}개&` +
        `customerName=${username}`;

      popupWindow.location.href = checkoutUrl;

      clearTimers();

      // 결제 상태 폴링 (팝업 닫힘 및 백엔드 상태 교차 확인)
      let lastServerCheck = Date.now();
      pollingRef.current = setInterval(async () => {
        const isClosed = !popupWindow || popupWindow.closed;
        const now = Date.now();

        // 3초마다 서버 상태 직접 확인 (안전장치)
        if (!isClosed && (now - lastServerCheck > 3000)) {
          lastServerCheck = now;
          const verified = await verifyPaymentStatus(currentOrderIdRef.current);
          if (verified) {
            clearInterval(pollingRef.current);
            setProcessing(false);
            if (popupWindow && !popupWindow.closed) popupWindow.close();
            return;
          }
        }

        if (isClosed) {
          clearInterval(pollingRef.current);
          setTimeout(async () => {
            setPaymentResult(prev => {
              if (prev === null) {
                verifyPaymentStatus(currentOrderIdRef.current).then(verified => {
                  if (!verified) {
                    setResultError('사용자에 의해 결제가 중단되었습니다.');
                    setPaymentResult('fail');
                  }
                });
              }
              return prev;
            });
            setProcessing(false);
          }, 1000);
        }
      }, 500);

      timeoutRef.current = setTimeout(() => {
        if (pollingRef.current) {
          clearTimers();
          setPaymentResult('fail');
          setResultError('결제 시간이 초과되었습니다.');
          setProcessing(false);
          if (popupWindow && !popupWindow.closed) popupWindow.close();
        }
      }, 10 * 60 * 1000);

    } catch (error) {
      console.error('[GoldChargeModal] Payment error:', error);
      if (popupWindow) popupWindow.close();
      alert('결제 준비 중 오류가 발생했습니다.');
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

  // 은화 교환 탭 렌더링
  if (activeTab === 'exchange') {
    return (
      <CurrencyExchangeModal
        onClose={onClose}
        onExchangeSuccess={(data) => {
          if (onChargeSuccess) onChargeSuccess(data);
        }}
      />
    );
  }

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
              <div className="spinner-container">
                <div className="spinner-ring"></div>
              </div>
              <div className="loading-text">
                <h2>결제를 처리하고 있습니다...</h2>
                <p>잠시만 기다려주세요.</p>
              </div>
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
