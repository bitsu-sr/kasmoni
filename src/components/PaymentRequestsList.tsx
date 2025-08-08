import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { paymentRequestsApi } from '../services/api';
import { PaymentRequest } from '../types';
import { formatPaymentDate } from '../utils/dateUtils';

interface PaymentRequestsListProps {
  memberId: number;
  refreshTrigger: number;
}

const PaymentRequestsList: React.FC<PaymentRequestsListProps> = ({
  memberId,
  refreshTrigger
}) => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);

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

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner"></div>
        <p>Loading payment requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-2" 
          onClick={fetchRequests}
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <p>No payment requests found.</p>
        <p>Submit your first payment request using the "Request Payment" button above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4>My Payment Requests</h4>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Request Date</th>
                <th>Group</th>
                <th>Receive Month</th>
                <th>Amount</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{formatPaymentDate(request.createdAt!)}</td>
                  <td>{request.group?.name}</td>
                  <td>{formatSlotDisplay(request.slot)}</td>
                  <td>{formatCurrency(request.amount)}</td>
                  <td>
                    <span className={`badge ${request.paymentType === 'cash' ? 'badge-info' : 'badge-secondary'}`}>
                      {request.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ms-1">{getStatusText(request.status)}</span>
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelectedRequest(request)}
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Request Details</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>Request Information</h5>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Request ID:</strong></td>
                        <td>#{selectedRequest.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <span className={`badge ${getStatusClass(selectedRequest.status)}`}>
                            {getStatusIcon(selectedRequest.status)}
                            <span className="ms-1">{getStatusText(selectedRequest.status)}</span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Submitted:</strong></td>
                        <td>{formatPaymentDate(selectedRequest.createdAt!)}</td>
                      </tr>
                      {selectedRequest.reviewedAt && (
                        <tr>
                          <td><strong>Reviewed:</strong></td>
                          <td>{formatPaymentDate(selectedRequest.reviewedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h5>Payment Details</h5>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Group:</strong></td>
                        <td>{selectedRequest.group?.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Receive Month:</strong></td>
                        <td>{formatSlotDisplay(selectedRequest.slot)}</td>
                      </tr>
                      <tr>
                        <td><strong>Amount:</strong></td>
                        <td>{formatCurrency(selectedRequest.amount)}</td>
                      </tr>
                      <tr>
                        <td><strong>Payment Date:</strong></td>
                        <td>{formatPaymentDate(selectedRequest.paymentDate)}</td>
                      </tr>
                      <tr>
                        <td><strong>Payment Type:</strong></td>
                        <td>
                          <span className={`badge ${selectedRequest.paymentType === 'cash' ? 'badge-info' : 'badge-secondary'}`}>
                            {selectedRequest.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRequest.paymentType === 'bank_transfer' && (selectedRequest.senderBank || selectedRequest.receiverBank) && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h5>Bank Information</h5>
                    <table className="table table-borderless">
                      <tbody>
                        {selectedRequest.senderBank && (
                          <tr>
                            <td><strong>Sender's Bank:</strong></td>
                            <td>{selectedRequest.senderBank}</td>
                          </tr>
                        )}
                        {selectedRequest.receiverBank && (
                          <tr>
                            <td><strong>Receiver's Bank:</strong></td>
                            <td>{selectedRequest.receiverBank}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedRequest.proofOfPayment && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h5>Proof of Payment</h5>
                    <p className="text-muted">{selectedRequest.proofOfPayment}</p>
                  </div>
                </div>
              )}

              {selectedRequest.requestNotes && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h5>Your Notes</h5>
                    <p className="text-muted">{selectedRequest.requestNotes}</p>
                  </div>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h5>Admin Notes</h5>
                    <div className="alert alert-info">
                      {selectedRequest.adminNotes}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentRequestsList;