import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './Auth.css';

const AuthOverlay = () => {
  const [mode, setMode] = useState('welcome'); // 'welcome', 'login', 'register'

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleClose = () => {
    // 로그인 성공 시 오버레이를 닫는 로직은 App.js에서 처리
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        {mode === 'welcome' && (
          <div className="welcome-screen">
            <h1>3D Community</h1>
            <p className="welcome-subtitle">위치기반 소셜 메타버스에 오신 것을 환영합니다</p>
            <div className="welcome-buttons">
              <button
                className="primary-btn"
                onClick={handleSwitchToLogin}
              >
                로그인
              </button>
              <button
                className="secondary-btn"
                onClick={handleSwitchToRegister}
              >
                회원가입
              </button>
            </div>
            <div className="welcome-features">
              <div className="feature">
                <span className="feature-icon">🌐</span>
                <p>3D 가상 공간</p>
              </div>
              <div className="feature">
                <span className="feature-icon">💬</span>
                <p>실시간 채팅</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🎮</span>
                <p>미니게임</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📍</span>
                <p>위치기반 방 생성</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <Login
            onSwitchToRegister={handleSwitchToRegister}
            onClose={handleClose}
          />
        )}

        {mode === 'register' && (
          <Register
            onSwitchToLogin={handleSwitchToLogin}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthOverlay;
