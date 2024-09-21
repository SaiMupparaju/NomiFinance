const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  accountId: { type: String, required: true, unique: true }, // Plaid account ID as the primary key
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  mask: { type: String, required: true },
  subtype: { type: String, required: true },
  type: { type: String, required: true },
  balances: {
    available: { type: Number, default: null },
    current: { type: Number, default: null },
    limit: { type: Number, default: null },
    iso_currency_code: { type: String, default: null },
  },
  accessToken: { type: String, required: true }, // Plaid access token
  userToken: { type: String, required: true }, // User token associated with the account
  transactions: { type: Array, default: [] }, // Store transaction data
}, { timestamps: true });

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

module.exports = BankAccount;
