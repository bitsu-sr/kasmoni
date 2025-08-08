import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import LoginModal from './LoginModal.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="container">
          <div className="card">
            <div className="text-center">
              <h2>Authentication Required</h2>
              <p>Please log in to access this page.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </button>
            </div>
          </div>
        </div>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
