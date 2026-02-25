const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prompts.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL
  )
`);

module.exports = db;
