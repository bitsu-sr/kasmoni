import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { groupsApi, paymentsApi } from '../services/api';
import { Group, MemberSlot } from '../types';
import { formatCurrency } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';

interface SlotDetailProps {
  slot: MemberSlot;
  onClose: () => void;
}

interface GroupPaymentStats {
  pendingCount: number;
  receivedCount: number;
  notPaidCount: number;
  totalMembers: number;
  lastPaymentDate?: string;
}

const SlotDetail: React.FC<SlotDetailProps> = ({ slot, onClose }) => {
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);
  const [paymentStats, setPaymentStats] = useState<GroupPaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getCurrentMonth = (): string => {
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
        const stats: GroupPaymentStats = {
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

  const formatReceiveMonth = (receiveMonth: string): string => {
    if (!receiveMonth) return '';
    const parts = receiveMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDateRange = (startMonth: string, duration: number): string => {
    if (!startMonth) return '';
    const parts = startMonth.split('-');
    const startYear = parseInt(parts[0], 10);
    const startMonthNum = parseInt(parts[1], 10);
    
    const startDate = new Date(startYear, startMonthNum - 1);
    
    // Calculate end date: add duration months and subtract 1 month to get the last month
    const endDate = new Date(startYear, startMonthNum - 1 + duration - 1);
    
    const startFormatted = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const endFormatted = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatLastUpdated = (dateString: string): string => {
    if (!dateString) return 'No payments yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="slot-detail-overlay">
        <div className="slot-detail-modal">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slot-detail-overlay">
        <div className="slot-detail-modal">
          <div className="modal-header">
            <h2>Error</h2>
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchGroupDetails}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slot-detail-overlay">
      <div className="slot-detail-modal">
        <div className="modal-header">
          <h2>
            <Calendar size={24} />
            Slot Details
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Group Information */}
          <div className="detail-section">
            <h3>Group Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Group Name:</label>
                <span>{slot.groupName}</span>
              </div>
              <div className="detail-item">
                <label>Monthly Amount:</label>
                <span>{formatCurrency(slot.monthlyAmount)}</span>
              </div>
              <div className="detail-item">
                <label>Duration:</label>
                <span>{slot.duration} months</span>
              </div>
              <div className="detail-item">
                <label>Date Range:</label>
                <span>{groupDetails ? formatDateRange(groupDetails.startMonth, groupDetails.duration) : '-'}</span>
              </div>
              <div className="detail-item">
                <label>Your Receive Month:</label>
                <span>{formatReceiveMonth(slot.receiveMonth)}</span>
              </div>
                             <div className="detail-item">
                 <label>Total Amount:</label>
                 <span>{formatCurrency(slot.totalAmount)}</span>
               </div>
               <div className="detail-item">
                 <label>Last Updated:</label>
                 <span>{paymentStats?.lastPaymentDate ? formatLastUpdated(paymentStats.lastPaymentDate) : 'No payments yet'}</span>
               </div>
             </div>
           </div>

          {/* Payment Statistics */}
          {paymentStats && (
            <div className="detail-section">
              <h3>Group Payment Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <h4>{paymentStats.receivedCount}</h4>
                    <p>Payments Received</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="stat-content">
                    <h4>{paymentStats.pendingCount}</h4>
                    <p>Members with Pending Bank Transfers</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <XCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <h4>{paymentStats.notPaidCount}</h4>
                    <p>Members haven’t paid yet</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="stat-content">
                    <h4>{paymentStats.totalMembers}</h4>
                    <p>Total Group Members</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="detail-section">
            <div className="privacy-notice">
              <AlertCircle size={20} />
              <p>
                <strong>Privacy Notice:</strong> For privacy reasons, the names of other members in this group are not visible to you. 
                You can only see the payment statistics and your own slot information.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotDetail; 