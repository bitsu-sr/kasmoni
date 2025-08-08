import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="./logokasmonigr.png" alt="Kasmoni Logo" className="navbar-logo" />
          <span className="navbar-title">Sranan Kasmoni</span>
        </Link>

        {isAuthenticated && (
          <>
            <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
              <Link to="/dashboard" className={`navbar-item ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/members" className={`navbar-item ${isActive('/members') ? 'active' : ''}`}>
                Members
              </Link>
              <Link to="/groups" className={`navbar-item ${isActive('/groups') ? 'active' : ''}`}>
                Groups
              </Link>
              <Link to="/payments" className={`navbar-item ${isActive('/payments') ? 'active' : ''}`}>
                Payments
              </Link>
              <Link to="/analytics" className={`navbar-item ${isActive('/analytics') ? 'active' : ''}`}>
                Analytics
              </Link>
            </div>

            <div className="navbar-user">
              <span className="user-name">{user?.username || 'User'}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </>
        )}

        <button 
          className="navbar-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
