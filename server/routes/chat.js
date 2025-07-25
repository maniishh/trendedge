const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
router.post('/ai', auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const OPENAI_API_KEY = 'openApikey';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are TrendEdge AI, a helpful assistant for stock traders.' },
          { role: 'user', content: message }
        ],
        max_tokens: 150
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API error:', err);  
      return res.status(500).json({ error: 'OpenAI error', details: err });
    }
    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
