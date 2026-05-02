require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });

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

// Upload .txt file from UI → stores in S3 → triggers Lambda pipeline
app.post('/api/upload-prompt', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.file.originalname.endsWith('.txt')) {
      return res.status(400).json({ error: 'Only .txt files are allowed' });
    }

    const key = `prompts/${Date.now()}-${req.file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: 'text/plain',
    }));

    res.json({ message: 'File uploaded successfully', key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Poll for Lambda result: returns content of response file from S3, 404 if not ready yet
app.get('/api/result', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    const data = await s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }));

    const text = await data.Body.transformToString();
    res.json({ result: text });
  } catch (err) {
    if (err.name === 'NoSuchKey') return res.status(404).json({ error: 'Not ready yet' });
    res.status(500).json({ error: err.message });
  }
});

// New endpoint: accepts raw prompt text (used by Lambda for file-based processing)
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt.trim());
    const text = result.response.text();

    res.json({ response: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to generate AI response' });
  }
});

// Serve built React frontend
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
