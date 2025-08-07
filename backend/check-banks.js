const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/kasmoni.db');

db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="banks"', (err, rows) => {
  if (err) {
    console.error('Error checking banks table:', err);
  } else {
    console.log('Banks table exists:', rows.length > 0);
    if (rows.length > 0) {
      console.log('Banks table found');
    } else {
      console.log('Banks table not found');
    }
  }
  db.close();
}); 