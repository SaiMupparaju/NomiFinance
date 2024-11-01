// models/transaction.model.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  accountId: { type: String, required: true }, // Plaid account ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: String, required: true, unique: true }, // Plaid transaction ID
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  name: { type: String },
  category: { type: [String] },
  pending: { type: Boolean },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

TransactionSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
