import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './AuthModal.css';

function AuthModal({ mode, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      if (isLogin) {
        // 로그인
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });

        // role 기반 리다이렉트
        if (response.user.role === 'ROLE_DEVELOPER') {
          navigate('/admin');
        } else {
          onSuccess(response.user);
        }
      } else {
        // 회원가입
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
        // 회원가입 성공 시 성공 메시지 모달 표시 (자동 로그인 제거)
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 성공 모달 확인 버튼 핸들러
  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    onClose(); // 초기 화면으로 복귀 (로그인하지 않은 상태)
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>

        {/* 회원가입 성공 메시지 모달 */}
        {showSuccessModal ? (
          <div className="success-message-container">
            <div className="success-icon">✓</div>
            <h2 className="success-title">회원가입 완료!</h2>
            <p className="success-message">
              회원가입이 성공적으로 완료되었습니다.<br />
              로그인 후 서비스를 이용하실 수 있습니다.
            </p>
            <button className="success-confirm-btn" onClick={handleSuccessConfirm}>
              확인
            </button>
          </div>
        ) : (
          <>
            <h2 className="auth-modal-title">
              {isLogin ? '로그인' : '회원가입'}
            </h2>

            <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
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

          {!isLogin && (
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
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <p>
              계정이 없으신가요?{' '}
              <button onClick={() => setIsLogin(false)}>회원가입</button>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{' '}
              <button onClick={() => setIsLogin(true)}>로그인</button>
            </p>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
