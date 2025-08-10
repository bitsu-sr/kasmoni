import React, { useState, useEffect } from 'react';
import { membersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MemberDetail = ({ member, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [memberGroups, setMemberGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [currentMember, setCurrentMember] = useState(member);
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    birthDate: member.birthDate,
    birthplace: member.birthplace,
    address: member.address,
    city: member.city,
    phoneNumber: member.phoneNumber,
    email: member.email,
    nationalId: member.nationalId,
    nationality: member.nationality,
    occupation: member.occupation,
    bankName: member.bankName,
    accountNumber: member.accountNumber,
    registrationDate: member.registrationDate,
  });

  // Check if user has appropriate roles
  const isAdministrator = isAuthenticated && user && user.role === 'administrator';
  const isSuperUser = isAuthenticated && user && user.role === 'super_user';
  const canEdit = isAdministrator || isSuperUser;
  const canDelete = isAdministrator;

  // Function to show access denied message
  const showAccessDenied = (action) => {
    if (action === 'edit') {
      alert('Access denied! Please contact the Sranan Kasmoni administrator or super user to edit members');
    } else if (action === 'delete') {
      alert('Access denied! Please contact the Sranan Kasmoni administrator to delete members');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getStatusDisplay = (status) => {
    switch (status.toLowerCase()) {
      case 'received':
        return { text: 'Received', class: 'badge-success' };
      case 'settled':
        return { text: 'Settled', class: 'badge-success' };
      case 'pending':
        return { text: 'Pending', class: 'badge-warning' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Email validation
    if (name === 'email') {
      if (value === '') {
        setEmailValid(null);
      } else {
        setEmailValid(validateEmail(value));
      }
    }
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('formData:', formData);
    console.log('emailValid:', emailValid);
    
    // Only validate email if it's not empty and not null
    if (formData.email && emailValid === false) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Making API call to update member:', member.id);
      const response = await membersApi.update(member.id, formData);
      console.log('API response:', response);
      if (response.data.success && response.data.data) {
        console.log('Update successful, calling onUpdate');
        const updatedMember = response.data.data;
        onUpdate(updatedMember);
        
        // Update the currentMember and formData with the new data
        setCurrentMember(updatedMember);
        setFormData({
          firstName: updatedMember.firstName,
          lastName: updatedMember.lastName,
          birthDate: updatedMember.birthDate,
          birthplace: updatedMember.birthplace,
          address: updatedMember.address,
          city: updatedMember.city,
          phoneNumber: updatedMember.phoneNumber,
          email: updatedMember.email,
          nationalId: updatedMember.nationalId,
          nationality: updatedMember.nationality,
          occupation: updatedMember.occupation,
          bankName: updatedMember.bankName,
          accountNumber: updatedMember.accountNumber,
          registrationDate: updatedMember.registrationDate,
        });
        
        setIsEditing(false);
        setError(null);
      } else {
        console.log('Update failed:', response.data.error);
        setError(response.data.error || 'Failed to update member');
      }
    } catch (err) {
      console.error('Error updating member:', err);
      let errorMessage = 'Error updating member';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: currentMember.firstName,
      lastName: currentMember.lastName,
      birthDate: currentMember.birthDate,
      birthplace: currentMember.birthplace,
      address: currentMember.address,
      city: currentMember.city,
      phoneNumber: currentMember.phoneNumber,
      email: currentMember.email,
      nationalId: currentMember.nationalId,
      nationality: currentMember.nationality,
      occupation: currentMember.occupation,
      bankName: currentMember.bankName,
      accountNumber: currentMember.accountNumber,
      registrationDate: currentMember.registrationDate,
    });
    setEmailValid(null);
    setIsEditing(false);
    setError(null);
  };

  // Update currentMember when member prop changes
  useEffect(() => {
    setCurrentMember(member);
  }, [member]);

  useEffect(() => {
    const fetchMemberGroups = async () => {
      try {
        setGroupsLoading(true);
        const response = await membersApi.getGroups(currentMember.id);
        if (response.data.success && response.data.data) {
          setMemberGroups(response.data.data);
        } else {
          console.error('API returned success: false:', response.data);
        }
      } catch (err) {
        console.error('Error fetching member groups:', err);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchMemberGroups();
  }, [currentMember.id]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      onDelete(currentMember.id);
    }
  };

  return (
    <div className="member-detail-overlay">
      <div className="member-detail-modal">
        <div className="modal-header sticky-header">
          <h2>{isEditing ? 'Edit Member' : `Member Details of ${currentMember.firstName} ${currentMember.lastName}`}</h2>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="modal-body">
          {/* Member Summary Tiles */}
          <div className="member-summary-tiles">
            <div className="summary-tile">
              <div className="tile-icon">📊</div>
              <div className="tile-content">
                <h4>Total Slots</h4>
                <p>{memberGroups.length}</p>
              </div>
            </div>
            <div className="summary-tile">
              <div className="tile-icon">💰</div>
              <div className="tile-content">
                <h4>Total Monthly Amount</h4>
                <p>SRD {memberGroups.reduce((total, group) => total + (group.monthlyAmount || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Member Groups Table */}
          <div className="member-groups-section">
            <h3>Member Groups</h3>
            {groupsLoading ? (
              <div className="loading">Loading groups...</div>
            ) : memberGroups.length > 0 ? (
              <div className="table-container">
                <table className="member-groups-table">
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Receive Month</th>
                      <th>Monthly Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberGroups.map((group, index) => (
                      <tr key={index}>
                        <td>{group.groupName}</td>
                        <td>{group.receiveMonth}</td>
                        <td>SRD {group.monthlyAmount?.toLocaleString() || '0'}</td>
                        <td>
                          <span className={`badge ${getStatusDisplay(group.paymentStatus).class}`}>
                            {getStatusDisplay(group.paymentStatus).text}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-groups">This member is not part of any groups.</div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Birth Date *</label>
                  <input 
                    type="date" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Birthplace *</label>
                  <input 
                    type="text" 
                    name="birthplace" 
                    value={formData.birthplace} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <div className="email-input-container">
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className={`form-control ${emailValid === true ? 'valid' : emailValid === false ? 'invalid' : ''}`}
                      required 
                    />
                    {emailValid === true && (
                      <span className="email-status valid">✓</span>
                    )}
                    {emailValid === false && (
                      <span className="email-status invalid">✗</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">National ID *</label>
                  <input 
                    type="text" 
                    name="nationalId" 
                    value={formData.nationalId} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nationality *</label>
                  <input 
                    type="text" 
                    name="nationality" 
                    value={formData.nationality} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Occupation *</label>
                  <input 
                    type="text" 
                    name="occupation" 
                    value={formData.occupation} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name *</label>
                  <input 
                    type="text" 
                    name="bankName" 
                    value={formData.bankName} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Number *</label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={formData.accountNumber} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Date</label>
                  <input 
                    type="date" 
                    name="registrationDate" 
                    value={formData.registrationDate} 
                    onChange={handleInputChange} 
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={loading || emailValid === false}
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
            <div className="member-details">
              <div className="detail-row">
                <div className="detail-group">
                  <label>First Name:</label>
                  <span>{currentMember.firstName}</span>
                </div>
                <div className="detail-group">
                  <label>Last Name:</label>
                  <span>{currentMember.lastName}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Birth Date:</label>
                  <span>{currentMember.birthDate}</span>
                </div>
                <div className="detail-group">
                  <label>Birthplace:</label>
                  <span>{currentMember.birthplace}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Address:</label>
                  <span>{currentMember.address}</span>
                </div>
                <div className="detail-group">
                  <label>City:</label>
                  <span>{currentMember.city}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Phone Number:</label>
                  <span>{currentMember.phoneNumber}</span>
                </div>
                <div className="detail-group">
                  <label>Email:</label>
                  <span>{currentMember.email}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>National ID:</label>
                  <span>{currentMember.nationalId}</span>
                </div>
                <div className="detail-group">
                  <label>Nationality:</label>
                  <span>{currentMember.nationality}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Occupation:</label>
                  <span>{currentMember.occupation}</span>
                </div>
                <div className="detail-group">
                  <label>Bank Name:</label>
                  <span>{currentMember.bankName}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label>Account Number:</label>
                  <span>{currentMember.accountNumber}</span>
                </div>
                <div className="detail-group">
                  <label>Registration Date:</label>
                  <span>{currentMember.registrationDate}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (canEdit) {
                      setIsEditing(true);
                    } else {
                      showAccessDenied('edit');
                    }
                  }}
                >
                  Edit Member
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    if (canDelete) {
                      handleDelete();
                    } else {
                      showAccessDenied('delete');
                    }
                  }}
                >
                  Delete Member
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
        </div>
      </div>
    </div>
  );
};

export default MemberDetail;
