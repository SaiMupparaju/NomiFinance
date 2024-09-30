import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';  // Add a CSS file to style the page
import { useAuth } from '../contexts/AuthContext';

function LandingPage() {
  
  const navigate = useNavigate();
  const {auth} = useAuth();

  
  const handleLoginClick = () => {
    navigate('/login');  // Navigate to /login
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleGuestClick = () => {
    navigate("/home");  // Navigate to the home page for guest users
  };

  // useEffect(() => {
  //   if(auth.user){
  //     navigate("/home");
  //   }
  // }, [auth])

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 position-relative">
      <div className="text-center">
        <h1 className="mb-3">Nomi</h1>
        <p className="mb-4">The app to make your Finances Smarter</p>
        <div>
          <button onClick={handleRegisterClick} className="btn btn-primary mr-2">Sign Up</button>
          <button onClick={handleLoginClick} className="btn btn-secondary">Login</button>
        </div>
      </div>

      {/* Continue as Guest Button - Positioned at the bottom center */}
      <div className="continue-as-guest">
        <button onClick={handleGuestClick} className="btn btn-outline-primary">Continue as Guest</button>
      </div>
    </div>
  );
}

export default LandingPage;
