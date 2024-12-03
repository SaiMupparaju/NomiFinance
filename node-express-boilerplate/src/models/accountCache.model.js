const mongoose = require('mongoose');

const accountCacheSchema = new mongoose.Schema({
  accessToken: { type: String, required: true, unique: true },
  accountsData: { type: mongoose.Schema.Types.Mixed }, // Stores the accountsResponse.data exactly as is
  cacheTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AccountCache', accountCacheSchema);