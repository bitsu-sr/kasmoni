const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  try {
    console.log('Testing notification endpoints...\n');
    
    // Test login first
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.data.token;
      
      // Test pending payment requests count
      console.log('\n2. Testing pending payment requests count...');
      try {
        const paymentRequestsResponse = await axios.get(`${API_BASE_URL}/payment-requests/pending-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Payment requests response:', paymentRequestsResponse.data);
      } catch (error) {
        console.log('❌ Payment requests error:', error.response?.data || error.message);
      }
      
      // Test unread messages count
      console.log('\n3. Testing unread messages count...');
      try {
        const messagesResponse = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Messages response:', messagesResponse.data);
      } catch (error) {
        console.log('❌ Messages error:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEndpoints(); 