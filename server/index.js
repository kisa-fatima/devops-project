require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

app.use(cors());
app.use(express.json());

app.get('/api/prompts', (req, res) => {
  try {
    const prompts = db.prepare('SELECT id, prompt FROM prompts ORDER BY id').all();
    res.json(prompts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.post('/api/prompts/run/:id', async (req, res) => {
  try {
    const promptId = req.params.id;
    if (promptId == null || promptId === '') {
      return res.status(400).json({ error: 'Missing prompt id in URL' });
    }

    const row = db.prepare('SELECT id, prompt FROM prompts WHERE id = ?').get(promptId);
    if (!row) return res.status(404).json({ error: 'Prompt not found' });

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });
    const result = await model.generateContent(row.prompt);
    const response = result.response;
    const text = response.text();

    res.json({ promptId: row.id, response: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to run prompt with Gemini' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
