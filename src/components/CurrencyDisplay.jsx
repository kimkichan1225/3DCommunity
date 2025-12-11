import React from 'react';
import './CurrencyDisplay.css';

/**
 * CurrencyDisplay 컴포넌트
 * - 사용자가 보유한 재화를 표시
 * - Silver Coin: 일반 재화
 * - Gold Coin: 유료 재화
 */
function CurrencyDisplay({ silverCoins = 0, goldCoins = 0, onChargeGold }) {
  // 숫자를 천 단위 콤마로 포맷
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="currency-display-container">
      {/* Gold Coin (유료 재화) */}
      <div className="currency-item gold">
        <img src="/resources/Icon/Gold-Coin.png" alt="Gold Coin" className="currency-icon" />
        <span className="currency-amount">{formatNumber(goldCoins)}</span>
        {onChargeGold && (
          <button
            className="charge-button"
            onClick={onChargeGold}
            title="금화 충전"
          >
            +
          </button>
        )}
      </div>

      {/* Silver Coin (일반 재화) */}
      <div className="currency-item silver">
        <img src="/resources/Icon/Silver-Coin.png" alt="Silver Coin" className="currency-icon" />
        <span className="currency-amount">{formatNumber(silverCoins)}</span>
      </div>
    </div>
  );
}

export default CurrencyDisplay;
