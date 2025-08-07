const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function resetDenisePassword() {
  const db = new sqlite3.Database('./database/kasmoni.db');
  
  try {
    const newPassword = 'denise123';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update Denise Alemware's password
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE members 
        SET password_hash = ? 
        WHERE username = 'denise.alemware'
      `, [passwordHash], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log('Denise Alemware password reset successfully!');
    console.log('New password:', newPassword);
    
    // Verify the update
    const member = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, username, firstName, lastName, password_hash 
        FROM members 
        WHERE username = 'denise.alemware'
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('Updated member data:', member);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    db.close();
  }
}

resetDenisePassword(); 