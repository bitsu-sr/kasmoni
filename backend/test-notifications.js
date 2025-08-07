const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testNotifications() {
  try {
    // First, get a token by logging in as admin
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('Token obtained:', token ? 'Yes' : 'No');

    // Test pending payment requests count
    console.log('\n--- Testing Pending Payment Requests Count ---');
    try {
      const paymentRequestsResponse = await axios.get(`${API_BASE_URL}/payment-requests/pending-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Payment Requests Response:', paymentRequestsResponse.data);
    } catch (error) {
      console.error('Payment Requests Error:', error.response?.data || error.message);
    }

    // Test unread messages count
    console.log('\n--- Testing Unread Messages Count ---');
    try {
      const messagesResponse = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Messages Response:', messagesResponse.data);
    } catch (error) {
      console.error('Messages Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testNotifications(); 