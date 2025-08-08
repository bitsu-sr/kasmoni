import React, { useState, useEffect } from 'react';
import { User, Camera, Save, ArrowLeft, Trash2, AlertTriangle, MessageSquare, CheckCircle, XCircle, Clock, Calendar, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { messagesApi, authApi } from '../services/api';

interface Message {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  requestType: 'delete_account' | 'change_info' | 'payment_notification';
  requestDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminNotes?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangeInfoConfirm, setShowChangeInfoConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.userType === 'member' && user?.memberId) {
      fetchUserMessages();
    }
  }, [user]);

  const fetchUserMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await messagesApi.getByMemberId(user!.memberId!);
      if (response.data.success) {
        setUserMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getNotificationCount = () => {
    if (!userMessages.length) return 0;
    
    // Count messages that are either pending, have admin notes (responses), or are payment notifications AND are unviewed
    return userMessages.filter(message => {
      const isUnviewed = localStorage.getItem(`message_${message.id}_viewed`) !== 'true';
      const hasNotification = message.status === 'pending' || 
        (message.adminNotes && (message.status === 'approved' || message.status === 'rejected')) ||
        message.requestType === 'payment_notification';
      
      return isUnviewed && hasNotification;
    }).length;
  };

  const handleSave = () => {
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (requestType: 'delete_account' | 'change_info', details: string) => {
    try {
      await messagesApi.create({
        requestType,
        requestDetails: details
      });
      
      alert('Your request has been sent to the administrators. You will be notified once it is reviewed.');
      // Refresh messages after sending
      fetchUserMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    if (user?.userType === 'member') {
      setShowDeleteConfirm(true);
    } else {
      // For system users, allow direct deletion
      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        // TODO: Implement account deletion
        alert('Account deletion functionality will be implemented.');
      }
    }
  };

  const handleChangeInfo = () => {
    if (user?.userType === 'member') {
      setShowChangeInfoConfirm(true);
    } else {
      // For system users, allow direct changes
      setIsEditing(true);
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError('');
      
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(response.data.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>You must be logged in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const notificationCount = getNotificationCount();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-between align-center">
            <div>
              <h1 className="card-title">
                <User size={32} />
                Profile
              </h1>
              <p>Manage your account settings and preferences</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-2">
            {/* Profile Picture Section */}
            <div className="card">
              <div className="card-header">
                <h3>Profile Picture</h3>
              </div>
              <div className="text-center py-4">
                <div className="profile-avatar-large">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="profile-avatar-img"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User size={48} />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-3">
                    <label className="btn btn-outline-primary">
                      <Camera size={16} />
                      Change Picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePictureChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-between align-center">
                  <h3>Profile Information</h3>
                  <div className="d-flex gap-2">
                    {user.userType === 'member' && (
                      <button 
                        className="btn btn-info"
                        onClick={() => navigate(`/members/${user.memberId}`)}
                      >
                        <User size={16} />
                        Member Details
                      </button>
                    )}
                    <button 
                      className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                      onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    >
                      {isEditing ? (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      ) : (
                        'Edit Profile'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="profile-info">
                <div className="profile-field">
                  <label>Username</label>
                  <div className="profile-value">{user.username}</div>
                </div>
                
                {user.email && (
                  <div className="profile-field">
                    <label>Email</label>
                    <div className="profile-value">{user.email}</div>
                  </div>
                )}
                
                {user.userType === 'member' && (
                  <>
                    {user.firstName && (
                      <div className="profile-field">
                        <label>First Name</label>
                        <div className="profile-value">{user.firstName}</div>
                      </div>
                    )}
                    
                    {user.lastName && (
                      <div className="profile-field">
                        <label>Last Name</label>
                        <div className="profile-value">{user.lastName}</div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="profile-field">
                  <label>Role</label>
                  <div className="profile-value">
                    <span className={`badge badge-${user.role === 'administrator' ? 'danger' : user.role === 'super_user' ? 'warning' : 'info'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                
                {user.userType && (
                  <div className="profile-field">
                    <label>User Type</label>
                    <div className="profile-value">
                      <span className={`badge badge-${user.userType === 'member' ? 'success' : 'primary'}`}>
                        {user.userType}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Notification Section - Only for member users */}
        {user.userType === 'member' && notificationCount > 0 && (
          <div className="mt-4">
            <div className="card">
              <div className="card-header">
                <h3>
                  <MessageSquare size={24} />
                  Message Notifications
                </h3>
              </div>
              <div className="card-body">
                <div style={{ 
                  backgroundColor: '#e7f3ff', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #bee5eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MessageSquare size={20} className="text-blue-500" />
                    <strong>You have {notificationCount} message{notificationCount > 1 ? 's' : ''} requiring attention</strong>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: '#0c5460' }}>
                    You have pending requests or administrator responses. Click the button below to view your messages.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/messages')}
                    style={{ marginTop: '0.5rem' }}
                  >
                    <ExternalLink size={16} />
                    View Messages
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings Section */}
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <h3>Account Settings</h3>
            </div>
            <div className="grid grid-2 gap-3">
              <button className="btn btn-primary" onClick={handleChangePassword}>
                <Lock size={16} />
                Change Password
              </button>
              <button className="btn btn-primary" onClick={handleChangeInfo}>
                <User size={16} />
                Change Information
              </button>
              <button className="btn btn-secondary">
                <Camera size={16} />
                Update Profile Picture
              </button>
              <button className="btn btn-outline-danger" onClick={handleDeleteAccount}>
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
                Delete Account Request
              </h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <p>
                As a member, you cannot directly delete your account. Your request will be sent to the administrators for review.
              </p>
              <div className="form-group">
                <label>Reason for deletion:</label>
                <textarea
                  id="deleteReason"
                  className="form-control"
                  rows={3}
                  placeholder="Please provide a reason for deleting your account..."
                  defaultValue=""
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const reason = (document.getElementById('deleteReason') as HTMLTextAreaElement)?.value || 'No reason provided';
                  sendMessage('delete_account', reason);
                  setShowDeleteConfirm(false);
                }} 
                className="btn btn-danger"
              >
                <Trash2 size={16} />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Information Confirmation Modal */}
      {showChangeInfoConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
                Change Information Request
              </h3>
              <button onClick={() => setShowChangeInfoConfirm(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <p>
                As a member, you cannot directly change your information. Your request will be sent to the administrators for review.
              </p>
              <div className="form-group">
                <label>What information would you like to change?</label>
                <textarea
                  id="changeInfoDetails"
                  className="form-control"
                  rows={3}
                  placeholder="Please describe what information you would like to change..."
                  defaultValue=""
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => setShowChangeInfoConfirm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const details = (document.getElementById('changeInfoDetails') as HTMLTextAreaElement)?.value || 'No details provided';
                  sendMessage('change_info', details);
                  setShowChangeInfoConfirm(false);
                }} 
                className="btn btn-primary"
              >
                <User size={16} />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Lock size={20} style={{ marginRight: '0.5rem' }} />
                Change Password
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      id="currentPassword"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      required
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('current')}
                      disabled={changingPassword}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="newPassword"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      required
                      disabled={changingPassword}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('new')}
                      disabled={changingPassword}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <small className="form-text text-muted">Password must be at least 6 characters long</small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirmPassword"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      required
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('confirm')}
                      disabled={changingPassword}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="alert alert-danger">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="alert alert-success">
                    {passwordSuccess}
                  </div>
                )}

                <div className="modal-footer">
                  <button 
                    type="button" 
                    onClick={() => setShowChangePasswordModal(false)} 
                    className="btn btn-secondary"
                    disabled={changingPassword}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <div className="spinner-small"></div>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 