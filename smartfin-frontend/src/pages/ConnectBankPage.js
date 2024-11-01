import React , {useEffect, useState} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate } from 'react-router-dom';

function ConnectBankPage() {

    const navigate = useNavigate();
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
        onSuccess: (metadata) => {
            console.log("Plaid Link flow completed:", metadata);
            // No need to handle public_token here, backend handles the webhook
            // You may want to trigger a poll or a request to check if accounts are linked successfully
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

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-lg-6 col-md-8">
                    <div className="card card-custom">  {/* Using custom card class */}
                        <h2 className="text-center">Connect Your Bank Accounts</h2>
                        <p className="mt-3">Nomi lets you program your finances by connecting to at least one of your bank accounts!</p>
                        <p className="mt-3"> You can undo this at any time.</p>
                        <div className="d-flex justify-content-center mt-4">
                            <button onClick={handleConnect} className="btn btn-custom">Connect</button>  {/* Using custom button class */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConnectBankPage;
