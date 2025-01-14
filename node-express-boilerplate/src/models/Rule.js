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
  },
  color: {
    type: String,
    default: '#ffffff' // Default color (white)
  },
  lastUpdated: {
    type: Date,
    default: Date.now // Automatically set to the current date
  },
  lastExecuted: {
    type: Date,
    default: null
  },
    // New applet-specific fields
    isApplet: {
      type: Boolean,
      default: false
    },
    appletId: {
      type: String,
      required: function() {
        return this.isApplet;
      }
    },
    appletInputs: {
      type: Object,
      required: function() {
        return this.isApplet;
      },
      validate: {
        validator: function(inputs) {
          return this.isApplet ? Object.keys(inputs).length > 0 : true;
        },
        message: 'Applet inputs are required when isApplet is true'
      }
    }
});

ruleSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});


  

const Rule = mongoose.model('Rule', ruleSchema);
module.exports = Rule;