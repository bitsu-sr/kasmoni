import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, User, Calendar, AlertTriangle, CheckCircle, XCircle, Eye, CreditCard, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../services/api';
import { formatTimestamp } from '../utils/dateUtils';

interface Message {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  requestType: 'delete_account' | 'change_info' | 'payment_notification';
  requestDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'read';
  createdAt: string;
  adminNotes?: string;
  isViewed?: boolean;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'read'>('all');
  const [openMessageId, setOpenMessageId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      if (user?.userType === 'member' && user?.memberId) {
        // For member users, fetch their own messages
        const response = await messagesApi.getByMemberId(user.memberId);
        if (response.data.success) {
          setMessages(response.data.data || []);
        }
      } else if (user?.role === 'administrator') {
        // For administrators, fetch all messages
        const response = await messagesApi.getAll();
        if (response.data.success) {
          setMessages(response.data.data || []);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (messageId: number, newStatus: 'approved' | 'rejected', notes?: string) => {
    try {
      await messagesApi.updateStatus(messageId, newStatus, notes);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: newStatus, adminNotes: notes }
          : msg
      ));
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleMessageClick = async (messageId: number) => {
    // Toggle message open/close
    if (openMessageId === messageId) {
      setOpenMessageId(null);
    } else {
      setOpenMessageId(messageId);
    }

    // Mark message as read when opened (for all users)
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.status === 'pending') {
      try {
        await messagesApi.markAsRead(messageId);
        // Update local state to reflect the status change
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        ));
        
        // Trigger a custom event to notify dashboard to refresh notifications
        window.dispatchEvent(new CustomEvent('messageRead'));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    return messages.filter(message => message.status === filter);
  };

  // Calculate message statistics
  const getMessageStats = () => {
    const total = messages.length;
    const read = messages.filter(msg => msg.status === 'read' || msg.status === 'approved' || msg.status === 'rejected').length;
    const unread = messages.filter(msg => msg.status === 'pending').length;
    

    
    return { total, read, unread };
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'delete_account':
        return <Trash2 size={16} className="text-red-500" />;
      case 'change_info':
        return <User size={16} className="text-blue-500" />;
      case 'payment_notification':
        return <CreditCard size={16} className="text-green-500" />;
      default:
        return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'delete_account':
        return 'Account Deletion Request';
      case 'change_info':
        return 'Information Change Request';
      case 'payment_notification':
        return 'Payment Notification';
      default:
        return 'Unknown Request';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle size={16} className="text-warning" />;
      case 'approved':
        return <CheckCircle size={16} className="text-success" />;
      case 'rejected':
        return <XCircle size={16} className="text-danger" />;
      case 'read':
        return <Eye size={16} className="text-info" />;
      default:
        return <AlertTriangle size={16} className="text-secondary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'read':
        return 'Read';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'read':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatTimestamp(dateString);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredMessages = getFilteredMessages();
  const isMember = user?.userType === 'member';
  const stats = getMessageStats();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <div>
              <h1 className="card-title">
                <MessageSquare className="card-title-icon" />
                {isMember ? 'My Messages' : 'Messages'}
              </h1>
              <p>{isMember ? 'Your requests and administrator responses' : 'Member requests and notifications'}</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Message Statistics */}
          <div className="message-stats" style={{
            display: 'flex',
            gap: '2rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>{stats.total}</div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Total Messages</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{stats.read}</div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Read</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.unread}</div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Unread</div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label htmlFor="statusFilter" style={{ marginRight: '0.5rem' }}>Status:</label>
                                 <select
                   id="statusFilter"
                   value={filter}
                   onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected' | 'read')}
                   className="form-control"
                   style={{ width: 'auto' }}
                 >
                   <option value="all">All Messages</option>
                   <option value="pending">Pending</option>
                   <option value="read">Read</option>
                   <option value="approved">Approved</option>
                   <option value="rejected">Rejected</option>
                 </select>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="messages-container">
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <MessageSquare size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                <p>{isMember ? 'No messages found. You haven\'t sent any requests yet.' : 'No messages found.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                 {filteredMessages.map((message) => {
                   const isOpen = openMessageId === message.id;
                   const isUnread = message.status === 'pending';
                   const dateTime = formatDateTime(message.createdAt);
                  
                  return (
                    <div key={message.id} className="message-card" style={{
                      border: '1px solid #e9ecef',
                      borderRadius: '0.5rem',
                      backgroundColor: '#fff',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      ...(isUnread && {
                        borderLeft: '4px solid #007bff',
                        backgroundColor: '#f8f9fa'
                      })
                    }}>
                      {/* Message Header (Subject) */}
                      <div 
                        className="message-header"
                        onClick={() => handleMessageClick(message.id)}
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isUnread ? '#e7f3ff' : '#fff',
                          borderBottom: isOpen ? '1px solid #e9ecef' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#d1ecf1' : '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#e7f3ff' : '#fff';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {getRequestTypeIcon(message.requestType)}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: isUnread ? 'bold' : 'normal',
                              fontSize: '1rem',
                              color: isUnread ? '#007bff' : '#212529'
                            }}>
                              {getRequestTypeLabel(message.requestType)}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: '#6c757d',
                              marginTop: '0.25rem'
                            }}>
                              {dateTime.date} at {dateTime.time}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isUnread && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: '#007bff',
                              fontWeight: '600',
                              backgroundColor: '#fff',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              <Eye size={12} />
                              New
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getStatusIcon(message.status)}
                            <span className={`badge ${getStatusClass(message.status)}`}>
                              {getStatusLabel(message.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Message Body (Expandable Content) */}
                      {isOpen && (
                        <div className="message-body" style={{
                          padding: '1rem',
                          backgroundColor: '#fff',
                          borderTop: '1px solid #e9ecef'
                        }}>
                          {/* Sender Information (for admins) */}
                          {!isMember && (
                            <div style={{ 
                              marginBottom: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '0.25rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <User size={16} />
                                <strong>From: {message.memberName}</strong>
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                                <div>Email: {message.memberEmail}</div>
                                <div>Phone: {message.memberPhone}</div>
                              </div>
                            </div>
                          )}

                          {/* Message Content */}
                          <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '1rem', 
                            borderRadius: '0.25rem',
                            marginBottom: '1rem'
                          }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                              {isMember ? 'Your Request:' : 'Request Details:'}
                            </strong>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>{message.requestDetails}</p>
                          </div>

                          {/* Administrator Response */}
                          {message.adminNotes && (
                            <div style={{ 
                              backgroundColor: '#e7f3ff', 
                              padding: '1rem', 
                              borderRadius: '0.25rem',
                              marginBottom: '1rem'
                            }}>
                              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                                Administrator Response:
                              </strong>
                              <p style={{ margin: 0, lineHeight: '1.5' }}>{message.adminNotes}</p>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                          }}>
                            <Clock size={14} />
                            Received on {dateTime.full}
                          </div>

                          {/* Admin Actions */}
                          {!isMember && message.status === 'pending' && message.requestType !== 'payment_notification' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => {
                                  const notes = prompt('Add admin notes (optional):');
                                  handleStatusChange(message.id, 'approved', notes || undefined);
                                }}
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  const notes = prompt('Add admin notes (optional):');
                                  handleStatusChange(message.id, 'rejected', notes || undefined);
                                }}
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages; 