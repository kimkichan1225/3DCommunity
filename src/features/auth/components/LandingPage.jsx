import React, { useState } from 'react';
import './LandingPage.css';
import authService from '../services/authService';

function LandingPage({ onLoginSuccess }) {
  const [showButtons, setShowButtons] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!showButtons && !authMode) {
      setShowButtons(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });

        // 관리자인 경우 관리자 페이지로 리다이렉트
        if (response.user.role === 'ROLE_DEVELOPER') {
          window.location.href = '/admin';
          return;
        }

        // 일반 사용자는 게임 화면으로
        onLoginSuccess(response.user);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.');
          setLoading(false);
          return;
        }
        await authService.register({
          email: formData.email,
          password: formData.password,
          username: formData.nickname
        });
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setAuthMode('login');
        setFormData({ email: '', password: '', nickname: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setAuthMode(null);
    setFormData({ email: '', password: '', nickname: '', confirmPassword: '' });
    setError('');
  };

  return (
    <div className="landing-overlay" onClick={handleClick}>
      <div className={`landing-content ${authMode ? 'auth-active' : ''}`}>
        {/* 로고 */}
        <div className="logo-container">
          <img src="/mainlogo.png" alt="MetaPlaza Logo" className="logo" />
        </div>

        {/* 버튼 표시 전: Click to Start */}
        {!showButtons && !authMode && (
          <div className="click-to-start">
            <p className="start-text">Click to Start</p>
          </div>
        )}

        {/* 버튼 표시 후: 로그인/회원가입 버튼 */}
        {showButtons && !authMode && (
          <div className="button-container">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                setAuthMode('login');
              }}
            >
              로그인
            </button>
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setAuthMode('register');
              }}
            >
              회원가입
            </button>
          </div>
        )}

        {/* 인증 폼 */}
        {authMode && (
          <div className="auth-form-container" onClick={(e) => e.stopPropagation()}>
            <button className="back-button" onClick={handleBack}>← 뒤로</button>

            <h2 className="auth-title">
              {authMode === 'login' ? '로그인' : '회원가입'}
            </h2>

            <form onSubmit={handleSubmit} className="auth-form">
              {authMode === 'register' && (
                <div className="form-group">
                  <label>닉네임</label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="닉네임을 입력하세요"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label>비밀번호</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label>비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? '처리 중...' : (authMode === 'login' ? '로그인' : '회원가입')}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>
                  계정이 없으신가요?{' '}
                  <button onClick={() => setAuthMode('register')}>회원가입</button>
                </p>
              ) : (
                <p>
                  이미 계정이 있으신가요?{' '}
                  <button onClick={() => setAuthMode('login')}>로그인</button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
