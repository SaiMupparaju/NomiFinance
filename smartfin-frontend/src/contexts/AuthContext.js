import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, 
    register as apiRegister, 
    getLinkToken as apiGetLinkToken, 
    exchangePublicToken as apiExchangePublicToken,
} from '../utils/api';
import axios from 'axios';
import axiosInstance from '../utils/axiosInstance';

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
            axios.defaults.headers.common['Authorization'] = "Bearer ${token}";
        }
    }

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
            console.log("Auth Context", user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', tokens.access.token);
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

    const exchangePublicToken = async (publicToken) => {
        try {
            const data = await apiExchangePublicToken(publicToken);
            console.log('Access token:', data.accessToken);
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
    };


    return (
        <AuthContext.Provider value={{ auth, login, register, logout, getLinkToken, linkToken, exchangePublicToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);