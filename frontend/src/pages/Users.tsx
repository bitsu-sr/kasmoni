import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, Shield, User, UserCheck, Activity, Filter, Key, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { User as UserType } from '../types';
import { useNavigate } from 'react-router-dom';

interface UsersPageProps {
  // Add any props if needed
}

const Users: React.FC<UsersPageProps> = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [filter, setFilter] = useState<'all' | 'system' | 'member'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [showPasswordNotification, setShowPasswordNotification] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showGeneratedPasswordNotification, setShowGeneratedPasswordNotification] = useState(false);
  const [generatingPasswordFor, setGeneratingPasswordFor] = useState<string>('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(25);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getUsers();
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await authApi.createUser(userData);
      if (response.data.success && response.data.data) {
        // Store the initial password for display
        setNewUserPassword(response.data.data.initialPassword);
        setShowPasswordNotification(true);
        setShowCreateModal(false);
        fetchUsers();
        
        // Scroll to top of page to show the notification
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide notification after 10 seconds
        setTimeout(() => {
          setShowPasswordNotification(false);
          setNewUserPassword('');
        }, 10000);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async (userData: any) => {
    try {
      // Handle editing based on user type
      if (selectedUser?.userType === 'member') {
        // Update member user
        if (userData.username !== selectedUser.username) {
          await authApi.updateMemberUsername(selectedUser.memberId!, userData.username);
        }
        if (userData.password) {
          await authApi.updateMemberPassword(selectedUser.memberId!, userData.password);
        }
        if (userData.role !== selectedUser.role) {
          await authApi.updateMemberRole(selectedUser.memberId!, userData.role);
        }
      } else {
        // Update system user (existing logic)
        // TODO: Add system user update endpoint
      }
      
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    const userName = userToDelete ? getUserDisplayName(userToDelete) : 'this user';
    
    if (!window.confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) return;
    
    try {
      // Handle deletion based on user type
      // TODO: Add delete endpoints
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      if (user.userType === 'member') {
        await authApi.toggleMemberUserStatus(user.memberId!);
      }
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleGeneratePassword = async (user: UserType) => {
    if (!window.confirm(`Are you sure you want to generate a new password for ${getUserDisplayName(user)}? This will invalidate their current password.`)) return;
    
    try {
      setGeneratingPasswordFor(getUserDisplayName(user));
      const response = await authApi.generateMemberPassword(user.memberId!);
      if (response.data.success && response.data.data) {
        setGeneratedPassword(response.data.data.newPassword);
        setShowGeneratedPasswordNotification(true);
        
        // Scroll to top of page to show the notification
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide notification after 10 seconds
        setTimeout(() => {
          setShowGeneratedPasswordNotification(false);
          setGeneratedPassword('');
        }, 10000);
      }
    } catch (error) {
      console.error('Error generating password:', error);
    } finally {
      setGeneratingPasswordFor('');
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;
    
    // Filter by user type
    if (filter !== 'all') {
      filtered = filtered.filter(user => user.userType === filter);
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Separate admins and non-admins
    const admins = filtered.filter(user => user.role === 'administrator');
    const nonAdmins = filtered.filter(user => user.role !== 'administrator');
    
    // Sort non-admins
    const sortedNonAdmins = nonAdmins.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = getUserDisplayName(a).toLowerCase();
          bValue = getUserDisplayName(b).toLowerCase();
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'lastLogin':
          aValue = a.last_login ? new Date(a.last_login).getTime() : 0;
          bValue = b.last_login ? new Date(b.last_login).getTime() : 0;
          break;
        default:
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Return admins first, then sorted non-admins
    return [...admins, ...sortedNonAdmins];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'super_user':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'super_user':
        return 'Super User';
      default:
        return 'Normal User';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    return userType === 'system' ? 'System User' : 'Member User';
  };

  const getUserDisplayName = (user: UserType) => {
    if (user.userType === 'member' && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  // Get filtered and sorted users
  const filteredUsers = getFilteredUsers();

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUsersPerPageChange = (newUsersPerPage: number) => {
    setUsersPerPage(newUsersPerPage);
    setCurrentPage(1); // Reset to first page when changing users per page
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body">
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <div>
              <h1 className="card-title">
                <UsersIcon className="card-title-icon" />
                User Management
              </h1>
              <p>Manage system users and member users</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/user-logs')}
              >
                <Activity size={16} />
                View User Logs
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Add User
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Password Notifications */}
          {showPasswordNotification && newUserPassword && (
            <div className="alert alert-success" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              marginBottom: '1rem'
            }}>
              <div>
                <strong>New user created successfully!</strong>
                <br />
                <span>Initial password: </span>
                <code style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  marginLeft: '0.5rem'
                }}>
                  {newUserPassword}
                </code>
                <br />
                                 <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                   ⚠️ Please provide this password to the user securely. The password will not be shown again.
                 </small>
                 {showCopySuccess && (
                   <div style={{ 
                     marginTop: '0.5rem', 
                     padding: '0.5rem', 
                     backgroundColor: '#d4edda', 
                     border: '1px solid #c3e6cb', 
                     borderRadius: '0.25rem',
                     color: '#155724',
                     fontSize: '0.875rem',
                     fontWeight: 'bold'
                   }}>
                     ✅ Password copied to clipboard!
                   </div>
                 )}
               </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    navigator.clipboard.writeText(newUserPassword);
                    setShowCopySuccess(true);
                    setTimeout(() => setShowCopySuccess(false), 2000);
                  }}
                  title="Copy password"
                  style={{
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  Copy
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setShowPasswordNotification(false);
                    setNewUserPassword('');
                  }}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {showGeneratedPasswordNotification && generatedPassword && (
            <div className="alert alert-info" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              color: '#0c5460',
              marginBottom: '1rem'
            }}>
              <div>
                <strong>New password generated successfully!</strong>
                <br />
                <span>New password for {generatingPasswordFor}: </span>
                <code style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  marginLeft: '0.5rem'
                }}>
                  {generatedPassword}
                </code>
                <br />
                                 <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                   ⚠️ Please provide this new password to the user securely. Their old password is no longer valid.
                 </small>
                 {showCopySuccess && (
                   <div style={{ 
                     marginTop: '0.5rem', 
                     padding: '0.5rem', 
                     backgroundColor: '#d1ecf1', 
                     border: '1px solid #bee5eb', 
                     borderRadius: '0.25rem',
                     color: '#0c5460',
                     fontSize: '0.875rem',
                     fontWeight: 'bold'
                   }}>
                     ✅ Password copied to clipboard!
                   </div>
                 )}
               </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    setShowCopySuccess(true);
                    setTimeout(() => setShowCopySuccess(false), 2000);
                  }}
                  title="Copy password"
                  style={{
                    backgroundColor: '#17a2b8',
                    borderColor: '#17a2b8',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  Copy
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setShowGeneratedPasswordNotification(false);
                    setGeneratedPassword('');
                  }}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="filter-controls" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label htmlFor="userTypeFilter" style={{ marginRight: '0.5rem' }}>User Type:</label>
                <select
                  id="userTypeFilter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'system' | 'member')}
                  className="form-control"
                  style={{ width: 'auto' }}
                >
                  <option value="all">All Users</option>
                  <option value="system">System Users</option>
                  <option value="member">Member Users</option>
                </select>
              </div>
              <div>
                <label htmlFor="roleFilter" style={{ marginRight: '0.5rem' }}>Role:</label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto' }}
                >
                  <option value="all">All Roles</option>
                  <option value="administrator">Administrator</option>
                  <option value="super_user">Super User</option>
                  <option value="normal_user">Normal User</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User Type</th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                  >
                    <div className="header-content">
                      Name
                      <span className="sort-icon">{getSortIcon('name')}</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('username')}
                  >
                    <div className="header-content">
                      Username
                      <span className="sort-icon">{getSortIcon('username')}</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('email')}
                  >
                    <div className="header-content">
                      Email
                      <span className="sort-icon">{getSortIcon('email')}</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('role')}
                  >
                    <div className="header-content">
                      Role
                      <span className="sort-icon">{getSortIcon('role')}</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('status')}
                  >
                    <div className="header-content">
                      Status
                      <span className="sort-icon">{getSortIcon('status')}</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="header-content">
                      Last Login
                      <span className="sort-icon">{getSortIcon('lastLogin')}</span>
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={`${user.userType}-${user.id}`}>
                    <td>
                      <span className={`badge ${user.userType === 'system' ? 'badge-primary' : 'badge-secondary'}`}>
                        {getUserTypeLabel(user.userType || 'system')}
                      </span>
                    </td>
                    <td>{getUserDisplayName(user)}</td>
                    <td>{user.username}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getRoleIcon(user.role)}
                        {getRoleLabel(user.role)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                                         <td>
                       {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                     </td>
                     <td>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button
                           className="btn btn-sm btn-primary"
                           onClick={() => {
                             setSelectedUser(user);
                             setShowEditModal(true);
                           }}
                           title="Edit User"
                           style={{ 
                             padding: '0.5rem', 
                             minWidth: '2rem',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}
                         >
                           <Edit size={16} />
                         </button>
                                                   <button
                            className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleUserStatus(user)}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                            style={{ 
                              padding: '0.5rem', 
                              minWidth: '2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {user.is_active ? (
                              <UserCheck size={16} />
                            ) : (
                              <User size={16} />
                            )}
                          </button>
                          {user.userType === 'member' && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleGeneratePassword(user)}
                              title="Generate New Password"
                              disabled={generatingPasswordFor === getUserDisplayName(user)}
                              style={{ 
                                padding: '0.5rem', 
                                minWidth: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Key size={16} />
                            </button>
                          )}
                          {currentUser?.role === 'administrator' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                              style={{ 
                                padding: '0.5rem', 
                                minWidth: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No users found matching the current filters.</p>
            </div>
          )}

          {/* Users per page selector */}
          <div className="pagination-controls" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div className="users-per-page">
              <label htmlFor="usersPerPage" style={{ marginRight: '0.5rem' }}>Users per page:</label>
              <select
                id="usersPerPage"
                className="form-control"
                value={usersPerPage}
                onChange={(e) => handleUsersPerPageChange(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers} users
                </span>
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-outline-secondary"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        className={`btn ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="btn btn-outline-secondary"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
        />
      )}
    </div>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'normal_user' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create New User</h3>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="form-control"
              >
                <option value="normal_user">Normal User</option>
                <option value="super_user">Super User</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email || '',
    password: '',
    role: user.role
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit User</h3>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="form-control"
              >
                <option value="normal_user">Normal User</option>
                <option value="super_user">Super User</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users; 