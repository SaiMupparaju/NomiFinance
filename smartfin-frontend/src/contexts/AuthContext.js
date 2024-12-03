import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, 
    register as apiRegister, 
    getLinkToken as apiGetLinkToken, 
    exchangePublicToken as apiExchangePublicToken,
} from '../utils/api';
import axios from 'axios';
import axiosInstance from '../utils/axiosInstance';
import logoutState from '../utils/logoutState';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        return { user, tokens };
    });

    const [linkToken, setLinkToken] = useState(null);


    const setDefaultAxios = (token) => {
        if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Use backticks for template literals
        } else {
            delete axiosInstance.defaults.headers.common['Authorization']; // Remove the header if the token is not present
        }
    };




    const resendVerificationEmail = async () => {
        try {
            await axiosInstance.post('/auth/send-verification-email');
        } catch (error) {
            throw new Error('Failed to resend verification email');
        }
    };

    const login = async (email, password) => {
        try {
            const { user, tokens } = await apiLogin(email, password);
            logoutState.isLoggingOut = false;
            console.log("Auth Context", user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', tokens.access.token);
            console.log("refresh token", tokens.refresh.token, typeof tokens.refresh.token === 'string' );
            localStorage.setItem('refreshToken', tokens.refresh.token);
            setAuth({ user, tokens });
            
            setDefaultAxios(tokens.access.token);

            return ({user, tokens});
        } catch (error) {
            console.error("Failed to login:", error);
            throw error; // Make sure to re-throw the error so it can be caught in the LoginPage
        }
    };

    const register = async (userData) => {
        try {
            const { user, tokens } = await apiRegister(userData);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', tokens.access.token);
            localStorage.setItem('refreshToken', tokens.refresh.token);
            setAuth({ user, tokens });

            setDefaultAxios(tokens.access.token);

            return ({user, tokens});
        } catch (error) {
            console.error("Failed to register:", error);
            throw error;
        }
    };

    const getLinkToken = async () => {
        try {
            const { link_token } = await apiGetLinkToken();
            setLinkToken(link_token);
            return link_token;
        } catch (error) {
            console.error("Failed to get link token:", error);
            throw error;
        }
    };

    const deleteUserConfirm = async () => {
        try {
            const userId = auth?.user?.id;  // Assuming 'auth.user.id' holds the current user's ID
            if (!userId) {
                throw new Error('User ID not available');
            }
            await axiosInstance.delete(`/users/${userId}`);  // This will call your deleteUser route in the backend
            logout();  // Optionally log out the user after deletion
        } catch (error) {
            console.error("Failed to delete user:", error);
            throw new Error('Failed to delete user');
        }
    };

    const exchangePublicToken = async (publicToken) => {
        try {
            const data = await apiExchangePublicToken(publicToken);
            //console.log('Access token:', data.accessToken);
            // You would typically want to save this accessToken to state or somewhere persistent
        } catch (error) {
            console.error("Failed to exchange public token:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuth({ user: null, tokens: null });
        setDefaultAxios(null);
    };

    const continueAsGuest = () => {
        localStorage.setItem('isGuest', 'true');
        setAuth({ user: null, tokens: null, isGuest: true });
    }

    const setUser = (user) => {
        setAuth((prevAuth) => ({ ...prevAuth, user }));
        localStorage.setItem('user', JSON.stringify(user));
      };




    return (
        <AuthContext.Provider value={{ auth, login, register, logout, getLinkToken, linkToken, exchangePublicToken, resendVerificationEmail, deleteUserConfirm, continueAsGuest, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);