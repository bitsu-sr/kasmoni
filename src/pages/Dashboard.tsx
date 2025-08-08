import React, { useState, useEffect } from 'react';
import { Users, Users2, CreditCard, DollarSign, AlertTriangle, Clock, Calendar, Bell, MessageSquare } from 'lucide-react';
import { dashboardApi, notificationsApi } from '../services/api';
import { DashboardStats, GroupWithCurrentRecipient, GroupStatus } from '../types';
import { formatCurrency } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Clock component that updates every second
const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="live-clock">
      <Clock size={20} />
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

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groupsWithRecipients, setGroupsWithRecipients] = useState<GroupWithCurrentRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Remove test values - let the real API calls set the counts

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [user]);

  // Refresh notifications every 30 seconds
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
          setPendingPaymentRequests(paymentRequestsResponse.data.data.count);
        }
        if (messagesResponse.data.success && messagesResponse.data.data) {
          setUnreadMessages(messagesResponse.data.data.count);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const formatMonthYear = (monthYear: string): string => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getCurrentMonthYear = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return formatMonthYear(`${year}-${month}`);
  };

  const getStatusDisplay = (status: GroupStatus | undefined, pendingCount?: number) => {
    // Always prioritize backend status first
    switch (status) {
      case 'fully_paid':
        return { text: 'Fully Paid', class: 'badge-success' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      case 'pending':
        // Only show "Pending: X" when backend status is "pending"
        if (pendingCount && pendingCount > 0) {
          return { text: `Pending: ${pendingCount}`, class: 'badge-warning' };
        }
        return { text: 'Pending', class: 'badge-warning' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  // Click handlers for notification badges
  const handlePaymentRequestsClick = () => {
    navigate('/payment-requests');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  // Refresh notifications when returning from messages page or when a message is read
  useEffect(() => {
    const handleFocus = () => {
      if (document.hasFocus()) {
        fetchNotifications();
      }
    };

    const handleMessageRead = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('messageRead', handleMessageRead);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('messageRead', handleMessageRead);
    };
  }, []);

  // Add styles for notification badges
  const styles = `
    .notification-badges {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .notification-badge {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .notification-badge:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .notification-badge.payment-requests {
      color: #dc3545;
    }

    .notification-badge.messages {
      color: #007bff;
    }

    .badge-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
    }

    .notification-badge.messages .badge-count {
      background: #007bff;
    }

    .stats-card {
      position: relative !important;
    }
  `;

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      styleElement.id = 'notification-badges-styles';
      
      // Remove existing styles if they exist
      const existingStyles = document.getElementById('notification-badges-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
      
      document.head.appendChild(styleElement);
    }
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-between align-center">
            <div>
              <h1 className="card-title">Dashboard</h1>
              <p>Welcome to Sranan Kasmoni! Here's an overview of your savings groups for {getCurrentMonthYear()}.</p>
            </div>
                         <div className="d-flex align-center gap-2">
               {/* Notification badges for admin users - positioned to the left of the clock */}
               {(user?.role === 'administrator' || user?.role === 'super_user') && (
                 <div className="notification-badges">
                   {pendingPaymentRequests > 0 && (
                     <div 
                       className="notification-badge payment-requests" 
                       title={`${pendingPaymentRequests} Pending Request${pendingPaymentRequests > 1 ? 's' : ''}`}
                       onClick={handlePaymentRequestsClick}
                     >
                       <Bell size={16} />
                       <span className="badge-count">{pendingPaymentRequests}</span>
                     </div>
                   )}
                   {unreadMessages > 0 && (
                     <div 
                       className="notification-badge messages" 
                       title={`${unreadMessages} Unread Message${unreadMessages > 1 ? 's' : ''}`}
                       onClick={handleMessagesClick}
                     >
                       <MessageSquare size={16} />
                       <span className="badge-count">{unreadMessages}</span>
                     </div>
                   )}
                 </div>
               )}
               <LiveClock />
             </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-4">
            {/* First row: Expected amount, Total paid, Total received, Total pending */}
            <div className="stats-card">
              <div className="stats-card-icon">
                <DollarSign size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{formatCurrency(stats.totalAmountExpected)}</h3>
                <p>Total Expected (All Active Groups)</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <DollarSign size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{formatCurrency(stats.totalAmountPaid)}</h3>
                <p>Total Paid ({getCurrentMonthYear()})</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <CreditCard size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{formatCurrency(stats.totalAmountReceived)}</h3>
                <p>Total Received ({getCurrentMonthYear()})</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <Clock size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{formatCurrency(stats.pendingAmount || 0)}</h3>
                <p>Total Pending ({getCurrentMonthYear()})</p>
              </div>
            </div>

            {/* Second row: Total payment, Overdue payments, Total groups, Total members */}
            <div className="stats-card">
              <div className="stats-card-icon">
                <CreditCard size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{stats.totalPayments}</h3>
                <p>Total Payments ({getCurrentMonthYear()})</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <AlertTriangle size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{stats.overduePayments}</h3>
                <p>Overdue Payments ({getCurrentMonthYear()})</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <Users2 size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{stats.totalGroups}</h3>
                <p>Total Groups</p>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-icon">
                <Users size={32} />
              </div>
              <div className="stats-card-content">
                <h3>{stats.totalMembers}</h3>
                <p>Total Members</p>
              </div>
            </div>
          </div>
        )}

        {/* Groups with Current Month Recipients Section */}
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <h3>
                <Calendar size={24} />
                Groups - {getCurrentMonthYear()} Recipients
              </h3>
              <p>Groups and members due to receive their tanda this month</p>
            </div>
            
            {groupsWithRecipients.length > 0 ? (
              <div className="grid grid-3">
                {groupsWithRecipients.map((group) => (
                  <div key={group.id} className="group-tile">
                    <div className="group-header">
                      <h4>{group.name}</h4>
                      <div className="group-amount">
                        <DollarSign size={20} />
                        <span>{formatCurrency(group.monthlyAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="group-status-row">
                      <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                        {getStatusDisplay(group.status, group.pendingCount).text}
                      </span>
                    </div>
                    
                    <div className="group-recipient">
                      {group.firstName && group.lastName ? (
                        <>
                          <div className="recipient-info">
                            <strong>Recipient:</strong> {group.firstName} {group.lastName}
                          </div>
                          {group.phoneNumber && (
                            <div className="recipient-contact">
                              <strong>Phone:</strong> {group.phoneNumber}
                            </div>
                          )}
                          {group.bankName && group.accountNumber && (
                            <div className="recipient-bank">
                              <strong>Bank:</strong> {group.bankName} - {group.accountNumber}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="no-recipient">
                          <p>No recipient assigned for this month</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p>No groups found or no recipients assigned for the current month.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-primary">
                  <Users size={16} />
                  Add New Member
                </button>
                <button className="btn btn-primary">
                  <Users2 size={16} />
                  Create New Group
                </button>
                <button className="btn btn-primary">
                  <CreditCard size={16} />
                  Record Payment
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>System Status</h3>
              </div>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-between align-center">
                  <span>Backend API</span>
                  <span className="badge badge-success">Connected</span>
                </div>
                <div className="d-flex justify-between align-center">
                  <span>Database</span>
                  <span className="badge badge-success">Online</span>
                </div>
                <div className="d-flex justify-between align-center">
                  <span>Last Updated</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 