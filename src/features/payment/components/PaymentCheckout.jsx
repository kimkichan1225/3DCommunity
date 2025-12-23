import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PaymentCheckout.css';

const PaymentCheckout = () => {
    const [searchParams] = useSearchParams();
    const amount = parseInt(searchParams.get('amount'));
    const orderId = searchParams.get('orderId');
    const orderName = searchParams.get('orderName');
    const customerName = searchParams.get('customerName');

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // 토스페이먼츠 클라이언트 키
    const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_DnyRpQWGrNDQv6ZKaMPe3Kwv1M9E';

    useEffect(() => {
        const launchPayment = async () => {
            try {
                // [SAFETY] SDK 로드 확인
                if (typeof window.TossPayments !== 'function') {
                    console.error('Toss Payments SDK not loaded yet.');
                    setError('결제 서버를 불러오고 있습니다. 잠시만 기다려 주세요...');
                    return;
                }

                setIsProcessing(true);
                console.log('[PaymentCheckout] Launching Standard UI (Core SDK)...');

                // 1. 객체 초기화
                const tossPayments = window.TossPayments(clientKey);

                // 2. 결제창 호출 (카드 결제 기본)
                // 성공/실패 시 이 창(팝업)이 해당 URL로 리다이렉트됩니다.
                await tossPayments.requestPayment('카드', {
                    amount: amount,
                    orderId: orderId,
                    orderName: orderName,
                    customerName: customerName,
                    successUrl: `${window.location.origin}/payment/callback/success`,
                    failUrl: `${window.location.origin}/payment/callback/fail`,
                });
            } catch (err) {
                console.error('Payment launch failed:', err);
                setError('결제창을 여는 중 오류가 발생했습니다.');
                setIsProcessing(false);
            }
        };

        // 약간의 지연을 주어 SDK가 확실히 준비되게 함
        const timer = setTimeout(launchPayment, 500);
        return () => clearTimeout(timer);
    }, [clientKey, amount, orderId, orderName, customerName]);

    return (
        <div className="payment-checkout-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="payment-loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    {error ? error : '토스 결제창으로 연결 중...'}
                </p>
                {!error && <p style={{ color: '#666', marginTop: '10px' }}>잠시만 기다려주세요.</p>}
            </div>
        </div>
    );
};

export default PaymentCheckout;
