// utils/subscriptionCleanup.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function cleanupUserSubscription(user) {
  if (!user.subscriptionId || !user.stripeCustomerId) {
    return;
  }

  try {
    // Cancel the subscription immediately
    await stripe.subscriptions.cancel(user.subscriptionId, {
      invoice_now: true,
      prorate: true
    });

    // Optionally delete the customer
    await stripe.customers.del(user.stripeCustomerId);
  } catch (error) {
    console.error('Error cleaning up subscription:', error);
    throw error;
  }
}

module.exports = { cleanupUserSubscription };