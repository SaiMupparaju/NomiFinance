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

  useEffect(() => {
    if(auth.user){
      navigate("/home");
    }
  }, [auth])

  console.log("BACKEND_URL", process.env.REACT_APP_BACKEND_URL)

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 position-relative">
      <div className="text-center">
        <h1 className="mb-3">
          Nomi
          <sup style={{ fontSize: '0.7rem', color: 'green', marginLeft: '4px' }}>[Beta]</sup>
        </h1>
        <p className="mb-4">The app to make your finances smarter</p>
        <div className="btn-container">
          <button onClick={handleRegisterClick} className="btn btn-primary">Sign Up</button>
          <button onClick={handleLoginClick} className="btn btn-secondary">Login</button>
          <button onClick={handleGuestClick} className="btn btn-outline-primary">Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
