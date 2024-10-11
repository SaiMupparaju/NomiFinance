// src/routes/v1/stripeWebhook.route.js

const express = require('express');
const router = express.Router();
const stripeController = require('../../controllers/stripe.controller');

router.post('/', stripeController.handleWebhook);

module.exports = router;
