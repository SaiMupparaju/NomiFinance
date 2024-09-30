const mongoose = require('mongoose');

const UserAccountSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: { type: Object, required: true }, // Store the object that maps bank names to their accounts
  numberOfBankAccounts: { type: Number, required: true }, // Track the number of bank accounts
  lastUpdated: { type: Date, default: Date.now } // Timestamp for when the summary was last updated
});

const UserAccountSummary = mongoose.model('UserAccountSummary', UserAccountSummarySchema);

module.exports = UserAccountSummary;
