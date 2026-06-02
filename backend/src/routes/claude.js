const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../auth');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Issue #11: Rate limiting op Claude API proxy — voorkomt onverwachte API-kosten door misbruik
const claudeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 uur
  max: 100,                  // max 100 Claude-calls per uur per gebruiker
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip, // per gebruiker na auth, anders per IP
  message: { error: 'API limiet bereikt. Probeer over een uur opnieuw.' },
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Claude rate limit bereikt voor userId=${req.userId} IP=${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

router.post('/', requireAuth, claudeLimiter, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-ant-...')) {
    return res.status(503).json({ error: 'API key niet geconfigureerd op server. Voeg ANTHROPIC_API_KEY toe aan .env' });
  }

  const { model, max_tokens, messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array ontbreekt' });
  }

  const body = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 1000,
    messages
  };
  if (system) body.system = system;

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(upstream.status).json({ error: txt.slice(0, 300) });
    }

    const data = await upstream.json();
    res.json(data);
  } catch (e) {
    console.error('Claude proxy error:', e.message);
    res.status(500).json({ error: 'Kan Anthropic niet bereiken: ' + e.message });
  }
});

module.exports = router;
