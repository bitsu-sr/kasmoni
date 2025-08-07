const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database', 'kasmoni.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking for pending payment requests and unread messages...\n');

// Check pending payment requests
db.get(`
  SELECT COUNT(*) as count
  FROM payment_requests
  WHERE status = 'pending_approval'
`, (err, result) => {
  if (err) {
    console.error('Error checking payment requests:', err);
  } else {
    console.log(`Pending payment requests: ${result.count}`);
  }
});

// Check unread messages
db.get(`
  SELECT COUNT(*) as count
  FROM messages
  WHERE status = 'pending'
`, (err, result) => {
  if (err) {
    console.error('Error checking messages:', err);
  } else {
    console.log(`Unread messages: ${result.count}`);
  }
  
  // Close the database connection
  db.close();
}); 