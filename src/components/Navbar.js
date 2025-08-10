import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Building2, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  MoreHorizontal,
  Users as UsersIcon,
  ChevronDown,
  X,
  Menu,
  LogIn,
  LogOut,
  Activity,
  User,
  MessageSquare,
  Bell,
  Trash2,
  Archive,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch user messages for notification
  useEffect(() => {
    if (isAuthenticated && user?.userType === 'member' && user?.memberId) {
      fetchUserMessages();
    }
  }, [isAuthenticated, user, user?.memberId]);

  const fetchUserMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await messagesApi.getByMemberId(user.memberId);
      if (response.data.success) {
        setUserMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Get notification count (pending messages or responses)
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

  // Base nav items for all users
  const baseNavItems = [
    { path: '/payments', label: 'Payments', icon: CreditCard },
  ];

  // Admin nav items
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/members', label: 'Members', icon: Users },
    { path: '/groups', label: 'Groups', icon: Building2 },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/payouts', label: 'Payouts', icon: DollarSign },
    { path: '/users', label: 'Users', icon: UsersIcon },
    { path: '/user-logs', label: 'User Logs', icon: Activity },
    { path: '/payment-logs', label: 'Payment Logs', icon: FileText },
    { path: '/payment-requests', label: 'Payment Requests', icon: MessageSquare },
    { path: '/archived-payments', label: 'Archived', icon: Archive },
    { path: '/payments-trashbox', label: 'Trashbox', icon: Trash2 },
    { path: '/banks', label: 'Banks', icon: Building2 },
  ];

  // Member nav items
  const memberNavItems = [
    { path: '/member-dashboard', label: 'Dashboard', icon: Home },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/messages', label: 'Messages', icon: MessageSquare, isNotification: true },
  ];

  const getDisplayNavItems = () => {
    if (!isAuthenticated) return baseNavItems;
    
    if (user?.userType === 'admin') {
      return adminNavItems;
    } else if (user?.userType === 'member') {
      return memberNavItems;
    }
    
    return baseNavItems;
  };

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMoreDropdown = () => {
    setIsMoreDropdownOpen(!isMoreDropdownOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeMoreDropdown = () => {
    setIsMoreDropdownOpen(false);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (!user?.username) return 'User';
    return user.username.length > 20 
      ? user.username.substring(0, 20) + '...' 
      : user.username;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeMoreDropdown();
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        closeProfileDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = getDisplayNavItems();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="./logokasmonigr.png" alt="Kasmoni Logo" className="navbar-logo" />
          <span className="navbar-title">Sranan Kasmoni</span>
        </Link>

        {isAuthenticated && (
          <>
            <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
              {/* Main navigation items */}
              {navItems.slice(0, 6).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.isNotification && getNotificationCount() > 0 && (
                    <span className="notification-badge">{getNotificationCount()}</span>
                  )}
                </Link>
              ))}

              {/* More dropdown for additional items */}
              {navItems.length > 6 && (
                <div className="navbar-dropdown" ref={dropdownRef}>
                  <button
                    className={`navbar-dropdown-toggle ${isMoreDropdownOpen ? 'active' : ''}`}
                    onClick={toggleMoreDropdown}
                  >
                    <MoreHorizontal size={18} />
                    <span>More</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {isMoreDropdownOpen && (
                    <div className="navbar-dropdown-menu">
                      {navItems.slice(6).map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`navbar-dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                          onClick={closeMoreDropdown}
                        >
                          <item.icon size={16} />
                          <span>{item.label}</span>
                          {item.isNotification && getNotificationCount() > 0 && (
                            <span className="notification-badge">{getNotificationCount()}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="navbar-user" ref={profileDropdownRef}>
              <button
                className="user-profile-button"
                onClick={toggleProfileDropdown}
              >
                <div className="user-avatar">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" />
                  ) : (
                    <span className="user-initials">{getUserInitials()}</span>
                  )}
                </div>
                <span className="user-name">{getUserDisplayName()}</span>
                <ChevronDown size={16} />
              </button>

              {isProfileDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-avatar">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" />
                      ) : (
                        <span className="user-initials">{getUserInitials()}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user?.username || 'User'}</div>
                      <div className="user-email">{user?.email || ''}</div>
                      <div className="user-role">{user?.userType || 'User'}</div>
                    </div>
                  </div>
                  
                  <div className="user-dropdown-actions">
                    <Link to="/profile" className="dropdown-action" onClick={closeProfileDropdown}>
                      <User size={16} />
                      Profile
                    </Link>
                    
                    {user?.userType === 'member' && (
                      <Link to="/messages" className="dropdown-action" onClick={closeProfileDropdown}>
                        <MessageSquare size={16} />
                        Messages
                        {getNotificationCount() > 0 && (
                          <span className="notification-badge">{getNotificationCount()}</span>
                        )}
                      </Link>
                    )}
                    
                    <button onClick={handleLogout} className="dropdown-action logout">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="navbar-auth">
            <Link to="/login" className="login-btn">
              <LogIn size={18} />
              Login
            </Link>
          </div>
        )}

        <button 
          className="navbar-toggle" 
          onClick={toggleMenu}
        >
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
