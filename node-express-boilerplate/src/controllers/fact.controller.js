// controllers/factController.js
const { fetchAccounts, getTransactions } = require('./plaid.controller'); // Assuming this service exists to fetch bank accounts
const BankAccount = require('../models/bankAccount.model');
const accountPropertyMapping = {
  balance: 'balances.current',
  available: 'balances.available',
  limit: 'balances.limit',
  current: 'balances.current',
  currency: 'balances.iso_currency_code',
};
const moment = require('moment'); // For date manipulation
const { mongoose } = require('mongoose');
const { getExchangeRate } = require('../services/exchangeRateService');

const toProperCase = (str) => {
  const exceptions = ['of', 'the', 'and', 'in', 'on', 'at', 'with', 'a', 'an'];

  return str
    .split('_') // Split on underscores
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      // Capitalize the first word and non-exception words
      if (index === 0 || !exceptions.includes(lowerWord)) {
        return word.charAt(0).toUpperCase() + lowerWord.slice(1);
      }
      return lowerWord;
    })
    .join(' '); // Join them back with spaces
};

const calculateExpenses = async (account, params, timeframe) => {
  try {
    const transactions = account.transactions;

    // Define start date based on the timeframe
    const startDate = getStartDate(timeframe);

    // Filter transactions by date and category
    const totalExpenses = transactions.reduce((sum, transaction) => {
      const transactionDate = moment(transaction.date);

      if (transactionDate.isAfter(startDate) && shouldCountTransaction(transaction, params.categories)) {
        // Add positive amounts or negate negative amounts
        return sum + (transaction.amount > 0 ? transaction.amount : -1 * transaction.amount);
      }
      return sum;
    }, 0);

    return totalExpenses;
  } catch (error) {
    console.error(`Error in calculateExpenses for account ${account.accountId}:`, error);
    throw new Error('Failed to calculate expenses');
  }
};

// Function to calculate start date based on the timeframe
const getStartDate = (timeframe) => {
  switch (timeframe) {
    case 'since_last_month':
      return moment().subtract(1, 'month').startOf('day');
    case 'since_1_week':
      return moment().subtract(1, 'week').startOf('day');
    case 'since_1_month':
      return moment().subtract(1, 'month').startOf('day');
    case 'since_1_year':
      return moment().subtract(1, 'year').startOf('day');
    case 'since_ytd':
      return moment().startOf('year');
    default:
      throw new Error(`Invalid timeframe: ${timeframe}`);
  }
};

// Function to check if the transaction matches the categories from params
const shouldCountTransaction = (transaction, categories) => {
  const { personal_finance_category: pfc } = transaction;

  if (pfc && categories.includes(pfc.primary)) {
    return true;
  }
  if (pfc && categories.includes(pfc.detailed)) {
    return true;
  }

  return false;
};


const convertToUSD = async (value, currency) => {
  try {
    // Fetch the exchange rate for the provided currency
    const rateData = await getExchangeRate(currency.toUpperCase());

    // If no rate is found for the currency, assume it's already in USD
    const rate = rateData ? rateData.rate : 1;

    // Convert the value to USD using the exchange rate
    const convertedValue = value / rate;

    console.log(`Converted ${value} ${currency} to ${convertedValue} USD using rate ${rate}`);

    return convertedValue;
  } catch (error) {
    console.error(`Error converting ${value} from ${currency} to USD:`, error);
    throw new Error('Currency conversion failed.');
  }
};

const isIncomeTransaction = (transaction, incomeType, params) => {
  const { personal_finance_category: pfc } = transaction;

  if (!pfc) return false;

  if (pfc.primary !== 'INCOME') {
    return false;
  }

  if (incomeType === 'total') {
    return true;
  } else if (incomeType === 'from') {
    return params.incomes.includes(pfc.detailed);
  }

  return false;
};

const calculateIncome = async (account, params, timeframe, incomeType) => {
  try {
    const transactions = account.transactions;

    const startDate = getStartDate(timeframe);

    const totalIncome = transactions.reduce((sum, transaction) => {
      const transactionDate = moment(transaction.date);

      if (transactionDate.isAfter(startDate) && isIncomeTransaction(transaction, incomeType, params)) {
        return sum + (transaction.amount > 0 ? transaction.amount : 0);
      }
      return sum;
    }, 0);

    return totalIncome;
  } catch (error) {
    console.error(`Error in calculateIncome for account ${account.accountId}:`, error);
    throw new Error('Failed to calculate income');
  }
};


/*
In this function we pass in the userId, the factString, and any potential params to find the 
*/
exports.getFactValue = async (userId, factString, params) => {
  try {
    //console.log("getFactValue", userId, factString, params);

    if (factString === "custom_value") {
      // Check for currency in params; default to USD if not provided
      const currency = params?.currency || "USD";

      if (params.customValue === null || params.customValue === undefined) {
        params.customValue = 0;
      }

      // Convert the custom value to USD using the skeleton function
      const convertedValue = convertToUSD(params.customValue, currency);

      return convertedValue;
    }
    // Split the fact string into its components (e.g., "bank_of_america/plaid_checking_0000/balances")
    const tokens = factString.split('/');
    if (tokens.length < 4) {
      throw new Error('Invalid fact string format.');
    }

    const factBankName = tokens[0];
    const factAccountString = tokens[1];
    const property = tokens[2]; 
    const subProperty = tokens[3];
    //    const [factBankName, factAccountString, property, subProperty] = factString.split('/');

    if (!factBankName || !factAccountString || !property) {
      throw new Error('Invalid fact string format.');
    }

    // Normalize the bank name
    const bankName = toProperCase(factBankName); // Convert "bank_of_america" to "Bank Of America"

    // Extract the account name and mask by slicing
    const accountName = toProperCase(factAccountString.slice(0, -5)); // Account name is the part before the last 5 characters
    const accountMask = factAccountString.slice(-4); // Last 4 characters represent the mask

    // Fetch the account from the database based on bank name, account name, and mask
    //console.log("account query:", userId, bankName, accountName, accountMask);
    const account = await BankAccount.findOne({
      userId: userId,
      bankName: bankName,
      accountName: accountName,
      mask: accountMask,
    });
    //console.log("fetched account", account);

    if (!account) {
      throw new Error(`Account not found for user ID ${userId}, bank name ${bankName}, account name ${accountName} with mask {${accountMask}}.`);
    }

    // If the property is "balances", return the corresponding balance value
    if (property === 'balances') {
      if (!subProperty || !accountPropertyMapping[subProperty]) {
        throw new Error(`Invalid sub-property for balances: ${subProperty}`);
      }
      //console.log("Returning account property with subproperty", subProperty, account.balances[subProperty]);
      return account.balances[subProperty]; // Return the balance property
    }

    // If the property is "expenses", calculate expenses based on categories and timeframe
    if (property === 'expenses') {
      if (!params || !params.categories || !Array.isArray(params.categories) || params.categories.length === 0) {
        throw new Error('Categories are required to calculate expenses.');
      }

      const expenseTimeframe = subProperty; // This could be 'since_last_month', 'since_1_week', etc.
      const totalExpenses = await calculateExpenses(account, params, expenseTimeframe);
      return totalExpenses;
    }

    if (property === 'income') {
      if (tokens.length < 5) {
        throw new Error('Invalid fact string format for income.');
      }
    
      const incomeType = tokens[3]; // 'total' or 'from'
      const timeframe = tokens[4]; // 'since_1_week', etc.
    
      if (!incomeType || !timeframe) {
        throw new Error('Invalid fact string format for income.');
      }
    
      if (incomeType === 'total') {
        // Calculate total income
        const totalIncome = await calculateIncome(account, params, timeframe, 'total');
        return totalIncome;
      } else if (incomeType === 'from') {
        if (!params || !params.incomes || !Array.isArray(params.incomes) || params.incomes.length === 0) {
          throw new Error('Incomes are required to calculate income from specific sources.');
        }
        // Calculate income from specific sources
        const totalIncome = await calculateIncome(account, params, timeframe, 'from');
        return totalIncome;
      } else {
        throw new Error(`Invalid income type: ${incomeType}`);
      }
    }

    throw new Error(`Unsupported property type: ${property}`);

  } catch (error) {
    console.error(`Error in getFactValue for user ID ${userId}, fact string ${factString}:`, error);
    throw new Error('Failed to get fact value');
  }
};



const generateFacts = (bankAccounts) => {
  //console.log("Generating facts");
  const facts = {};

  Object.keys(bankAccounts).forEach((bankName) => {
    bankAccounts[bankName].forEach((account) => {
      if (account.type === 'depository') {
        Object.keys(accountPropertyMapping).forEach((property) => {
          const factName = `${bankName.toLowerCase().replace(/\s+/g, '_')} ${account.name.toLowerCase().replace(/\s+/g, '_')}_{${account.mask}} ${property}`;
          const factPath = accountPropertyMapping[property];
          const factValue = eval(`account.${factPath}`);
          facts[factName] = factValue;
        });
      }
    });
  });

  return facts;
};

exports.getUserFacts = async (req, res) => {
  console.log("reached");
  const userId = req.params.userId; // Access the userId from the URL
  console.log("User ID:", userId);
  try {
    // Fetch bank accounts using the refactored fetchAccounts function
    const bankAccounts = await fetchAccounts(userId);
    //console.log("bank accounts:", bankAccounts);
    
    if (!bankAccounts || bankAccounts.length === 0) {
      return res.status(404).json({ error: 'No bank accounts found for this user' });
    }

    const facts = generateFacts(bankAccounts);
    res.status(200).json(facts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFactTree = async (req, res) => {
  console.log("Fetching fact tree...");
  try {
    const userId = req.user.id;
    console.log("User ID:", userId);

    const bankAccounts = await fetchAccounts(userId);
    //console.log("Fetched bank accounts:", JSON.stringify(bankAccounts, null, 2));

    if (!bankAccounts || bankAccounts.length === 0) {
      console.log("No bank accounts found for this user.");
      return res.status(404).json({ error: 'No bank accounts found for this user' });
    }

    const factTree = getFactTree(bankAccounts);
    //console.log("Generated fact tree:", JSON.stringify(factTree, null, 2));
    
    res.status(200).json(factTree);
  } catch (error) {
    console.error("Error fetching fact tree:", error);
    res.status(500).json({ error: error.message });
  }
};

const getFactTree = (bankAccounts) => {
  const factTree = [];
  
  // Define categories (you can expand this list as needed)
  const categories = [
    { label: 'Category 1', value: 'category_1' },
    { label: 'Category 2', value: 'category_2' },
    { label: 'Category 3', value: 'category_3' },
  ];

  // Define timing options, each leading to the same set of categories
  const timings = [
    { label: 'Last Rule Check', value: 'last_rule_check'},
    { label: 'Since 1 Week', value: 'since_1_week'},
    { label: 'Since 1 Month', value: 'since_1_month'},
    { label: 'Since 1 Year', value: 'since_1_year'},
    { label: 'Since Y2D', value: 'since_ytd'},
  ];

  const incomes = [
    {label: 'Total', value: 'total', children: timings},
    {label: 'From', value: 'from', children: timings}
  ]

  try {
    // Iterate over each bank in the bankAccounts object
    Object.keys(bankAccounts).forEach(bankName => {
      console.log(`Processing bank: ${bankName}`);
      const bankNode = {
        label: bankName, // Bank Name (e.g., "Bank of America")
        value: bankName.toLowerCase().replace(/\s+/g, '_'), // Normalized value for the bank
        children: [] // Array to hold the accounts under this bank
      };

      bankAccounts[bankName].forEach(account => {
        console.log(`Processing account: ${account.name} {${account.mask}}`);

        // Only include accounts of type 'depository'
        if (account.type === 'depository') {
          const accountNode = {
            label: `${account.name} {${account.mask}}`, // Account label (e.g., "Checkings {0000}")
            value: `${account.name.toLowerCase().replace(/\s+/g, '_')}_${account.mask}`, // Normalized value for the account
            children: [
              { label: 'Balances', value: 'balances', children: [
                { label: 'Balance', value: 'balance' }, // Hard-coded properties
                { label: 'Limit', value: 'limit' },
                { label: 'Current', value: 'current' },
                { label: 'Available', value: 'available' },
              ]},
              { label: 'Expenses', value: 'expenses', children: timings },
              { label: 'Income', value: 'income', children: incomes}
            ]
          };

          bankNode.children.push(accountNode);
        } else {
          console.log(`Skipping non-depository account: ${account.name} {${account.mask}}`);
        }
      });

      // Only add the bank node if it has accounts under it
      if (bankNode.children.length > 0) {
        factTree.push(bankNode);
      }
    });

    factTree.push({
      label: 'Custom Value', // Custom Value label
      value: 'custom_value', // Normalized value for custom
      children: [], // No children for custom value
    });

    //console.log("Final fact tree structure:", JSON.stringify(factTree, null, 2));
    return factTree;
  } catch (error) {
    console.error("Error generating fact tree:", error);
    throw new Error("Failed to generate fact tree");
  }
};
