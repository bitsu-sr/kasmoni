const axios = require('axios');

async function testMessageCreation() {
  try {
    console.log('Testing message creation functionality...');
    
    // First, login as an administrator to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Admin login successful! Token:', token.substring(0, 20) + '...');

      // Check existing messages for member 1 (Giorgio Felix)
      console.log('\nChecking existing messages for member 1...');
      const messagesResponse = await axios.get('http://localhost:5000/api/messages/member/1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Messages for member 1:', JSON.stringify(messagesResponse.data, null, 2));

      // Look for payment notification messages
      const paymentNotifications = messagesResponse.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`\nFound ${paymentNotifications.length} payment notification(s) for member 1`);
      
      if (paymentNotifications.length > 0) {
        console.log('Latest payment notification:');
        console.log(JSON.stringify(paymentNotifications[0], null, 2));
      }

      // Check messages for member 15 (Denise Alemware)
      console.log('\nChecking existing messages for member 15...');
      const messagesResponse2 = await axios.get('http://localhost:5000/api/messages/member/15', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const paymentNotifications2 = messagesResponse2.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`Found ${paymentNotifications2.length} payment notification(s) for member 15`);
      
      if (paymentNotifications2.length > 0) {
        console.log('Latest payment notification for Denise:');
        console.log(JSON.stringify(paymentNotifications2[0], null, 2));
      }

      // Test creating a message manually
      console.log('\nTesting manual message creation...');
      const messageData = {
        requestType: 'payment_notification',
        requestDetails: 'Test payment notification message'
      };

      // Login as a member to create a message
      const memberLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'denise.alemware',
        password: 'denise123'
      });

      if (memberLoginResponse.data.success) {
        const memberToken = memberLoginResponse.data.data.token;
        
        const createMessageResponse = await axios.post('http://localhost:5000/api/messages', messageData, {
          headers: {
            'Authorization': `Bearer ${memberToken}`
          }
        });

        console.log('Manual message creation response:', JSON.stringify(createMessageResponse.data, null, 2));
      }

    } else {
      console.log('Admin login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMessageCreation(); 