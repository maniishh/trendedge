const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const ALPHA_API_KEY = process.env.ALPHA_API_KEY;
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

function calculate20DMA(prices) {
  const last20 = prices.slice(0, 20).map(p => parseFloat(p['4. close']));
  const sum = last20.reduce((a, b) => a + b, 0);
  return sum / 20;
}

 
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
 
router.post('/watchlist', auth, async (req, res) => {
  try {
    let { symbols } = req.body;
   
    if (!Array.isArray(symbols)) symbols = [];
    symbols = symbols.map(s => String(s).trim().toUpperCase()).filter(Boolean);
    symbols = Array.from(new Set(symbols));
    if (symbols.length === 0) {
      return res.status(400).json({ message: 'Watchlist cannot be empty.' });
    }
    
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { watchlist: symbols },
      { new: true, runValidators: true }
    );
    console.log('Updated user:', updated);
    // Fetch user again to confirm
    const user = await User.findById(req.user.id);
    res.json({ message: 'Watchlist updated', watchlist: user.watchlist, user });
  } catch (err) {
    console.error('Error updating watchlist:', err.message);
    res.status(500).json({ message: 'Failed to update watchlist' });
  }
});


router.get('/market', async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    jwt.verify(token, process.env.JWT_SECRET);  
    const symbolsParam = req.query.symbols;
    if (!symbolsParam) return res.status(400).json({ message: 'Missing symbols parameter' });
    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
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
    console.error('Error fetching market stocks:', err.message);
    res.status(500).json({ message: 'Failed to fetch market stocks' });
  }
});

module.exports = router;



