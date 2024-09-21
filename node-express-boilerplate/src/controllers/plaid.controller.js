const { PlaidApi, PlaidEnvironments, Configuration, AccountsGetRequest } = require('plaid');
const User = require('../models/user.model'); // Update the path according to your project structure
const BankAccount = require('../models/bankAccount.model');
const LinkToken = require('../models/linkToken.model');
const { getBankNameByAccessToken } = require('../services/BankAccountService');

const PLAID_CLIENT_ID = "6674c87c3a3e2b001a826a0b";
const PLAID_SECRET = "137a6b2a2ac6bcb3906d29a4920892";
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const WEBHOOK = "https://c113-75-102-136-103.ngrok-free.app" //FIXME

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

 
const plaidClient = new PlaidApi(configuration);

const getUserToken = async function (userId) {
  try {
      const user = await User.findById(userId);
      if (!user) {
          throw new Error("User not found");
      }

      // Check if the user already has a Plaid user token
      if (user.plaidUserToken) {
          console.log(`User token already exists for user ID: ${userId}`);
          return user.plaidUserToken;
      }

      // If no user token exists, create a new one
      console.log(`Creating a new user token for user ID: ${userId}`);
      const request = {
          client_user_id: userId
      };

      const response = await plaidClient.userCreate(request);
      const userToken = response.data.user_token;

      // Save the new user token to the database
      await User.findByIdAndUpdate(userId, { plaidUserToken: userToken });
      console.log(`User token created and saved for user ID: ${userId}`);
      return userToken;
  } catch (error) {
      console.error("Error in getUserToken:", error);
      throw new Error("Failed to create user token");
  }
};

async function resetLogin(accessToken) {
  try {
    const response = await plaidClient.sandboxItemResetLogin({
      access_token: accessToken,
    });

    if (response.data.reset_login) {
      console.log('Login has been reset successfully.');
      return true;
    } else {
      console.log('Failed to reset login.');
      return false;
    }
  } catch (error) {
    console.error('Error resetting login:', error.response?.data || error.message);
    throw error;
  }
}

async function getUpdateLinkToken_forItem(userId, bankName) {
  try {
    // Find a bank account for the user and bank to get the access token
    const bankAccount = await BankAccount.findOne({ userId: userId, bankName: bankName });

    if (!bankAccount) {
      throw new Error('Bank account not found for the given user and bank.');
    }

    const accessToken = bankAccount.accessToken;

    const userToken = await getUserToken(userId);
    // Reset login for the Item (only in Sandbox environment)
    // console.log("calling reset Login");
    // resetLogin(accessToken);


    console.log('Login has been reset successfully.');

    // Create a link token for update mode
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId, // Ensure the user ID is a string
      },
      update: {
        account_selection_enabled: true
      },
      user_token: userToken,
      client_name: 'Plaid Test App', // Replace with your app's name
      products: ['auth', 'transactions'],
      language: 'en',        // Adjust as needed
      webhook: `${WEBHOOK}/v1/plaid/webhook`,
      redirect_uri: 'http://localhost:3000/home',
      access_token: accessToken,
      country_codes: ['US'], // Adjust as needed
    });


    const linkToken = linkTokenResponse.data.link_token;

    console.log('Link token created successfully.');

    return linkToken;
  } catch (error) {
    console.error('Error in getUpdateLinkToken_forItem:', error.response?.data || error.message);
    throw error;
  }
}

 
const getLinkToken = async function (req, response) {
    console.log('Plaid call received');
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
          return response.status(404).send({ message: "User not found" });
        }
        
        const clientUserId = user.id;

        const existingToken = await LinkToken.findOne({ userId: clientUserId }).sort({ createdAt: -1 });
        if (existingToken) {
          console.log('Returning existing link token for user:', clientUserId);
          return response.json({ link_token: existingToken.linkToken });
        }

        const userToken = await getUserToken(req.user.id);


        const plaidRequest = {
            user: {
                client_user_id: clientUserId,
            },
            user_token: userToken,
            client_name: 'Plaid Test App',
            enable_multi_item_link: true,
            products: ['auth','transactions'],
            language: 'en',
            redirect_uri: 'http://localhost:3000/home',
            webhook: `${WEBHOOK}/v1/plaid/webhook`, //MUST DO EVERY TIME LAUNCH
            country_codes: ['US'],
        };

        const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
        const linkToken = createTokenResponse.data.link_token;
        // Store the new LinkToken in the database
        await LinkToken.create({ linkToken, userId: clientUserId });
        console.log('New link token created for user:', clientUserId);
        response.json({ link_token: linkToken });
    } catch (error) {
        console.error("Error in getLinkToken:", error);
        response.status(500).send({ message: "Failed to create link token", error: error.toString() });
    }
};

const getUpdateLinkToken = async function (req, response) {
  console.log('Plaid call received');
  try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return response.status(404).send({ message: "User not found" });
      }


      const clientUserId = user.id;

      const existingToken = await LinkToken.findOne({ userId: clientUserId }).sort({ createdAt: -1 });
      if (existingToken) {
        console.log('Returning existing link token for user:', clientUserId);
        return response.json({ link_token: existingToken.linkToken });
      }

      const userToken = await getUserToken(req.user.id);


      const plaidRequest = {
          user: {
              client_user_id: clientUserId,
          },
          update: {
            user: true,
            item_ids: user.plaidAccessTokens
          },
          user_token: userToken,
          client_name: 'Plaid Test App',
          enable_multi_item_link: true,
          products: ['auth','transactions'],
          language: 'en',
          redirect_uri: 'http://localhost:3000/home',
          webhook: `${WEBHOOK}/v1/plaid/webhook`,
          country_codes: ['US'],
      };

      const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
      const linkToken = createTokenResponse.data.link_token;
      // Store the new LinkToken in the database
      await LinkToken.create({ linkToken, userId: clientUserId });
      console.log('New link token created for user:', clientUserId);
      response.json({ link_token: linkToken });
  } catch (error) {
      console.error("Error in getLinkToken:", error);
      response.status(500).send({ message: "Failed to create link token", error: error.toString() });
  }
};

const exchangePublicTokenCore = async function(publicToken, userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const plaidResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = plaidResponse.data.access_token;

    await User.findByIdAndUpdate(userId, {
      $push: { plaidAccessTokens: accessToken }, // assuming it's an array for multiple access tokens
    });

    return accessToken;
  } catch (error) {
    console.error("Error in exchangePublicTokenCore:", error);
    throw error;
  }
};

const exchangePublicToken = async function(req, res) {
  try {
    const { public_token } = req.body;
    const userId = req.user.id;

    const accessToken = await exchangePublicTokenCore(public_token, userId);

    res.json({ accessToken });
  } catch (error) {
    console.error("Error in exchangePublicToken:", error);
    res.status(500).send({ message: "Failed to exchange public token", error: error.toString() });
  }
};

const saveOrUpdateAccount = async (accountData) => {
  try {
    // Upsert the account data into the database
    await BankAccount.findOneAndUpdate(
      { accountId: accountData.accountId }, // Find by Plaid account ID
      accountData,
      { upsert: true, new: true } // Create if it doesn't exist, return the updated document
    );
  } catch (error) {
    console.error("Error saving/updating account:", error);
    throw new Error("Failed to save or update account");
  }
};

const fetchAccounts = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    if (!user.plaidAccessTokens || user.plaidAccessTokens.length === 0) {
      throw new Error(`No Plaid access tokens found for user ID ${userId}.`);
    }

    let bankAccounts = {};

    for (const accessToken of user.plaidAccessTokens) {
      try {
        const request = {
          access_token: accessToken,
        };

        const plaidResponse = await plaidClient.accountsGet(request);
        if (!plaidResponse || !plaidResponse.data) {
          throw new Error('Invalid response from Plaid API when fetching accounts.');
        }

        const accounts = plaidResponse.data.accounts;
        const item = plaidResponse.data.item;


        console.log("fetching transactions");
        // Fetch transactions for all accounts associated with this access token
        const transactionsRequest = {
          access_token: accessToken,
          start_date: '2023-01-01',  // Example start date, adjust as needed
          end_date: new Date().toISOString().split('T')[0], // Today's date as end date
        };

        const transactionsResponse = await plaidClient.transactionsGet(transactionsRequest);
        if (!transactionsResponse || !transactionsResponse.data) {
          throw new Error('Invalid response from Plaid API when fetching transactions.');
        }

        const transactions = transactionsResponse.data.transactions;

        // Organize transactions by account_id for easier assignment later
        const transactionsByAccount = transactions.reduce((acc, transaction) => {
          if (!acc[transaction.account_id]) {
            acc[transaction.account_id] = [];
          }
          acc[transaction.account_id].push(transaction);
          return acc;
        }, {});

        const institutionRequest = {
          institution_id: item.institution_id,
          country_codes: ['US'],  // Or other country codes as appropriate
        };

        const institutionResponse = await plaidClient.institutionsGetById(institutionRequest);
        if (!institutionResponse || !institutionResponse.data) {
          throw new Error('Invalid response from Plaid API when fetching institution data.');
        }

        const bankName = institutionResponse.data.institution.name;

        for (const account of accounts) {
          try {
            // Attach transactions to the account object
            account.transactions = transactionsByAccount[account.account_id] || [];

            // Prepare the data to be saved
            const accountData = {
              accountId: account.account_id,
              userId: userId,
              bankName: bankName,
              accountName: account.name,
              mask: account.mask,
              subtype: account.subtype,
              type: account.type,
              balances: account.balances,
              accessToken: accessToken,
              userToken: user.plaidUserToken, // Assuming userToken is stored in the user model
              transactions: account.transactions,
              needsUpdate: false,
            };

            // Use the saveOrUpdateAccount function to handle the database operation
            await saveOrUpdateAccount(accountData);

            if (!bankAccounts[bankName]) {
              bankAccounts[bankName] = [];
            }
            bankAccounts[bankName].push(account);
          } catch (accountError) {
            console.error(`Error processing account ${account.account_id}:`, accountError);
          }
        }
      } catch (plaidError) {
        // Handle specific errors that require user action (e.g., ITEM_LOGIN_REQUIRED)
        if (plaidError.response && plaidError.response.data && plaidError.response.data.error_code) {
          const errorCode = plaidError.response.data.error_code;
          
          // If the error code is ITEM_LOGIN_REQUIRED or PENDING_EXPIRATION, flag it
          if (errorCode === 'ITEM_LOGIN_REQUIRED' || errorCode === 'PENDING_EXPIRATION') {


            const bankName = await getBankNameByAccessToken(accessToken, userId);

            // Mark the bank with `needsUpdate` status
            bankAccounts[bankName] = [{
              bankName: bankName,
              needsUpdate: true,
              error: plaidError.response.data.error_message,
            }];
          } else {
            console.error(`Unhandled Plaid error: ${plaidError.response.data.error_message}`);
          }
        } else {
          console.error(`Error fetching accounts with access token ${accessToken}:`, plaidError);
        }
      }
    }

    console.log("fetchAccounts: bank accounts", bankAccounts);

    return bankAccounts;
  } catch (error) {
    console.error(`Error fetching accounts for user ID ${userId}:`, error);
    throw new Error("Failed to fetch accounts");
  }
};

const getAccounts = async (req, res) => {
  console.log("gettting Accounts");
  try {
    const userId = req.user.id;
    const bankAccounts = await fetchAccounts(userId);

    if (!bankAccounts || Object.keys(bankAccounts).length === 0) {
      return res.status(404).send({ message: "No accounts found for the user." });
    }

    res.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).send({ message: "Failed to fetch accounts", error: error.toString() });
  }
};


const handlePlaidWebhook = async (req, res) => {
  console.log("Webhook received:", req.body); // Log the full webhook payload

  const { webhook_type, webhook_code, public_tokens, link_token } = req.body;

  try {
      if (webhook_type === 'LINK' && webhook_code === 'SESSION_FINISHED') {
          // Find the user associated with the link_token
          const linkTokenRecord = await LinkToken.findOne({ linkToken: link_token });

          if (!linkTokenRecord) {
              console.error(`No associated user found for link token: ${link_token}`);
              return res.status(404).send('No associated user found for link token');
          }

          const userId = linkTokenRecord.userId;
          console.log("found user:", userId);

          if (public_tokens && public_tokens.length > 0) {
              for (const publicToken of public_tokens) {
                  // Exchange public token for access token and associate with the user
                  await exchangePublicTokenCore(publicToken, userId);
              }
          }

          // Delete the link token record after processing
          await LinkToken.deleteOne({ _id: linkTokenRecord._id });

          res.status(200).send('Webhook processed successfully');
      } else {
          res.status(400).send('Unhandled webhook type or code');
      }
  } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
  }
};


const getTransactions = async (userId, factBankName, factAccountString) => {
  try {
    // Normalize the bankName from fact string (e.g., "bank_of_america" -> "Bank Of America")
    const bankName = factBankName; 
    const accountName = factAccountString;
    // Extract the account name and mask from the factAccountString


    // Fetch the BankAccount document associated with the user, bank name, account name, and mask
    const account = await BankAccount.findOne({
      userId: userId,
      bankName: bankName,
      accountName: accountName,
    });

    if (!account) {
      throw new Error(`No account found for user ID ${userId}, bank name ${bankName}, and account name ${accountName} with mask {${accountMask}}.`);
    }

    const accessToken = account.accessToken;
    if (!accessToken) {
      throw new Error(`Access token not found for account ${accountName} with mask {${accountMask}} in bank ${bankName}.`);
    }

    // Set the date range for the last year
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    // Fetch transactions for the specified account from the last year
    const transactionsRequest = {
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      account_ids: [account.accountId],
    };

    const transactionsResponse = await plaidClient.transactionsGet(transactionsRequest);
    const transactions = transactionsResponse.data.transactions;

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions found for the specified account.');
    }

    return transactions;
  } catch (error) {
    console.error(`Error fetching transactions for user ID ${userId}, bank name ${bankName}, account name ${accountName} with mask {${accountMask}}:`, error);
    throw new Error('Failed to fetch transactions');
  }
};


  module.exports = {
    getLinkToken,
    exchangePublicToken,
    getAccounts,
    fetchAccounts,
    handlePlaidWebhook,
    getUpdateLinkToken,
    getTransactions,
    getUpdateLinkToken_forItem
  }