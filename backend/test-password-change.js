const axios = require('axios');

async function testPasswordChange() {
  try {
    console.log('Testing password change functionality...');
    
    // First, login as Denise Alemware to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'denise.alemware',
      password: 'denise123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Login successful! Token:', token.substring(0, 20) + '...');

      // Test the password change endpoint
      console.log('\nTesting password change...');
      const changePasswordResponse = await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword: 'denise123',
        newPassword: 'newpassword123'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Password change response:', JSON.stringify(changePasswordResponse.data, null, 2));

      // Test login with new password
      console.log('\nTesting login with new password...');
      const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'denise.alemware',
        password: 'newpassword123'
      });

      console.log('New login response:', JSON.stringify(newLoginResponse.data, null, 2));

      // Change password back to original
      console.log('\nChanging password back to original...');
      const revertResponse = await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword: 'newpassword123',
        newPassword: 'denise123'
      }, {
        headers: {
          'Authorization': `Bearer ${newLoginResponse.data.data.token}`
        }
      });

      console.log('Revert password response:', JSON.stringify(revertResponse.data, null, 2));

    } else {
      console.log('Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPasswordChange(); 