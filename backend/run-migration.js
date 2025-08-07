const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database/kasmoni.db');

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file>');
  process.exit(1);
}

const MIGRATION_PATH = path.join(__dirname, 'database', migrationFile);

console.log(`Running migration: ${migrationFile}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to database');
  
  // Read and execute migration
  fs.readFile(MIGRATION_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading migration file:', err.message);
      process.exit(1);
    }
    
    db.exec(data, (err) => {
      if (err) {
        console.error('Error running migration:', err.message);
        process.exit(1);
      } else {
        console.log('Migration completed successfully');
        db.close();
      }
    });
  });
});