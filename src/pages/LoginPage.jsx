import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../features/auth';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    console.log('로그인 성공:', user);

    // role에 따라 리다이렉트
    if (user.role === 'ROLE_DEVELOPER') {
      window.location.href = '/admin';
    } else {
      navigate('/game');
    }
  };

  return <LandingPage onLoginSuccess={handleLoginSuccess} />;
};

export default LoginPage;
