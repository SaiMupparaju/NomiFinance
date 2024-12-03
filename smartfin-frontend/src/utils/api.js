import axios from 'axios';
import axiosInstance from './axiosInstance';
import axiosPublic from './axiosPublic';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/v1`; // Adjust if your API is at a different URL

export const login = async (email, password) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
        const { user, tokens } = response.data;
        console.log("tokens: ", tokens);
        // Assuming the backend sends an array of bank accounts
        return { user, tokens};
    } catch (error) {
        console.error('Failed to login:', error.response.data);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/auth/register`, userData);
        return response.data; // This should include tokens and user details
    } catch (error) {
        console.error('Failed to register:', error.response.data);
        throw error;
    }
};


export const getLinkToken = async () => {
    try {
        const response = await axiosInstance.post(`${API_URL}/plaid/get-link-token`);
        return response.data; // this will have the link token
    } catch (error) {
        console.error('Failed to get link token:', error.response?.data);
        throw error;
    }
};



export const exchangePublicToken = async (publicToken) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/plaid/exchange-public-token`, { public_token: publicToken });
        return response.data;  // This will include the access token
    } catch (error) {
        console.error('Failed to exchange public token:', error.response?.data);
        throw error;
    }
};
