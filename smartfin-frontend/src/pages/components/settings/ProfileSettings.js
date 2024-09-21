import React, { useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaEdit, FaLock, FaEnvelope, FaUser } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance'; // Use your axios instance
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { auth } = useAuth(); // Get auth context
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(auth.user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetPasswordMessage, setResetPasswordMessage] = useState(''); // For password reset feedback

  // Function to handle email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to check if email is taken
  const checkEmailExists = async (email) => {
    try {
      const response = await axiosInstance.get('/users', { params: { email } });
      return response.data.users.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Handle pressing Enter for email field
  const handleEmailKeyDown = async (event) => {
    if (event.key === 'Enter') {
      if (!validateEmail(email)) {
        setEmailError('Invalid email format');
        return;
      }

      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setEmailError('Email is already taken');
      } else {
        setEmailError('');
        setIsEditingEmail(false);
        
        try {
          await axiosInstance.post('/auth/send-verification-email', {
            verifyingNewUser: false,
            newEmail: email,
          });

          alert('Verification email sent to ' + email);
        } catch (error) {
          console.error('Error sending verification email:', error);
          setEmailError('Failed to send verification email.');
        }
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email: auth.user.email });
      setResetPasswordMessage('Password reset email sent to your inbox.');
      setError('');
    } catch (err) {
      setError('Failed to send password reset email.');
      setResetPasswordMessage('');
    }
  };

  // Handle clicking out of email field (revert to initial state without changing email)
  const handleEmailBlur = () => {
    setIsEditingEmail(false);
    setEmail(auth.user?.email || '');
    setEmailError('');
  };

  const renderTooltip = (text) => (
    <Tooltip>{text}</Tooltip>
  );

  return (
    <div className="profile-settings">
      <h4 className="font-weight-bold mb-4">Profile Settings</h4>
      <div className="card-body">
        {/* User's Name */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <FaUser className="icon" />
            <div className="ml-3">
              <p className="mb-0">Username</p>
              <h6 className="font-weight-normal">{auth.user?.name || 'John Doe'}</h6>
            </div>
          </div>
          <OverlayTrigger placement="top" overlay={renderTooltip('Edit username')}>
            <Button variant="outline-primary" className="btn-icon">
              <FaEdit />
            </Button>
          </OverlayTrigger>
        </div>

        {/* User's Email */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <FaEnvelope className="icon" />
            <div className="ml-3">
              <p className="mb-0">Email</p>
              {isEditingEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  onKeyDown={handleEmailKeyDown}
                  className="form-control"
                  autoFocus
                />
              ) : (
                <h6 className="font-weight-normal">{auth.user?.email || 'john.doe@example.com'}</h6>
              )}
              {emailError && <p className="text-danger">{emailError}</p>}
            </div>
          </div>
          {!isEditingEmail && (
            <OverlayTrigger placement="top" overlay={renderTooltip('Edit email')}>
              <Button variant="outline-primary" className="btn-icon" onClick={() => setIsEditingEmail(true)}>
                <FaEdit />
              </Button>
            </OverlayTrigger>
          )}
        </div>

        {/* Change Password */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <FaLock className="icon" />
            <div className="ml-3">
              <p className="mb-0">Password</p>
              <h6 className="font-weight-normal">••••••••</h6>
            </div>
          </div>
          <OverlayTrigger placement="top" overlay={renderTooltip('Reset password')}>
            <Button variant="outline-danger" className="btn-icon" onClick={handleResetPassword}>
              <FaEdit />
            </Button>
          </OverlayTrigger>
        </div>
        {/* Feedback for Reset Password */}
        {resetPasswordMessage && <p className="text-success">{resetPasswordMessage}</p>}
        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
};

export default ProfileSettings;
