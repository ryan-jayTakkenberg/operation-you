const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/workouts — all workouts for user
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC'
  ).all(req.userId);
  res.json(rows);
});

// GET /api/workouts/:date — workouts for specific date
router.get('/:date', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM workouts WHERE user_id = ? AND date = ? ORDER BY id DESC'
  ).all(req.userId, req.params.date);
  res.json(rows);
});

// POST /api/workouts — log a workout
router.post('/', requireAuth, (req, res) => {
  const { date, type, intensity, duration_min, notes } = req.body;
  if (!date || !type) return res.status(400).json({ error: 'date en type zijn verplicht' });

  const result = db.prepare(
    'INSERT INTO workouts (user_id, date, type, intensity, duration_min, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, date, type, intensity || null, duration_min || null, notes || null);

  const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(workout);
});

// PUT /api/workouts/:id — update a workout
router.put('/:id', requireAuth, (req, res) => {
  const { type, intensity, duration_min, notes } = req.body;
  const existing = db.prepare('SELECT * FROM workouts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Workout niet gevonden' });

  db.prepare(
    'UPDATE workouts SET type = ?, intensity = ?, duration_min = ?, notes = ? WHERE id = ? AND user_id = ?'
  ).run(type ?? existing.type, intensity ?? existing.intensity, duration_min ?? existing.duration_min, notes ?? existing.notes, req.params.id, req.userId);

  const updated = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/workouts/:id
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Workout niet gevonden' });
  res.json({ ok: true });
});

module.exports = router;
