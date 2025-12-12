import React, { useState } from 'react';
import paymentService from '../services/paymentService';
import './GoldChargeModal.css';

function GoldChargeModal({ onClose, onChargeSuccess }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  // 금화 충전 옵션
  const goldOptions = [
    { gold: 100, price: 1000, popular: false },
    { gold: 500, price: 5000, popular: true },
    { gold: 1000, price: 10000, popular: false },
    { gold: 5000, price: 50000, popular: false },
    { gold: 10000, price: 100000, popular: false },
  ];

  // 금액 선택
  const handleSelectAmount = (option) => {
    setSelectedAmount(option);
    setReady(true); // 금액 선택 시 바로 준비 완료
  };

  const handleCharge = async () => {
    if (!selectedAmount) {
      alert('충전할 금화를 선택해주세요.');
      return;
    }

    setProcessing(true);

    try {
      // 주문 ID 생성 (영문 대소문자, 숫자, -, _, = 조합, 6-64자)
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = localStorage.getItem('username') || 'Guest';

      // 백엔드에 결제 요청 기록
      console.log('결제 요청 데이터:', {
        goldAmount: selectedAmount.gold,
        orderId: orderId,
        amount: selectedAmount.price
      });

      const paymentRequestResult = await paymentService.createDirectPaymentRequest(
        selectedAmount.gold,
        orderId,
        selectedAmount.price
      );

      console.log('결제 요청 결과:', paymentRequestResult);

      // 토스페이먼츠 결제창 방식 (v1)
      const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_DnyRpQWGrNDQv6ZKaMPe3Kwv1M9E';
      const tossPayments = window.TossPayments(clientKey);

      // v1 결제 요청
      tossPayments.requestPayment('카드', {
        amount: selectedAmount.price,
        orderId: orderId,
        orderName: `금화 ${selectedAmount.gold.toLocaleString()}개`,
        customerName: username,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });

    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setProcessing(false);
    }
  };

  return (
    <div className="gold-charge-modal-overlay" onClick={onClose}>
      <div className="gold-charge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 금화 충전</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
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

        <div className="modal-footer">
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
