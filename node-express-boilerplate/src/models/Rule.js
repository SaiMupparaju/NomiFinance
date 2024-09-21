const mongoose = require('mongoose');


const ruleSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  rule: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,  // This will store the ID of the job in Agenda
    default: null
  }
});
  

const Rule = mongoose.model('Rule', ruleSchema);
module.exports = Rule;