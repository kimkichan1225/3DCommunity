import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './SuspensionNotification.css';

/**
 * 제재된 사용자를 위한 고정 알림 컴포넌트
 * - 로그인한 사용자가 제재 상태인 경우 화면 상단에 고정 알림을 표시
 * - 제재 해제 시까지 알림이 유지됨
 */
const SuspensionNotification = () => {
  const [suspensionInfo, setSuspensionInfo] = useState(null);

  useEffect(() => {
    checkSuspensionStatus();

    // 주기적으로 제재 상태 확인 (5분마다)
    const interval = setInterval(() => {
      checkSuspensionStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkSuspensionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSuspensionInfo(null);
        return;
      }

      // JWT 토큰에서 사용자 정보 확인
      const decoded = jwtDecode(token);

      // 서버에서 최신 사용자 정보 가져오기
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();

        // 제재 상태 확인
        if (userData.isPermanentlySuspended) {
          setSuspensionInfo({
            type: 'permanent',
            reason: userData.suspensionReason,
          });
        } else if (userData.suspendedUntil && new Date(userData.suspendedUntil) > new Date()) {
          setSuspensionInfo({
            type: 'temporary',
            suspendedUntil: new Date(userData.suspendedUntil),
            reason: userData.suspensionReason,
          });
        } else {
          setSuspensionInfo(null);
        }
      }
    } catch (error) {
      console.error('Failed to check suspension status:', error);
    }
  };

  // 제재 상태가 아니면 렌더링하지 않음
  if (!suspensionInfo) {
    return null;
  }

  // 남은 시간 계산
  const getRemainingTime = () => {
    if (suspensionInfo.type === 'permanent') {
      return null;
    }

    const now = new Date();
    const until = suspensionInfo.suspendedUntil;
    const diff = until - now;

    if (diff <= 0) {
      return '곧 해제됩니다';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}일 ${hours}시간 남음`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    } else {
      return `${minutes}분 남음`;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`suspension-notification ${suspensionInfo.type}`}>
      <div className="suspension-content">
        <div className="suspension-icon">
          {suspensionInfo.type === 'permanent' ? '🚫' : '⚠️'}
        </div>
        <div className="suspension-details">
          <div className="suspension-title">
            {suspensionInfo.type === 'permanent' ? '계정이 영구 정지되었습니다' : '계정이 일시 정지되었습니다'}
          </div>
          {suspensionInfo.type === 'temporary' && (
            <div className="suspension-time">
              해제일: {formatDate(suspensionInfo.suspendedUntil)} ({getRemainingTime()})
            </div>
          )}
          {suspensionInfo.reason && (
            <div className="suspension-reason">
              사유: {suspensionInfo.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuspensionNotification;
