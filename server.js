import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// In-memory key stores
const keys = {};
const tempLinks = {};

// Serve your styled homepage (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Generate key (used on pretty landing page)
app.get('/api/generate-key', (req, res) => {
  const key = crypto.randomBytes(8).toString('hex');
  keys[key] = false;
  res.json({ key });
});

// API: Validate key (used by Discord bot)
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

// Generate temporary URL (for monetized EXE.io link)
app.get('/generate-temp-url', (req, res) => {
  const id = crypto.randomBytes(4).toString('hex');
  const keyPageUrl = `/key-${id}`;
  tempLinks[keyPageUrl] = { createdAt: Date.now(), used: false };

  // Auto-redirect to the temporary key page
  res.redirect(keyPageUrl);
});

// Serve the temporary one-time-use key page
app.get('/key-:id', (req, res) => {
  const id = req.params.id;
  const page = `/key-${id}`;
  const pageData = tempLinks[page];

  if (
    !pageData ||
    pageData.used ||
    Date.now() - pageData.createdAt > 10 * 60 * 1000
  ) {
    return res.send('<h2 style="color: white; background: black; padding: 2rem;">This key page has expired or was already used.</h2>');
  }

  pageData.used = true;
  const key = crypto.randomBytes(8).toString('hex');
  keys[key] = false;

  res.send(`
    <html>
      <head>
        <title>Your Access Key</title>
        <style>
          body { background: #111; color: #0ff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
          #key { font-size: 2rem; padding: 1rem; border: 2px solid #0ff; border-radius: 8px; margin-top: 1rem; }
          button { margin-top: 1rem; padding: 0.5rem 1rem; font-size: 1rem; background: transparent; color: #0ff; border: 2px solid #0ff; cursor: pointer; border-radius: 5px; }
          button:hover { background: #0ff; color: #111; }
        </style>
      </head>
      <body>
        <h1>Your One-Time Key</h1>
        <div id="key">${key}</div>
        <button onclick="copyKey()">Copy Key</button>
        <script>
          function copyKey() {
            const keyText = document.getElementById('key').textContent;
            navigator.clipboard.writeText(keyText).then(() => alert('Copied!'));
          }
        </script>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Key API running on port ${PORT}`));
