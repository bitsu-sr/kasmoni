import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { paymentRequestsApi, banksApi } from '../services/api';
import { Bank } from '../types';
import { getCurrentDateString, getCurrentMonthString } from '../utils/dateUtils';

interface EligibleSlot {
  groupId: number;
  slot: string;
  groupName: string;
  monthlyAmount: number;
}

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  onSuccess: () => void;
}

const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  isOpen,
  onClose,
  memberId,
  onSuccess
}) => {
  const [eligibleSlots, setEligibleSlots] = useState<EligibleSlot[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    groupId: '',
    slot: '',
    amount: '',
    paymentDate: getCurrentDateString(),
    paymentType: 'bank_transfer' as 'cash' | 'bank_transfer',
    senderBank: '',
    receiverBank: '',
    proofOfPayment: '',
    requestNotes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchEligibleSlots();
      fetchBanks();
    } else {
      // Reset form when modal closes
      setFormData({
        groupId: '',
        slot: '',
        amount: '',
        paymentDate: getCurrentDateString(),
        paymentType: 'bank_transfer' as 'cash' | 'bank_transfer',
        senderBank: '',
        receiverBank: '',
        proofOfPayment: '',
        requestNotes: ''
      });
      setError(null);
    }
  }, [isOpen, memberId]);

  const fetchEligibleSlots = async () => {
    try {
      setLoading(true);
      const response = await paymentRequestsApi.getEligibleSlots(memberId);
      if (response.data.success && response.data.data) {
        setEligibleSlots(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching eligible slots:', err);
      setError('Failed to load eligible groups and slots');
    } finally {
      setLoading(false);
    }
  };

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

    // Auto-set amount when group/slot is selected
    if (name === 'groupId' && value) {
      const selectedSlot = eligibleSlots.find(slot => slot.groupId === parseInt(value) && slot.slot === formData.slot);
      if (selectedSlot) {
        setFormData(prev => ({ ...prev, amount: selectedSlot.monthlyAmount.toString() }));
      }
    }

    if (name === 'slot' && formData.groupId) {
      const selectedSlot = eligibleSlots.find(slot => 
        slot.groupId === parseInt(formData.groupId) && slot.slot === value
      );
      if (selectedSlot) {
        setFormData(prev => ({ ...prev, amount: selectedSlot.monthlyAmount.toString() }));
      }
    }
  };

  const handleTogglePaymentType = () => {
    setFormData(prev => ({
      ...prev,
      paymentType: prev.paymentType === 'cash' ? 'bank_transfer' : 'cash',
      senderBank: '',
      receiverBank: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupId || !formData.slot || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const submitData = {
        groupId: parseInt(formData.groupId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        slot: formData.slot,
        paymentType: formData.paymentType,
        senderBank: formData.paymentType === 'bank_transfer' ? formData.senderBank : undefined,
        receiverBank: formData.paymentType === 'bank_transfer' ? formData.receiverBank : undefined,
        proofOfPayment: formData.proofOfPayment || undefined,
        requestNotes: formData.requestNotes || undefined
      };

      await paymentRequestsApi.create(submitData);
      
      // Reset form
      setFormData({
        groupId: '',
        slot: '',
        amount: '',
        paymentDate: getCurrentDateString(),
        paymentType: 'bank_transfer',
        senderBank: '',
        receiverBank: '',
        proofOfPayment: '',
        requestNotes: ''
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting payment request:', err);
      setError(err.response?.data?.error || 'Failed to submit payment request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getAvailableSlots = () => {
    if (!formData.groupId) return [];
    return eligibleSlots.filter(slot => slot.groupId === parseInt(formData.groupId));
  };

  const getUniqueGroups = () => {
    const groupMap = new Map();
    eligibleSlots.forEach(slot => {
      if (!groupMap.has(slot.groupId)) {
        groupMap.set(slot.groupId, {
          id: slot.groupId,
          name: slot.groupName,
          monthlyAmount: slot.monthlyAmount
        });
      }
    });
    return Array.from(groupMap.values());
  };

  const formatSlotDisplay = (slot: string): string => {
    if (!slot) return '';
    const parts = slot.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Submit Payment Request</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            {loading ? (
              <div className="text-center">Loading eligible groups and slots...</div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Group *</label>
                    <select 
                      name="groupId" 
                      value={formData.groupId} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      required
                    >
                      <option value="">Select a group...</option>
                      {getUniqueGroups().map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} - SRD {group.monthlyAmount}/month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receive Month *</label>
                    <select 
                      name="slot" 
                      value={formData.slot} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      required
                      disabled={!formData.groupId}
                    >
                      <option value="">
                        {formData.groupId ? 'Select a receive month...' : 'Select a group first...'}
                      </option>
                      {getAvailableSlots().map((slot) => (
                        <option key={slot.slot} value={slot.slot}>
                          {formatSlotDisplay(slot.slot)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (SRD) *</label>
                    <input 
                      type="number" 
                      name="amount" 
                      value={formData.amount} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      step="0.01"
                      min="0"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Date *</label>
                    <input 
                      type="date" 
                      name="paymentDate" 
                      value={formData.paymentDate} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Month</label>
                    <input 
                      type="text" 
                      value={getCurrentMonthString()}
                      className="form-control" 
                      disabled
                      title="Payment month is automatically set to current month"
                    />
                    <small className="form-text text-muted">
                      Payment month is automatically set to current month. Admins can change this if needed.
                    </small>
                  </div>
                </div>
                
                <div className="form-row align-center mb-2">
                  <label className="form-label">Payment Type:</label>
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
                </div>
                
                {formData.paymentType === 'bank_transfer' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Sender's Bank</label>
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
                    </div>
                    <div className="form-group">
                      <label className="form-label">Receiver's Bank</label>
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
                    placeholder="Optional: Reference number or file path"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    name="requestNotes" 
                    value={formData.requestNotes} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    rows={3}
                    placeholder="Optional: Additional notes about this payment request"
                    maxLength={500}
                  />
                  <small className="form-text text-muted">
                    {formData.requestNotes.length}/500 characters
                  </small>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentRequestModal;