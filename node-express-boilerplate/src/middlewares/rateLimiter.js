const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 30 * 60 * 10000,
  max: 20,
  skipSuccessfulRequests: true,
});

module.exports = {
  authLimiter,
};
