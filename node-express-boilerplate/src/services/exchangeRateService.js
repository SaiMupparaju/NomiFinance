const axios = require('axios');
const Rate = require('../models/rate.model');

// API URL for getting exchange rates
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

// Fetch exchange rates from the API and store them in the database
const fetchAndStoreRates = async () => {
  try {
    // Fetch exchange rate data from the API
    const response = await axios.get(EXCHANGE_RATE_API_URL);

    if (response.data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    const rates = response.data.rates;
    const baseCurrency = response.data.base_code;

    // Loop through the rates and upsert them in the database
    for (const [currency, rate] of Object.entries(rates)) {
      await Rate.findOneAndUpdate(
        { currency },  // Find by currency
        { currency, baseCurrency, rate },  // Update or create with new rate
        { upsert: true, new: true, useFindAndModify: false }  // Create if doesn't exist, return updated
      );
    }

    console.log('Exchange rates updated successfully.');
  } catch (error) {
    console.error('Error fetching and storing exchange rates:', error);
    throw error;
  }
};

// Get the exchange rate for a specific currency from the database
const getExchangeRate = async (currency) => {
  try {
    const rate = await Rate.findOne({ currency });

    if (!rate) {
      throw new Error(`Rate not found for currency: ${currency}`);
    }

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

module.exports = {
  fetchAndStoreRates,
  getExchangeRate,
};
