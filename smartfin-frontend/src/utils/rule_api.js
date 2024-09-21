import axiosInstance from './axiosInstance';

const API_URL = 'http://localhost:3001/v1/rules'; // Adjust if your API URL is different

// Create a new rule
export const createRule = async (ruleData) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/create`, ruleData);
        return response.data; // This should include the created rule details
    } catch (error) {
        console.error('Failed to create rule:', error.response?.data);
        throw error;
    }
};

// Get a list of all rules
export const getAllRules = async () => {
    try {
        const response = await axiosInstance.get(API_URL);
        return response.data; // This should include a list of all rules
    } catch (error) {
        console.error('Failed to fetch rules:', error.response?.data);
        throw error;
    }
};

// Get a specific rule by ID
export const getRuleById = async (ruleId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/${ruleId}`);
        return response.data; // This should include the details of the specific rule
    } catch (error) {
        console.error('Failed to fetch rule by ID:', error.response?.data);
        throw error;
    }
};

// Update a rule by ID
export const updateRule = async (ruleId, ruleData) => {
    try {
        console.log("updating rule ", ruleId);
        const response = await axiosInstance.put(`${API_URL}/${ruleId}`, ruleData);
        return response.data; // This should include the updated rule details
    } catch (error) {
        console.error('Failed to update rule:', error.response?.data);
        throw error;
    }
};

// Delete a rule by ID
export const deleteRule = async (ruleId) => {
    try {
        await axiosInstance.delete(`${API_URL}/${ruleId}`);
        return { message: 'Rule deleted successfully' }; // Return a success message
    } catch (error) {
        console.error('Failed to delete rule:', error.response?.data);
        throw error;
    }
};

export const getUserRules = async (userId) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/rules/user/${userId}`);
      return response.data; // This will include the list of rules for the user
    } catch (error) {
      console.error('Failed to fetch user rules:', error.response?.data);
      throw error;
    }
};

export const getFactTree = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/tree`);
        return response.data;
    } catch (error) {
        console.error('Error fetching fact tree:', error);
        throw error;
    }
};
