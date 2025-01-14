// src/pages/components/AppletConfigs.js

// 1) The helper that replaces placeholders in ruleConfig
export const processAppletConfig = (config, userInputs) => {
  // Stringify -> replace -> parse
  let ruleConfig = JSON.stringify(config);
  Object.entries(userInputs).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
    ruleConfig = ruleConfig.replace(placeholder, value);
  });
  return JSON.parse(ruleConfig);
};

// 2) The actual applet definitions
export const appletConfigs = {
  paycheck: {
    id: 'paycheck',
    icon: '💰',
    title: 'Get Notified When Paycheck Arrives',

    ruleConfig: {
      // The final name you want saved to the DB
      name: 'Get Notified When Paycheck Arrives',

      // NESTED conditions shape:
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // We'll check if "income since 1 week" is greater than a custom value
                    fact: '${accountPath}/income/total/since_1_week',
                    operator: 'greaterThan',
                    // Instead of passing the user's numeric input as a fact string,
                    // we now use "custom_value" to tell the back-end to treat it as a literal number.
                    value: {
                      fact: 'custom_value'
                    },
                    // This "params" object is used by fact.controller.js
                    // to figure out how much that custom_value actually is and in which currency.
                    params: {
                      customValue: '${amount}',
                      currency: '${currency}'
                    }
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },

      // The event object: user’s chosen notification
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [],
          // For example, mention the {amount} + {currency} in the text
          message: 'Paycheck is here! Amount at least: ${amount} ${currency}'
        }
      },

      // The schedule defaults to your “ontruth” variant, but you can change as needed
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth'
      }
    },

    // Inputs define what the user needs to provide
    inputs: [
      {
        key: 'accountPath',
        label: 'Select the Account Your Paycheck will go to',
        type: 'accountSelect'
      },
      {
        key: 'amount',
        label: 'Around how much will the paycheck be (you can round down)',
        type: 'number',       // user enters any non-negative integer
        defaultValue: 0
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',       // user picks from a dropdown
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      }
    ],

    // 3) The generateRule() method calls processAppletConfig, replacing placeholders
    generateRule: function (formValues) {
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },
  
  // alwaysTrue: {
  //   id: 'alwaysTrue',
  //   icon: '🔔',
  //   title: 'Always True Rule',
    
  //   ruleConfig: {
  //     // The final name you want saved to the DB
  //     name: 'Always True Rule',

  //     // NESTED conditions shape
  //     conditions: {
  //       all: {
  //         conditions: {
  //           all: [
  //             {
  //               all: [
  //                 {
  //                   // E.g., "bank_of_america/plaid_checking_0000/balances/balance"
  //                   fact: '${accountPath}/balances/balance',
  //                   operator: 'equal',
  //                   // It's "equal" to the same path → so it always passes
  //                   value: {
  //                     fact: '${accountPath}/balances/balance'
  //                   },
  //                   params: null
  //                 }
  //               ],
  //               ifOP: 'all'
  //             }
  //           ]
  //         },
  //         operator: 'AND'
  //       }
  //     },

  //     event: {
  //       type: 'Notify Text',
  //       params: {
  //         emails: [],
  //         phone_numbers: [
  //           '+15712532500' // Hard-coded phone number from your example
  //         ],
  //         message: '123'
  //       }
  //     },

  //     schedule: {
  //       events: [],
  //       view: 'timeGridWeek',
  //       frequency: 'daily',
  //       userLocalTimeZone: 'America/New_York',
  //       date: null,
  //       dailyTimes: [
  //         // The ISO string from your example
  //         '2024-12-30T04:30:00.000Z'
  //       ],
  //       weeklyTimes: null,
  //       monthlyOptions: null,
  //       customTimes: null
  //     }
  //   },

  //   // Only one user input: the account path
  //   inputs: [
  //     {
  //       key: 'accountPath',
  //       label: 'Select Account',
  //       type: 'accountSelect'
  //     }
  //   ],

  //   // Replaces placeholders (like ${accountPath}) in ruleConfig
  //   generateRule: function (formValues) {
  //     return processAppletConfig(this.ruleConfig, formValues);
  //   }
  // },

    // Existing paycheck, alwaysTrue, etc...
  
  leisureExpenses: {
    id: 'leisureExpenses',
    icon: '🎉',
    title: 'Check Leisurely Spending',

    ruleConfig: {
      name: 'Leisurely Expenses Check',

      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // We'll insert "since_1_week" or "since_1_month" at runtime:
                    fact: '${accountPath}/expenses/${timeFrameSnippet}',
                    operator: 'greaterThanInclusive',
                    // We'll treat user-specified number as custom_value
                    value: {
                      fact: 'custom_value',
                      params: {
                        customValue: '${amount}',
                        currency: '${currency}'
                      }
                    },
                    // The specific categories we consider “leisure”
                    params: {
                      categories: [
                        'ENTERTAINMENT',
                        'FOOD_AND_DRINK'
                      ]
                    }
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },

      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [],
          // E.g. let the user see the threshold
          message: 'Leisure expenses exceeded ${amount} ${currency} this ${timeFrameName}!'
        }
      },

      // The schedule: once daily, user picks the timezone/times if they like
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'daily',
        timeZone: 'America/Los_Angeles'
      }
    },

    // The user must provide:
    // 1) The account (accountPath)
    // 2) The amount threshold (amount)
    // 3) The currency (currency)
    // 4) The timeframe (week or month)
    inputs: [
      {
        key: 'accountPath',
        label: 'Which one of your  accounts should this check?',
        type: 'accountSelect'
      },
      {
        key: 'amount',
        label: 'Do you want us to alert you when your expenses are over a certain amount',
        type: 'number',
        defaultValue: 0
      },
      {
        key: 'currency',
        label: 'What currency is the above value?',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      },
      {
        key: 'timeFrame',
        label: 'Time Frame',
        type: 'select',
        options: [
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' }
        ],
        required: true
      }
    ],

    generateRule: function(formValues) {
      // We must convert 'week' => 'since_1_week' or 'month' => 'since_1_month'
      let timeFrameSnippet;
      let timeFrameName; // For the message text

      if (formValues.timeFrame === 'week') {
        timeFrameSnippet = 'since_1_week';
        timeFrameName = 'week';
      } else {
        // default to 'month'
        timeFrameSnippet = 'since_1_month';
        timeFrameName = 'month';
      }

      // We’ll temporarily store them so we can do placeholders:
      const updatedValues = {
        ...formValues,
        timeFrameSnippet,
        timeFrameName
      };

      // Now run our processAppletConfig using updatedValues
      const finalRule = processAppletConfig(this.ruleConfig, updatedValues);
      return finalRule;
    }
  },

  expensesThisMonth: {
    id: 'expensesThisMonth',
    icon: '💰',
    title: 'Expenses This Month',
    description: 'Get an Alert when your expenses this month go over a certain value',

    ruleConfig: {
      name: 'Leisurely Expenses Check',

      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // We'll insert "since_1_week" or "since_1_month" at runtime:
                    fact: '${accountPath}/expenses/since_1_month',
                    operator: 'greaterThanInclusive',
                    // We'll treat user-specified number as custom_value
                    value: {
                      fact: 'custom_value',
                      params: {
                        customValue: '${amount}',
                        currency: '${currency}'
                      }
                    },
                    // The specific categories we consider “leisure”
                    params: {
                      categories: [
                        "TRANSFERS_OUT",
                        "LOAN_PAYMENTS",
                        "BANK_FEES",
                        "ENTERTAINMENT",
                        "GENERAL_MERCHANDISE",
                        "MEDICAL",
                        "HOME_IMPROVEMENT",
                        'FOOD_AND_DRINK'
                      ]
                    }
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },

      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [],
          // E.g. let the user see the threshold
          message: 'Leisure expenses exceeded ${amount} ${currency} this ${timeFrameName}!'
        }
      },

      // The schedule: once daily, user picks the timezone/times if they like
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'daily',
        timeZone: 'America/Los_Angeles'
      }
    },

    // The user must provide:
    // 1) The account (accountPath)
    // 2) The amount threshold (amount)
    // 3) The currency (currency)
    // 4) The timeframe (week or month)
    inputs: [
      {
        key: 'accountPath',
        label: 'Which one of your  accounts should this check?',
        type: 'accountSelect'
      },
      {
        key: 'amount',
        label: 'Do you want us to alert you when your expenses are over a certain amount',
        type: 'number',
        defaultValue: 0
      },
      {
        key: 'currency',
        label: 'What currency is the above value?',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      }
    ],

    generateRule: function(formValues) {
      // We must convert 'week' => 'since_1_week' or 'month' => 'since_1_month'
      let timeFrameSnippet;
      let timeFrameName; // For the message text

      if (formValues.timeFrame === 'week') {
        timeFrameSnippet = 'since_1_week';
        timeFrameName = 'week';
      } else {
        // default to 'month'
        timeFrameSnippet = 'since_1_month';
        timeFrameName = 'month';
      }

      // We’ll temporarily store them so we can do placeholders:
      const updatedValues = {
        ...formValues,
        timeFrameSnippet,
        timeFrameName
      };

      // Now run our processAppletConfig using updatedValues
      const finalRule = processAppletConfig(this.ruleConfig, updatedValues);
      return finalRule;
    }
  },

  lowBalanceAlert: {
    id: 'lowBalanceAlert',                 
    icon: '🔔',
    title: 'Low Balance Alert',
    description: 'Get a text when your account balance goes below a threshold.',
  
    hideExecuteSection: true, // Keep using the “ontruth” schedule from the JSON
  
    ruleConfig: {
      name: 'Low Balance Alert',
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    fact: '${accountPath}/balances/available',
                    operator: 'lessThanInclusive',
                    value: {
                      fact: 'custom_value',
                      params: {
                        customValue: '${threshold}',  
                        // <--- Moved from "USD" to a placeholder so the user can choose currency
                        currency: '${currency}'
                      }
                    },
                    params: null
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [
            '+15712532500'
          ],
          message: 'this is a sample message'
        }
      },
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth',
        timeZone: 'America/New_York'
      }
    },
  
    // Updated inputs to include currency
    inputs: [
      {
        key: 'accountPath',
        label: 'Which account do you want to watch?',
        type: 'accountSelect'
      },
      {
        key: 'threshold',
        label: 'Low Balance Threshold',
        type: 'number',
        defaultValue: 100
      },
      {
        key: 'currency',
        label: 'Currency for Threshold',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      }
    ],
  
    generateRule: function(formValues) {
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },

  compareAccounts: {
    id: 'compareAccounts',
    icon: '🔗',
    title: 'Compare Two Accounts',
    description: 'Alerts you when one account’s available balance is at least as large as another account’s.',
  
    // Decide whether you want to hide the Execute schedule panel
    // Since your custom JSON has `frequency: "ontruth"`, we can hide it:
    hideExecuteSection: true,
  
    ruleConfig: {
      name: 'Compare Accounts',
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // The "fact" is the first account’s balance
                    fact: '${accountPath1}/balances/available',
                    operator: 'greaterThanInclusive',
                    // The “value” is the second account’s balance
                    value: {
                      fact: '${accountPath2}/balances/available'
                    },
                    params: null
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [
            '+15712532500'
          ],
          message: 'test tes test test'
        }
      },
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth',
        timeZone: 'America/New_York'
      }
    },
  
    // The user must specify *two* accounts, so we have two accountSelect inputs
    inputs: [
      {
        key: 'accountPath1',
        label: 'Which is the first account you want to compare? (We will notify you when the first account has more than the second)',
        type: 'accountSelect'
      },
      {
        key: 'accountPath2',
        label: 'Which is the second account to compare?',
        type: 'accountSelect'
      }
    ],
  
    generateRule: function(formValues) {
      // Just run processAppletConfig, which replaces the placeholders
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },

  miscIncomeAlert: {
    id: 'miscIncomeAlert',
    icon: '💸',
    title: 'Alert for Misc Income Sources',
    description: 'Get an SMS alert whenever you receive pension or other “misc” income sources.',
  
    // We’ll hide the scheduling from the user since we want to lock “ontruth”
    hideExecuteSection: true,
  
    ruleConfig: {
      name: 'Get Income Alert about Misc. Income Source',
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // Param-ify the account path
                    fact: '${accountPath}/income/from/in_last_day',
                    operator: 'greaterThanInclusive',
                    // Hard-code the threshold to 0
                    value: {
                      fact: 'custom_value',
                      params: {
                        customValue: 0,
                        currency: 'USD'
                      }
                    },
                    // “incomes” array remains as is
                    params: {
                      incomes: [
                        'INCOME_OTHER_INCOME',
                        'INCOME_RETIREMENT_PENSION'
                      ]
                    }
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [
            '+15712532500'
          ],
          message: 'gaaah'  // from your custom rule’s message
        }
      },
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth',
        timeZone: 'America/New_York'
      }
    },
  
    // Only one input for the user: which account to monitor
    inputs: [
      {
        key: 'accountPath',
        label: 'Which account do you want to watch for miscellaneous incomes?',
        type: 'accountSelect'
      }
    ],
  
    generateRule: function(formValues) {
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },

  largeTransactionAlert: {
    id: 'largeTransactionAlert',
    icon: '⚠️',
    title: 'Alert Me of Large Transactions',
    description: 'Receive a text message when a single transaction exceeds a chosen threshold.',
  
    // We'll hide the "Execute" schedule panel in the UI,
    // because we’re locking the frequency to "ontruth."
    hideExecuteSection: true,
  
    ruleConfig: {
      name: 'Large Transaction Alert',
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    fact: '${accountPath}/contains/large_transaction',
                    operator: 'greaterThanInclusive',
                    value: {
                      fact: 'custom_value',
                      params: {
                        // We'll replace ${amount} at runtime with the user’s input
                        customValue: '${amount}',
                        // Now also replace the currency so it’s user-defined
                        currency: '${currency}'
                      }
                    },
                    params: null
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [],
          // Now the message references both the amount and the currency placeholders
          message: 'Alert! A transaction above ${amount} ${currency} occurred.'
        }
      },
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth',
        timeZone: 'America/New_York'
      }
    },
  
    // Now we have three inputs:
    // (1) accountPath, (2) amount, and (3) currency
    inputs: [
      {
        key: 'accountPath',
        label: 'Select which account to watch for large transactions',
        type: 'accountSelect'
      },
      {
        key: 'amount',
        label: 'Alert me if a single transaction exceeds this amount',
        type: 'number',
        defaultValue: 0
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      }
    ],
  
    // This method merges user form inputs into the placeholders in `ruleConfig`.
    generateRule: function (formValues) {
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },


  largeForeignTransactionAlert: {
    id: 'largeForeignTransactionAlert',
    icon: '🌎',
    title: 'Alert Me of Large Foreign Transactions',
    description: 'Receive a text message when a single foreign transaction exceeds a chosen threshold in the last 32 hours.',

    // We’ll keep the schedule panel hidden, forcing an "ontruth" frequency
    hideExecuteSection: true,

    // The rule config
    ruleConfig: {
      name: 'Large Foreign Transaction Alert',
      conditions: {
        all: {
          conditions: {
            all: [
              {
                all: [
                  {
                    // This is the “fact” we’ll parse in fact.controller:
                    fact: '${accountPath}/contains/large_foreign_transaction',
                    operator: 'greaterThanInclusive',
                    // This is the numeric threshold, stored as custom_value
                    value: {
                      fact: 'custom_value',
                      params: {
                        customValue: '${amount}',
                        currency: '${currency}'
                      }
                    },
                    // This is how we pass the user’s homeCountry to the rule’s params
                    params: {
                      homeCountry: '${homeCountry}'
                    }
                  }
                ],
                ifOP: 'all'
              }
            ]
          },
          operator: 'AND'
        }
      },
      event: {
        type: 'Notify Text',
        params: {
          emails: [],
          phone_numbers: [],
          message: 'Foreign transaction above ${amount} ${currency} detected!'
        }
      },
      schedule: {
        events: [],
        view: 'timeGridWeek',
        userLocalTimeZone: 'America/New_York',
        date: null,
        dailyTimes: null,
        weeklyTimes: null,
        monthlyOptions: null,
        customTimes: null,
        frequency: 'ontruth',     // Force "ontruth"
        timeZone: 'America/New_York'
      }
    },

    // The user must specify:
    // 1) accountPath,
    // 2) amount,
    // 3) currency,
    // 4) homeCountry
    inputs: [
      {
        key: 'accountPath',
        label: 'Select which account to watch for large foreign transactions',
        type: 'accountSelect'
      },
      {
        key: 'amount',
        label: 'Alert me if a single foreign transaction exceeds this amount',
        type: 'number',
        defaultValue: 0
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        required: true
      },
      {
        key: 'homeCountry',
        label: 'Your Home Country',
        type: 'select',
        options: ['US', 'CA', 'GB', 'AU', 'IN', 'FR', 'DE', 'JP'],
        required: true
      }
    ],

    // The generateRule() merges user input placeholders into ruleConfig
    generateRule: function(formValues) {
      return processAppletConfig(this.ruleConfig, formValues);
    }
  },
  


  
  
};

export default appletConfigs;
