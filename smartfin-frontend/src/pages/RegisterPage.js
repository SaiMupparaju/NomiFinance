import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name !== 'password' && name !== 'confirmPassword') {
            const updatedFormData = { ...formData, [name]: value };
            localStorage.setItem('registerFormData', JSON.stringify({
                name: updatedFormData.name,
                email: updatedFormData.email
            }));
        }
    };

    useEffect(() => {
        const storedFormData = JSON.parse(localStorage.getItem('registerFormData'));
        if (storedFormData) {
            setFormData((prevData) => ({
                ...prevData,
                name: storedFormData.name || '',
                email: storedFormData.email || ''
            }));
        }
    }, []);

    const handleRegister = async (event) => {
        event.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password
            };
            await register(userData);
            navigate('/verify-email', { state: { email: formData.email } }); 
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await loginWithGoogle();
            navigate('/home');
        } catch (error) {
            setError('Google sign-up failed');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">Sign Up to Nomi</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleRegister} className="card p-4">
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mb-3">Register</button>

                </form>
            </div>
        </div>
    );
}

export default RegisterPage;