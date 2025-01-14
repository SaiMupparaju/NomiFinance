// src/pages/components/PaycheckApplet.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';

function PaycheckApplet({ onSelect }) {
  const applet = {
    id: 'paycheck-notification',
    title: 'Get Notified When Paycheck Arrives',
    icon: '💰',
    inputs: [
      {
        id: 'account',
        label: 'Select Account',
        type: 'accountSelect',
        required: true
      },
      {
        id: 'amount',
        label: 'Minimum Amount',
        type: 'number',
        required: true,
        defaultValue: 1000
      }
    ],
    generateRule: (inputs) => ({
      conditions: {
        all: [{
          fact: `${inputs.account}/income/total/since_1_week`,
          operator: 'greaterThan',
          value: inputs.amount
        }]
      },
      event: {
        type: 'Notify Text',
        params: {
          message: `Paycheck received: $${inputs.amount}`
        }
      }
    })
  };

  return (
    <Card className="h-100 shadow-sm hover-shadow">
      <Card.Body className="d-flex flex-column align-items-center text-center p-4">
        <div className="mb-3">
          <span style={{ fontSize: '2.5rem' }}>{applet.icon}</span>
        </div>
        <h4 className="mb-4 fw-bold">
          {applet.title}
        </h4>
        <div className="mt-auto">
          <Button 
            variant="primary"
            onClick={() => onSelect(applet)}
            className="px-4"
          >
            Use Template
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default PaycheckApplet;