import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const { auth, setAuth } = useAuth(); 
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  // const retriesRef = useRef(0);          // Ref to maintain retries count
  // const isMountedRef = useRef(true);     // Ref to check if component is mounted
  // const maxRetries = 10;                 // Maximum number of retries

  useEffect(() => {
    let retries = 0;
    const maxRetries = 10;
    const pollInterval = 3000;
    let pollTimer = null;  // Add this to track the timeout
    const abortController = new AbortController();  // Add this for cancelling requests

    const pollSubscriptionStatus = async () => {
      try {
        // Add signal to request
        const response = await axiosInstance.get('/users/subscription', {
          signal: abortController.signal
        });
        
        const subscriptionData = response.data;

        if (subscriptionData.subscriptionStatus === 'active') {
          setAuth((prevAuth) => ({
            ...prevAuth,
            user: {
              ...prevAuth.user,
              ...subscriptionData,
            },
          }));
          navigate('/home');
        } else {
          if (retries < maxRetries) {
            retries += 1;
            pollTimer = setTimeout(pollSubscriptionStatus, pollInterval);
          } else {
            setIsProcessing(false);
            console.error('Max retries reached');
          }
        }
      } catch (error) {
        // Don't continue polling if we got a 401 or if the request was aborted
        if (error.response?.status === 401 || error.name === 'AbortError') {
          return;
        }

        if (retries < maxRetries) {
          retries += 1;
          pollTimer = setTimeout(pollSubscriptionStatus, pollInterval);
        } else {
          setIsProcessing(false);
          console.error('Max retries reached');
        }
      }
    };

    pollSubscriptionStatus();

    // Cleanup function
    return () => {
      if (pollTimer) clearTimeout(pollTimer);
      abortController.abort();  // Cancel any in-flight requests
    };
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
