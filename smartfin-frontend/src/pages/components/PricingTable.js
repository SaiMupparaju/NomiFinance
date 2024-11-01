import React from 'react';
import { Helmet } from 'react-helmet';
import {useAuth} from '../../contexts/AuthContext';

function PricingTable() {

    const {auth} = useAuth();
    return (
    <div>
        <Helmet>
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        </Helmet>
        <stripe-pricing-table pricing-table-id="prctbl_1Q9yKaFbGvhl0lO077dFNTGG"
        publishable-key="pk_test_51Q74V1FbGvhl0lO07hE1gQ7N8T2ejNIphVf2BsJcmYLm15IfJDfRQ7SBsEG6LAWkScHD3NtzK8scMacLLn9V6lEV00qBGkCE6n"
        client-reference-id={auth.user.id} >
        </stripe-pricing-table> 
    </div>
    );
}

export default PricingTable;