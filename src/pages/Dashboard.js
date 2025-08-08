import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to the Kasmoni Dashboard!</p>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Members</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Active Groups</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Total Payments</h3>
          <p>0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
