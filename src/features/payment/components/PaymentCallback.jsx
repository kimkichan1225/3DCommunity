import React, { useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const { status } = useParams(); // 'success' or 'fail'

    const hasSentMessage = React.useRef(false);

    useEffect(() => {
        if (hasSentMessage.current) return;

        console.log(`[PaymentCallback] ${status} 감지 - 부모 창 알림 시도`);

        if (window.opener && !window.opener.closed) {
            if (status === 'success') {
                const paymentKey = searchParams.get('paymentKey');
                const orderId = searchParams.get('orderId');
                const amount = searchParams.get('amount');

                if (!paymentKey || !orderId) {
                    console.error('[PaymentCallback] 필수 결제 정보 누락');
                    return;
                }

                window.opener.postMessage({
                    type: 'PAYMENT_AUTHORIZED',
                    data: { paymentKey, orderId, amount }
                }, window.location.origin);
                hasSentMessage.current = true;
            } else {
                const code = searchParams.get('code');
                const message = searchParams.get('message');

                window.opener.postMessage({
                    type: 'PAYMENT_ERROR',
                    error: message || '결제가 취소되었거나 오류가 발생했습니다.',
                    code: code
                }, window.location.origin);
                hasSentMessage.current = true;
            }
        } else {
            console.error('[PaymentCallback] 부모 창(window.opener)을 찾을 수 없습니다.');
        }

        // 통보 후 즉시 창 닫기
        const closeTimer = setTimeout(() => {
            window.close();
        }, 800);
        return () => clearTimeout(closeTimer);
    }, [status, searchParams]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'sans-serif'
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3182f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '10px'
            }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p>결제 상태를 확인 중입니다...</p>
        </div>
    );
};

export default PaymentCallback;
