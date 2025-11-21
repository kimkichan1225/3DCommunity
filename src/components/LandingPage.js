import React, { useState } from 'react';
import './LandingPage.css';
import AuthModal from './AuthModal';

function LandingPage({ onLoginSuccess }) {
  const [showButtons, setShowButtons] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null

  const handleClick = () => {
    if (!showButtons && !authModal) {
      setShowButtons(true);
    }
  };

  const handleAuthSuccess = (user) => {
    setAuthModal(null);
    onLoginSuccess(user);
  };

  return (
    <div className="landing-overlay" onClick={handleClick}>
      <div className="landing-content">
        {/* 로고 */}
        <div className="logo-container">
          <img src="/mainlogo.png" alt="MetaPlaza Logo" className="logo" />
        </div>

        {/* 버튼 표시 전: Click to Start */}
        {!showButtons && !authModal && (
          <div className="click-to-start">
            <p className="start-text">Click to Start</p>
          </div>
        )}

        {/* 버튼 표시 후: 로그인/회원가입 버튼 */}
        {showButtons && !authModal && (
          <div className="button-container">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                setAuthModal('login');
              }}
            >
              로그인
            </button>
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setAuthModal('register');
              }}
            >
              회원가입
            </button>
          </div>
        )}
      </div>

      {/* 인증 모달 */}
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default LandingPage;
