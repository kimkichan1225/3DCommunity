import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // 토큰 만료 확인
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // 권한 확인
      const userRole = decoded.role || decoded.authorities?.[0]?.authority;

      if (requiredRole && userRole !== requiredRole) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setIsAuthorized(false);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        로딩 중...
      </div>
    );
  }

  if (isAuthorized === false) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
