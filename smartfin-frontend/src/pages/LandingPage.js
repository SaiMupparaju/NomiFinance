// src/pages/LandingPage.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';  
import { useAuth } from '../contexts/AuthContext';

function LandingPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [exampleIndex, setExampleIndex] = useState(0);

  // 1) A list of example rule ideas to cycle through
  const examples = [
    '“Send a text if my restaurant spending exceeds $500.”',
    '“Email me whenever my balance drops below $100.”',
    '“Notify me by SMS if a deposit of $1,000 or more is received.”',
    '“Alert me when monthly expenses surpass $2,000.”',
    '“Warn me of any transactions originating from foreign countries.”',
  ];

  // 2) Rotate the example text every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % examples.length);
    }, 6000);

    return () => clearInterval(intervalId);
  }, [examples.length]);

  // 3) If user is logged in already, navigate to /home
  useEffect(() => {
    if (auth.user) {
      navigate('/home');
    }
  }, [auth, navigate]);

  // 4) Handlers for sign up / login / guest
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleGuestClick = () => {
    navigate('/home');
  };

  return (
    <div className="landing-page">
      
      {/* HERO SECTION */}
      <section className="hero-section d-flex flex-column justify-content-center align-items-center">
        <h1 className="hero-title">
          Nomi 
          <sup className="beta-tag">[Beta]</sup>
        </h1>

        <p className="hero-subtitle">
          Elevate your finances with flexible, intelligent automations
        </p>

        {/* Dynamic examples area back in the hero */}
        <div className="dynamic-examples">
          <p className="examples-title">Sample Rules You Can Create:</p>
          <p className="example-text">{examples[exampleIndex]}</p>
        </div>

        <div className="hero-buttons">
          <button onClick={handleRegisterClick} className="btn btn-primary hero-btn">
            Sign Up
          </button>
          <button onClick={handleLoginClick} className="btn btn-secondary hero-btn">
            Login
          </button>
          <button onClick={handleGuestClick} className="btn btn-outline-primary hero-btn">
            Continue as Guest
          </button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        {/* 1) Connect Your Accounts - uses handshake.webp */}
        <div className="feature-row">
          <div className="feature-image">
            <img 
              src="/handshake.webp" 
              alt="Securely connect accounts" 
            />
          </div>
          <div className="feature-text">
            <h2>Connect Your Bank Accounts Securely</h2>
            <p>
              Link your accounts with confidence to monitor balances, transactions, 
              and expenses in real time. Nomi places security at the forefront of your experience.
            </p>
          </div>
        </div>

        {/* 2) Smart Rules - uses lightbulb.webp */}
        <div className="feature-row reverse-row">
          <div className="feature-image">
            <img 
              src="/lightbulb.webp"
              alt="Smart automation rules" 
            />
          </div>
          <div className="feature-text">
            <h2>Automate with Smart Rules</h2>
            <p>
              Utilize ready-made templates or build your own logic. Instantly move funds to 
              savings, get notified about sizable transactions, and more—all in a few clicks.
            </p>
          </div>
        </div>

        {/* 3) Stay Informed - uses alert.jpeg */}
        <div className="feature-row">
          <div className="feature-image">
            <img 
              src="/alert.jpg"
              alt="Stay informed with alerts" 
            />
          </div>
          <div className="feature-text">
            <h2>Stay Informed, Stress-Free</h2>
            <p>
              Receive real-time notifications and periodic insights on anything you want to monitor. 
              Nomi helps you stay ahead of your finances without the hassle.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION (Optional) */}
      <section className="cta-section text-center">
        <h2>Ready to Take Control of Your Finances?</h2>
        <p>Sign up or continue as a guest to explore Nomi’s innovative features.</p>
        <button onClick={handleRegisterClick} className="btn btn-primary mx-2">
          Sign Up
        </button>
        <button onClick={handleGuestClick} className="btn btn-outline-primary mx-2">
          Continue as Guest
        </button>
      </section>
    </div>
  );
}

export default LandingPage;
