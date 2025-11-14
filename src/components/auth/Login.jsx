import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import './Auth.css';

const Login = ({ onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

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
      await login(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
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
            placeholder="비밀번호를 입력하세요"
            required
            autoComplete="current-password"
            minLength={6}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          계정이 없으신가요?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={onSwitchToRegister}
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
