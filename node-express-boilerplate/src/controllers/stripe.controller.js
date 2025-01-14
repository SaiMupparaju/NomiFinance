// stripe.controller.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user.model'); // Adjust the path as needed

const frontendUrlBase = process.env.FRONTEND_URL



function mapProductIdToPlan(productId) {
  switch (productId) {
    case process.env.NOMI_PREMIUM_ID:
      return 'Nomi Premium'
    case process.env.NOMI_STANDARD_ID:
      return 'Nomi Standard'
    case process.env.NOMI_SINGLE_ID:
      return 'Nomi Free'
  }
}

async function updateUserSubscription(user, subscription) {
  if (!user) return;

  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem.price.id;
  
  // Fix: Get just the product ID string, not the entire product object
  const productId = typeof subscriptionItem.price.product === 'string' 
    ? subscriptionItem.price.product 
    : subscriptionItem.price.product.id;

  const subscriptionPlan = mapProductIdToPlan(productId);

  user.subscriptionStatus = subscription.status;
  user.subscriptionId = subscription.id;
  user.subscriptionPriceId = priceId;
  user.subscriptionProductId = productId; // Now this will always be a string
  user.subscriptionPlan = subscriptionPlan;
  user.subscriptionCurrentPeriodEnd = subscription.current_period_end;
  user.subscriptionCanceledAt = subscription.canceled_at;

  await user.save();
  return user;
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

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSession(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Add these if you need them
      case 'customer.subscription.trial_will_end':
        // Handle trial ending soon
        break;

      case 'customer.subscription.pending_update_applied':
        // Handle subscription updates that were pending
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};


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
  try {
    // For checkout.session.completed
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    
    if (!subscriptionId) {
      console.log('No subscription found in checkout session');
      return;
    }

    // Get the user either by customer ID or metadata
    let user = await User.findOne({ stripeCustomerId: customerId });
    
    if (!user && session.client_reference_id) {
      user = await User.findById(session.client_reference_id);
    }

    if (!user) {
      console.error('No user found for checkout session');
      return;
    }

    // Update user's Stripe customer ID if not set
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customerId;
    }

    // Fetch the full subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });

    await updateUserSubscription(user, subscription);

    // Handle any additional setup needed for new subscriptions
    if (subscription.status === 'active') {
      // Additional business logic for new subscriptions
      // e.g., sending welcome emails, setting up initial resources, etc.
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    if (!user) {
      console.error('No user found for subscription update');
      return;
    }

    await updateUserSubscription(user, subscription);

    // Handle specific subscription status changes
    switch (subscription.status) {
      case 'past_due':
        // Send payment reminder email
        break;
      case 'canceled':
        // Clean up user resources
        break;
      case 'unpaid':
        // Handle failed payment after retries
        break;
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}


async function handleInvoicePaid(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });
    if (!user) return;

    // Update subscription if this is a subscription invoice
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      await updateUserSubscription(user, subscription);
    }

    // Record successful payment
    user.lastPaymentStatus = 'succeeded';
    user.lastPaymentDate = new Date();
    await user.save();
  } catch (error) {
    console.error('Error handling invoice payment:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });
    if (!user) return;

    // Update user payment status
    user.lastPaymentStatus = 'failed';
    user.lastPaymentFailureDate = new Date();
    
    // If this is final attempt, subscription will be marked as unpaid
    if (invoice.next_payment_attempt === null) {
      user.subscriptionStatus = 'unpaid';
    }

    await user.save();

    // You might want to notify the user about the failed payment
  } catch (error) {
    console.error('Error handling failed invoice payment:', error);
    throw error;
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
