const BankAccount = require('../models/bankAccount.model');

/**
 * Retrieves the bank name based on the access token.
 * @param {String} accessToken - The Plaid access token.
 * @param {String} userId - The user ID.
 * @returns {String} bankName - The name of the bank associated with the access token.
 */
const getBankNameByAccessToken = async (accessToken, userId) => {
  try {
    const bankAccount = await BankAccount.findOne({
      userId,
      accessToken,
    });

    if (!bankAccount) {
      throw new Error(`No bank account found for access token: ${accessToken}`);
    }

    return bankAccount.bankName;
  } catch (error) {
    console.error(`Error fetching bank name by access token: ${error.message}`);
    throw new Error(`Unable to retrieve bank name for access token ${accessToken}`);
  }
};

module.exports = {
  getBankNameByAccessToken,
};
