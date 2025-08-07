const axios = require('axios');

async function testPaymentNotification() {
  try {
    console.log('Testing payment notification functionality...');
    
    // First, login as an administrator to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Admin login successful! Token:', token.substring(0, 20) + '...');

      // Create a test payment
      console.log('\nCreating a test payment...');
      const paymentData = {
        groupId: 3, // Groep 02
        memberId: 15, // Denise Alemware
        amount: 500.00,
        paymentDate: '2025-01-15',
        paymentMonth: '2025-01',
        slot: '2025-10', // New slot for Denise in group 3
        paymentType: 'bank_transfer',
        senderBank: 'Test Bank',
        receiverBank: 'Kasmoni Bank',
        status: 'received',
        proofOfPayment: 'test_proof.pdf'
      };

      const createPaymentResponse = await axios.post('http://localhost:5000/api/payments', paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Payment creation response:', JSON.stringify(createPaymentResponse.data, null, 2));

      // Check if a notification message was created
      console.log('\nChecking for payment notification messages...');
      const messagesResponse = await axios.get('http://localhost:5000/api/messages/member/15', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Messages for member 15:', JSON.stringify(messagesResponse.data, null, 2));

      // Look for payment notification messages
      const paymentNotifications = messagesResponse.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`\nFound ${paymentNotifications.length} payment notification(s)`);
      
      if (paymentNotifications.length > 0) {
        console.log('Latest payment notification:');
        console.log(JSON.stringify(paymentNotifications[0], null, 2));
      }

      // Test bulk payment creation
      console.log('\nTesting bulk payment creation...');
      const bulkPaymentData = {
        groupId: 2, // Groep 01
        paymentMonth: '2025-01',
        payments: [
          {
            memberId: 15,
            amount: 600.00,
            paymentDate: '2025-01-16',
            slot: '2025-10', // New slot for Denise in group 3
            paymentType: 'cash',
            status: 'received'
          }
        ]
      };

      const bulkPaymentResponse = await axios.post('http://localhost:5000/api/payments/bulk', bulkPaymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Bulk payment creation response:', JSON.stringify(bulkPaymentResponse.data, null, 2));

      // Check messages again
      const updatedMessagesResponse = await axios.get('http://localhost:5000/api/messages/member/15', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const updatedPaymentNotifications = updatedMessagesResponse.data.data.filter(msg => 
        msg.requestType === 'payment_notification'
      );

      console.log(`\nAfter bulk payment: Found ${updatedPaymentNotifications.length} payment notification(s)`);

    } else {
      console.log('Admin login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPaymentNotification(); 