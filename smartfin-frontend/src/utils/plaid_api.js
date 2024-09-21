import axiosInstance from './axiosInstance';

export const fetchBankAccounts = async () => {
    try {
        const response = await axiosInstance.get('/plaid/accounts');
        return response.data;
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
    }
};


export const fetchUpdateLink = async () => {
    try {
        const response = await axiosInstance.get('/create_update_link_token');
        return response.data;
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
    }
};



