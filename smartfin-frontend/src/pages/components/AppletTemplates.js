// src/pages/components/AppletTemplates.js
export const appletTemplates = {
  paycheckNotification: {
    id: 'paycheck-notification',
    title: 'Paycheck Alert',
    description: 'Get notified when your paycheck arrives',
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
  },
  lowBalanceAlert: {
    id: 'low-balance-alert',
    title: 'Low Balance Alert',
    description: 'Get notified when your balance drops below a threshold',
    icon: '⚠️',
    inputs: [
      {
        id: 'account',
        label: 'Select Account',
        type: 'accountSelect',
        required: true
      },
      {
        id: 'threshold',
        label: 'Alert Threshold',
        type: 'number',
        required: true,
        defaultValue: 100
      }
    ],
    generateRule: (inputs) => ({
      conditions: {
        all: [{
          fact: `${inputs.account}/balances/available`,
          operator: 'lessThan',
          value: inputs.threshold
        }]
      },
      event: {
        type: 'Notify Text',
        params: {
          message: `Warning: Balance below $${inputs.threshold}`
        }
      }
    })
  }
};

export default appletTemplates;