import axios from 'axios';
import logoutState from './logoutState';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/v1`;

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Create a single source of truth for handling logouts
let logoutPromise = null;

const handleLogout = async () => {
  if (logoutPromise) {
    return logoutPromise;
  }

  logoutPromise = new Promise((resolve) => {
    // Clear tokens and default headers
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    // Set logout state
    logoutState.isLoggingOut = true;
    
    // Use history.replace instead of window.location to prevent multiple redirects
    window.history.replaceState({}, '', '/logout');
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    resolve();
  });

  // Clear the promise after completion
  logoutPromise.finally(() => {
    logoutPromise = null;
    logoutState.isLoggingOut = false;
  });

  return logoutPromise;
};

// Function to get token from storage
const getToken = () => localStorage.getItem('token');

// Interceptor to handle responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const excludedUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/verify-email',
      '/auth/refresh-tokens',
      '/v1/auth/login',
      '/v1/auth/register',
      '/v1/auth/forgot-password',
      '/v1/auth/verify-email',
      '/v1/auth/refresh-tokens',
    ];

    const requestUrl = new URL(originalRequest.url, axiosInstance.defaults.baseURL).pathname;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !excludedUrls.includes(requestUrl) &&
      !logoutState.isLoggingOut
    ) {
      await handleLogout();
    }

    return Promise.reject(error);
  }
);

// Interceptor to inject the token into requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;