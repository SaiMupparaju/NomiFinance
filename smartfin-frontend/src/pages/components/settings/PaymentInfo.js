// src/components/settings/PaymentInfo.js

import React from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';

const PaymentInfo = () => {
  const { auth } = useAuth();

  const handleSubscribeNow = () => {
    // Redirect to the pricing page
    window.location.href = '/pricing';
  };

  const handleManageSubscription = async () => {
    try {
      const response = await axiosInstance.post('/payment/create-billing-portal-session');
      const { url } = response.data;
      console.log("billing url", url);
      // Redirect the user to the Stripe Billing Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      alert('Unable to load billing portal. Please try again later.');
    }
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
          <p>You are subscribed to the <strong>{auth.user.subscriptionPlan}</strong> plan.</p>
          <Button variant="primary" onClick={handleManageSubscription}>
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentInfo;
