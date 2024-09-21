import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the token from the URL
  const token = new URLSearchParams(location.search).get('token');

  // Function to validate the password regex
  const validatePassword = (value) => {
    if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
        return false;
    }
    return true;
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Ensure password and confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password regex
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one letter and one number.');
      return;
    }

    try {
      // Make the API request to reset the password
      await axiosInstance.post(`/auth/reset-password?token=${token}`, { password });
      setMessage('Password reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError('Failed to reset password. The token may have expired.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Reset Your Password</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handlePasswordReset} className="card p-4">
          <div className="mb-3">
            <label htmlFor="password" className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
