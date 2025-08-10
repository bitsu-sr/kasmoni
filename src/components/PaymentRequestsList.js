import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { paymentRequestsApi } from '../services/api';
import { formatPaymentDate } from '../utils/dateUtils';

const PaymentRequestsList = ({
  memberId,
  refreshTrigger
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [memberId, refreshTrigger]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await paymentRequestsApi.getByMember(memberId);
      if (response.data.success && response.data.data) {
        setRequests(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching payment requests:', err);
      setError('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <Clock size={16} className="status-icon unknown" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  };

  const formatSlotDisplay = (slot) => {
    if (!slot) return '';
    const parts = slot.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SRD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading payment requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <XCircle size={20} />
          <span>{error}</span>
        </div>
        <button onClick={fetchRequests} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Clock size={48} />
        </div>
        <h3>No Payment Requests</h3>
        <p>You haven't submitted any payment requests yet.</p>
      </div>
    );
  }

  return (
    <div className="payment-requests-list">
      <div className="list-header">
        <h3>Payment Requests</h3>
        <span className="request-count">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="requests-grid">
        {requests.map((request) => (
          <div key={request.id} className={`request-card ${getStatusClass(request.status)}`}>
            <div className="request-header">
              <div className="request-status">
                {getStatusIcon(request.status)}
                <span className={`status-badge ${getStatusClass(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="request-date">
                {formatPaymentDate(request.createdAt)}
              </div>
            </div>

            <div className="request-content">
              <div className="request-group">
                <label>Group:</label>
                <span>{request.groupName}</span>
              </div>
              
              <div className="request-slot">
                <label>Slot:</label>
                <span>{formatSlotDisplay(request.slot)}</span>
              </div>
              
              <div className="request-amount">
                <label>Amount:</label>
                <span className="amount-value">{formatCurrency(request.amount)}</span>
              </div>
              
              <div className="request-payment-date">
                <label>Payment Date:</label>
                <span>{formatPaymentDate(request.paymentDate)}</span>
              </div>
              
              <div className="request-payment-month">
                <label>Payment Month:</label>
                <span>{formatSlotDisplay(request.paymentMonth)}</span>
              </div>
              
              <div className="request-payment-type">
                <label>Payment Type:</label>
                <span className="payment-type-badge">
                  {request.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                </span>
              </div>

              {request.paymentType === 'bank_transfer' && (
                <>
                  {request.senderBank && (
                    <div className="request-sender-bank">
                      <label>Sender Bank:</label>
                      <span>{request.senderBank}</span>
                    </div>
                  )}
                  {request.receiverBank && (
                    <div className="request-receiver-bank">
                      <label>Receiver Bank:</label>
                      <span>{request.receiverBank}</span>
                    </div>
                  )}
                </>
              )}

              {request.proofOfPayment && (
                <div className="request-proof">
                  <label>Proof of Payment:</label>
                  <span className="proof-text">{request.proofOfPayment}</span>
                </div>
              )}

              {request.requestNotes && (
                <div className="request-notes">
                  <label>Your Notes:</label>
                  <span className="notes-text">{request.requestNotes}</span>
                </div>
              )}

              {request.adminNotes && (
                <div className="admin-notes">
                  <label>Admin Response:</label>
                  <span className="admin-notes-text">{request.adminNotes}</span>
                </div>
              )}
            </div>

            <div className="request-footer">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedRequest(request)}
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content request-detail-modal">
            <div className="modal-header">
              <h3>Payment Request Details</h3>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Request Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusClass(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      {getStatusText(selectedRequest.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted:</label>
                    <span>{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedRequest.reviewedAt && (
                    <div className="detail-item">
                      <label>Reviewed:</label>
                      <span>{new Date(selectedRequest.reviewedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Payment Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Group:</label>
                    <span>{selectedRequest.groupName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Slot:</label>
                    <span>{formatSlotDisplay(selectedRequest.slot)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span className="amount-value">{formatCurrency(selectedRequest.amount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Date:</label>
                    <span>{formatPaymentDate(selectedRequest.paymentDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Month:</label>
                    <span>{formatSlotDisplay(selectedRequest.paymentMonth)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Type:</label>
                    <span>{selectedRequest.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.paymentType === 'bank_transfer' && (
                <div className="detail-section">
                  <h4>Bank Transfer Details</h4>
                  <div className="detail-grid">
                    {selectedRequest.senderBank && (
                      <div className="detail-item">
                        <label>Sender Bank:</label>
                        <span>{selectedRequest.senderBank}</span>
                      </div>
                    )}
                    {selectedRequest.receiverBank && (
                      <div className="detail-item">
                        <label>Receiver Bank:</label>
                        <span>{selectedRequest.receiverBank}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.proofOfPayment && (
                <div className="detail-section">
                  <h4>Proof of Payment</h4>
                  <div className="proof-content">
                    {selectedRequest.proofOfPayment}
                  </div>
                </div>
              )}

              {selectedRequest.requestNotes && (
                <div className="detail-section">
                  <h4>Your Notes</h4>
                  <div className="notes-content">
                    {selectedRequest.requestNotes}
                  </div>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div className="detail-section">
                  <h4>Admin Response</h4>
                  <div className="admin-notes-content">
                    {selectedRequest.adminNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRequestsList;
