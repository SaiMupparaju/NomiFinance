import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Engine } from "../json-rules-engine/src/json-rules-engine";
import { fetchBankAccounts } from '../utils/plaid_api'; // Adjust the import path
import { all } from 'axios';

function TestPage() {
  const [message, setMessage] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [accountProperties, setAccountProperties] = useState([]);
  const [accountIndexMap, setAccountIndexMap] = useState({});

  const accountPropertyMapping = {
    balance: 'balances.current',
    available: 'balances.available',
    limit: 'balances.limit',
    currency: 'balances.iso_currency_code'
  };

  useEffect(() => {
    const getBankAccounts = async () => {
      try {
        const accounts = await fetchBankAccounts();
        setBankAccounts(accounts);
        const indexMap = accounts.reduce((map, account, index) => {
          const key = `${account.name} {${account.mask}}`;
          map[key] = index;
          return map;
        }, {});
        setAccountIndexMap(indexMap);

        const properties = accounts.flatMap(account => [
          `${account.name} ${account.mask} balance`,
          `${account.name} ${account.mask} available`,
          `${account.name} ${account.mask} limit`,
          `${account.name} ${account.mask} currency`
        ]);

        setAccountProperties(properties);
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
      }
    };

    getBankAccounts();
  }, []);

  useEffect(() => {
    console.log("bank accounts updated:", bankAccounts);
    console.log("index map updated:", accountIndexMap);
    console.log("account props updated:", accountProperties);
  }, [bankAccounts, accountIndexMap, accountProperties]);

  useEffect(() => {
    async function start() {
      const engine = new Engine();
      const facts = {};

      // Dynamically generate facts for each account property
      bankAccounts.forEach((account, index) => {
        Object.keys(accountPropertyMapping).forEach((property) => {
          const factName = `${account.name} {${account.mask}} ${property}`;
          const factPath = accountPropertyMapping[property];
          const factValue = eval(`account.${factPath}`);
          facts[factName] = factValue;
        });
      });

      console.log("Generated facts:", facts);


      const engineParam = {
        "conditions": {
          "all": 
            [
              {
                "all": [{
                  "all": [
                    {
                      "all": [
                        {
                          "fact": "Plaid Checking {0000} balance",
                          "operator": "equal",
                          "value": {
                            "fact": "Plaid Checking {0000} balance"
                          }
                        }
                      ],
                      "ifOP": "all"
                    }
                  ]
                }],
                "operator": "AND"
              }
            ]
          
        },
        "event": {
          "type": "Notify Email",
          "params": {
            "emails": [
              "saivamsim26@gmail.com"
            ],
            "phone_numbers": [],
            "message": "Your notification message here."
          }
        }
      }

      // Add an example condition using one of the generated facts
      if (Object.keys(facts).length > 0) {
        engine.addRule(engineParam);
      }

      // Run the engine with the generated facts
      const { events } = await engine.run(facts);

      // Update the state with the message
      if (events.length > 0) {
        setMessage(events[0].params.message || events[0].params.data);
      } else {
        setMessage('No events triggered');
      }
    }

    start();
  }, [bankAccounts]); // Run this useEffect whenever bankAccounts changes

  return (
    <Container className="text-center p-5">
      <h1>Test Page</h1>
      <p>{message}</p>
    </Container>
  );
}

export default TestPage;
