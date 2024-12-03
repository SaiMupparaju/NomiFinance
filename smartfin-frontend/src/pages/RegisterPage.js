import React, { useState, useEffect } from 'react';
import { useNavigate , Link} from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { privacyPolicy } from '../privacyPolicy'; // Ensure this is correctly exported

function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const MySwal = withReactContent(Swal);

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

        if (!hasAcceptedPolicy) {
            setError('You must accept the privacy policy before registering.');
            return;
        }

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

    const handleAcceptPolicyClick = (e) => {
        if (!hasAcceptedPolicy) {
            e.preventDefault();
            showPrivacyPolicy();
        } else {
            setHasAcceptedPolicy(false);
        }
    };

    const showPrivacyPolicy = () => {
        MySwal.fire({
            title: 'Privacy Policy',
            html: `
                <div style="height: 400px; overflow-y: hidden;">
                    <iframe
                        src="/privacypolicy.pdf"
                        style="width: 100%; height: 100%; border: none;"
                    ></iframe>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Accept',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Cancel',
            cancelButtonColor: '#d33',
            showConfirmButton: true,
            didOpen: (popup) => {
                const acceptButton = MySwal.getConfirmButton();
                acceptButton.disabled = true;
    
                const iframe = popup.querySelector('iframe');
    
                // Listen for the user scrolling within the PDF (only works in supported browsers)
                iframe.addEventListener('load', () => {
                    const checkScroll = setInterval(() => {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            if (iframeDoc.scrollingElement.scrollTop + iframeDoc.scrollingElement.clientHeight >= iframeDoc.scrollingElement.scrollHeight - 5) {
                                acceptButton.disabled = false;
                                clearInterval(checkScroll);
                            }
                        } catch (error) {
                            console.error('Cross-origin iframe access issue:', error);
                        }
                    }, 500);
                });
            },
        }).then((result) => {
            if (result.isConfirmed) {
                setHasAcceptedPolicy(true);
            }
        });
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

                    <div className="mb-3 form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="acceptPolicy"
                            checked={hasAcceptedPolicy}
                            onClick={handleAcceptPolicyClick}
                        />
                        <label className="form-check-label" htmlFor="acceptPolicy">
                            I accept the Privacy Policy
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3">Register</button>

                </form>

                <div className="text-center mt-3">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
