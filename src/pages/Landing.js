import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-header">
          <img src="./logokasmonigr.png" alt="Kasmoni Logo" className="landing-logo" />
          <h1>Sranan Kasmoni</h1>
          <p>Rotating Savings Management System</p>
        </div>
        
        <div className="landing-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-large">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-large">
              Login
            </Link>
          )}
        </div>
        
        <div className="landing-features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>Member Management</h3>
              <p>Manage group members and their information</p>
            </div>
            <div className="feature">
              <h3>Payment Tracking</h3>
              <p>Track payments and contributions</p>
            </div>
            <div className="feature">
              <h3>Group Management</h3>
              <p>Organize savings groups</p>
            </div>
            <div className="feature">
              <h3>Analytics</h3>
              <p>View reports and insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
