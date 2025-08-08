import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

const Login: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user?.userType === 'member') {
      navigate('/member-dashboard');
    } else {
      navigate('/dashboard');
    }
    return null;
  }

  const handleCloseModal = () => {
    setShowLoginModal(false);
    // Redirect to appropriate dashboard based on user type
    if (user?.userType === 'member') {
      navigate('/member-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          <h2>Welcome to Sranan Kasmoni</h2>
          <p>Please log in to access your account.</p>
        </div>
      </div>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default Login; 