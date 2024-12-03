module.exports = {
    fetchAndStoreRates: jest.fn().mockResolvedValue('Mocked fetch and store rates completed'),
  
    getExchangeRate: jest.fn(async (currency) => {
      // Return a fixed exchange rate for testing purposes
      if (currency === 'USD') {
        return { currency: 'USD', rate: 1 }; // USD should be base rate
      } else if (currency === 'EUR') {
        return { currency: 'EUR', rate: 0.85 }; // Example rate for EUR
      } else {
        throw new Error(`Rate not found for currency: ${currency}`);
      }
    }),
  };
  