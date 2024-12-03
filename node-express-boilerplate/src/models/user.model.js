const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const schedulerApi = require('../utils/schedulerApi');

const BankAccount = require('./bankAccount.model');
const UserAccountSummary = require('./userAccountSummary.model');
const Transaction = require('./transactions.model');
const Rule = require('./Rule');
const LinkToken = require('./linkToken.model');



//module.exports = mongoose.model('BankAccount', BankAccountSchema);

const userSchema = mongoose.Schema({
  name: {
      type: String,
      required: true,
      trim: true
  },
  email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
          if (!validator.isEmail(value)) {
              throw new Error('Invalid email');
          }
      },
  },
  password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
          if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
              throw new Error('Password must contain at least one letter and one number');
          }
      },
      private: true // used by the toJSON plugin
  },
  role: {
      type: String,
      enum: roles,
      default: 'user'
  },
  isEmailVerified: {
      type: Boolean,
      default: false
  },
  unverifiedEmail: {
    type: String,
    trim: true,
    validate(value) {
      if (value && !validator.isEmail(value)) {
        throw new Error('Invalid email');
      }
    },
  },
  bankAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' }],
  plaidAccessTokens: {  // Storing general access token
      type: [String],
      required: false  // Make this optional as not every user might connect to Plaid immediately
  },
  plaidUserToken: String,
  // **Stripe-related fields**
  stripeCustomerId: {
    type: String,
    default: null,
  },
  subscriptionId: {
    type: String,
    default: null,
  },
  subscriptionStatus: {
    type: String,
    default: null,
  },
  subscriptionPlan: {
    type: String,
    default: null,
  },
  subscriptionProductId: {
    type: String,
    default: null,
  },
  subscriptionPriceId: {
    type: String,
    default: null,
  },
  subscriptionCurrentPeriodEnd: { type: Date },
  subscriptionCanceledAt: { type: Date },
  lastPaymentStatus: { type: String },
  lastPaymentDate: { type: Date },  
  lastPaymentFailureDate: { type: Date }
  
}, {
  timestamps: true
});

userSchema.pre('findOneAndDelete', async function (next) {
  const userId = this.getQuery()._id;

  try {
    // Delete BankAccounts
    await BankAccount.deleteMany({ userId });

    // Delete UserAccountSummary
    await UserAccountSummary.deleteOne({ userId });

    // Delete Transactions
    await Transaction.deleteMany({ userId });

    // Fetch Rules where the user is either the creator or subscriber
    const rules = await Rule.find({
      $or: [{ creatorId: userId }, { subscriberId: userId }],
    });

    // Collect promises for cancelling jobs
    const cancelJobPromises = rules.map(async (rule) => {
      if (rule.jobId) {
        try {
          await schedulerApi.cancelJob(rule.jobId);
        } catch (error) {
          console.error(`Error canceling job for rule ${rule._id}:`, error);
          // Optionally handle the error
        }
      }
    });

    // Cancel all jobs concurrently
    await Promise.all(cancelJobPromises);

    // Delete the rules after canceling jobs
    await Rule.deleteMany({
      $or: [{ creatorId: userId }, { subscriberId: userId }],
    });

    // Delete LinkTokens
    await LinkToken.deleteMany({ userId });

    next();
  } catch (error) {
    next(error);
  }
});

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
