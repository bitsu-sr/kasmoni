import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { paymentRequestsApi, banksApi } from '../services/api';
import { getCurrentDateString, getCurrentMonthString } from '../utils/dateUtils';

const PaymentRequestModal = ({
  isOpen,
  onClose,
  memberId,
  onSuccess
}) => {
  const [eligibleSlots, setEligibleSlots] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
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
        paymentType: 'bank_transfer',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-set amount when group/slot is selected
    if (name === 'groupId' && value) {
      const selectedSlot = eligibleSlots.find(slot => slot.groupId === parseInt(value) && slot.slot === formData.slot);
      if (selectedSlot) {
        setFormData(prev => ({ ...prev, amount: selectedSlot.monthlyAmount.toString() }));
      }
    }

    if (name === 'slot' && value) {
      const selectedSlot = eligibleSlots.find(slot => slot.groupId === parseInt(formData.groupId) && slot.slot === value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.groupId || !formData.slot || !formData.amount || !formData.paymentDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.paymentType === 'bank_transfer' && (!formData.senderBank || !formData.receiverBank)) {
      setError('Please select both sender and receiver banks for bank transfer');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const requestData = {
        memberId,
        groupId: parseInt(formData.groupId),
        slot: formData.slot,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentType: formData.paymentType,
        senderBank: formData.senderBank || null,
        receiverBank: formData.receiverBank || null,
        proofOfPayment: formData.proofOfPayment || null,
        requestNotes: formData.requestNotes || null
      };

      const response = await paymentRequestsApi.create(requestData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to create payment request');
      }
    } catch (err) {
      console.error('Error creating payment request:', err);
      setError(err.response?.data?.message || 'Failed to create payment request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getAvailableSlots = () => {
    if (!formData.groupId) return [];
    return eligibleSlots.filter(slot => slot.groupId === parseInt(formData.groupId));
  };

  const getUniqueGroups = () => {
    const uniqueGroups = [];
    const seen = new Set();
    
    eligibleSlots.forEach(slot => {
      if (!seen.has(slot.groupId)) {
        seen.add(slot.groupId);
        uniqueGroups.push({
          id: slot.groupId,
          name: slot.groupName
        });
      }
    });
    
    return uniqueGroups;
  };

  const formatSlotDisplay = (slot) => {
    return `Slot ${slot}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-request-modal">
        <div className="modal-header">
          <h2>Request Payment</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="payment-request-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="groupId">Group *</label>
                <select
                  id="groupId"
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a group</option>
                  {getUniqueGroups().map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="slot">Slot *</label>
                <select
                  id="slot"
                  name="slot"
                  value={formData.slot}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.groupId}
                >
                  <option value="">Select a slot</option>
                  {getAvailableSlots().map(slot => (
                    <option key={slot.slot} value={slot.slot}>
                      {formatSlotDisplay(slot.slot)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentDate">Payment Date *</label>
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

            {formData.paymentType === 'bank_transfer' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senderBank">Sender Bank *</label>
                  <select
                    id="senderBank"
                    name="senderBank"
                    value={formData.senderBank}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select sender bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="receiverBank">Receiver Bank *</label>
                  <select
                    id="receiverBank"
                    name="receiverBank"
                    value={formData.receiverBank}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select receiver bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
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

            <div className="form-group">
              <label htmlFor="requestNotes">Additional Notes</label>
              <textarea
                id="requestNotes"
                name="requestNotes"
                value={formData.requestNotes}
                onChange={handleInputChange}
                placeholder="Any additional information about your payment request..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentRequestModal;
