import React from 'react';
import {Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Adjust path as needed
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import ConnectBankPage from './pages/ConnectBankPage';
import SuccessLoginPage from './pages/SuccessLogin';
import CreateRulePage from './pages/createPage';
import EditRulePage from './pages/editPage';
import VerifyEmailPage from './pages/components/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPassword';
import TestPage from './pages/testEngine';
import FactQuery from './pages/components/FactQuery';
import PaymentSuccess from './pages/components/PaymentSuccess';
import PaymentCancel from './pages/components/PaymentCancel';
import PricingTable from './pages/components/PricingTable';

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/connect-banks" element={<ConnectBankPage />} />
        <Route path="/redirect" element={<SuccessLoginPage />} />
        <Route path="/create-rule" element={<CreateRulePage />} />
        <Route path="/edit-rule/:ruleId" element={<EditRulePage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path='/pricing' element={<PricingTable />} />

        {/* Additional routes can be added here */}
      </Routes>
  );
}

export default App;
//TODO need to put the payment id in the home.js 