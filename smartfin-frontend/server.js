const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Port 80 to serve the app publicly

// Serve static files from the "build" directory
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler to serve index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
