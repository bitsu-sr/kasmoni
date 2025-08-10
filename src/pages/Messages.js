import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { messagesApi } from '../services/api';
import '../styles/Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesApi.getAll();
      if (response.data && response.data.success) {
        setConversations(response.data.data);
      } else {
        setConversations([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch conversations');
      console.error('Conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await messagesApi.getByMemberId(conversationId);
      if (response.data && response.data.success) {
        setMessages(response.data.data);
      } else {
        setMessages([]);
      }
      // Mark messages as read
      await messagesApi.markAsRead(conversationId);
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Messages error:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
        senderId: user.id
      };

      await messagesApi.create(messageData);
      setNewMessage('');
      // Refresh messages
      fetchMessages(selectedConversation.id);
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const filteredConversations = conversations.filter(conversation => {
    const participantNames = conversation.participants
      .filter(p => p.id !== user.id)
      .map(p => `${p.firstName} ${p.lastName}`)
      .join(' ');
    
    return participantNames.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <div className="messages-search">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="messages-content">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="no-conversations">
                {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map(conversation => {
                const otherParticipants = conversation.participants.filter(p => p.id !== user.id);
                const participantNames = otherParticipants.map(p => `${p.firstName} ${p.lastName}`).join(', ');
                const lastMessage = conversation.lastMessage;
                const unreadCount = getUnreadCount(conversation);
                const isSelected = selectedConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="conversation-avatar">
                      <div className="avatar-initials">
                        {otherParticipants[0]?.firstName?.charAt(0)}{otherParticipants[0]?.lastName?.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <div className="participant-names">{participantNames}</div>
                        {lastMessage && (
                          <div className="last-message-time">
                            {formatTime(lastMessage.timestamp)}
                          </div>
                        )}
                      </div>
                      
                      {lastMessage && (
                        <div className="last-message">
                          <span className="last-message-sender">
                            {lastMessage.senderId === user.id ? 'You: ' : ''}
                          </span>
                          {lastMessage.content}
                        </div>
                      )}
                    </div>
                    
                    {unreadCount > 0 && (
                      <div className="unread-badge">{unreadCount}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="conversation-header">
                <div className="conversation-title">
                  {selectedConversation.participants
                    .filter(p => p.id !== user.id)
                    .map(p => `${p.firstName} ${p.lastName}`)
                    .join(', ')}
                </div>
                <div className="conversation-actions">
                  <button className="action-btn">📞</button>
                  <button className="action-btn">📹</button>
                  <button className="action-btn">ℹ️</button>
                </div>
              </div>

              {/* Messages List */}
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(message => {
                    const isOwnMessage = message.senderId === user.id;
                    const sender = selectedConversation.participants.find(p => p.id === message.senderId);
                    
                    return (
                      <div
                        key={message.id}
                        className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}
                      >
                        {!isOwnMessage && (
                          <div className="message-avatar">
                            <div className="avatar-initials">
                              {sender?.firstName?.charAt(0)}{sender?.lastName?.charAt(0)}
                            </div>
                          </div>
                        )}
                        
                        <div className="message-content">
                          <div className="message-bubble">
                            {message.content}
                          </div>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwnMessage && (
                              <span className="message-status">
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                  />
                  <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    📤
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default Messages;
