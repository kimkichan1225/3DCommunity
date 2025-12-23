import React, { useState, useEffect } from 'react';
import currencyService from '../../../services/currencyService';
import './GoldChargeModal.css'; // 기존 스타일 공유 및 확장

function CurrencyExchangeModal({ onClose, onExchangeSuccess }) {
    const [goldAmount, setGoldAmount] = useState(1);
    const [userGold, setUserGold] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 현재 보유 금화 조회
    useEffect(() => {
        const fetchCurrency = async () => {
            try {
                const data = await currencyService.getCurrency();
                setUserGold(data.goldCoins);
            } catch (err) {
                console.error('Failed to fetch currency:', err);
            }
        };
        fetchCurrency();
    }, []);

    const handleExchange = async () => {
        if (goldAmount <= 0) return;
        if (goldAmount > userGold) {
            setError('보유한 금화가 부족합니다.');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const data = await currencyService.exchangeGoldToSilver(goldAmount);
            setSuccess(true);
            if (onExchangeSuccess) onExchangeSuccess(data);

            // 2초 후 닫기
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || '교환 중 오류가 발생했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="gold-charge-modal-overlay" onClick={onClose}>
                <div className="gold-charge-modal payment-result success" onClick={(e) => e.stopPropagation()}>
                    <div className="gold-charge-modal__header">
                        <h2>✅ 교환 완료!</h2>
                    </div>
                    <div className="gold-charge-modal__content">
                        <div className="result-details">
                            <div className="detail-item">
                                <span className="detail-label">지급된 은화:</span>
                                <span className="detail-value success">🥈 {(goldAmount * 100).toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">소모된 금화:</span>
                                <span className="detail-value error">💰 {goldAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        <p className="success-message">은화 교환이 성공적으로 완료되었습니다!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="gold-charge-modal-overlay" onClick={onClose}>
            <div className="gold-charge-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gold-charge-modal__header">
                    <h2>🥈 은화 교환</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="gold-charge-modal__content">
                    <div className="info-section">
                        <p className="info-text">💰 금화를 소비하여 은화를 획득합니다.</p>
                        <p className="info-text">✨ <strong>1 금화 = 100 은화</strong></p>
                    </div>

                    <div className="exchange-container" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '30px',
                        borderRadius: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#aaa', marginBottom: '10px' }}>보유 금화: <span style={{ color: '#FFD700' }}>💰 {userGold.toLocaleString()}</span></p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                <input
                                    type="number"
                                    value={goldAmount}
                                    onChange={(e) => setGoldAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                    min="1"
                                    max={userGold}
                                    style={{
                                        width: '120px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid rgba(255, 215, 0, 0.3)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: '#FFD700',
                                        fontSize: '20px',
                                        textAlign: 'center',
                                        outline: 'none'
                                    }}
                                />
                                <span style={{ fontSize: '24px', color: '#888' }}>💰</span>
                                <span style={{ fontSize: '24px', color: '#fff' }}>➔</span>
                                <span style={{ fontSize: '24px', color: '#C0C0C0' }}>🥈</span>
                                <span style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>{(goldAmount * 100).toLocaleString()}</span>
                            </div>
                        </div>

                        {error && <p style={{ color: '#ff3b30', fontSize: '14px', marginBottom: '10px' }}>⚠️ {error}</p>}
                    </div>

                    <div className="payment-info" style={{ marginTop: '20px' }}>
                        <p>은화는 아이템 구매, 강화 등 게임 내 다양한 활동에 사용됩니다.</p>
                    </div>
                </div>

                <div className="gold-charge-modal__footer">
                    <button className="cancel-button" onClick={onClose}>취 stub
                        취소
                    </button>
                    <button
                        className="charge-button"
                        onClick={handleExchange}
                        disabled={processing || goldAmount <= 0 || goldAmount > userGold}
                        style={{
                            background: 'linear-gradient(135deg, #C0C0C0, #808080)',
                            color: '#1a1a2e'
                        }}
                    >
                        {processing ? '교환 중...' : `${goldAmount.toLocaleString()} 금화 교환하기`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CurrencyExchangeModal;
