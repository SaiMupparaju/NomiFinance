import React , {useEffect, useState} from 'react';
import './styles/ConnectBankPage.css';
import { useAuth } from '../contexts/AuthContext';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate } from 'react-router-dom';
import {useAccounts} from '../contexts/AccountsContext';

function ConnectBankPage() {

    const navigate = useNavigate();
    const {refreshAccounts} = useAccounts();
    const { getLinkToken, linkToken, exchangePublicToken } = useAuth();
    const [isTokenFetched, setIsTokenFetched] = useState(false);
    const [publicToken, setPublicToken] = useState();

    // Fetch the link token only once when the component mounts
    useEffect(() => {
        if (!isTokenFetched) {
            getLinkToken()
                .then(() => setIsTokenFetched(true))
                .catch(error => console.error('Error fetching link token:', error));
        }
        console.log("link tok", linkToken);
    }, [getLinkToken, isTokenFetched]);

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: async (metadata) => {
            console.log("Plaid Link flow completed:", metadata);
            // No need to handle public_token here, backend handles the webhook
            // You may want to trigger a poll or a request to check if accounts are linked successfully
            await refreshAccounts();
            navigate('/home');  // Redirect to home or a success page
        },
        onExit: (err, metadata) => {
            // Handle exit without success if needed
            if (err) {
                console.error('Plaid Link encountered an error:', err);
            }
            console.log('Plaid Link exited. Metadata:', metadata);
        },
    });

    const handleConnect = () => {
        if (ready) {
            open();
        }
    };

    const handleDoThisLater = () => {
        navigate('/home');
      };

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-lg-6 col-md-8">
                    <div className="card card-custom">  {/* Using custom card class */}
                        <h2 className="text-center">Connect to Plaid</h2>
                        <p className="mt-3">Connecting to Plaid allows your Nomi rules to access your banking information as long as its useful to you. </p>
                        <p className="mt-3"> You can remove or update connections any time. </p>
                        <div className="d-flex justify-content-center mt-4">
                            <button onClick={handleConnect} className="btn btn-custom">Connect</button>  {/* Using custom button class */}
                        </div>
                    </div>
                </div>
            </div>
            <button
                onClick={handleDoThisLater}
                className="btn btn-secondary position-absolute do-this-later-button"
            > Do this later
            </button>
        </div>
    );
}

export default ConnectBankPage;
