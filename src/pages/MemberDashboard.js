import React, { useState, useEffect } from 'react';
import { User, DollarSign, Clock, Calendar, ArrowLeft, Plus } from 'lucide-react';
import { membersApi } from '../services/api';
import { formatCurrency } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SlotDetail from '../components/SlotDetail';
import PaymentRequestModal from '../components/PaymentRequestModal';
import PaymentRequestsList from '../components/PaymentRequestsList';

const MemberDashboard = () => {
  const [memberSlots, setMemberSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [paymentRequestRefresh, setPaymentRequestRefresh] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.userType === 'member' && user?.memberId) {
      fetchMemberSlots();
    } else if (user && user.userType !== 'member') {
      navigate('/dashboard');
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, navigate, authLoading]);

  const fetchMemberSlots = async () => {
    try {
      setLoading(true);
      
      const slotsResponse = await membersApi.getSlots(user.memberId);
      
      if (slotsResponse.data.success && slotsResponse.data.data) {
        setMemberSlots(slotsResponse.data.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching member slots:', err);
      setError('Failed to load member slots');
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

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCloseSlotDetail = () => {
    setSelectedSlot(null);
  };

  const handlePaymentRequestSuccess = () => {
    setPaymentRequestRefresh(prev => prev + 1);
    // Also refresh member slots to show updated payment status
    fetchMemberSlots();
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = new Date(year, parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Show loading while authentication is being checked
  if (authLoading) {
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

  if (!user || user.userType !== 'member') {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>This page is only available for member users.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <button className="btn btn-primary" onClick={fetchMemberSlots}>
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
              <h1 className="card-title">
                <User size={32} />
                My Dashboard
              </h1>
              <p>Welcome back, {user.firstName} {user.lastName}! Here are your slots for {getCurrentMonthYear()}.</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowPaymentRequestModal(true)}
              >
                <Plus size={16} />
                Request Payment
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
                Back to Main Dashboard
              </button>
            </div>
          </div>
        </div>

        {memberSlots.length > 0 ? (
          <>
            {/* Summary Section */}
            <div className="mt-4">
              <div className="grid grid-3">
                <div className="stats-card">
                  <div className="stats-card-icon">
                    <Calendar size={32} />
                  </div>
                  <div className="stats-card-content">
                    <h3>{memberSlots.length}</h3>
                    <p>Total Slots</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon">
                    <DollarSign size={32} />
                  </div>
                  <div className="stats-card-content">
                    <h3>{formatCurrency(memberSlots.reduce((sum, slot) => sum + Number(slot.monthlyAmount), 0))}</h3>
                    <p>Total Monthly Amount</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon">
                    <Clock size={32} />
                  </div>
                  <div className="stats-card-content">
                    <h3>{memberSlots.filter(slot => slot.paymentStatus === 'received').length}</h3>
                    <p>Received Slots</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Member Slots Section */}
            <div className="mt-4">
              <div className="card">
                <div className="card-header">
                  <h3>
                    <User size={24} />
                    {user.firstName} Slots
                  </h3>
                  <p>Your slots across all groups</p>
                </div>
                
                <div className="grid grid-3">
                  {memberSlots.map((slot, index) => (
                    <div 
                      key={`${slot.groupId}-${slot.slot}`} 
                      className="member-slot-tile"
                      onClick={() => handleSlotClick(slot)}
                      title="Click to view slot details"
                    >
                      <div className="slot-header">
                        <h4>{slot.groupName}</h4>
                        <div className="slot-amount">
                          <DollarSign size={20} />
                          <span>{formatCurrency(slot.monthlyAmount)}</span>
                        </div>
                      </div>
                      
                      <div className="slot-details">
                        <div className="slot-info">
                          <strong>Duration:</strong> {slot.duration} months
                        </div>
                        <div className="slot-info">
                          <strong>Total Amount:</strong> {formatCurrency(slot.totalAmount)}
                        </div>
                        <div className="slot-info">
                          <strong>Receive Month:</strong> {formatReceiveMonth(slot.receiveMonth)}
                        </div>
                        <div className="slot-status">
                          <span className={`badge ${
                            slot.paymentStatus === 'received' ? 'badge-success' :
                            slot.paymentStatus === 'pending' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {slot.paymentStatus === 'received' ? 'Received' :
                             slot.paymentStatus === 'pending' ? 'Pending' :
                             'Not Paid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <div className="card">
              <div className="text-center py-4">
                <User size={64} className="text-muted mb-3" />
                <h3>No Slots Found</h3>
                <p>You don't have any slots assigned yet. Please contact an administrator to get added to a group.</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Requests Section */}
        <div className="mt-4">
          <PaymentRequestsList 
            memberId={user.memberId} 
            refreshTrigger={paymentRequestRefresh}
          />
        </div>
      </div>

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <SlotDetail
          slot={selectedSlot}
          onClose={handleCloseSlotDetail}
        />
      )}

      {/* Payment Request Modal */}
      <PaymentRequestModal
        isOpen={showPaymentRequestModal}
        onClose={() => setShowPaymentRequestModal(false)}
        memberId={user.memberId}
        onSuccess={handlePaymentRequestSuccess}
      />
    </div>
  );
};

export default MemberDashboard;
