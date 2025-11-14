import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import './Auth.css';

const Register = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const register = useAuthStore((state) => state.register);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (formData.username.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-form">
        <div className="success-message">
          <h2>회원가입 성공!</h2>
          <p>로그인 화면으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">닉네임</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="닉네임을 입력하세요"
            required
            autoComplete="username"
            minLength={2}
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="6자 이상 입력하세요"
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={onSwitchToLogin}
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
