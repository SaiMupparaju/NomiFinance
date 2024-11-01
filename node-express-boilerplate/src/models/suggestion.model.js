const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  suggestion: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  // Optionally include user information if the user is logged in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

module.exports = Suggestion;
