// models/deleteReason.model.js

const mongoose = require('mongoose');

const deleteReasonSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    reason: { type: String, required: false },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DeleteReason = mongoose.model('DeleteReason', deleteReasonSchema);
module.exports = DeleteReason;
