import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { membersApi } from '../services/api.js';
import { formatCurrency, formatDate, formatPhoneNumber, getDisplayName, isValidEmail } from '../utils/validation.js';
import Pagination from '../components/Pagination.js';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthplace: '',
    address: '',
    city: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    nationality: '',
    occupation: '',
    bankName: '',
    accountNumber: '',
    registrationDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // If user is a member, only fetch their own data
      if (user?.userType === 'member' && user?.memberId) {
        const response = await membersApi.getById(user.memberId);
        if (response.data.success && response.data.data) {
          const member = response.data.data;
          setMembers([member]);
          setFilteredMembers([member]);
        }
      } else {
        // Fetch all members for admin users
        const response = await membersApi.getAll({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        });
        
        if (response.data.success) {
          const membersData = response.data.data || [];
          setMembers(membersData);
          setFilteredMembers(membersData);
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (!term) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => 
        member.firstName?.toLowerCase().includes(term.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(term.toLowerCase()) ||
        member.email?.toLowerCase().includes(term.toLowerCase()) ||
        member.phoneNumber?.includes(term) ||
        member.nationalId?.includes(term)
      );
      setFilteredMembers(filtered);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    let sorted = [...filteredMembers];
    
    if (newSortBy === 'alphabetical') {
      sorted.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (newSortBy === 'status') {
      sorted.sort((a, b) => {
        const statusA = a.paymentStatus || 'Not Paid';
        const statusB = b.paymentStatus || 'Not Paid';
        return statusA.localeCompare(statusB);
      });
    }
    
    setFilteredMembers(sorted);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.nationalId) {
      return 'Please fill in all required fields';
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await membersApi.create(formData);
      
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          firstName: '',
          lastName: '',
          birthDate: '',
          birthplace: '',
          address: '',
          city: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          nationality: '',
          occupation: '',
          bankName: '',
          accountNumber: '',
          registrationDate: new Date().toISOString().split('T')[0],
        });
        fetchMembers();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to add member');
      }
    } catch (err) {
      setError('Failed to add member');
      console.error('Error adding member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await membersApi.update(editingMember.id, formData);
      
      if (response.data.success) {
        setEditingMember(null);
        setShowForm(false);
        setFormData({
          firstName: '',
          lastName: '',
          birthDate: '',
          birthplace: '',
          address: '',
          city: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          nationality: '',
          occupation: '',
          bankName: '',
          accountNumber: '',
          registrationDate: new Date().toISOString().split('T')[0],
        });
        fetchMembers();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update member');
      }
    } catch (err) {
      setError('Failed to update member');
      console.error('Error updating member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await membersApi.delete(id);
      
      if (response.data.success) {
        fetchMembers();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to delete member');
      }
    } catch (err) {
      setError('Failed to delete member');
      console.error('Error deleting member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      birthDate: member.birthDate || '',
      birthplace: member.birthplace || '',
      address: member.address || '',
      city: member.city || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
      nationalId: member.nationalId || '',
      nationality: member.nationality || '',
      occupation: member.occupation || '',
      bankName: member.bankName || '',
      accountNumber: member.accountNumber || '',
      registrationDate: member.registrationDate || new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Not Paid':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="members">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="members">
      <div className="members-header">
        <h1>Members</h1>
        {(user?.role === 'administrator' || user?.role === 'super_user') && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingMember(null);
              setFormData({
                firstName: '',
                lastName: '',
                birthDate: '',
                birthplace: '',
                address: '',
                city: '',
                phoneNumber: '',
                email: '',
                nationalId: '',
                nationality: '',
                occupation: '',
                bankName: '',
                accountNumber: '',
                registrationDate: new Date().toISOString().split('T')[0],
              });
              setShowForm(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Add Member
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="members-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fas fa-search"></i>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
            <option value="alphabetical">Alphabetical</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-sm">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="members-table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>National ID</th>
              <th>Bank</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="member-name">
                    <span className="member-avatar">
                      {getDisplayName(member.firstName, member.lastName).charAt(0)}
                    </span>
                    <span>{getDisplayName(member.firstName, member.lastName)}</span>
                  </div>
                </td>
                <td>{formatPhoneNumber(member.phoneNumber)}</td>
                <td>{member.email || '-'}</td>
                <td>{member.nationalId}</td>
                <td>{member.bankName || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(member.paymentStatus)}`}>
                    {member.paymentStatus || 'Not Paid'}
                  </span>
                </td>
                <td>{formatDate(member.registrationDate)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => setSelectedMember(member)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {(user?.role === 'administrator' || user?.role === 'super_user') && (
                      <>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditClick(member)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMember(member.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredMembers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredMembers.length / itemsPerPage)}
          totalItems={filteredMembers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Add/Edit Member Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingMember ? handleEditMember : handleAddMember} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nationalId">National ID *</label>
                  <input
                    type="text"
                    id="nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="birthDate">Birth Date</label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="birthplace">Birth Place</label>
                  <input
                    type="text"
                    id="birthplace"
                    name="birthplace"
                    value={formData.birthplace}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nationality">Nationality</label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bankName">Bank Name</label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="accountNumber">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingMember ? 'Update Member' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Member Details</h2>
              <button onClick={() => setSelectedMember(null)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="member-details">
                <div className="detail-row">
                  <strong>Name:</strong> {getDisplayName(selectedMember.firstName, selectedMember.lastName)}
                </div>
                <div className="detail-row">
                  <strong>Phone:</strong> {formatPhoneNumber(selectedMember.phoneNumber)}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedMember.email || '-'}
                </div>
                <div className="detail-row">
                  <strong>National ID:</strong> {selectedMember.nationalId}
                </div>
                <div className="detail-row">
                  <strong>Birth Date:</strong> {selectedMember.birthDate ? formatDate(selectedMember.birthDate) : '-'}
                </div>
                <div className="detail-row">
                  <strong>Birth Place:</strong> {selectedMember.birthplace || '-'}
                </div>
                <div className="detail-row">
                  <strong>Nationality:</strong> {selectedMember.nationality || '-'}
                </div>
                <div className="detail-row">
                  <strong>Address:</strong> {selectedMember.address || '-'}
                </div>
                <div className="detail-row">
                  <strong>City:</strong> {selectedMember.city || '-'}
                </div>
                <div className="detail-row">
                  <strong>Occupation:</strong> {selectedMember.occupation || '-'}
                </div>
                <div className="detail-row">
                  <strong>Bank Name:</strong> {selectedMember.bankName || '-'}
                </div>
                <div className="detail-row">
                  <strong>Account Number:</strong> {selectedMember.accountNumber || '-'}
                </div>
                <div className="detail-row">
                  <strong>Registration Date:</strong> {formatDate(selectedMember.registrationDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
