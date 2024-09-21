const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    unique: true,
  },
  baseCurrency: {
    type: String,
    default: 'USD',
  },
  rate: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

const Rate = mongoose.model('Rate', rateSchema);

module.exports = Rate;