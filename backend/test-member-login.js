const axios = require('axios');

async function testMemberLogin() {
  try {
    console.log('Testing login with test.member / 12345');
    
    // Test login with member user
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'test.member',
      password: '12345'
    });

    console.log('Login successful!');
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Token:', token);
      
      // Test the /me endpoint
      const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Me response:', meResponse.data);
      
      // Test the member slots endpoint
      const slotsResponse = await axios.get(`http://localhost:5000/api/members/${meResponse.data.data.memberId}/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Slots response:', slotsResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMemberLogin(); 