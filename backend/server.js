require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Issue #12: Validate JWT_SECRET at startup — fail fast before any routes load
const JWT_SECRET = process.env.JWT_SECRET;
const PLACEHOLDER = 'verander-dit-naar-iets-random-en-lang';
if (!JWT_SECRET || JWT_SECRET === PLACEHOLDER || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is not set, is still the placeholder value, or is shorter than 32 characters.');
  console.error('Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/sync', require('./src/routes/sync'));
app.use('/api/claude', require('./src/routes/claude'));
app.use('/api/workouts', require('./src/routes/workouts'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OPERATION YOU backend ▶ http://localhost:${PORT}`));
