// models/plaidErrorLog.model.js
const mongoose = require('mongoose');

const plaidErrorLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accessToken: { type: String, required: true },
  errorCode: { type: String, required: true },
  errorMessage: { type: String, required: true },
  lastNotified: { type: Date, default: null },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('PlaidErrorLog', plaidErrorLogSchema);
