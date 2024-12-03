import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

function VerifyEmailPage() {
  const { resendVerificationEmail, deleteUserConfirm } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { auth } = useAuth();
  const MySwal = withReactContent(Swal);

  // Extract the token from the URL and email from state
  const token = new URLSearchParams(location.search).get('token');
  const email = location.state?.email || ''; // Get email from state (optional)

  const showWelcomeModals = () => {
    // List of examples to shuffle through
    const examples = [
      '“If I spend over $500 at restaurants then text me"',
      '“When my account balance drops below $100, send me an email"',
      '“If I receive a deposit over $1,000, notify me via SMS"',
      '“When my monthly expenses exceed $2,000, alert me"',
      '“If there are transactions from foreign countries, warn me”',
    ];

    // Updated steps with the new text
    const steps = [
      {
        title: 'About Nomi',
        content: `
          <p>Nomi lets you create super flexible rules for your finances.</p>
          <p>Think a customizable ‘IF statement’ linked to your bank accounts.</p>
          <p id="example-text" style="font-style: italic;"></p>
        `,
      },
      {
        title: 'About Plaid',
        content: `
          <p>Plaid is the most trusted digital finance platform worldwide..</p>
          <p>Connecting to Plaid allows your Nomi rules to access your banking information as long as its useful to you.</p>
          <p>We’ll walk you through the steps to connect to Plaid in a moment. You can remove or update connections any time.</p>
        `,
      },
      {
        title: 'About Your Data',
        content: `
          <p>Your data is secure.</p>
          <p>Check out Nomi’s Privacy Policy in Settings or send us an email for more information.</p>
          <p>If at any time you no longer want give Nomi access to your data, you can delete your account, and your information will be deleted promptly.</p>
        `,
      },
    ];

    const displayModal = (index) => {
      let intervalId = null;

      const step = steps[index];
      MySwal.fire({
        title: step.title,
        html: `
          <div style="text-align: left;">
            ${step.content}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            ${index > 0 ? '<button id="back-button" class="swal2-styled swal2-default-button">Back</button>' : '<div></div>'}
            ${index < steps.length - 1 ? '<button id="next-button" class="swal2-styled swal2-confirm">Next</button>' : '<button id="finish-button" class="swal2-styled swal2-confirm">Continue!</button>'}
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          if (index === 0) {
            // For the first slide, start the interval to update examples
            const exampleTextElement = MySwal.getPopup().querySelector('#example-text');
            let currentExampleIndex = 0;

            // Function to update the example text
            const updateExampleText = () => {
              exampleTextElement.textContent = examples[currentExampleIndex];
              currentExampleIndex = (currentExampleIndex + 1) % examples.length;
            };

            // Start the interval
            updateExampleText(); // Initialize with the first example
            intervalId = setInterval(updateExampleText, 3000); // Change example every 3 seconds
          }

          if (index > 0) {
            const backButton = MySwal.getPopup().querySelector('#back-button');
            backButton.addEventListener('click', () => {
              if (intervalId) clearInterval(intervalId);
              displayModal(index - 1);
            });
          }
          if (index < steps.length - 1) {
            const nextButton = MySwal.getPopup().querySelector('#next-button');
            nextButton.addEventListener('click', () => {
              if (intervalId) clearInterval(intervalId);
              displayModal(index + 1);
            });
          } else {
            const finishButton = MySwal.getPopup().querySelector('#finish-button');
            finishButton.addEventListener('click', () => {
              if (intervalId) clearInterval(intervalId);
              MySwal.close();
              navigate('/redirect');
            });
          }
        },
        willClose: () => {
          // Clear the interval when the modal is closed
          if (intervalId) clearInterval(intervalId);
        },
      });
    };

    // Start the modal sequence
    displayModal(0);
  };

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token) => {
    try {
      await axiosInstance.post(`/auth/verify-email?token=${token}`);
      setMessage('Your email has been successfully verified! Sending you to the Next Step...');
      setEmailVerified(true);
      setTimeout(() => {
        auth.user.isEmailVerified = true;
        localStorage.removeItem('registerFormData');
        showWelcomeModals();
      }, 3000);
    } catch (error) {
      setError('Email verification failed. The token may have expired.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setAlertVisible(true);
      setTimeout(() => {
        setAlertVisible(false);
      }, 3000);
    } catch (error) {
      setError('Failed to resend the verification email.');
    }
  };

  const handleBack = async () => {
    try {
      // Delete the user
      await deleteUserConfirm();
      // Navigate back to the registration page
      navigate('/register');
    } catch (error) {
      setError('Failed to delete the user.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: '400px', position: 'relative' }}>
        {/* Back Button as an icon at the top left */}
        <FaArrowLeft
          onClick={handleBack}
          style={{
            position: 'absolute', 
            top: '20px',
            left: '20px',
            cursor: 'pointer',
            fontSize: '24px',
          }}
          title="Go back"
        />
        {alertVisible && <div className="alert alert-success">Verification email sent!</div>}

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!emailVerified && (
          <>
            <h2 className="text-center mb-4">Verify Your Email</h2>
            <p className="text-center">Please check your email inbox to verify {email}.</p>
            <button onClick={handleResendVerification} className="btn btn-primary w-100 mb-3">
              Resend Verification Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
