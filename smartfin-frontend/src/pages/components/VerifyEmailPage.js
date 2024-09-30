import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { FaArrowLeft } from 'react-icons/fa';  // Importing an icon for the back button

function VerifyEmailPage() {
    const { resendVerificationEmail, deleteUserConfirm } = useAuth();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [alertVisible, setAlertVisible] = useState(false); 
    const [emailVerified, setEmailVerified] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { auth } = useAuth();
    
    // Extract the token from the URL and email from state
    const token = new URLSearchParams(location.search).get('token');
    const email = location.state?.email || '';  // Get email from state (optional)

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
                navigate('/redirect');
            }, 3000);
        } catch (error) {
            setError('Email verification failed. The token may have expired.');
        }
    };

    const handleResendVerification = async () => {
        try {
            resendVerificationEmail();

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
                        fontSize: '24px'
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
