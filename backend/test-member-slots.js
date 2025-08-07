const axios = require('axios');

async function testMemberSlots() {
  try {
    console.log('Testing member slots endpoint...');
    
    // First, login as a member to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'denise.alemware',
      password: 'denise123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Login successful! Token:', token.substring(0, 20) + '...');

      // Test the member slots endpoint
      const slotsResponse = await axios.get('http://localhost:5000/api/members/15/slots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('\nMember slots response:');
      console.log(JSON.stringify(slotsResponse.data, null, 2));

      // Check if any slots show "received" status from previous months
      const currentDate = new Date();
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = currentDate.getFullYear().toString();
      const currentMonthYear = `${currentYear}-${currentMonth}`;

      console.log(`\nCurrent month: ${currentMonthYear}`);
      
      if (slotsResponse.data.success && slotsResponse.data.data) {
        const slots = slotsResponse.data.data;
        console.log(`\nFound ${slots.length} slots:`);
        
        slots.forEach((slot, index) => {
          console.log(`${index + 1}. Group: ${slot.groupName}`);
          console.log(`   Slot: ${slot.slot}`);
          console.log(`   Payment Status: ${slot.paymentStatus}`);
          console.log(`   Current Month: ${currentMonthYear}`);
          console.log(`   Is Current Month: ${slot.slot === currentMonthYear}`);
          console.log('');
        });
      }
    } else {
      console.log('Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMemberSlots(); 