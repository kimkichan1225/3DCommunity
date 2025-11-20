import React, { useState } from 'react';
import './LandingPage.css';

function LandingPage({ onLogin, onRegister }) {
  const [showButtons, setShowButtons] = useState(false);

  const handleClick = () => {
    if (!showButtons) {
      setShowButtons(true);
    }
  };

  return (
    <div className="landing-overlay" onClick={handleClick}>
      <div className="landing-content">
        {/* 로고 */}
        <div className="logo-container">
          <img src="/mainlogo.png" alt="MetaPlaza Logo" className="logo" />
        </div>

        {/* 버튼 표시 전: Click to Start */}
        {!showButtons && (
          <div className="click-to-start">
            <p className="start-text">Click to Start</p>
          </div>
        )}

        {/* 버튼 표시 후: 로그인/회원가입 버튼 */}
        {showButtons && (
          <div className="button-container">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onLogin();
              }}
            >
              로그인
            </button>
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onRegister();
              }}
            >
              회원가입
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
