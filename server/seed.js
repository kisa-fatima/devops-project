const db = require('./db');

// Add your prompts here; run: node seed.js
const prompts = [
  "In less than 15 lines, give me a 10-minute arm workout using only bodyweight.",
  "In less than 15 lines, create a 5-minute intense ab routine with no equipment.",
  "In less than 15 lines, suggest a 15-minute leg strengthening workout for beginners.",
  "In less than 15 lines, provide a 10-minute back stretch and strengthening routine.",
  "In less than 15 lines, give a 20-minute full-body workout for overall fitness.",
  "In less than 15 lines, suggest a 10-minute high-intensity cardio session for fat burning.",
  "In less than 15 lines, create a 10-minute shoulder workout that can be done at home with no equipment.",
  "In less than 15 lines, suggest a 15-minute yoga flow for relaxation and core strength.",
  "In less than 15 lines, provide a 15-minute full-body stretching routine to improve flexibility."
];

db.prepare('DELETE FROM prompts').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name='prompts'").run();
const insert = db.prepare('INSERT INTO prompts (prompt) VALUES (?)');
for (const p of prompts) {
  insert.run(p);
}
console.log('Seeded', prompts.length, 'prompts.');

db.close();
