import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/v1`;

const axiosPublic = axios.create({
  baseURL: API_URL,
});

export default axiosPublic;
