import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Edit, Filter, Search } from 'lucide-react';
import { paymentRequestsApi } from '../services/api';
import { PaymentRequest } from '../types';
import { formatPaymentDate } from '../utils/dateUtils';
import PaymentRequestReviewModal from '../components/PaymentRequestReviewModal';

const PaymentRequestsAdmin: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await paymentRequestsApi.getAll();
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

  const filterRequests = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.member?.firstName?.toLowerCase().includes(term) ||
        request.member?.lastName?.toLowerCase().includes(term) ||
        request.group?.name?.toLowerCase().includes(term) ||
        request.id?.toString().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleReviewRequest = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    fetchRequests(); // Refresh the list
    setShowReviewModal(false);
    setSelectedRequest(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock size={16} className="text-warning" />;
      case 'approved':
        return <CheckCircle size={16} className="text-success" />;
      case 'rejected':
        return <XCircle size={16} className="text-danger" />;
      default:
        return <Clock size={16} className="text-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const formatSlotDisplay = (slot: string): string => {
    if (!slot) return '';
    const parts = slot.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount).replace('$', 'SRD ');
  };

  const getPendingCount = () => {
    return requests.filter(request => request.status === 'pending_approval').length;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>Loading payment requests...</p>
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
            <button className="btn btn-primary" onClick={fetchRequests}>
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
              <h1 className="card-title">Payment Requests</h1>
              <p>Manage member payment requests requiring approval</p>
              {getPendingCount() > 0 && (
                <div className="alert alert-warning mt-2">
                  <strong>{getPendingCount()}</strong> pending request{getPendingCount() !== 1 ? 's' : ''} awaiting your review
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                Filters
              </button>
              <button className="btn btn-primary" onClick={fetchRequests}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card-body border-bottom">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status Filter</label>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Search</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Search by member name, group, or request ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-control"
                  />
                  <Search size={16} className="input-group-icon" />
                </div>
              </div>
            </div>
            {(statusFilter !== 'all' || searchTerm) && (
              <div className="filter-results-info">
                Showing {filteredRequests.length} of {requests.length} requests
              </div>
            )}
          </div>
        )}

        {filteredRequests.length === 0 ? (
          <div className="text-center py-4">
            {requests.length === 0 ? (
              <>
                <Clock size={64} className="text-muted mb-3" />
                <h3>No Payment Requests</h3>
                <p>No payment requests have been submitted yet.</p>
              </>
            ) : (
              <>
                <Search size={64} className="text-muted mb-3" />
                <h3>No Matching Requests</h3>
                <p>No requests match your current filters.</p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Member</th>
                  <th>Group</th>
                  <th>Receive Month</th>
                  <th>Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>#{request.id}</td>
                    <td>
                      <div>
                        <strong>{request.member?.firstName} {request.member?.lastName}</strong>
                        {request.member?.email && (
                          <div className="text-muted small">{request.member.email}</div>
                        )}
                      </div>
                    </td>
                    <td>{request.group?.name}</td>
                    <td>{formatSlotDisplay(request.slot)}</td>
                    <td>{formatCurrency(request.amount)}</td>
                    <td>{formatPaymentDate(request.createdAt!)}</td>
                    <td>
                      <span className={`badge ${getStatusClass(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ms-1">{getStatusText(request.status)}</span>
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleReviewRequest(request)}
                          title={request.status === 'pending_approval' ? 'Review request' : 'View details'}
                        >
                          {request.status === 'pending_approval' ? <Edit size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <PaymentRequestReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
};

export default PaymentRequestsAdmin;