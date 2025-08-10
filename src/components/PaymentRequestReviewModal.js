import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, AlertTriangle } from 'lucide-react';
import { paymentRequestsApi, banksApi } from '../services/api';
import { formatPaymentDate, getCurrentMonthString } from '../utils/dateUtils';

const PaymentRequestReviewModal = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    groupId: '',
    amount: '',
    paymentDate: '',
    paymentMonth: '',
    slot: '',
    paymentType: 'bank_transfer',
    senderBank: '',
    receiverBank: '',
    proofOfPayment: '',
    adminNotes: ''
  });

  useEffect(() => {
    if (isOpen && request) {
      // Initialize form data with request data
      setFormData({
        groupId: request.groupId.toString(),
        amount: request.amount.toString(),
        paymentDate: request.paymentDate,
        paymentMonth: request.paymentMonth,
        slot: request.slot,
        paymentType: request.paymentType,
        senderBank: request.senderBank || '',
        receiverBank: request.receiverBank || '',
        proofOfPayment: request.proofOfPayment || '',
        adminNotes: request.adminNotes || ''
      });
      setIsEditing(false);
      fetchBanks();
    }
  }, [isOpen, request]);

  const fetchBanks = async () => {
    try {
      const response = await banksApi.getAll();
      if (response.data.success && response.data.data) {
        setBanks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTogglePaymentType = () => {
    setFormData(prev => ({
      ...prev,
      paymentType: prev.paymentType === 'cash' ? 'bank_transfer' : 'cash',
      senderBank: '',
      receiverBank: ''
    }));
  };

  const handleApprove = async () => {
    if (!request) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const reviewData = {
        status: 'approved',
        adminNotes: formData.adminNotes
      };

      // If editing, include the modified fields
      if (isEditing) {
        reviewData.groupId = parseInt(formData.groupId);
        reviewData.amount = parseFloat(formData.amount);
        reviewData.paymentDate = formData.paymentDate;
        reviewData.paymentMonth = formData.paymentMonth;
        reviewData.slot = formData.slot;
        reviewData.paymentType = formData.paymentType;
        reviewData.senderBank = formData.senderBank || null;
        reviewData.receiverBank = formData.receiverBank || null;
        reviewData.proofOfPayment = formData.proofOfPayment || null;
      }

      const response = await paymentRequestsApi.review(request.id, reviewData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to approve payment request');
      }
    } catch (err) {
      console.error('Error approving payment request:', err);
      setError(err.response?.data?.message || 'Failed to approve payment request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const reviewData = {
        status: 'rejected',
        adminNotes: formData.adminNotes
      };

      const response = await paymentRequestsApi.review(request.id, reviewData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to reject payment request');
      }
    } catch (err) {
      console.error('Error rejecting payment request:', err);
      setError(err.response?.data?.message || 'Failed to reject payment request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle size={16} className="status-icon pending" />;
      case 'approved':
        return <Check size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <AlertTriangle size={16} className="status-icon unknown" />;
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
        return 'Unknown';
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

  if (!isOpen || !request) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-request-review-modal">
        <div className="modal-header">
          <h2>Review Payment Request</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Request Information Display */}
          <div className="request-info-section">
            <h3>Request Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Member:</label>
                <span>{request.memberName}</span>
              </div>
              <div className="info-item">
                <label>Group:</label>
                <span>{request.groupName}</span>
              </div>
              <div className="info-item">
                <label>Slot:</label>
                <span>{formatSlotDisplay(request.slot)}</span>
              </div>
              <div className="info-item">
                <label>Amount:</label>
                <span>{formatCurrency(request.amount)}</span>
              </div>
              <div className="info-item">
                <label>Payment Date:</label>
                <span>{formatPaymentDate(request.paymentDate)}</span>
              </div>
              <div className="info-item">
                <label>Payment Month:</label>
                <span>{formatSlotDisplay(request.paymentMonth)}</span>
              </div>
              <div className="info-item">
                <label>Payment Type:</label>
                <span className="payment-type">
                  {request.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                </span>
              </div>
              {request.paymentType === 'bank_transfer' && (
                <>
                  <div className="info-item">
                    <label>Sender Bank:</label>
                    <span>{request.senderBank || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Receiver Bank:</label>
                    <span>{request.receiverBank || 'Not specified'}</span>
                  </div>
                </>
              )}
              {request.proofOfPayment && (
                <div className="info-item">
                  <label>Proof of Payment:</label>
                  <span>{request.proofOfPayment}</span>
                </div>
              )}
              {request.requestNotes && (
                <div className="info-item">
                  <label>Member Notes:</label>
                  <span>{request.requestNotes}</span>
                </div>
              )}
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${request.status}`}>
                  {getStatusIcon(request.status)}
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="info-item">
                <label>Submitted:</label>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Edit Mode Toggle */}
          <div className="edit-toggle-section">
            <button
              type="button"
              className={`btn ${isEditing ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Request'}
            </button>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="edit-form-section">
              <h3>Edit Request Details</h3>
              <form className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="groupId">Group ID</label>
                    <input
                      type="number"
                      id="groupId"
                      name="groupId"
                      value={formData.groupId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="slot">Slot</label>
                    <input
                      type="text"
                      id="slot"
                      name="slot"
                      value={formData.slot}
                      onChange={handleInputChange}
                      placeholder="YYYY-MM format"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="paymentDate">Payment Date</label>
                    <input
                      type="date"
                      id="paymentDate"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paymentMonth">Payment Month</label>
                    <input
                      type="text"
                      id="paymentMonth"
                      name="paymentMonth"
                      value={formData.paymentMonth}
                      onChange={handleInputChange}
                      placeholder="YYYY-MM format"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Type</label>
                    <div className="toggle-container">
                      <button
                        type="button"
                        className={`toggle-option ${formData.paymentType === 'cash' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'cash' }))}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        className={`toggle-option ${formData.paymentType === 'bank_transfer' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'bank_transfer' }))}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>
                </div>

                {formData.paymentType === 'bank_transfer' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="senderBank">Sender Bank</label>
                      <select
                        id="senderBank"
                        name="senderBank"
                        value={formData.senderBank}
                        onChange={handleInputChange}
                      >
                        <option value="">Select sender bank</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="receiverBank">Receiver Bank</label>
                      <select
                        id="receiverBank"
                        name="receiverBank"
                        value={formData.receiverBank}
                        onChange={handleInputChange}
                      >
                        <option value="">Select receiver bank</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="proofOfPayment">Proof of Payment</label>
                  <input
                    type="text"
                    id="proofOfPayment"
                    name="proofOfPayment"
                    value={formData.proofOfPayment}
                    onChange={handleInputChange}
                    placeholder="Transaction ID, receipt number, etc."
                  />
                </div>
              </form>
            </div>
          )}

          {/* Admin Notes */}
          <div className="admin-notes-section">
            <h3>Admin Notes</h3>
            <textarea
              name="adminNotes"
              value={formData.adminNotes}
              onChange={handleInputChange}
              placeholder="Add notes about your decision..."
              rows={3}
              className="admin-notes-textarea"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="btn btn-danger"
            disabled={submitLoading}
          >
            {submitLoading ? 'Processing...' : 'Reject'}
          </button>
          <button
            onClick={handleApprove}
            className="btn btn-success"
            disabled={submitLoading}
          >
            {submitLoading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestReviewModal;
