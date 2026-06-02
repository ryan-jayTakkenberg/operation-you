const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');

// Issue #10: Rate limiting op login/register — beschermt tegen brute-force aanvallen
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 10,                   // max 10 pogingen per IP per venster
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel pogingen. Probeer over 15 minuten opnieuw.' },
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Auth rate limit bereikt voor IP ${req.ip} op ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

router.post('/register', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  if (password.length < 8) return res.status(400).json({ error: 'Wachtwoord moet minstens 8 tekens zijn' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email.toLowerCase().trim(), hash);
    const token = signToken(result.lastInsertRowid);
    res.json({ token, userId: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email is al in gebruik' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Email of wachtwoord klopt niet' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email of wachtwoord klopt niet' });

  db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(user.id);
  const token = signToken(user.id);
  res.json({ token, userId: user.id });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, created_at, last_seen FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
  res.json(user);
});

module.exports = router;
