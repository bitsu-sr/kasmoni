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

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  isNotification?: boolean;
}

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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
  const baseNavItems: NavItem[] = [
    { path: '/payments', label: 'Payments', icon: CreditCard },
  ];

  // Admin and super user nav items
  const adminNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Main Dashboard', icon: Home },
    { path: '/groups', label: 'Groups', icon: UsersIcon },
    ...baseNavItems,
    { path: '/payment-requests', label: 'Payment Requests', icon: Bell }
  ];

  // Member nav items
  const memberNavItems: NavItem[] = user?.userType === 'member' 
    ? [
        { path: '/member-dashboard', label: 'My Dashboard', icon: Home },
        ...baseNavItems
      ]
    : baseNavItems;

  // Determine which nav items to display based on user role
  const getDisplayNavItems = (): NavItem[] => {
    if (!isAuthenticated || !user) return baseNavItems;
    
    if (user.userType === 'member') {
      return memberNavItems;
    }
    
    // For system users, check if they're admin or super_user
    if (user.role === 'administrator' || user.role === 'super_user') {
      return adminNavItems;
    }
    
    // For normal users, only show base items
    return baseNavItems;
  };

  const displayNavItems = getDisplayNavItems();

  // Base more nav items
  const baseMoreNavItems: NavItem[] = [
    { path: '/payouts', label: 'Payouts', icon: DollarSign },
    { path: '/members', label: 'Members', icon: Users },
    { path: '/banks', label: 'Banks', icon: Building2 },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/messages', label: 'Messages', icon: MessageSquare, isNotification: true },
  ];

  // Add My Messages for member users
  const memberMoreNavItems: NavItem[] = user?.userType === 'member' 
    ? [
        ...baseMoreNavItems
      ]
    : baseMoreNavItems;

  // Add User Management and User Logs only for administrators
  const moreNavItems: NavItem[] = isAuthenticated && user && (user.role === 'administrator' || user.role === 'super_user')
    ? [
        ...baseMoreNavItems.slice(0, 2), // Payouts, Members
        ...baseMoreNavItems.slice(2), // Banks, Analytics
        { path: '/payments/trashbox', label: 'Payments Trashbox', icon: Trash2 },
        { path: '/payments/archive', label: 'Archived Payments', icon: Archive },
        { path: '/payment-logs', label: 'Payment Logs', icon: FileText },
        { path: '/users', label: 'User Management', icon: Users },
        ...(user.role === 'administrator' ? [{ path: '/user-logs', label: 'User Logs', icon: Activity }] : [])
      ]
    : user?.userType === 'member' 
      ? memberMoreNavItems
      : baseMoreNavItems;

  const isActive = (path: string) => location.pathname === path;

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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    if (user.userType === 'member' && user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.userType === 'member' && user.firstName) {
      return user.firstName;
    }
    return user.username;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isMoreDropdownOpen || isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreDropdownOpen, isProfileDropdownOpen]);

  const notificationCount = getNotificationCount();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/" className="navbar-logo">
              <img src="/logokasmonigr.png" alt="Kasmoni Logo" className="navbar-logo-img" />
              <span>Sranan Kasmoni</span>
            </Link>
          </div>
          
          <div className="navbar-nav">
            {displayNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="navbar-dropdown" ref={profileDropdownRef}>
                <button 
                  className={`navbar-link dropdown-toggle ${isProfileDropdownOpen ? 'active' : ''}`}
                  onClick={toggleProfileDropdown}
                >
                  <div className="navbar-avatar">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="navbar-avatar-img"
                      />
                    ) : (
                      <div className="navbar-avatar-placeholder">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <span className="navbar-profile-text">{getUserDisplayName()}</span>
                  <ChevronDown size={16} className={`dropdown-arrow ${isProfileDropdownOpen ? 'rotated' : ''}`} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={closeProfileDropdown}
                    >
                      <User size={16} />
                      <span>{getUserDisplayName()}'s Profile</span>
                      {notificationCount > 0 && (
                        <span className="notification-badge">{notificationCount}</span>
                      )}
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        closeProfileDropdown();
                        handleLogout();
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', width: '100%', textAlign: 'left' }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="navbar-link"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            )}
            
            <div className="navbar-dropdown" ref={dropdownRef}>
              <button 
                className={`navbar-link dropdown-toggle ${isMoreDropdownOpen ? 'active' : ''}`}
                onClick={toggleMoreDropdown}
              >
                <span>More</span>
                {notificationCount > 0 && (
                  <span className="notification-badge-small">{notificationCount}</span>
                )}
                <ChevronDown size={16} className={`dropdown-arrow ${isMoreDropdownOpen ? 'rotated' : ''}`} />
              </button>
              
              {isMoreDropdownOpen && (
                <div className="dropdown-menu">
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={closeMoreDropdown}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                        {item.isNotification && notificationCount > 0 && (
                          <span className="notification-badge">{notificationCount}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button className="navbar-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`navbar-mobile ${isMenuOpen ? 'open' : ''}`}>
          <div className="navbar-mobile-content">
            {displayNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-mobile-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile Profile/Login */}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="navbar-mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  <span>{getUserDisplayName()}'s Profile</span>
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </Link>
                <button
                  className="navbar-mobile-link"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', width: '100%', textAlign: 'left' }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="navbar-mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
            )}
            
            <div className="mobile-dropdown">
              <div className="mobile-dropdown-header">
                <span>More</span>
                <ChevronDown size={16} />
              </div>
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`navbar-mobile-link mobile-dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {item.isNotification && notificationCount > 0 && (
                      <span className="notification-badge">{notificationCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 