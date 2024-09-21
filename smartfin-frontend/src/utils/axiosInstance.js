// src/utils/axiosInstance.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/v1'; // Adjust this to your API base URL

const axiosInstance = axios.create({
    baseURL: API_URL
});

// Function to get token from storage
const getToken = () => {
    return localStorage.getItem('token');
};

// Use an interceptor to inject the token to requests before they are sent
axiosInstance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;
