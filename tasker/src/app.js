// src/app.js
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/scheduleRoutes');
const agenda = require('./agenda');
const cors = require('cors');
const morgan = require('morgan'); // Add morgan for request logging

const app = express();

// Middleware for logging all inbound requests using morgan
app.use(morgan('combined')); // Use 'combined' for detailed logs

// Custom middleware to log additional details of incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: Method = ${req.method}, URL = ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Middleware to authenticate requests
const authenticateRequest = (req, res, next) => {
  const token = req.headers['authorization']; // Get the token from the header
  const expectedToken = process.env.TASKER_API_KEY; // Get the expected token from the environment variable
  console.log('Authenticating request');

  if (token && token === `Bearer ${expectedToken}`) {
    console.log('Token valid');
    return next();
  }
  console.log('Invalid token');
  return res.status(401).json({ message: 'Unauthorized' });
};

// Apply the authentication middleware to all routes
app.use(authenticateRequest);

app.use(cors());
app.use(bodyParser.json());

// Use the scheduling routes
app.use('/', scheduleRoutes);

agenda.start().then(() => {
  console.log('Agenda started!');
});

module.exports = app;
