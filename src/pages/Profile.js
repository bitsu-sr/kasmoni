import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? false,
    language: user?.preferences?.language ?? 'en',
    timezone: user?.preferences?.timezone ?? 'UTC'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
      setPreferences({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? false,
        language: user.preferences?.language ?? 'en',
        timezone: user.preferences?.timezone ?? 'UTC'
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await usersApi.update(user.id, profileData);
      if (response.data && response.data.success) {
        updateUser(response.data.data);
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await usersApi.changePassword(user.id, passwordData);
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to change password');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateProfile({ preferences });
      updateUser(updatedUser);
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Preferences update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageSubmit = async () => {
    if (!profileImage) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      
      const updatedUser = await uploadProfileImage(formData);
      updateUser(updatedUser);
      setSuccess('Profile image updated successfully!');
      setProfileImage(null);
    } catch (err) {
      setError('Failed to upload profile image');
      console.error('Image upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {/* Profile Image Section */}
      <div className="profile-image-section">
        <div className="profile-image-container">
          <div className="profile-image">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" />
            ) : (
              <div className="profile-image-placeholder">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-image-actions">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="profile-image-input"
              className="hidden"
            />
            <label htmlFor="profile-image-input" className="upload-btn">
              Change Photo
            </label>
            {profileImage && (
              <button onClick={handleImageSubmit} className="save-image-btn">
                Save Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Personal Information
        </button>
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Personal Information Tab */}
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <h2>Personal Information</h2>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="save-btn">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="profile-tab">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="form-input"
                  minLength="6"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="save-btn">
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="profile-tab">
            <h2>Preferences</h2>
            <form onSubmit={handlePreferencesSubmit} className="profile-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={preferences.emailNotifications}
                    onChange={handlePreferenceChange}
                    className="checkbox-input"
                  />
                  Receive email notifications
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={preferences.smsNotifications}
                    onChange={handlePreferenceChange}
                    className="checkbox-input"
                  />
                  Receive SMS notifications
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Language</label>
                  <select
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                    className="form-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    name="timezone"
                    value={preferences.timezone}
                    onChange={handlePreferenceChange}
                    className="form-select"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="CST">Central Time</option>
                    <option value="MST">Mountain Time</option>
                    <option value="PST">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="save-btn">
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess(null)} className="close-success">×</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
