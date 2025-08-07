const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// First, let's check existing banks
const db = new sqlite3.Database('./database/kasmoni.db');

console.log('Checking existing banks...');
db.all('SELECT * FROM banks', (err, rows) => {
  if (err) {
    console.error('Error checking banks:', err);
  } else {
    console.log('Existing banks:', rows);
  }
  
  // Now let's test creating a bank
  console.log('\nTesting bank creation...');
  
  // First, let's get an admin user
  db.get('SELECT * FROM users WHERE role = "administrator" LIMIT 1', (err, user) => {
    if (err) {
      console.error('Error getting admin user:', err);
      db.close();
      return;
    }
    
    if (!user) {
      console.log('No admin user found');
      db.close();
      return;
    }
    
    console.log('Admin user found:', user.username);
    
    // Create a token for this user
    const token = jwt.sign({ userId: user.id, userType: 'system' }, JWT_SECRET, { expiresIn: '24h' });
    console.log('Token created:', token.substring(0, 20) + '...');
    
    // Test inserting a bank directly
    const testBank = {
      bankName: 'Test Bank ' + Date.now(),
      shortName: 'TB' + Date.now(),
      bankAddress: 'Test Address'
    };
    
    console.log('Attempting to insert test bank:', testBank);
    
    db.run('INSERT INTO banks (bankName, shortName, bankAddress, createdAt, updatedAt) VALUES (?, ?, ?, datetime("now"), datetime("now"))', 
      [testBank.bankName, testBank.shortName, testBank.bankAddress], 
      function(err) {
        if (err) {
          console.error('Error inserting bank:', err);
        } else {
          console.log('Bank inserted successfully with ID:', this.lastID);
        }
        db.close();
      }
    );
  });
}); 