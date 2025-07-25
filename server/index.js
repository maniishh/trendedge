require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

console.log("🔍 MONGO_URI from env:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI);
 
// Mount API routes
app.use('/api', authRoutes);
app.use('/api/stocks', stockRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
