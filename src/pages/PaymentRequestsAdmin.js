import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPaymentRequests, approvePaymentRequest, rejectPaymentRequest, getPaymentRequestDetails } from '../services/api';
import '../styles/PaymentRequestsAdmin.css';

const PaymentRequestsAdmin = () => {
  const { user } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const data = await getPaymentRequests();
      setPaymentRequests(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payment requests');
      console.error('Payment requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await approvePaymentRequest(requestId);
      fetchPaymentRequests();
      setError(null);
    } catch (err) {
      setError('Failed to approve payment request');
      console.error('Approve error:', err);
    }
  };

  const handleReject = async (requestId, reason) => {
    const rejectionReason = reason || prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    try {
      await rejectPaymentRequest(requestId, rejectionReason);
      fetchPaymentRequests();
      setError(null);
    } catch (err) {
      setError('Failed to reject payment request');
      console.error('Reject error:', err);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const details = await getPaymentRequestDetails(request.id);
      setSelectedRequest({ ...request, ...details });
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to fetch request details');
      console.error('Details error:', err);
    }
  };

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = request.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestId.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesType = filterType === 'all' || request.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'processing': return 'status-processing';
      default: return 'status-pending';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'withdrawal': return 'type-withdrawal';
      case 'deposit': return 'type-deposit';
      case 'transfer': return 'type-transfer';
      default: return 'type-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="payment-requests-admin-container">
        <div className="loading-spinner">Loading payment requests...</div>
      </div>
    );
  }

  return (
    <div className="payment-requests-admin-container">
      <div className="payment-requests-header">
        <h1>Payment Requests Management</h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{paymentRequests.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <span className="stat-value pending">
              {paymentRequests.filter(r => r.status === 'pending').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <span className="stat-value approved">
              {paymentRequests.filter(r => r.status === 'approved').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="payment-requests-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processing">Processing</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="type-filter"
          >
            <option value="all">All Types</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="deposit">Deposit</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      {/* Payment Requests List */}
      <div className="payment-requests-list">
        {currentRequests.length === 0 ? (
          <div className="no-requests">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
              ? 'No payment requests match your search criteria' 
              : 'No payment requests found'}
          </div>
        ) : (
          currentRequests.map(request => (
            <div key={request.id} className={`payment-request-card ${request.status}`}>
              <div className="request-header">
                <div className="request-id">#{request.requestId}</div>
                <div className="request-date">{formatDate(request.createdAt)}</div>
              </div>
              
              <div className="request-content">
                <div className="member-info">
                  <div className="member-name">{request.memberName}</div>
                  <div className="member-email">{request.memberEmail}</div>
                </div>
                
                <div className="request-details">
                  <div className="request-description">{request.description}</div>
                  <div className="request-amount">{formatCurrency(request.amount)}</div>
                </div>
                
                <div className="request-meta">
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                  <span className={`type-badge ${getTypeBadgeClass(request.type)}`}>
                    {request.type}
                  </span>
                </div>
              </div>
              
              <div className="request-actions">
                <button 
                  onClick={() => handleViewDetails(request)} 
                  className="view-details-btn"
                >
                  View Details
                </button>
                
                {request.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApprove(request.id)} 
                      className="approve-btn"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(request.id)} 
                      className="reject-btn"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Request Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="close-modal">×</button>
            </div>
            
            <div className="request-details-content">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Request ID:</span>
                    <span className="detail-value">#{selectedRequest.requestId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className={`detail-value type-badge ${getTypeBadgeClass(selectedRequest.type)}`}>
                      {selectedRequest.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">{formatCurrency(selectedRequest.amount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Member Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedRequest.memberName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedRequest.memberEmail}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedRequest.memberPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Request Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedRequest.description}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  {selectedRequest.updatedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{formatDate(selectedRequest.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <div className="notes-content">{selectedRequest.notes}</div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              {selectedRequest.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailsModal(false);
                    }} 
                    className="approve-btn"
                  >
                    Approve Request
                  </button>
                  <button 
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setShowDetailsModal(false);
                    }} 
                    className="reject-btn"
                  >
                    Reject Request
                  </button>
                </>
              )}
              <button onClick={() => setShowDetailsModal(false)} className="close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRequestsAdmin;
