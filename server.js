import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const keys = {}; // In-memory store

// Generate key
app.get('/api/generate-key', (req, res) => {
  const key = crypto.randomBytes(8).toString('hex');
  keys[key] = false; // false = not used
  res.json({ key });
});

// Validate key
app.post('/api/validate-key', (req, res) => {
  const { key } = req.body;

  if (!keys.hasOwnProperty(key)) {
    return res.status(400).json({ success: false, message: 'Key not found.' });
  }

  if (keys[key]) {
    return res.status(400).json({ success: false, message: 'Key already used.' });
  }

  keys[key] = true;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Key API running on port ${PORT}`));
