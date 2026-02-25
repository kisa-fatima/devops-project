const db = require('./db');

const rows = db.prepare('SELECT * FROM prompts').all();
console.log(rows);
db.close();
