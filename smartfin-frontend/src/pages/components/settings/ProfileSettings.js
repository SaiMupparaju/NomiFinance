import React, { useState } from 'react';
import { Button, OverlayTrigger, Tooltip , Modal, Form} from 'react-bootstrap';
import { FaEdit, FaLock, FaEnvelope, FaUser } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance'; // Use your axios instance
import './ProfileSettings.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ProfileSettings = () => {
  const { auth, logout } = useAuth(); // Get auth context
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(auth.user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetPasswordMessage, setResetPasswordMessage] = useState(''); // For password reset feedback

  const MySwal = withReactContent(Swal);
  // Function to handle email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [reasonText, setReasonText] = useState('');

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!isConfirmed) {
      alert('You must confirm that you understand this action cannot be undone.');
      return;
    }

    try {
      // Send delete request to the backend
      await axiosInstance.delete(`/users/${auth.user.id}`, {
        data: { reason: reasonText || '' },
      });

      await logout();
      alert('Your account has been deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete your account. Please try again later.');
    }
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
      axiosInstance.post('/auth/forgot-password', { email: auth.user.email });
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
        <div className="text-center mt-5">
          <Button variant="danger" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </div>
      </div>


      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This action is <strong>irreversible</strong>. All your data will be deleted.
          </p>
          <Form>
            <Form.Group controlId="formCheckbox">
              <Form.Check
                type="checkbox"
                label="I understand that this action cannot be undone."
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
            </Form.Group>
            <Form.Group controlId="formTextarea">
              <Form.Label>
                We'd appreciate it if you told us your reason for deleting
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    
    </div>
  );
};

export default ProfileSettings;
