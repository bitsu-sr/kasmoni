// Test the notification count logic
const userMessages = [
  {
    id: 4,
    memberId: 15,
    memberName: "Denise Alemware",
    memberEmail: "1000012@bitsu.com",
    memberPhone: "8800012",
    requestType: "payment_notification",
    requestDetails: "Test payment notification message",
    status: "pending",
    adminNotes: null,
    createdAt: "2025-08-05 00:11:08",
    updatedAt: "2025-08-05 00:11:08"
  },
  {
    id: 7,
    memberId: 15,
    memberName: "Denise Alemware",
    memberEmail: "1000012@bitsu.com",
    memberPhone: "8800012",
    requestType: "payment_notification",
    requestDetails: "Test payment notification for badge testing",
    status: "pending",
    adminNotes: null,
    createdAt: "2025-08-05 00:35:09",
    updatedAt: "2025-08-05 00:35:09"
  }
];

// Simulate localStorage for Node.js
const mockLocalStorage = {};

// Simulate the getNotificationCount function
const getNotificationCount = () => {
  if (!userMessages.length) return 0;
  
  // Count messages that are either pending, have admin notes (responses), or are payment notifications AND are unviewed
  return userMessages.filter(message => {
    const isUnviewed = mockLocalStorage[`message_${message.id}_viewed`] !== 'true';
    const hasNotification = message.status === 'pending' || 
      (message.adminNotes && (message.status === 'approved' || message.status === 'rejected')) ||
      message.requestType === 'payment_notification';
    
    return isUnviewed && hasNotification;
  }).length;
};

// Test the logic
console.log('User messages:', userMessages);
console.log('Notification count:', getNotificationCount());

// Test with one message marked as viewed
mockLocalStorage['message_4_viewed'] = 'true';
console.log('Notification count after marking message 4 as viewed:', getNotificationCount());

// Test with all messages marked as viewed
mockLocalStorage['message_7_viewed'] = 'true';
console.log('Notification count after marking all messages as viewed:', getNotificationCount());

// Clean up
delete mockLocalStorage['message_4_viewed'];
delete mockLocalStorage['message_7_viewed'];
console.log('Notification count after cleanup:', getNotificationCount()); 