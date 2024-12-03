import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const { setUser, auth, setAuth } = useAuth(); 
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  // const retriesRef = useRef(0);          // Ref to maintain retries count
  // const isMountedRef = useRef(true);     // Ref to check if component is mounted
  // const maxRetries = 10;                 // Maximum number of retries

  useEffect(() => {
    let retries = 0;
    const maxRetries = 10; // Adjust as needed
    const pollInterval = 3000; // Poll every 3 seconds

    const pollSubscriptionStatus = async () => {
      try {
        const response = await axiosInstance.get('/users/subscription');
        const subscriptionData = response.data;

        if (subscriptionData.subscriptionStatus === 'active') {
          console.log("user found");
          setAuth((prevAuth) => ({
            ...prevAuth,
            user: {
              ...prevAuth.user,
              ...subscriptionData,
            },
          }));
          navigate('/home'); // Redirect to home or desired page
        } else {
          throw new Error('Subscription not active yet');
        }
      } catch (error) {
        if (retries < maxRetries) {
          retries += 1;
          setTimeout(pollSubscriptionStatus, pollInterval);
        } else {
          console.error('Max retries reached. Subscription not activated.');
          // Handle max retries exceeded (show error message, etc.)
        }
      }
    };

    pollSubscriptionStatus();
  }, [setAuth, navigate]); // Remove setUser from dependencies

  const handleGoHome = () => {
    navigate('/home/');
  };

  return (
    <div className="container text-center mt-5">
      <div className="card p-5 shadow-lg">
        <div className="checkmark-container">
          <FaCheckCircle className="animated-checkmark text-success" />
        </div>
        <h2 className="text-success mt-4">Payment Successful!</h2>
        <p className="lead">
          Thank you for subscribing. Your payment was completed successfully.
        </p>
        {isProcessing ? (
          <p className="text-muted">
            It may take a moment to process your subscription details on our end. We will enable the option to go back home when we are done.
          </p>
        ) : (
          <button className="btn btn-primary mt-4" onClick={handleGoHome}>
            Go Back Home
          </button>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
