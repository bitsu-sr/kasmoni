import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { dashboardApi, notificationsApi } from '../services/api.js';
import { formatCurrency, formatDate } from '../utils/validation.js';
import { formatMonthYear } from '../utils/dateUtils.js';

// Live Clock Component
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="live-clock">
      <i className="fas fa-clock"></i>
      <span>{currentTime.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })}</span>
      <span className="date-display">
        {currentTime.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [groupsWithRecipients, setGroupsWithRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [user]);

  // Refresh notifications every 30 seconds for admin users
  useEffect(() => {
    if (user?.role === 'administrator' || user?.role === 'super_user') {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats and groups
      const [statsResponse, groupsResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getGroupsWithCurrentRecipients()
      ]);
      
      if (statsResponse.data.success && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }
      if (groupsResponse.data.success && groupsResponse.data.data) {
        setGroupsWithRecipients(groupsResponse.data.data);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Only fetch notifications for admin users
      if (user?.role === 'administrator' || user?.role === 'super_user') {
        const [paymentRequestsResponse, messagesResponse] = await Promise.all([
          notificationsApi.getPendingPaymentRequests(),
          notificationsApi.getUnreadMessages()
        ]);
        
        if (paymentRequestsResponse.data.success && paymentRequestsResponse.data.data) {
          setPendingPaymentRequests(paymentRequestsResponse.data.data.count || 0);
        }
        if (messagesResponse.data.success && messagesResponse.data.data) {
          setUnreadMessages(messagesResponse.data.data.count || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const getStatusDisplay = (status, pendingCount) => {
    switch (status) {
      case 'fully_paid':
        return { text: 'Fully Paid', class: 'badge-success' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      case 'pending':
        if (pendingCount && pendingCount > 0) {
          return { text: `Pending: ${pendingCount}`, class: 'badge-warning' };
        }
        return { text: 'Pending', class: 'badge-warning' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  const handlePaymentRequestsClick = () => {
    navigate('/payment-requests');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <LiveClock />
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <LiveClock />
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <LiveClock />
      </div>

      {/* Notification Badges */}
      {(user?.role === 'administrator' || user?.role === 'super_user') && (
        <div className="notification-badges">
          {pendingPaymentRequests > 0 && (
            <div className="notification-badge" onClick={handlePaymentRequestsClick}>
              <i className="fas fa-bell"></i>
              <span className="badge-count">{pendingPaymentRequests}</span>
            </div>
          )}
          {unreadMessages > 0 && (
            <div className="notification-badge" onClick={handleMessagesClick}>
              <i className="fas fa-envelope"></i>
              <span className="badge-count">{unreadMessages}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>Total Members</h3>
              <p className="stat-number">{stats.totalMembers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-building"></i>
            </div>
            <div className="stat-content">
              <h3>Active Groups</h3>
              <p className="stat-number">{stats.totalGroups || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="stat-content">
              <h3>Total Payments</h3>
              <p className="stat-number">{stats.totalPayments || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3>Total Amount Paid</h3>
              <p className="stat-number">{formatCurrency(stats.totalAmountPaid || 0)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Pending Payments</h3>
              <p className="stat-number">{stats.pendingPayments || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>Overdue Payments</h3>
              <p className="stat-number">{stats.overduePayments || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Groups with Current Recipients */}
      {groupsWithRecipients.length > 0 && (
        <div className="dashboard-section">
          <h2>Groups with Current Recipients</h2>
          <div className="groups-grid">
            {groupsWithRecipients.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                    {getStatusDisplay(group.status, group.pendingCount).text}
                  </span>
                </div>
                <div className="group-details">
                  <p><strong>Monthly Amount:</strong> {formatCurrency(group.monthlyAmount)}</p>
                  <p><strong>Receive Month:</strong> {formatMonthYear(group.receiveMonth)}</p>
                  {group.firstName && group.lastName && (
                    <p><strong>Current Recipient:</strong> {group.firstName} {group.lastName}</p>
                  )}
                  {group.phoneNumber && (
                    <p><strong>Phone:</strong> {group.phoneNumber}</p>
                  )}
                  {group.bankName && (
                    <p><strong>Bank:</strong> {group.bankName}</p>
                  )}
                  {group.accountNumber && (
                    <p><strong>Account:</strong> {group.accountNumber}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button onClick={() => navigate('/members')} className="btn btn-primary">
            <i className="fas fa-user-plus"></i>
            Add Member
          </button>
          <button onClick={() => navigate('/groups')} className="btn btn-primary">
            <i className="fas fa-building"></i>
            Create Group
          </button>
          <button onClick={() => navigate('/payments')} className="btn btn-primary">
            <i className="fas fa-credit-card"></i>
            Record Payment
          </button>
          <button onClick={() => navigate('/analytics')} className="btn btn-primary">
            <i className="fas fa-chart-bar"></i>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
