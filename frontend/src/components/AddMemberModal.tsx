import React, { useState, useEffect } from 'react';
import { membersApi, groupsApi } from '../services/api';
import { Member, Group } from '../types';

interface AddMemberModalProps {
  group: Group;
  availableMonths: string[];
  onClose: () => void;
  onMemberAdded: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  group, 
  availableMonths, 
  onClose, 
  onMemberAdded 
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await membersApi.getAll();
      if (response.data.success && response.data.data) {
        setMembers(response.data.data);
      } else {
        setError('Failed to fetch members');
      }
    } catch (err) {
      setError('Error loading members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId || !selectedMonth) {
      setError('Please select both a member and a month');
      return;
    }

    try {
      setLoading(true);
      const response = await groupsApi.addMember(group.id, {
        memberId: selectedMemberId as number,
        receiveMonth: selectedMonth,
      });

      if (response.data.success) {
        onMemberAdded();
        setSelectedMemberId('');
        setSelectedMonth('');
        setError(null);
      } else {
        setError('Failed to add member to group');
      }
    } catch (err) {
      setError('Error adding member to group');
    } finally {
      setLoading(false);
    }
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatMonth = (monthString: string): string => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Member to {group.name}</h3>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select Member *</label>
            <select 
              value={selectedMemberId} 
              onChange={(e) => setSelectedMemberId(e.target.value ? parseInt(e.target.value) : '')}
              className="form-control"
              required
            >
              <option value="">Choose a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Receive Month *</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Choose a month...</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </div>

          {availableMonths.length === 0 && (
            <div className="alert alert-warning">
              No available months for this group. All months have been assigned to members.
            </div>
          )}

          <div className="group-info">
            <h4>Group Information</h4>
            <p><strong>Monthly Amount:</strong> SRD {group.monthlyAmount}</p>
            <p><strong>Duration:</strong> {group.duration} months</p>
            <p><strong>Period:</strong> {formatMonth(group.startMonth)} - {formatMonth(group.endMonth)}</p>
            <p><strong>Available Slots:</strong> {availableMonths.length}</p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={handleAddMember}
              disabled={loading || !selectedMemberId || !selectedMonth || availableMonths.length === 0}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal; 