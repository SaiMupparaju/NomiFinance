// src/index.js
const app = require('./app');
const agenda = require('./agenda');

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Scheduler server running on http://localhost:${PORT}`);
});

