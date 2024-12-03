import React from 'react';
import { Helmet } from 'react-helmet';
import {useAuth} from '../../contexts/AuthContext';

function PricingTable() {

    const id = process.env.REACT_APP_STRIPE_PRICING_TABLE_ID
    const key = process.env.REACT_APP_STRIPE_PRICING_TABLE_KEY

    const {auth} = useAuth();
    return (
    <div>
        <Helmet>
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        </Helmet>
        <stripe-pricing-table pricing-table-id={id}
        publishable-key={key} 
        client-reference-id={auth.user.id} >
        </stripe-pricing-table> 
    </div>
    );
}

export default PricingTable;