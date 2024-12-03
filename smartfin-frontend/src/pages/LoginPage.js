import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Update the import path as necessary
import axiosInstance from '../utils/axiosInstance'; // Ensure this import path is correct
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the styles for the notifications

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const { user, tokens } = await login(email, password);
            console.log("token");
            navigate('/redirect');
        } catch (error) {
            console.log(error);
            setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('To reset password, input your email into the box.');
            return;
        }
        try {
            await axiosInstance.post('/auth/forgot-password', { email });
            toast.success('Password reset email sent to your inbox!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to send password reset email.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">Login to Nomi</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin} className="card p-4">
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>
                </form>
                <div className="text-center mt-2">
                    <button 
                        onClick={handleResetPassword} 
                        className="btn btn-link"
                        style={{ textDecoration: 'underline', padding: 0 }}
                    >
                        Forgot Password?
                    </button>
                </div>
                <ToastContainer />
            </div>
        </div>
    );
}

export default LoginPage;
