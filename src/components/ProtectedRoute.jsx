import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // 토큰 만료 확인
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthorized(false);
          setIsChecking(false);
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
        localStorage.removeItem('user');
        setIsAuthorized(false);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [requiredRole]);

  if (isChecking) {
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

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
