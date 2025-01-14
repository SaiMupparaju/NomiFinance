const { PlaidApi, PlaidEnvironments, Configuration, AccountsGetRequest } = require('plaid');
const User = require('../models/user.model'); // Update the path according to your project structure
const BankAccount = require('../models/bankAccount.model');
const UserAccountsSummary = require('../models/userAccountSummary.model');
const LinkToken = require('../models/linkToken.model');
const { getBankNameByAccessToken } = require('../services/BankAccountService');
const { sendEmail } = require('../services/email.service');
const PlaidErrorLog  = require('../models/plaidErrorLog.model');
const AccountCache = require('../models/accountCache.model');


const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const WEBHOOK = process.env.PLAID_WEBHOOK; //FIXME

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

const getBankIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || !user.plaidAccessTokens || user.plaidAccessTokens.length === 0) {
      return res.status(400).json({ message: 'No access tokens found for the user.' });
    }

    const plaidUserToken = user.plaidUserToken; // Adjust as needed if multiple tokens

    const response = await plaidClient.creditBankIncomeGet({
      user_token: plaidUserToken,
      options: {
        count: 1,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching bank income:', error);
    res.status(500).json({ message: 'Failed to fetch bank income', error: error.toString() });
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
    console.log(`redirect uri : ${process.env.FRONTEND_URL}/home`);

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
      redirect_uri: `${process.env.FRONTEND_URL}/home` ,
      access_token: accessToken,
      country_codes: ['US', 'CA'], // Adjust as needed
    });


    const linkToken = linkTokenResponse.data.link_token;

    console.log('Link token created successfully.');

    return linkToken;
  } catch (error) {
    console.error('Error in getUpdateLinkToken_forItem:', error.response?.data || error.message);
    throw error;
  }
}

const forceItemIntoUpdateMode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bankName } = req.body;

    // Find the access token for the specified bank
    const bankAccount = await BankAccount.findOne({ userId, bankName });

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found for the given user and bank.' });
    }

    const accessToken = bankAccount.accessToken;

    // Call the resetLogin function
    await resetLogin(accessToken);

    // Send a response back to the frontend
    res.status(200).json({ message: 'Item has been forced into update mode.' });
  } catch (error) {
    console.error('Error forcing item into update mode:', error);
    res.status(500).json({ message: 'Failed to force item into update mode', error: error.toString() });
  }
};

 
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


        console.log(`Webhook URL: ${WEBHOOK}`);
        console.log(`redirect uri : ${process.env.FRONTEND_URL}/home`);

        const plaidRequest = {
            user: {
                client_user_id: clientUserId,
            },
            user_token: userToken,
            client_name: 'Plaid Test App',
            enable_multi_item_link: true,
            products: ['auth','transactions'],
            language: 'en',
            redirect_uri: `${process.env.FRONTEND_URL}/home`,
            webhook: `${WEBHOOK}/v1/plaid/webhook`, //MUST DO EVERY TIME LAUNCH
            country_codes: ['US', 'CA'],
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
        //console.log('Returning existing link token for user:', clientUserId);
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
          redirect_uri: `${process.env.FRONTEND_URL}/home`,
          webhook: `${WEBHOOK}/v1/plaid/webhook`,
          country_codes: ['US', 'CA'],
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

//build out a cache here
async function fetchAccounts(userId) {
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
        // Possibly do account-level caching, if you want
        let accountCache = await AccountCache.findOne({ accessToken });
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        let accountsResponseData;
        if (accountCache && accountCache.cacheTimestamp > tenMinutesAgo) {
          console.log(`Using cached accounts data for access token ${accessToken}`);
          accountsResponseData = accountCache.accountsData;
        } else {
          const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
          accountsResponseData = accountsResponse.data;

          // update or create accountCache
          if (accountCache) {
            accountCache.accountsData = accountsResponseData;
            accountCache.cacheTimestamp = now;
          } else {
            accountCache = new AccountCache({
              accessToken,
              accountsData: accountsResponseData,
              cacheTimestamp: now,
            });
          }
          await accountCache.save();
        }

        // accountsResponseData contains { accounts, item }
        const { accounts, item } = accountsResponseData;

        // get bank name from institutionsGetById
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: item.institution_id,
          country_codes: ['US','CA'],
        });
        const bankName = institutionResponse.data.institution.name;

        // loop each account from Plaid
        for (const acct of accounts) {
          // find or create BankAccount in DB
          let bankAccount = await BankAccount.findOne({
            accountId: acct.account_id,
            userId,
          });
          if (!bankAccount) {
            bankAccount = new BankAccount({
              accountId: acct.account_id,
              userId,
              bankName,
              accountName: acct.name,
              mask: acct.mask,
              subtype: acct.subtype,
              type: acct.type,
              balances: acct.balances,
              accessToken,
              userToken: user.plaidUserToken,
              transactions: [],
              lastTransactionFetch: null,
              transactionsSyncCursor: null, // new
            });
          } else {
            // update fields if changed
            bankAccount.balances = acct.balances;
            bankAccount.mask = acct.mask;
            bankAccount.subtype = acct.subtype;
            bankAccount.type = acct.type;
          }

          // decide if we want to do an initial or forced sync
          const fourHoursAgo = new Date(now.getTime() - 4*60*60*1000);
          if (!bankAccount.lastTransactionFetch || bankAccount.lastTransactionFetch < fourHoursAgo) {
            console.log(`Syncing transactions for bankAccount ${bankAccount.accountId}...`);
            await syncTransactions(bankAccount);
          } else {
            console.log(`Using cached transactions for bankAccount ${bankAccount.accountId}`);
          }

          // Save the bank account
          await bankAccount.save();

          // Prepare data for final return
          const accountData = {
            ...acct,
            bankName,
            transactions: bankAccount.transactions,
          };

          if (!bankAccounts[bankName]) {
            bankAccounts[bankName] = [];
          }
          bankAccounts[bankName].push(accountData);
        }

      } catch (plaidError) {
        // handle plaid error
        await handlePlaidError(plaidError, accessToken, userId, bankAccounts);
      }
    }

    return bankAccounts;

  } catch (error) {
    console.error(`Error fetching accounts for user ID ${userId}:`, error);
    throw new Error('Failed to fetch accounts');
  }
}



async function handlePlaidError(plaidError, accessToken, userId, bankAccounts) {
  if (!plaidError.response?.data?.error_code) {
    console.error('Unexpected Plaid error format:', plaidError);
    return;
  }

  const errorCode = plaidError.response.data.error_code;
  const errorMessage = plaidError.response.data.error_message;
  const bankName = await getBankNameByAccessToken(accessToken, userId);

  try {
    // Find existing error log or create new one
    let errorLog = await PlaidErrorLog.findOne({
      userId,
      accessToken,
      resolved: false
    });

    const now = new Date();
    const fourHoursAgo = new Date(now - 8 * 60 * 60 * 1000);

    if (errorLog) {
      // Only send another email if the last notification was more than 4 hours ago
      if (!errorLog.lastNotified || errorLog.lastNotified < fourHoursAgo) {
        await sendPlaidErrorNotification(userId, bankName, errorCode, errorMessage);
        errorLog.lastNotified = now;
        await errorLog.save();
      }
    } else {
      // Create new error log and send first notification
      errorLog = new PlaidErrorLog({
        userId,
        bankName,
        accessToken,
        errorCode,
        errorMessage,
        lastNotified: now
      });
      await errorLog.save();
      await sendPlaidErrorNotification(userId, bankName, errorCode, errorMessage);
    }

    // Update bankAccounts object with error status
    if (bankName && bankAccounts) {
      bankAccounts[bankName] = [{
        bankName,
        needsUpdate: true,
        error: errorMessage
      }];
    }
  } catch (error) {
    console.error('Error handling Plaid error:', error);
  }
}

async function sendPlaidErrorNotification(userId, bankName, errorCode, errorMessage) {
  const user = await User.findById(userId);
  if (!user) return;

  const emailSubject = `Action Required: Update Your ${bankName} Connection`;
  const emailBody = `
    <p>Dear ${user.name},</p>
    <p>We've detected an issue with your ${bankName} account connection in Nomi Finance. To ensure your rules continue working properly, please update your credentials.</p>
    <p><strong>Why am I receiving this?</strong><br>
    Your bank requires periodic re-authentication to maintain secure access to your account information.</p>
    <p><strong>What should I do?</strong><br>
    1. Log in to Nomi Finance<br>
    2. Click on the settings icon (⚙️) in the navigation bar<br>
    3. Find your ${bankName} account and click "Update"</p>
    <p><a href="${process.env.FRONTEND_URL}/home">Update Your Connection Now</a></p>
    <p>If you need assistance, please contact our support team at sophia@nomifinance.com</p>
    <p>Best regards,<br>The Nomi Finance Team</p>
  `;

  await sendEmail(user.email, emailSubject, emailBody);
}

exports.markErrorResolved = async (req, res) => {
  try {
    const { accessToken } = req.body;
    await PlaidErrorLog.updateMany(
      { accessToken, resolved: false },
      { resolved: true }
    );
    res.status(200).json({ message: 'Error marked as resolved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

async function syncTransactions(bankAccount) {
  const accessToken = bankAccount.accessToken;
  if (!accessToken) {
    throw new Error(`No accessToken found for BankAccount ${bankAccount._id}`);
  }

  let cursor = bankAccount.transactionsSyncCursor || null;
  let hasMore = true;

  while (hasMore) {
    const syncRequest = {
      access_token: accessToken,
      cursor: cursor,
      count: 100,
    };

    const syncResponse = await plaidClient.transactionsSync(syncRequest);
    const {
      added,
      modified,
      removed,
      next_cursor,
      has_more
    } = syncResponse.data;

    // (a) handle 'added'
    for (const newTx of added) {
      const existingIndex = bankAccount.transactions.findIndex(
        (t) => t.transaction_id === newTx.transaction_id
      );
      if (existingIndex === -1) {
        bankAccount.transactions.push(newTx);
      } else {
        bankAccount.transactions[existingIndex] = newTx;
      }
    }

    // (b) handle 'modified'
    for (const modTx of modified) {
      const existingIndex = bankAccount.transactions.findIndex(
        (t) => t.transaction_id === modTx.transaction_id
      );
      if (existingIndex !== -1) {
        bankAccount.transactions[existingIndex] = modTx;
      } else {
        bankAccount.transactions.push(modTx);
      }
    }

    // (c) handle 'removed'
    for (const removedTx of removed) {
      bankAccount.transactions = bankAccount.transactions.filter(
        (t) => t.transaction_id !== removedTx
      );
    }

    // update cursor
    cursor = next_cursor;
    hasMore = has_more;
  }

  // store final next_cursor, update lastTransactionFetch
  bankAccount.transactionsSyncCursor = cursor;
  bankAccount.lastTransactionFetch = new Date();
  await bankAccount.save();
}

async function getTransactions(userId, bankName, accountMask) {
  // 1) Look up the BankAccount doc
  const account = await BankAccount.findOne({
    userId: userId,
    bankName: bankName,
    mask: accountMask,
  });

  if (!account) {
    throw new Error(
      `No account found for user ID ${userId}, bank name ${bankName}, and mask ${accountMask}.`
    );
  }

  // 2) Always perform a full sync via transactions/sync
  console.log(`Syncing transactions for account ${account.accountId} (no time-based check).`);
  await syncTransactions(account);

  // 3) Return the local array
  return account.transactions;
}





  module.exports = {
    getLinkToken,
    exchangePublicToken,
    getAccounts,
    fetchAccounts,
    handlePlaidWebhook,
    getUpdateLinkToken,
    getTransactions,
    getUpdateLinkToken_forItem,
    getBankIncome,
    forceItemIntoUpdateMode
  }