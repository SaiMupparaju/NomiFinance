// VerifyEmailPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';

function VerifyEmailPage() {
    const { resendVerificationEmail } = useAuth();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [emailVerified, setEmailVerified] = useState(false);

    const {auth}  = useAuth();
    // Extract the token from the URL
    const token = new URLSearchParams(location.search).get('token');

    useEffect(() => {
        // Verify the email when the component mounts if a token is available
        if (token) {
            verifyEmail(token);
        }
    }, [token]);

    const verifyEmail = async (token) => {
        try {
            await axiosInstance.post(`/auth/verify-email?token=${token}`);
            setMessage('Your email has been successfully verified!');
            setEmailVerified(true);
            setTimeout(() => {
                auth.user.isEmailVerified = true; 
                navigate('/redirect'); // Redirect after a delay
            }, 3000);
        } catch (error) {
            setError('Email verification failed. The token may have expired.');
        }
    };

    const handleResendVerification = async () => {
        try {
            await resendVerificationEmail();
            setMessage('A new verification email has been sent to your email address.');
        } catch (error) {
            setError('Failed to resend the verification email.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-100" style={{ maxWidth: '400px' }}>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                {!emailVerified && (
                    <>
                        <h2 className="text-center mb-4">Verify Your Email</h2>
                        <p className="text-center">Please check your email inbox to verify your email address.</p>
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
