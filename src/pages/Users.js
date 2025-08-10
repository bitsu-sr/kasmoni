import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUsers, createUser, updateUser, deleteUser, updateUserRole } from '../services/api';
import '../styles/Users.css';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
    status: 'active',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError('Failed to save user');
      console.error('Save user error:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error('Delete user error:', err);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user role');
      console.error('Update role error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'member',
      status: 'active',
      phone: '',
      address: ''
    });
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'manager': return 'role-manager';
      case 'member': return 'role-member';
      default: return 'role-member';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return 'status-active';
    }
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>User Management</h1>
        <button onClick={openNewUserModal} className="add-user-btn">
          + Add New User
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? 'No users match your search criteria' 
              : 'No users found'}
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={`user-card ${user.status}`}>
              <div className="user-avatar">
                <div className="avatar-initials">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
              </div>
              
              <div className="user-info">
                <div className="user-name">
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-details">
                  <span className="username">@{user.username}</span>
                  <span className="email">{user.email}</span>
                  {user.phone && <span className="phone">{user.phone}</span>}
                </div>
                <div className="user-meta">
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                    {user.status}
                  </span>
                  <span className="last-login">
                    Last: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              
              <div className="user-actions">
                {user.id !== currentUser?.id && (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                    disabled={currentUser?.role !== 'admin'}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
                <button onClick={() => handleEdit(user)} className="edit-btn">
                  Edit
                </button>
                {user.id !== currentUser?.id && (
                  <button onClick={() => handleDelete(user.id)} className="delete-btn">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="close-modal">×</button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="form-select"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
