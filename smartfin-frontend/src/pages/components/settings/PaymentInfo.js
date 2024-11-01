// src/components/settings/PaymentInfo.js

import React from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';

const PaymentInfo = () => {
  const { auth } = useAuth();

  const handleSubscribeNow = () => {
    // Redirect to the pricing page
    window.location.href = '/pricing';
  };

  const handleManageSubscription = () => {
    // Redirect the user to the static billing portal link
    window.location.href = 'https://billing.stripe.com/p/login/test_4gw9AB4FsdAJc80dQQ';
  };

  if (!auth.user) {
    return null; // or display a message prompting the user to log in
  }

  return (
    <div className="card-body">
      <h5>Payment Information</h5>
      {auth.user.subscriptionStatus !== 'active' ? (
        <div>
          <p>You are not currently subscribed to any plan.</p>
          <Button variant="primary" onClick={handleSubscribeNow}>
            Subscribe Now
          </Button>
        </div>
      ) : (
        <div>
          <p>
            You are subscribed to the <strong>{auth.user.subscriptionPlan}</strong> plan.
          </p>
          <Button variant="primary" onClick={handleManageSubscription}>
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentInfo;
