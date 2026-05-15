const router = require('express').Router();
const { requireAuth } = require('../auth');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

router.post('/', requireAuth, async (req, res) => {
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
