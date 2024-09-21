import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';

const FactQuery = () => {
  const [factValue, setFactValue] = useState(null);
  const [loading, setLoading] = useState(false);


  //const factString = "capital_one/plaid_checking_0000/balances/available"
  const factString = "bank_of_america/plaid_checking_0000/expenses/since_1_year"
  const params = {
    categories: ['TRAVEL', 'TRANSPORTATION']
  }
  const {auth} = useAuth();

  useEffect(() => {
    const fetchFactValue = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.post('/fact/fact-value', {
          userId: auth.user.id,
          factString: factString,
          params: params,
        });
        setFactValue(response.data.factValue);
      } catch (error) {
        console.error('Error fetching fact value:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactValue();
  }, []); // Trigger API call when factString or params change

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : factValue !== null ? (
        <p>Fact Value: {factValue}</p>
      ) : (
        <p>No fact value available.</p>
      )}
    </div>
  );
};

export default FactQuery;