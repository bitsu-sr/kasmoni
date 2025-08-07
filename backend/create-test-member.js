const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function createTestMember() {
  const db = new sqlite3.Database('./database/kasmoni.db');
  
  try {
    // Create a test member
    const testMember = {
      firstName: 'Test',
      lastName: 'Member',
      birthDate: '1990-01-01',
      birthplace: 'Test City',
      address: 'Test Address',
      city: 'Test City',
      phoneNumber: '1234567890',
      email: 'test@example.com',
      nationalId: 'TEST123456',
      nationality: 'Test',
      occupation: 'Tester',
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      username: 'test.member',
      password: '12345' // Simple 5-digit password
    };
    
    // Hash the password
    const passwordHash = await bcrypt.hash(testMember.password, 10);
    
    // Insert the member
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO members (
          firstName, lastName, birthDate, birthplace, address, city,
          phoneNumber, email, nationalId, nationality, occupation,
          bankName, accountNumber, username, password_hash, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testMember.firstName, testMember.lastName, testMember.birthDate,
        testMember.birthplace, testMember.address, testMember.city,
        testMember.phoneNumber, testMember.email, testMember.nationalId,
        testMember.nationality, testMember.occupation, testMember.bankName,
        testMember.accountNumber, testMember.username, passwordHash,
        'normal_user', 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    console.log('Test member created with ID:', result);
    console.log('Username:', testMember.username);
    console.log('Password:', testMember.password);
    
    // Add the member to a group
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO group_members (groupId, memberId, receiveMonth)
        VALUES (?, ?, ?)
      `, [2, result, '2025-02'], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Test member added to group 2 with receive month 2025-02');
    
  } catch (error) {
    console.error('Error creating test member:', error);
  } finally {
    db.close();
  }
}

createTestMember(); 