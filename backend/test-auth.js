const axios = require('axios');

async function testAuth() {
  try {
    console.log('Logging in as Denise Alemware...');
    
    // Login as Denise Alemware
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'denise.alemware',
      password: 'denise123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Login successful! Token:', token.substring(0, 20) + '...');

      // Test /me endpoint
      console.log('\nTesting /me endpoint...');
      const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('User data from /me:', JSON.stringify(meResponse.data, null, 2));
    } else {
      console.log('Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth(); 