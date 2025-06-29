const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ALPHA_API_KEY = process.env.ALPHA_API_KEY;
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

function calculate20DMA(prices) {
  const last20 = prices.slice(0, 20).map(p => parseFloat(p['4. close']));
  const sum = last20.reduce((a, b) => a + b, 0);
  return sum / 20;
}

// GET /api/stocks - Fetch stock data with 20-DMA and signals
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    const symbols = user?.watchlist?.length ? user.watchlist : DEFAULT_SYMBOLS;
    const result = [];

    for (const symbol of symbols) {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_API_KEY}`;
      const response = await axios.get(url);
      const data = response.data['Time Series (Daily)'];
      if (!data) continue;
      const prices = Object.values(data);

      const dma20 = calculate20DMA(prices);
      const current = parseFloat(prices[0]['4. close']);
      const percent = ((current - dma20) / dma20 * 100).toFixed(2);

      let status = 'Neutral';
      if (percent <= -2) status = 'Buy';
      else if (percent >= 5) status = 'Sell';

      result.push({ symbol, current, dma20, percent, status });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching stock data:', err.message);
    res.status(500).json({ message: 'Failed to fetch live stock data' });
  }
});

// POST /api/stocks/watchlist - Update user's watchlist
router.post('/watchlist', async (req, res) => {
  try {
    const { symbols } = req.body;
    const token = req.headers.authorization;

    console.log('Received symbols:', symbols);
    console.log('Received token:', token);

    if (!token) {
      console.log('No token');
      return res.status(401).json({ message: 'Missing token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    const updated = await User.findByIdAndUpdate(decoded.id, { watchlist: symbols });
    console.log('User updated:', updated);

    res.json({ message: 'Watchlist updated' });
  } catch (err) {
    console.error('Error updating watchlist:', err.message);
    res.status(500).json({ message: 'Failed to update watchlist' });
  }
});

module.exports = router;

