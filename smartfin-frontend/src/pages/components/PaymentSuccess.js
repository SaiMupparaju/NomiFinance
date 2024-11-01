import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const { setUser, auth } = useAuth(); 
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const retriesRef = useRef(0);          // Ref to maintain retries count
  const isMountedRef = useRef(true);     // Ref to check if component is mounted
  const maxRetries = 10;                 // Maximum number of retries

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isMountedRef.current) return; // Exit if component is unmounted

      try {
        const response = await axiosInstance.get(`/users/${auth.user.id}`);
        console.log('User data in PaymentSuccess:', response.data);

        setUser(response.data);

        if (response.data.subscriptionStatus === 'active') {
          setIsProcessing(false);
        } else if (retriesRef.current >= maxRetries) {
          console.warn('Subscription status did not update in time.');
          setIsProcessing(false);
        } else {
          retriesRef.current++;
          // Schedule the next fetch after 2 seconds
          setTimeout(fetchUserData, 2000);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsProcessing(false);
      }
    };

    fetchUserData(); // Initial fetch on component mount

    return () => {
      isMountedRef.current = false; // Set to false when component unmounts
    };
  }, [auth.user.id]); // Remove setUser from dependencies

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
