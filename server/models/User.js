const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w.-]+@([\w-]+\.)+[\w]{2,4}$/

  },
  password: {
    type: String,
    required: true
  },
  watchlist: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
//