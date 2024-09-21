const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const factController = require('../../controllers/fact.controller');

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key']; // Expect the API key in the header
  if (apiKey && apiKey === 'Sophia') {
    console.log("correct key from sched.");
    return next(); // If the key is correct, proceed
  }
  return res.status(403).json({ message: 'Forbidden: Invalid API key' });
};

// Route to get facts for a specific user by their ID
router.get('/user/:userId/facts', factController.getUserFacts);
router.get('/user/tree', auth(), factController.getFactTree);
router.post('/fact-value', apiKeyMiddleware, async (req, res) => {
    const { userId, factString, params } = req.body;
    try {
      const factValue = await factController.getFactValue(userId, factString, params);
      res.status(200).json({ factValue });
    } catch (error) {
      console.error('Error fetching fact value:', error);
      res.status(500).json({ message: 'Failed to fetch fact value', error: error.message });
    }
  });
module.exports = router;