import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { groupsApi, paymentsApi, banksApi } from '../services/api';
import { getCurrentDateString, getCurrentMonthString } from '../utils/dateUtils';

const BulkPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [groups, setGroups] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [paymentMonth, setPaymentMonth] = useState(getCurrentMonthString());
  const [memberSlots, setMemberSlots] = useState([]);
  const [paymentData, setPaymentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Generate month options for the dropdown
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Add current year months
    for (let month = 0; month < 12; month++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear}-${monthStr}`;
      const monthName = new Date(currentYear, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: yearMonth, label: monthName });
    }
    
    // Add next year months
    for (let month = 0; month < 12; month++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear + 1}-${monthStr}`;
      const monthName = new Date(currentYear + 1, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: yearMonth, label: monthName });
    }
    
    return options;
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
      fetchGroups();
      fetchBanks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await groupsApi.getAll();
      if (response.data.success && response.data.data) {
        setGroups(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch groups');
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await banksApi.getAll();
      if (response.data.success && response.data.data) {
        setBanks(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch banks');
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      setLoading(true);
      const response = await paymentsApi.getGroupMembersSlots(groupId);
      if (response.data.success && response.data.data) {
        const slots = response.data.data;
        setMemberSlots(slots);
        
        // Initialize payment data for each slot
        const initialData = {};
        slots.forEach(slot => {
          if (slot.hasPaid && slot.payment) {
            // Pre-fill with existing payment data for slots with payments
            initialData[slot.slot] = {
              memberId: slot.memberId,
              firstName: slot.firstName,
              lastName: slot.lastName,
              slot: slot.slot,
              slotLabel: slot.slotLabel,
              amount: slot.payment.amount.toString(),
              paymentDate: slot.payment.paymentDate,
              paymentType: slot.payment.paymentType,
              senderBank: slot.payment.senderBank || '',
              receiverBank: slot.payment.receiverBank || '',
              status: slot.payment.status
            };
          } else {
            // Use default values for unpaid slots
            initialData[slot.slot] = {
              memberId: slot.memberId,
              firstName: slot.firstName,
              lastName: slot.lastName,
              slot: slot.slot,
              slotLabel: slot.slotLabel,
              amount: selectedGroup ? selectedGroup.monthlyAmount.toString() : '',
              paymentDate: getCurrentDateString(),
              paymentType: 'cash', // Default to cash to avoid validation issues
              senderBank: '',
              receiverBank: '',
              status: 'not_paid'
            };
          }
        });
        setPaymentData(initialData);
      }
    } catch (err) {
      setError('Failed to fetch group members');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.id.toString() === groupId);
    setSelectedGroup(group || null);
    setMemberSlots([]);
    setPaymentData({});
    setValidationErrors({});
  };

  const resetModalState = () => {
    setSelectedGroup(null);
    setMemberSlots([]);
    setPaymentData({});
    setValidationErrors({});
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handlePaymentDataChange = (slotKey, field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [field]: value
      }
    }));
    
    // Clear validation errors for this field
    if (validationErrors[slotKey]) {
      setValidationErrors(prev => ({
        ...prev,
        [slotKey]: prev[slotKey].filter(error => !error.includes(field))
      }));
    }
  };

  const handleTogglePaymentType = (slotKey) => {
    const currentType = paymentData[slotKey]?.paymentType || 'bank_transfer';
    const newType = currentType === 'cash' ? 'bank_transfer' : 'cash';
    
    handlePaymentDataChange(slotKey, 'paymentType', newType);
  };

  const validatePayments = async () => {
    if (!selectedGroup) return false;

    // Validate all slots that have required fields filled
    const payments = Object.values(paymentData).filter(payment => {
      const hasRequiredFields = payment.amount && payment.slot && payment.paymentDate;
      
      // For bank_transfer payments, ensure bank fields are filled
      if (payment.paymentType === 'bank_transfer') {
        const hasBankFields = payment.senderBank && payment.receiverBank;
        return hasRequiredFields && hasBankFields;
      }
      
      return hasRequiredFields;
    });

    if (payments.length === 0) {
      setError('Please fill in at least one payment to process');
      return false;
    }

    try {
      const requestData = {
        groupId: selectedGroup.id,
        paymentMonth,
        payments: payments.map(payment => ({
          memberId: payment.memberId,
          amount: parseFloat(payment.amount),
          paymentDate: payment.paymentDate,
          slot: payment.slot,
          paymentType: payment.paymentType,
          senderBank: payment.senderBank,
          receiverBank: payment.receiverBank,
          status: payment.status
        }))
      };
      
      const response = await paymentsApi.validateBulk(requestData);

      if (response.data.success) {
        setValidationErrors({});
        return true;
      } else {
        const errors = {};
        response.data.data.forEach((result) => {
          if (result.errors.length > 0) {
            // Find the slot key based on memberId and slot
            const slotKey = Object.keys(paymentData).find(key => 
              paymentData[key].memberId === result.memberId && paymentData[key].slot === result.slot
            );
            if (slotKey) {
              errors[slotKey] = result.errors;
            }
          }
        });
        setValidationErrors(errors);
        return false;
      }
    } catch (err) {
      setError('Failed to validate payments');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }

    const isValid = await validatePayments();
    if (!isValid) return;

    // Process all slots that have required fields filled
    const payments = Object.values(paymentData).filter(payment => {
      const hasRequiredFields = payment.amount && payment.slot && payment.paymentDate;
      
      // For bank_transfer payments, ensure bank fields are filled
      if (payment.paymentType === 'bank_transfer') {
        const hasBankFields = payment.senderBank && payment.receiverBank;
        return hasRequiredFields && hasBankFields;
      }
      
      return hasRequiredFields;
    });

    if (payments.length === 0) {
      setError('Please fill in at least one payment to process');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        groupId: selectedGroup.id,
        paymentMonth,
        payments: payments.map(payment => ({
          memberId: payment.memberId,
          amount: parseFloat(payment.amount),
          paymentDate: payment.paymentDate,
          slot: payment.slot,
          paymentType: payment.paymentType,
          senderBank: payment.senderBank,
          receiverBank: payment.receiverBank,
          status: payment.status
        }))
      };
      
      const response = await paymentsApi.createBulk(requestData);

      if (response.data.success && response.data.data) {
        onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.error || 'Failed to create payments');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payments');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (slotKey, field) => {
    const errors = validationErrors[slotKey] || [];
    return errors.find(error => error.toLowerCase().includes(field.toLowerCase()));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content bulk-payment-modal">
        <div className="modal-header">
          <h2>Bulk Payment</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Group *</label>
                <select 
                  value={selectedGroup?.id || ''} 
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="form-control" 
                  required
                >
                  <option value="">Select a group...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - SRD {group.monthlyAmount}/month
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Month *</label>
                <select 
                  value={paymentMonth} 
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="form-control" 
                  required
                >
                  {generateMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedGroup && memberSlots.length > 0 && (
              <div className="bulk-payment-table">
                <h3>Group Members</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Slot</th>
                        <th>Amount (SRD)</th>
                        <th>Payment Date</th>
                        <th>Payment Type</th>
                        <th>Sender's Bank</th>
                        <th>Receiver's Bank</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberSlots.map((slot) => {
                        const payment = paymentData[slot.slot];
                        const slotErrors = validationErrors[slot.slot] || [];
                        const isCompleted = slot.hasPaid && payment?.status && ['received', 'settled'].includes(payment.status);
                        const isPending = slot.hasPaid && payment?.status === 'pending';
                        
                        return (
                          <tr key={slot.slot} className={`${slotErrors.length > 0 ? 'has-error' : ''} ${isCompleted ? 'paid-slot' : ''} ${isPending ? 'pending-slot' : ''}`}>
                           <td>
                             <strong>{slot.firstName} {slot.lastName}</strong>
                             <br />
                             <small>Member ID: {slot.memberId}</small>
                           </td>
                           <td>
                             <span className="slot-label">{slot.slotLabel}</span>
                             <input 
                               type="hidden" 
                               value={slot.slot} 
                               onChange={(e) => handlePaymentDataChange(slot.slot, 'slot', e.target.value)}
                             />
                           </td>
                           <td>
                             {isCompleted && (
                               <div className="paid-indicator">
                                 <span className="badge bg-success">Completed</span>
                               </div>
                             )}
                             {isPending && (
                               <div className="paid-indicator">
                                 <span className="badge bg-warning">Pending</span>
                               </div>
                             )}
                             <input 
                               type="number" 
                               value={payment?.amount || ''} 
                               onChange={(e) => handlePaymentDataChange(slot.slot, 'amount', e.target.value)}
                               className={`form-control form-control-sm ${getFieldError(slot.slot, 'amount') ? 'is-invalid' : ''}`}
                               step="0.01"
                               min="0"
                               placeholder="0.00"
                               required 
                               disabled={isCompleted}
                             />
                             {getFieldError(slot.slot, 'amount') && (
                               <div className="invalid-feedback">{getFieldError(slot.slot, 'amount')}</div>
                             )}
                           </td>
                           <td>
                             <input 
                               type="date" 
                               value={payment?.paymentDate || ''} 
                               onChange={(e) => handlePaymentDataChange(slot.slot, 'paymentDate', e.target.value)}
                               className={`form-control form-control-sm ${getFieldError(slot.slot, 'paymentDate') ? 'is-invalid' : ''}`}
                               required 
                               disabled={isCompleted}
                             />
                             {getFieldError(slot.slot, 'paymentDate') && (
                               <div className="invalid-feedback">{getFieldError(slot.slot, 'paymentDate')}</div>
                             )}
                           </td>
                           <td>
                             <label className="payment-type-toggle">
                               <input 
                                 type="checkbox" 
                                 checked={payment?.paymentType === 'cash'} 
                                 onChange={() => handleTogglePaymentType(slot.slot)} 
                                 disabled={isCompleted}
                               />
                               <span>{payment?.paymentType === 'cash' ? 'Cash' : 'Bank'}</span>
                             </label>
                           </td>
                           <td>
                             {payment?.paymentType === 'bank_transfer' && (
                               <select 
                                 value={payment?.senderBank || ''} 
                                 onChange={(e) => handlePaymentDataChange(slot.slot, 'senderBank', e.target.value)}
                                 className={`form-control form-control-sm ${getFieldError(slot.slot, 'senderBank') ? 'is-invalid' : ''}`}
                                 required
                                 disabled={isCompleted}
                               >
                                 <option value="">Select bank...</option>
                                 {banks.map((bank) => (
                                   <option key={bank.id} value={bank.bankName}>
                                     {bank.bankName}
                                   </option>
                                 ))}
                               </select>
                             )}
                           </td>
                           <td>
                             {payment?.paymentType === 'bank_transfer' && (
                               <select 
                                 value={payment?.receiverBank || ''} 
                                 onChange={(e) => handlePaymentDataChange(slot.slot, 'receiverBank', e.target.value)}
                                 className={`form-control form-control-sm ${getFieldError(slot.slot, 'receiverBank') ? 'is-invalid' : ''}`}
                                 required
                                 disabled={isCompleted}
                               >
                                 <option value="">Select bank...</option>
                                 {banks.map((bank) => (
                                   <option key={bank.id} value={bank.bankName}>
                                     {bank.bankName}
                                   </option>
                                 ))}
                               </select>
                             )}
                           </td>
                           <td>
                             <select 
                               value={payment?.status || 'not_paid'} 
                               onChange={(e) => handlePaymentDataChange(slot.slot, 'status', e.target.value)}
                               className="form-control form-control-sm"
                               disabled={isCompleted}
                             >
                               <option value="not_paid">Not Paid</option>
                               <option value="pending">Pending</option>
                               <option value="received">Received</option>
                               <option value="settled">Settled</option>
                             </select>
                           </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedGroup && memberSlots.length === 0 && (
              <div className="alert alert-info">
                <CheckCircle size={16} />
                All members in this group have fully paid their slots.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading || !selectedGroup || memberSlots.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Payments...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  Create Payments
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkPaymentModal;
