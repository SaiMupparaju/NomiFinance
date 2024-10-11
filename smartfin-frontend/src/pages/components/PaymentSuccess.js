import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const { setUser } = useAuth(); // Use setUser from the context
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch the latest user data from the backend
        const response = await axiosInstance.get('/users/me');
        // Update the user in the context and local storage
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [setUser]);

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
        <p className="lead">Thank you for subscribing. Your payment was completed successfully.</p>
        <button className="btn btn-primary mt-4" onClick={handleGoHome}>
          Go Back Home
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
