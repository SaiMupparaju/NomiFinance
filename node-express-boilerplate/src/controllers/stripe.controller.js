// stripe.controller.js

const stripe = require('stripe')("sk_test_51Q74V1FbGvhl0lO0PbkqbJBfGB1Csj9X0UHaU55S9ddUpjp8zMwUS7L9OTuzBerYOKR2ZNSvbMzZ6ASYPRCzI3lU00y2OvSp4z");
const User = require('../models/user.model'); // Adjust the path as needed

const frontendUrlBase = "http://localhost:3000/"

function mapLookupKeyToPlan(lookupKey) {
  switch (lookupKey) {
    case 'single_monthly':
    case 'single_yearly':
      return 'Nomi Single';
    case 'standard_monthly':
    case 'standard_yearly':
      return 'Nomi Standard';
    case 'premium_monthly':
    case 'premium_yearly':
      return 'Nomi Premium';
    default:
      return 'Unknown Plan';
  }
}

function mapProductIdToPlan(productId) {
  switch (productId) {
    case "prod_R0auXMo4nOGFkM":
      return 'Nomi Single'
    case "prod_R22J6iyXBxcFLX":
      return 'Nomi Standard'
    case "prod_R0b23M9NcTgjfF":
      return 'Nomi Premium'
  }
}

// Create a checkout session for a subscription
exports.createCheckoutSession = async (req, res) => {
  const { priceId } = req.body; // The ID of the Stripe Price (related to your product)
  const user = req.user; // Assuming you have user information from authentication middleware

  try {
    // Create a new customer in Stripe if not already stored
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${frontendUrlBase}/payment/success?session_id={CHECKOUT_SESSION_ID}`, //FIX ME
      cancel_url: `${frontendUrlBase}/payment/cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
};

async function handleSubscriptionEvent(subscription) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Extract subscription items
      const subscriptionItem = subscription.items.data[0];
      const priceId = subscriptionItem.price.id;
      const productId = subscriptionItem.price.product;
      const lookupKey = subscriptionItem.price.lookup_key;

      // Map lookupKey to your subscription plan names
      const subscriptionPlan = mapProductIdToPlan(productId);

      // Update user subscription details
      user.subscriptionStatus = status;
      user.subscriptionId = subscriptionId;
      user.subscriptionPriceId = priceId;
      user.subscriptionProductId = productId;
      user.subscriptionPlan = subscriptionPlan;

      await user.save();
      console.log(`Subscription updated for user: ${user.email}, Plan: ${subscriptionPlan}`);
    } else {
      console.error('User not found for customer ID:', customerId);
    }
  } catch (error) {
    console.error('Error handling subscription event:', error);
  }
}

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = "whsec_3548ac5a67033494b94c36d4273f70c410582ebf84f4fa3bb698e2f5a0fad87e";
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object;
      await handleCheckoutSession(checkoutSession);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionEvent(subscription);
      break;

    case 'invoice.payment_succeeded':
      const invoiceSucceeded = event.data.object;
      await handleInvoicePaymentSucceeded(invoiceSucceeded);
      break;

    case 'invoice.payment_failed':
      const invoiceFailed = event.data.object;
      await handleInvoicePaymentFailed(invoiceFailed);
      break;

    // ... handle other events as needed

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Retrieve the subscription object
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Extract subscription items
      const subscriptionItem = subscription.items.data[0];
      const priceId = subscriptionItem.price.id;
      const productId = subscriptionItem.price.product;
      const lookupKey = subscriptionItem.price.lookup_key;

      // Map lookupKey to your subscription plan names
      const subscriptionPlan = mapProductIdToPlan(productId);

      // Update user subscription details
      user.subscriptionStatus = subscription.status;
      user.subscriptionId = subscriptionId;
      user.subscriptionPriceId = priceId;
      user.subscriptionProductId = productId;
      user.subscriptionPlan = subscriptionPlan;

      await user.save();
      console.log(`Invoice payment succeeded for user: ${user.email}, Plan: ${subscriptionPlan}`);
    } else {
      console.error('User not found for customer ID:', customerId);
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Retrieve the subscription object
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Extract subscription items
      const subscriptionItem = subscription.items.data[0];
      const priceId = subscriptionItem.price.id;
      const productId = subscriptionItem.price.product;
      const lookupKey = subscriptionItem.price.lookup_key;

      // Map lookupKey to your subscription plan names
      const subscriptionPlan = mapProductIdToPlan(productId);

      // Update user subscription details
      user.subscriptionStatus = 'past_due';
      user.subscriptionId = subscriptionId;
      user.subscriptionPriceId = priceId;
      user.subscriptionProductId = productId;
      user.subscriptionPlan = subscriptionPlan;

      await user.save();
      console.log(`Invoice payment failed for user: ${user.email}, Plan: ${subscriptionPlan}`);
      // Optionally, send an email notification to the user
    } else {
      console.error('User not found for customer ID:', customerId);
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleCheckoutSession(session) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const clientReferenceId = session.client_reference_id;

  try {
    // Find the user by the client reference ID
    const user = await User.findById(clientReferenceId);

    if (user) {
      // Retrieve the subscription object from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Extract subscription items
      const subscriptionItem = subscription.items.data[0];
      const priceId = subscriptionItem.price.id;
      const productId = subscriptionItem.price.product;
      const lookupKey = subscriptionItem.price.lookup_key;

      // Map lookupKey to your subscription plan names
      const subscriptionPlan = mapProductIdToPlan(productId);

      // Update the user's Stripe information
      user.stripeCustomerId = customerId;
      user.subscriptionStatus = subscription.status;
      user.subscriptionId = subscriptionId;
      user.subscriptionPriceId = priceId;
      user.subscriptionProductId = productId;
      user.subscriptionPlan = subscriptionPlan;

      await user.save();
      console.log(`User subscription updated successfully for user: ${user.email}, Plan: ${subscriptionPlan}`);
    } else {
      console.error('User not found for client reference ID:', clientReferenceId);
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

// Update subscription status in the database
async function updateSubscriptionStatus(subscription) {
  const customerId = subscription.customer;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (user) {
    user.subscriptionStatus = subscription.status;
    user.subscriptionId = subscription.id;
    await user.save();
  } else {
    console.error('User not found for customer ID:', customerId);
  }
}

// Cancel a user's subscription
exports.cancelSubscription = async (req, res) => {
  const user = req.user;

  try {
    await stripe.subscriptions.del(user.subscriptionId);
    user.subscriptionStatus = 'canceled';
    await user.save();
    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Unable to cancel subscription' });
  }
};

// Create a billing portal session
exports.createBillingPortalSession = async (req, res) => {
  const user = req.user;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrlBaseL}/home`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Unable to create billing portal session' });
  }
};
