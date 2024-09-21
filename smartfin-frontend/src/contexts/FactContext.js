// FactContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFactTree, getUserFacts } from '../utils/fact_api';
import { useAuth } from '../contexts/AuthContext';

const FactContext = createContext();

export const useFact = () => useContext(FactContext);

export const FactProvider = ({ children }) => {
    const { auth } = useAuth();
    const [factTree, setFactTree] = useState(getGuestFactTree());
    const [userFacts, setUserFacts] = useState({});

    useEffect(() => {
        console.log("user fact tree", factTree);
    }, factTree);

    useEffect(() => {
        const fetchFactTreeAndFacts = async () => {
            if (auth.user) {
                try {
                    const factTreeData = await getFactTree(auth.user.id);
                    setFactTree(factTreeData);

                    const userFactsData = await getUserFacts(auth.user.id);
                    setUserFacts(userFactsData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };
        
        if(auth.user && auth.user.isEmailVerified){
            fetchFactTreeAndFacts();
        } else { 

        }
    }, [auth]);

    return (
        <FactContext.Provider value={{ factTree, userFacts }}>
            {children}
        </FactContext.Provider>
    );
};

const getGuestFactTree = () => {
    return [
        {
            label: 'Guest Bank',
            value: 'guest_bank',
            children: [
                {
                    label: 'Guest Account {0000}',
                    value: 'guest_account_0000',
                    children: [
                        { label: 'Balances', value: 'balances' , 
                            children: [
                                {label: 'Balance', value: 'balance'},
                                {label: 'Limit', value: 'limit'},
                                {label: 'Current', value: 'current'}, 
                                {label: 'Available', value: 'available'}
                            ]
                        },
                        { label: 'Expenses', value: 'expenses', children: [
                            {label: 'Last Rule Check', value: 'last_rule_check'},
                            {label: 'Since 1 Week', value: 'since_1_week'},
                            {label: 'Since 1 Month', value: 'since_1_month'},
                            {label: 'Since 1 Year', value: 'since_1_year'},
                            {label: 'Since Y2D', value: 'since_ytd'}
                        ]},
                    ],
                },
            ],
        },
        {
            label: 'Custom Value',
            value: 'custom_value',
            children: [],
        },
    ];
};
