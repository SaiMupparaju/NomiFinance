import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function PaymentCancel() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="container text-center mt-5">
      <div className="card p-5 shadow-lg">
        <h2 className="text-danger">Payment Canceled</h2>
        <p className="lead">Your payment was canceled. You can try again or contact support for assistance.</p>
        <button className="btn btn-primary mt-4" onClick={handleGoHome}>
          Go Back Home
        </button>
      </div>
    </div>
  );
}

export default PaymentCancel;
