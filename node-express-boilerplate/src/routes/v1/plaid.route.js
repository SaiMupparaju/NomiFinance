const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const plaidController = require('../../controllers/plaid.controller');


const router = express.Router();

router.post('/get-link-token', (req, res, next) => {
    console.log('Reached get-link-token route');
    next();
  }, auth(), plaidController.getLinkToken);

router.post('/exchange-public-token', auth(), plaidController.exchangePublicToken);
router.get('/accounts', auth(), plaidController.getAccounts);
router.post('/webhook/', plaidController.handlePlaidWebhook);
router.get('/get-update-link-token', auth(), plaidController.getUpdateLinkToken);
router.post('/credit/bank_income/get', auth(), plaidController.getBankIncome);
router.post('/force-reset-login', auth(), plaidController.forceItemIntoUpdateMode);


router.post('/create_update_link_token', async (req, res) => {
  const { userId, bankName } = req.body;
  console.log("creating update link token... with Bank Name:", bankName);

  if (!userId || !bankName) {
    return res.status(400).json({ error: 'User ID and bank name are required.' });
  }

  console.log("getting access token for the item");

  // modulate

  try {
    const linkToken = await plaidController.getUpdateLinkToken_forItem(userId, bankName);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('Error creating update link token:', error);
    res.status(500).json({ error: 'An error occurred while creating the link token.' });
  }
});
module.exports = router;