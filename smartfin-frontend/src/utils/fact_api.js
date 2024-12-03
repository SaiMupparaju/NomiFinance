import axiosInstance from './axiosInstance';


const API_URL = `${process.env.REACT_APP_BACKEND_URL}/v1/fact`; // Adjust if your API URL is different

export const getFactTree = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/user/tree`);
        return response.data;
    } catch (error) {
        console.error('Error fetching fact tree:', error);
        throw error;
    }
};

export const getUserFacts = async (userId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/user/${userId}/facts`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user facts:', error.response?.data || error.message);
        throw error;
    }
};