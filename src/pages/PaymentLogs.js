import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { paymentLogsApi } from '../services/api';
import '../styles/PaymentLogs.css';

const PaymentLogs = () => {
  const { user } = useAuth();
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPaymentLogs();
  }, []);

  const fetchPaymentLogs = async () => {
    try {
      setLoading(true);
      const response = await paymentLogsApi.getAll();
      if (response.data && response.data.success) {
        setPaymentLogs(response.data.data);
      } else {
        setPaymentLogs([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch payment logs');
      console.error('Payment logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (log) => {
    try {
      const response = await paymentLogsApi.getById(log.id);
      if (response.data && response.data.success) {
        setSelectedLog({ ...log, ...response.data.data });
      } else {
        setSelectedLog(log);
      }
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to fetch log details');
      console.error('Log details error:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await paymentLogsApi.export('csv');
      setError(null);
    } catch (err) {
      setError('Failed to export payment logs');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = paymentLogs.filter(log => {
    const matchesSearch = log.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const diffInDays = (now - logDate) / (1000 * 60 * 60 * 24);
      
      switch (filterDateRange) {
        case 'today':
          matchesDate = diffInDays < 1;
          break;
        case 'week':
          matchesDate = diffInDays < 7;
          break;
        case 'month':
          matchesDate = diffInDays < 30;
          break;
        case 'quarter':
          matchesDate = diffInDays < 90;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'cancelled': return 'status-cancelled';
      case 'processing': return 'status-processing';
      default: return 'status-default';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'payment': return 'type-payment';
      case 'withdrawal': return 'type-withdrawal';
      case 'transfer': return 'type-transfer';
      case 'refund': return 'type-refund';
      default: return 'type-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
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
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="payment-logs-container">
        <div className="loading-spinner">Loading payment logs...</div>
      </div>
    );
  }

  return (
    <div className="payment-logs-container">
      <div className="payment-logs-header">
        <h1>Payment Logs</h1>
        <div className="header-actions">
          <button 
            onClick={handleExport} 
            disabled={exporting} 
            className="export-btn"
          >
            {exporting ? 'Exporting...' : '📊 Export'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="logs-summary">
        <div className="summary-card">
          <div className="summary-title">Total Transactions</div>
          <div className="summary-value">{paymentLogs.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Completed</div>
          <div className="summary-value completed">
            {paymentLogs.filter(log => log.status === 'completed').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Pending</div>
          <div className="summary-value pending">
            {paymentLogs.filter(log => log.status === 'pending').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Failed</div>
          <div className="summary-value failed">
            {paymentLogs.filter(log => log.status === 'failed').length}
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="payment-logs-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search logs..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="processing">Processing</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="type-filter"
          >
            <option value="all">All Types</option>
            <option value="payment">Payment</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="refund">Refund</option>
          </select>
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="date-filter"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Payment Logs List */}
      <div className="payment-logs-list">
        {currentLogs.length === 0 ? (
          <div className="no-logs">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterDateRange !== 'all'
              ? 'No payment logs match your search criteria'
              : 'No payment logs found'}
          </div>
        ) : (
          currentLogs.map(log => (
            <div key={log.id} className={`payment-log-card ${log.status}`}>
              <div className="log-header">
                <div className="log-id">#{log.transactionId}</div>
                <div className="log-timestamp">
                  {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                </div>
              </div>
              
              <div className="log-content">
                <div className="log-main">
                  <div className="log-description">{log.description}</div>
                  <div className="log-member">{log.memberName}</div>
                </div>
                
                <div className="log-amount">
                  <div className="amount-value">{formatCurrency(log.amount)}</div>
                  <div className="log-meta">
                    <span className={`status-badge ${getStatusBadgeClass(log.status)}`}>
                      {log.status}
                    </span>
                    <span className={`type-badge ${getTypeBadgeClass(log.type)}`}>
                      {log.type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="log-actions">
                <button 
                  onClick={() => handleViewDetails(log)} 
                  className="view-details-btn"
                >
                  View Details
                </button>
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

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Log Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="close-modal">×</button>
            </div>
            
            <div className="log-details-content">
              <div className="detail-section">
                <h3>Transaction Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Transaction ID:</span>
                    <span className="detail-value">#{selectedLog.transactionId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-badge ${getStatusBadgeClass(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className={`detail-value type-badge ${getTypeBadgeClass(selectedLog.type)}`}>
                      {selectedLog.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">{formatCurrency(selectedLog.amount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Member Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedLog.memberName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedLog.memberEmail || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedLog.memberPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Transaction Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedLog.description}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(selectedLog.timestamp)} at {formatTime(selectedLog.timestamp)}</span>
                  </div>
                  {selectedLog.processedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Processed:</span>
                      <span className="detail-value">{formatDate(selectedLog.processedAt)} at {formatTime(selectedLog.processedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedLog.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <div className="notes-content">{selectedLog.notes}</div>
                </div>
              )}
              
              {selectedLog.errorMessage && (
                <div className="detail-section">
                  <h3>Error Details</h3>
                  <div className="error-content">{selectedLog.errorMessage}</div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
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

export default PaymentLogs;
