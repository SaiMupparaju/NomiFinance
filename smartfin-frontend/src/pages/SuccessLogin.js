import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Ensure this path is correct

function SuccessLoginPage() {
    const { auth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth || !auth.user) {
            navigate('/login'); // Redirect to login if no user is authenticated
            return;
        }
        
        console.log(auth.user);
        // Check if the user has bank accounts linked
        if (auth.user?.plaidAccessTokens?.length > 0) {
            navigate('/home'); // User has bank accounts, proceed to home
        } else {
            navigate('/connect-banks'); // No bank accounts, direct to connect accounts page
        }
    }, [auth, navigate]);

    return (
        <div>Loading your settings...</div>
    );
}

export default SuccessLoginPage;
