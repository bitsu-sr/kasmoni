import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, AlertTriangle } from 'lucide-react';
import { paymentRequestsApi, banksApi } from '../services/api';
import { PaymentRequest, Bank } from '../types';
import { formatPaymentDate, getCurrentMonthString } from '../utils/dateUtils';

interface PaymentRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PaymentRequest | null;
  onSuccess: () => void;
}

const PaymentRequestReviewModal: React.FC<PaymentRequestReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    groupId: '',
    amount: '',
    paymentDate: '',
    paymentMonth: '',
    slot: '',
    paymentType: 'bank_transfer' as 'cash' | 'bank_transfer',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      const reviewData: any = {
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
        if (formData.paymentType === 'bank_transfer') {
          reviewData.senderBank = formData.senderBank;
          reviewData.receiverBank = formData.receiverBank;
        }
        reviewData.proofOfPayment = formData.proofOfPayment;
      }

      await paymentRequestsApi.review(request.id!, reviewData);
      onSuccess();
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (!formData.adminNotes.trim()) {
      setError('Admin notes are required when rejecting a request');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      await paymentRequestsApi.review(request.id!, {
        status: 'rejected',
        adminNotes: formData.adminNotes
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <AlertTriangle size={16} className="text-warning" />;
      case 'approved':
        return <Check size={16} className="text-success" />;
      case 'rejected':
        return <XCircle size={16} className="text-danger" />;
      default:
        return null;
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

  if (!isOpen || !request) return null;

  const canEdit = request.status === 'pending_approval';
  const isReadOnly = !canEdit || !isEditing;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>
            Payment Request #{request.id} - Review
            <span className={`badge ms-2 ${request.status === 'pending_approval' ? 'badge-warning' : request.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
              {getStatusIcon(request.status)}
              <span className="ms-1">{getStatusText(request.status)}</span>
            </span>
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Member Information */}
          <div className="mb-4">
            <h5>Member Information</h5>
            <div className="row">
              <div className="col-md-6">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{request.member?.firstName} {request.member?.lastName}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{request.member?.email || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Submitted:</strong></td>
                      <td>{formatPaymentDate(request.createdAt!)}</td>
                    </tr>
                    {request.reviewedAt && (
                      <tr>
                        <td><strong>Reviewed:</strong></td>
                        <td>{formatPaymentDate(request.reviewedAt)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Editable Payment Details */}
          <div className="mb-4">
            <div className="d-flex justify-between align-center mb-3">
              <h5>Payment Details</h5>
              {canEdit && (
                <button 
                  type="button" 
                  className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-outline-primary'}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Group</label>
                <input 
                  type="text" 
                  value={request.group?.name || ''} 
                  className="form-control" 
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Receive Month</label>
                <input 
                  type="text" 
                  value={formatSlotDisplay(request.slot)} 
                  className="form-control" 
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (SRD)</label>
                <input 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  step="0.01"
                  min="0"
                  disabled={isReadOnly}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input 
                  type="date" 
                  name="paymentDate" 
                  value={formData.paymentDate} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Month</label>
              <input 
                type="text" 
                name="paymentMonth" 
                value={formData.paymentMonth} 
                onChange={handleInputChange} 
                className="form-control" 
                disabled={isReadOnly}
                placeholder="YYYY-MM format"
              />
              {!isReadOnly && (
                <small className="form-text text-muted">
                  Original request was for current month. You can change this if needed.
                </small>
              )}
            </div>
            
            <div className="form-row align-center mb-2">
              <label className="form-label">Payment Type:</label>
              {isReadOnly ? (
                <span className={`badge ms-2 ${formData.paymentType === 'cash' ? 'badge-info' : 'badge-secondary'}`}>
                  {formData.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                </span>
              ) : (
                <label style={{ marginLeft: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={formData.paymentType === 'cash'} 
                    onChange={handleTogglePaymentType} 
                  />
                  <span style={{ marginLeft: 4 }}>
                    {formData.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                  </span>
                </label>
              )}
            </div>
            
            {formData.paymentType === 'bank_transfer' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sender's Bank</label>
                  {isReadOnly ? (
                    <input 
                      type="text" 
                      value={formData.senderBank} 
                      className="form-control" 
                      disabled
                    />
                  ) : (
                    <select 
                      name="senderBank" 
                      value={formData.senderBank} 
                      onChange={handleInputChange} 
                      className="form-control" 
                    >
                      <option value="">Select sender's bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.bankName}>
                          {bank.bankName} ({bank.shortName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver's Bank</label>
                  {isReadOnly ? (
                    <input 
                      type="text" 
                      value={formData.receiverBank} 
                      className="form-control" 
                      disabled
                    />
                  ) : (
                    <select 
                      name="receiverBank" 
                      value={formData.receiverBank} 
                      onChange={handleInputChange} 
                      className="form-control" 
                    >
                      <option value="">Select receiver's bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.bankName}>
                          {bank.bankName} ({bank.shortName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Proof of Payment</label>
              <input 
                type="text" 
                name="proofOfPayment" 
                value={formData.proofOfPayment} 
                onChange={handleInputChange} 
                className="form-control" 
                disabled={isReadOnly}
                placeholder="Reference number or file path"
              />
            </div>
          </div>

          {/* Member Notes */}
          {request.requestNotes && (
            <div className="mb-4">
              <h5>Member Notes</h5>
              <div className="alert alert-info">
                {request.requestNotes}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="mb-4">
            <h5>Admin Notes</h5>
            <textarea 
              name="adminNotes" 
              value={formData.adminNotes} 
              onChange={handleInputChange} 
              className="form-control" 
              rows={3}
              placeholder={canEdit ? "Add notes about your review decision..." : "No admin notes"}
              disabled={!canEdit}
              maxLength={500}
            />
            {canEdit && (
              <small className="form-text text-muted">
                {formData.adminNotes.length}/500 characters
                {request.status === 'pending_approval' && (
                  <span className="text-warning"> • Required for rejection</span>
                )}
              </small>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={submitLoading}
          >
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          
          {canEdit && (
            <>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleReject}
                disabled={submitLoading}
              >
                {submitLoading ? 'Processing...' : 'Reject'}
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handleApprove}
                disabled={submitLoading}
              >
                {submitLoading ? 'Processing...' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestReviewModal;