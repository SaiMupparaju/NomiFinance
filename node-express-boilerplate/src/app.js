const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { fetchAndStoreRates } = require('./services/exchangeRateService');



const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}


// set security HTTP headers
app.use(helmet());

app.use(
  '/v1/payment/webhook',
  express.raw({ type: 'application/json' }), // This ensures req.body is a raw Buffer
  require('../src/routes/v1/stripeWebhook.route')
);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);
app.use('/webhook/plaid', require('./routes/v1/plaid.route'));



const initializeExchangeRates = async () => {
  try {
    console.log(`plaid webhook: ${process.env.PLAID_WEBHOOK}`);
    console.log('Fetching and storing exchange rates...');
    await fetchAndStoreRates(); // Fetch rates on startup
    setInterval(fetchAndStoreRates, 86400000); // Repeat every 24 hours
  } catch (error) {
    console.error('Error initializing exchange rates:', error);
  }
};
initializeExchangeRates();

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
