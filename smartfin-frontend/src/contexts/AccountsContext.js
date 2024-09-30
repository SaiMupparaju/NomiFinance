import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchBankAccounts } from '../utils/plaid_api';
import { useAuth } from './AuthContext';

// Create AccountsContext
const AccountsContext = createContext();

// Provide access to AccountsContext
export const useAccounts = () => useContext(AccountsContext);

// AccountsProvider Component
export const AccountsProvider = ({ children }) => {
  const { auth } = useAuth(); // Access auth information
  const [accounts, setAccounts] = useState({}); // State to store bank accounts
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track any errors

  // Default guest accounts
  const defaultGuestAccounts = {
    "Demo Bank": [
      { accountId: 'demo_savings_001', accountName: 'Demo Savings Account', type: 'savings', needsUpdate: false },
      { accountId: 'demo_checking_001', accountName: 'Demo Checking Account', type: 'checking', needsUpdate: false },
    ],
    "Demo Credit Union": [
      { accountId: 'demo_credit_001', accountName: 'Demo Credit Card', type: 'credit', needsUpdate: false },
    ],
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // If the user is authenticated, fetch real bank accounts
        if (auth && auth.user) {
          const accountsData = await fetchBankAccounts();
          setAccounts(accountsData);
        } 
        // If no user is authenticated, set the default guest accounts
        else {
          setAccounts(defaultGuestAccounts);
        }
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
        setError('Failed to fetch accounts.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [auth]); // Re-fetch accounts when the user changes (login/logout)

  // Expose the accounts and a function to refresh them manually if needed
  const refreshAccounts = async () => {
    try {
      setLoading(true);
      if (auth && auth.user) {
        const accountsData = await fetchBankAccounts();
        setAccounts(accountsData);
      } else {
        setAccounts(defaultGuestAccounts); // Reset to default guest accounts when refreshing as guest
      }
      setError(null);
    } catch (err) {
      console.error('Error refreshing bank accounts:', err);
      setError('Failed to refresh accounts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountsContext.Provider value={{ accounts, refreshAccounts, loading, error }}>
      {children}
    </AccountsContext.Provider>
  );
};
