const mongoose = require('mongoose');

const LinkTokenSchema = new mongoose.Schema({
  linkToken: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: 1800  }  // Automatically delete after 6 hours
});

const LinkToken = mongoose.model('LinkToken', LinkTokenSchema);

module.exports = LinkToken;