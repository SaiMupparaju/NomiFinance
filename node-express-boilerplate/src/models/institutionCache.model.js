// models/institutionCache.model.js

const mongoose = require('mongoose');

const institutionCacheSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, unique: true },
  institutionData: { type: mongoose.Schema.Types.Mixed },
  cacheTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InstitutionCache', institutionCacheSchema);