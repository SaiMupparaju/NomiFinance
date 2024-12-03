// src/components/settings/UpdateAccounts.js

import React, { useState } from 'react'; 
import { Button, Accordion, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { usePlaidLink } from 'react-plaid-link';
import { FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance'; // Use axios for authenticated requests
import Swal from 'sweetalert2'; // Import SweetAlert2
import withReactContent from 'sweetalert2-react-content';
import './UpdateAccounts.css'; // Make sure to import the CSS file

const PlaidLinkUpdate = ({ linkToken, onSuccess, onExit }) => {
  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  return ready ? open() : null; // Automatically open the Plaid Link when ready
};

const UpdateAccounts = ({ bankAccounts }) => {
  const { auth } = useAuth(); // Get the current user's info
  const [linkTokens, setLinkTokens] = useState({}); // Mapping of bankName to { linkToken, fetchedAt }
  const [currentBank, setCurrentBank] = useState(null);
  const [newAccountLinkToken, setNewAccountLinkToken] = useState(null); // For new account link token
  const MySwal = withReactContent(Swal); // Initialize SweetAlert2 with ReactContent

  const handleUpdateAccount = async (bankName) => {
    const tokenInfo = linkTokens[bankName];
    const now = Date.now();
    const TOKEN_EXPIRATION_TIME = 3.5 * 60 * 60 * 1000; // 3.5 hours in milliseconds

    // Check if token is valid or fetch a new one if expired
    if (tokenInfo && now - tokenInfo.fetchedAt < TOKEN_EXPIRATION_TIME) {
      setCurrentBank(bankName);
    } else {
      try {
        const response = await axiosInstance.post('plaid/create_update_link_token', {
          userId: auth.user.id,
          bankName,
        });

        const { link_token } = response.data;
        if (link_token) {
          setLinkTokens((prevTokens) => ({
            ...prevTokens,
            [bankName]: {
              linkToken: link_token,
              fetchedAt: now,
            },
          }));
          setCurrentBank(bankName);
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Failed to Create Link Token',
            text: 'Unable to create the Plaid link token. Please try again later.',
          });
        }
      } catch (error) {
        console.error('Error updating account:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while updating the account.',
        });
      }
    }
  };

  const handleOnSuccess = (public_token, metadata) => {
    console.log('Plaid Link success:', metadata);
    // Optionally handle public_token exchange or refresh account list
    setCurrentBank(null);

    MySwal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Your account was successfully linked!',
    });
  };

  const handleOnExit = (err, metadata) => {
    if (err) {
      console.error('Plaid Link error:', err);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an issue with the Plaid link flow. Please try again.',
      });
    }
    console.log('Plaid Link exit:', metadata);
    setCurrentBank(null);
  };

  const handleAddNewAccount = async () => {
    try {
      const response = await axiosInstance.post('plaid/get-link-token', {
        userId: auth.user.id,
      });

      const { link_token } = response.data;
      if (link_token) {
        setNewAccountLinkToken(link_token); // Set token for new account linking
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Failed to Create Link Token',
          text: 'Unable to create the Plaid link token. Please try again later.',
        });
      }
    } catch (error) {
      console.error('Error fetching new account link token:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching the link token.',
      });
    }
  };

  return (
    <div className="update-accounts">
      <h5 className="mb-3">Your Connected Bank Accounts</h5>

      <Accordion>
        {bankAccounts &&
          Object.keys(bankAccounts).map((bankName, idx) => (
            <Accordion.Item eventKey={idx.toString()} key={bankName}>
              <Accordion.Header>
                <div className="d-flex align-items-center justify-content-between w-100">
                  <span className="bank-name">{bankName}</span>
                  <div className="d-flex align-items-center">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Update Account</Tooltip>}
                    >
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="update-button"
                        onClick={() => handleUpdateAccount(bankName)}
                      >
                        Update
                      </Button>
                    </OverlayTrigger>
                    {/* Display hazard icon if the bank needs an update */}
                    {bankAccounts[bankName].some(account => account.needsUpdate) && (
                      <FaExclamationTriangle className="text-warning ms-2" />
                    )}
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  {bankAccounts[bankName].map((account) => (
                    <ListGroup.Item key={account.account_id}>
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{account.name}</strong><strong>{account.name}</strong>
                          <div className="text-muted">{account.type}</div>
                          {account.balance && (
                            <div className="text-muted">Balance: ${account.balance.toFixed(2)}</div>
                          )}
                        </div>
                        {/* Optionally add account balance or other details */}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          ))}
      </Accordion>

      <Button variant="primary" className="mt-3" onClick={handleAddNewAccount}>
        Add New Account
      </Button>

      {/* Render Plaid Link for adding a new account */}
      {newAccountLinkToken && (
        <PlaidLinkUpdate
          linkToken={newAccountLinkToken}
          onSuccess={handleOnSuccess}
          onExit={handleOnExit}
        />
      )}

      {currentBank && linkTokens[currentBank] && (
        <PlaidLinkUpdate
          linkToken={linkTokens[currentBank].linkToken}
          onSuccess={handleOnSuccess}
          onExit={handleOnExit}
        />
      )}
    </div>
  );
};

export default UpdateAccounts;
