import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { groupsApi, paymentsApi } from '../services/api';
import { formatCurrency } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';

const SlotDetail = ({ slot, onClose }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [slot.groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch group details
      const groupResponse = await groupsApi.getById(slot.groupId);
      if (groupResponse.data.success && groupResponse.data.data) {
        setGroupDetails(groupResponse.data.data);
      }

      // Fetch payment statistics for the group
      const paymentsResponse = await paymentsApi.getByGroup(slot.groupId);
      if (paymentsResponse.data.success && paymentsResponse.data.data) {
        const payments = paymentsResponse.data.data;
        
        // Get current month for filtering
        const currentMonth = getCurrentMonth();
        
        // Filter payments for current month only
        const currentMonthPayments = payments.filter(p => p.paymentMonth === currentMonth);
        
        // Get all group members
        const totalMembers = groupResponse.data.data?.members?.length || 0;
        
        // Get unique member IDs who have payments for current month
        const membersWithPayments = new Set(currentMonthPayments.map(p => p.memberId));
        
        // Calculate statistics based on current month payments
        const stats = {
          pendingCount: currentMonthPayments.filter(p => p.status === 'pending').length,
          receivedCount: currentMonthPayments.filter(p => p.status === 'received').length,
          notPaidCount: totalMembers - membersWithPayments.size, // Members with no payments at all
          totalMembers: totalMembers,
          lastPaymentDate: currentMonthPayments.length > 0 
            ? currentMonthPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate
            : undefined
        };
        
        setPaymentStats(stats);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const formatReceiveMonth = (receiveMonth) => {
    if (!receiveMonth) return '';
    const parts = receiveMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDateRange = (startMonth, duration) => {
    if (!startMonth) return '';
    const parts = startMonth.split('-');
    const startYear = parseInt(parts[0], 10);
    const startMonthNum = parseInt(parts[1], 10);
    
    const endDate = new Date(startYear, startMonthNum - 1 + duration);
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    
    const startDate = new Date(startYear, startMonthNum - 1);
    const startFormatted = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const endFormatted = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <CheckCircle size={16} className="status-icon received" />;
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'not_paid':
        return <XCircle size={16} className="status-icon not-paid" />;
      default:
        return <AlertCircle size={16} className="status-icon unknown" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'received':
        return 'Received';
      case 'pending':
        return 'Pending';
      case 'not_paid':
        return 'Not Paid';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content slot-detail-modal">
          <div className="loading-spinner">Loading slot details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content slot-detail-modal">
          <div className="error-message">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={onClose} className="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content slot-detail-modal">
        <div className="modal-header">
          <h2>Slot Details</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="slot-detail-content">
          {/* Group Information */}
          <div className="detail-section">
            <h3>Group Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Group Name:</label>
                <span>{groupDetails?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Monthly Amount:</label>
                <span>{formatCurrency(groupDetails?.monthlyAmount || 0)}</span>
              </div>
              <div className="detail-item">
                <label>Duration:</label>
                <span>{groupDetails?.duration || 0} months</span>
              </div>
              <div className="detail-item">
                <label>Start Date:</label>
                <span>{formatReceiveMonth(groupDetails?.startMonth)}</span>
              </div>
              <div className="detail-item">
                <label>End Date:</label>
                <span>{formatDateRange(groupDetails?.startMonth, groupDetails?.duration)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span>{formatLastUpdated(groupDetails?.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Slot Information */}
          <div className="detail-section">
            <h3>Slot Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Slot:</label>
                <span>{formatReceiveMonth(slot.slot)}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="status-display">
                  {getStatusIcon(slot.status)}
                  {getStatusText(slot.status)}
                </span>
              </div>
              <div className="detail-item">
                <label>Amount:</label>
                <span>{formatCurrency(slot.monthlyAmount)}</span>
              </div>
              <div className="detail-item">
                <label>Payment Date:</label>
                <span>{slot.paymentDate ? new Date(slot.paymentDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Statistics */}
          {paymentStats && (
            <div className="detail-section">
              <h3>Current Month Payment Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{paymentStats.totalMembers}</div>
                    <div className="stat-label">Total Members</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon received">
                    <CheckCircle size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{paymentStats.receivedCount}</div>
                    <div className="stat-label">Received</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon pending">
                    <Clock size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{paymentStats.pendingCount}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon not-paid">
                    <XCircle size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{paymentStats.notPaidCount}</div>
                    <div className="stat-label">Not Paid</div>
                  </div>
                </div>
              </div>
              
              {paymentStats.lastPaymentDate && (
                <div className="last-payment-info">
                  <Calendar size={16} />
                  <span>Last payment received: {new Date(paymentStats.lastPaymentDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotDetail;
