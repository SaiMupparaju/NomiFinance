const express = require('express');
const router = express.Router();
const suggestionController = require('../../controllers/suggestion.controller');
const authMiddleware = require('../../middlewares/auth');
// const authMiddleware = require('../middlewares/auth'); // Uncomment if authentication is required

// POST /api/suggestions
router.post('/api/suggestions', suggestionController.createSuggestion);

module.exports = router;
