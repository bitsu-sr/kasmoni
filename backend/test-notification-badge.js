const axios = require('axios');

async function testNotificationBadge() {
  try {
    console.log('Testing notification badge functionality...');
    
    // First, login as Denise Alemware to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'denise.alemware',
      password: 'denise123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Denise login successful! Token:', token.substring(0, 20) + '...');

      // Check existing messages for Denise
      console.log('\nChecking existing messages for Denise...');
      const messagesResponse = await axios.get('http://localhost:5000/api/messages/member/15', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Messages for Denise:', JSON.stringify(messagesResponse.data, null, 2));

      // Look for payment notification messages
      const paymentNotifications = messagesResponse.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`\nFound ${paymentNotifications.length} payment notification(s) for Denise`);
      
      if (paymentNotifications.length > 0) {
        console.log('Latest payment notification:');
        console.log(JSON.stringify(paymentNotifications[0], null, 2));
        
        // Check if this message is marked as viewed in localStorage
        console.log('\nChecking localStorage for message viewed status...');
        console.log('Message ID:', paymentNotifications[0].id);
        console.log('localStorage key would be: message_' + paymentNotifications[0].id + '_viewed');
      }

      // Create a new payment notification to test
      console.log('\nCreating a new payment notification...');
      const messageData = {
        requestType: 'payment_notification',
        requestDetails: 'Test payment notification for badge testing'
      };

      const createMessageResponse = await axios.post('http://localhost:5000/api/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('New message creation response:', JSON.stringify(createMessageResponse.data, null, 2));

      // Check messages again
      const updatedMessagesResponse = await axios.get('http://localhost:5000/api/messages/member/15', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const updatedPaymentNotifications = updatedMessagesResponse.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`\nAfter creating new message: Found ${updatedPaymentNotifications.length} payment notification(s)`);
      
      if (updatedPaymentNotifications.length > 0) {
        console.log('All payment notifications:');
        updatedPaymentNotifications.forEach((msg, index) => {
          console.log(`${index + 1}. ID: ${msg.id}, Status: ${msg.status}, Created: ${msg.createdAt}`);
        });
      }

    } else {
      console.log('Denise login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testNotificationBadge(); 