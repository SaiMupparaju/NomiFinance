// stripe.routes.js

const express = require('express');
const router = express.Router();
const stripeController = require('../../controllers/stripe.controller');
const authMiddleware = require('../../middlewares/auth'); // Your authentication middleware


// Route to create a checkout session
router.post('/create-checkout-session', authMiddleware, stripeController.createCheckoutSession);

// Route to cancel subscription
router.post('/cancel-subscription', authMiddleware, stripeController.cancelSubscription);

// Route to create billing portal session
router.post('/create-billing-portal-session', authMiddleware, stripeController.createBillingPortalSession);


module.exports = router;
