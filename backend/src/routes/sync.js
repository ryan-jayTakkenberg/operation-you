const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// Ensure user_states table exists (runs once at startup)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_states (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// GET /api/sync — pull full state for authenticated user
router.get('/', requireAuth, (req, res) => {
  const row = db.prepare('SELECT state FROM user_states WHERE user_id = ?').get(req.userId);
  if (!row) return res.json(null);
  try {
    res.json(JSON.parse(row.state));
  } catch {
    res.json(null);
  }
});

// POST /api/sync — push full state (upsert)
router.post('/', requireAuth, (req, res) => {
  const state = req.body;
  if (!state || typeof state !== 'object') return res.status(400).json({ error: 'Ongeldige state' });

  const json = JSON.stringify(state);
  db.prepare(`
    INSERT INTO user_states (user_id, state, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
  `).run(req.userId, json);

  res.json({ ok: true });
});

module.exports = router;
