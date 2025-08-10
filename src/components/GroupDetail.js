import React, { useState, useEffect, useCallback } from 'react';
import { groupsApi, paymentsApi } from '../services/api';
import { formatPaymentDate } from '../utils/dateUtils';
import AddMemberModal from './AddMemberModal';

const GroupDetail = ({ group, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    monthlyAmount: group.monthlyAmount.toString(),
    maxMembers: group.maxMembers.toString(),
    duration: group.duration.toString(),
    startMonth: group.startMonth,
    startYear: new Date(group.startMonth).getFullYear().toString(),
    startMonthValue: (new Date(group.startMonth).getMonth() + 1).toString().padStart(2, '0'),
  });

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchGroupMembers = useCallback(async () => {
    try {
      const response = await groupsApi.getById(group.id);
      if (response.data.success && response.data.data) {
        setGroupMembers(response.data.data.members || []);
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
  }, [group.id]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsApi.getByGroup(group.id);
      if (response.data.success && response.data.data) {
        setPayments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  }, [group.id]);

  useEffect(() => {
    fetchGroupMembers();
    fetchPayments();
  }, [fetchGroupMembers, fetchPayments]);

  const calculateEndMonth = (startMonth, duration) => {
    if (!startMonth || !duration) return '';
    
    const [year, month] = startMonth.split('-').map(Number);
    const endMonth = month + duration - 1;
    const endYear = year + Math.floor((endMonth - 1) / 12);
    const finalMonth = ((endMonth - 1) % 12) + 1;
    
    return `${endYear}-${finalMonth.toString().padStart(2, '0')}`;
  };

  const formatMonthYear = (monthYear) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-').map(Number);
    const date = new Date(year, month - 1); // month is 0-indexed in Date constructor
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getPendingCount = () => {
    return payments.filter(payment => payment.status === 'pending' || payment.status === 'not_paid').length;
  };

  const getStatusDisplay = (status, pendingCount) => {
    // Always prioritize backend status first
    switch (status) {
      case 'fully_paid':
        return { text: 'Fully Paid', class: 'badge-success' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      case 'pending':
        // Only show "Pending: X" when backend status is "pending"
        if (pendingCount && pendingCount > 0) {
          return { text: `Pending: ${pendingCount}`, class: 'badge-warning' };
        }
        return { text: 'Pending', class: 'badge-warning' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Update startMonth when year or month changes
      if (name === 'startYear' || name === 'startMonthValue') {
        updated.startMonth = `${updated.startYear}-${updated.startMonthValue}`;
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const groupData = {
        name: formData.name,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        maxMembers: parseInt(formData.maxMembers),
        duration: parseInt(formData.duration),
        startMonth: formData.startMonth,
      };

      const response = await groupsApi.update(group.id, groupData);
      if (response.data.success && response.data.data) {
        onUpdate(response.data.data);
        setIsEditing(false);
        setError(null);
      } else {
        setError('Failed to update group');
      }
    } catch (err) {
      setError('Error updating group');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: group.name,
      monthlyAmount: group.monthlyAmount.toString(),
      maxMembers: group.maxMembers.toString(),
      duration: group.duration.toString(),
      startMonth: group.startMonth,
      startYear: new Date(group.startMonth).getFullYear().toString(),
      startMonthValue: (new Date(group.startMonth).getMonth() + 1).toString().padStart(2, '0'),
    });
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      onDelete(group.id);
    }
  };

  const handleMemberAdded = () => {
    fetchGroupMembers();
    setShowAddMemberModal(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        const response = await groupsApi.removeMember(group.id, memberId);
        if (response.data.success) {
          setGroupMembers(groupMembers.filter(m => m.memberId !== memberId));
        } else {
          setError('Failed to remove member');
        }
      } catch (err) {
        setError('Error removing member');
      }
    }
  };

  const getAvailableMonths = () => {
    const months = [];
    const [startYear, startMonth] = group.startMonth.split('-').map(Number);
    const [endYear, endMonth] = group.endMonth.split('-').map(Number);
    
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      months.push(monthStr);
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    // Filter out months already taken by other members
    const takenMonths = groupMembers.map(m => m.receiveMonth);
    return months.filter(month => !takenMonths.includes(month));
  };

  const getPaymentStatus = (memberId, receiveMonth) => {
    const currentMonth = getCurrentMonth();
    
    // For each member in group details
    // Check if memberId matches any payment's memberId
    // Then check if that payment is for the current month AND the slot matches the receive month
    // If found, return the payment status
    
    for (const payment of payments) {
      if (payment.memberId === memberId && 
          payment.groupId === group.id && 
          payment.paymentMonth === currentMonth &&
          payment.slot === receiveMonth) {
        return payment.status.charAt(0).toUpperCase() + payment.status.slice(1).replace('_', ' ');
      }
    }
    
    return 'Not Paid';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'received':
        return 'status-received';
      case 'settled':
        return 'status-settled';
      case 'pending':
        return 'status-pending';
      case 'not paid':
        return 'status-not-paid';
      default:
        return 'status-na';
    }
  };

  return (
    <div className="group-detail-overlay">
      <div className="group-detail-modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Group' : 'Group Details'}</h2>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="modal-body">
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Group Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Amount (SRD) *</label>
                  <input 
                    type="number" 
                    name="monthlyAmount" 
                    value={formData.monthlyAmount} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Maximum Members *</label>
                  <input 
                    type="number" 
                    name="maxMembers" 
                    value={formData.maxMembers} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    min="1"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (months) *</label>
                  <input 
                    type="number" 
                    name="duration" 
                    value={formData.duration} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Month *</label>
                  <div className="month-year-selector">
                    <select 
                      name="startMonthValue" 
                      value={formData.startMonthValue} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      required 
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select 
                      name="startYear" 
                      value={formData.startYear} 
                      onChange={handleInputChange} 
                      className="form-control" 
                      required 
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = 2021 + i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">End Month (Calculated)</label>
                  <input 
                    type="month" 
                    value={calculateEndMonth(formData.startMonth, parseInt(formData.duration))} 
                    className="form-control" 
                    disabled 
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="group-details">
              <div className="detail-row">
                <div className="detail-group">
                  <label>Group Name:</label>
                  <span>{group.name}</span>
                </div>
                <div className="detail-group">
                  <label>Monthly Amount:</label>
                  <span>SRD {group.monthlyAmount}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Group Status:</label>
                  <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                    {getStatusDisplay(group.status, group.pendingCount).text}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Created:</label>
                  <span>{formatPaymentDate(group.createdAt)}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Maximum Members:</label>
                  <span>{group.maxMembers}</span>
                </div>
                <div className="detail-group">
                  <label>Duration:</label>
                  <span>{group.duration} months</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Start Month:</label>
                  <span>{formatMonthYear(group.startMonth)}</span>
                </div>
                <div className="detail-group">
                  <label>End Month:</label>
                  <span>{formatMonthYear(group.endMonth)}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Current Members:</label>
                  <span>{groupMembers.length} / {group.maxMembers}</span>
                </div>
                <div className="detail-group">
                  <label>Available Slots:</label>
                  <span>{group.maxMembers - groupMembers.length}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Group
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                >
                  Delete Group
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Group Members Section */}
          <div className="members-section">
            <div className="section-header">
              <h3>Group Members</h3>
              {groupMembers.length < group.maxMembers && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  Add Member
                </button>
              )}
            </div>

            {groupMembers.length === 0 ? (
              <div className="empty-members">
                <p>No members in this group yet.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  Add First Member
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="group-members-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Receive Month</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map((groupMember) => {
                      const status = getPaymentStatus(groupMember.memberId, groupMember.receiveMonth);
                      return (
                        <tr key={groupMember.id}>
                          <td>{groupMember.firstName || groupMember.member?.firstName} {groupMember.lastName || groupMember.member?.lastName}</td>
                          <td>{formatMonthYear(groupMember.receiveMonth)}</td>
                          <td>
                            <span className={`status-badge ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveMember(groupMember.memberId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          group={group}
          availableMonths={getAvailableMonths()}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </div>
  );
};

export default GroupDetail;
