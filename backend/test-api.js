const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testBankCreation() {
  const db = new sqlite3.Database('./database/kasmoni.db');
  
  try {
    // Get an admin user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE role = "administrator" LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      console.log('No admin user found');
      db.close();
      return;
    }
    
    console.log('Admin user found:', user.username);
    
    // Create a token
    const token = jwt.sign({ userId: user.id, userType: 'system' }, JWT_SECRET, { expiresIn: '24h' });
    console.log('Token created');
    
    // Test the API
    const testBank = {
      bankName: 'API Test Bank ' + Date.now(),
      shortName: 'ATB' + Date.now(),
      bankAddress: 'API Test Address'
    };
    
    console.log('Testing API with data:', testBank);
    
    const response = await axios.post('http://localhost:5000/api/banks', testBank, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response:', response.data);
    
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
  } finally {
    db.close();
  }
}

testBankCreation(); 