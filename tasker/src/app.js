// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const scheduleRoutes = require('./routes/scheduleRoutes');
const agenda = require('./agenda');
const cors = require('cors');

const app = express();


const corsOptions = {
    origin: 'http://localhost:3001', // OTHER PLACES HARDCODE THIS
    methods: 'GET,POST,PUT,DELETE', // Allow specific HTTP methods
  };
  
app.use(cors(corsOptions));

app.use(bodyParser.json());



// Use the scheduling routes
app.use('/', scheduleRoutes);

agenda.start().then(() => {
  console.log('Agenda started!');
});


module.exports = app;