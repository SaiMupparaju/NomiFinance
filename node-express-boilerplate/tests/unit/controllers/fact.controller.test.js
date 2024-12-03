const moment = require('moment');
const { calculateExpenses, calculateIncome, isIncomeTransaction } = require('../../../src/controllers/fact.controller');

describe('calculateExpenses', () => {
  it('calculates total expenses correctly for given categories and timeframe', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
          amount: -100.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
        {
          date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
          amount: -50.0,
          personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'GASOLINE_FUEL' },
        },
        {
          date: moment().subtract(15, 'days').format('YYYY-MM-DD'),
          amount: -200.0,
          personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'MOVIES' },
        },
        {
          date: moment().subtract(2, 'days').format('YYYY-MM-DD'),
          amount: -150.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'GROCERIES' },
        },
        // Transaction outside the timeframe
        {
          date: moment().subtract(2, 'months').format('YYYY-MM-DD'),
          amount: -300.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
        // Transaction not matching categories
        {
          date: moment().subtract(3, 'days').format('YYYY-MM-DD'),
          amount: -80.0,
          personal_finance_category: { primary: 'HEALTHCARE', detailed: 'DOCTOR' },
        },
      ],
    };

    const params = {
      categories: ['FOOD_AND_DRINK', 'ENTERTAINMENT'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(450.0);
  });

  it('returns 0 if no transactions match the categories', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
          amount: -100.0,
          personal_finance_category: { primary: 'HEALTHCARE', detailed: 'DOCTOR' },
        },
      ],
    };

    const params = {
      categories: ['FOOD_AND_DRINK', 'ENTERTAINMENT'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(0);
  });

  it('handles positive amounts correctly', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
          amount: 100.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
      ],
    };

    const params = {
      categories: ['FOOD_AND_DRINK'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(100.0);
  });

  it('returns 0 if no transactions are within the timeframe', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(2, 'months').format('YYYY-MM-DD'),
          amount: -100.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
      ],
    };

    const params = {
      categories: ['FOOD_AND_DRINK'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(0);
  });

  it('throws an error if categories are missing in params', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
          amount: -100.0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
      ],
    };

    const params = {}; // Missing categories

    const timeframe = 'since_1_month';

    await expect(calculateExpenses(account, params, timeframe)).rejects.toThrow(
      'Categories are required to calculate expenses.'
    );
  });

  it('handles zero amount transactions correctly', async () => {
    const account = {
      transactions: [
        {
          date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
          amount: 0,
          personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
        },
      ],
    };

    const params = {
      categories: ['FOOD_AND_DRINK'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(0);
  });

  it('returns 0 when there are no transactions', async () => {
    const account = {
      transactions: [],
    };

    const params = {
      categories: ['FOOD_AND_DRINK'],
    };

    const timeframe = 'since_1_month';

    const totalExpenses = await calculateExpenses(account, params, timeframe);

    expect(totalExpenses).toBe(0);
  });
});


describe('calculateIncome', () => {
    it('calculates total income correctly for the timeframe', async () => {
      const account = {
        transactions: [
          {
            date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
            amount: 2000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
          {
            date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
            amount: 500.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_INTEREST' },
          },
          {
            date: moment().subtract(15, 'days').format('YYYY-MM-DD'),
            amount: 300.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER' },
          },
          // Transaction outside the timeframe
          {
            date: moment().subtract(2, 'months').format('YYYY-MM-DD'),
            amount: 1000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
          // Non-income transaction
          {
            date: moment().subtract(3, 'days').format('YYYY-MM-DD'),
            amount: 80.0,
            personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
          },
        ],
      };
  
      const params = {};
  
      const timeframe = 'since_1_month';
      const incomeType = 'total';
  
      const totalIncome = await calculateIncome(account, params, timeframe, incomeType);
  
      expect(totalIncome).toBe(2800.0);
    });
  
    it('calculates income from specific sources correctly', async () => {
      const account = {
        transactions: [
          {
            date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
            amount: 2000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
          {
            date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
            amount: 500.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_INTEREST' },
          },
          {
            date: moment().subtract(15, 'days').format('YYYY-MM-DD'),
            amount: 300.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER' },
          },
        ],
      };
  
      const params = {
        incomes: ['INCOME_WAGES', 'INCOME_INTEREST'],
      };
  
      const timeframe = 'since_1_month';
      const incomeType = 'from';
  
      const totalIncome = await calculateIncome(account, params, timeframe, incomeType);
  
      expect(totalIncome).toBe(2500.0);
    });
  
    it('returns 0 if no income transactions match the specified incomes', async () => {
      const account = {
        transactions: [
          {
            date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
            amount: 2000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
        ],
      };
  
      const params = {
        incomes: ['INCOME_INTEREST'],
      };
  
      const timeframe = 'since_1_month';
      const incomeType = 'from';
  
      const totalIncome = await calculateIncome(account, params, timeframe, incomeType);
  
      expect(totalIncome).toBe(0);
    });
  
    it('ignores negative income amounts', async () => {
      const account = {
        transactions: [
          {
            date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
            amount: -2000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
        ],
      };
  
      const params = {};
  
      const timeframe = 'since_1_month';
      const incomeType = 'total';
  
      const totalIncome = await calculateIncome(account, params, timeframe, incomeType);
  
      expect(totalIncome).toBe(0);
    });
  
    it('throws an error if incomes are missing when incomeType is "from"', async () => {
      const account = {
        transactions: [
          {
            date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
            amount: 2000.0,
            personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
          },
        ],
      };
  
      const params = {}; // Missing incomes
  
      const timeframe = 'since_1_month';
      const incomeType = 'from';
  
      await expect(calculateIncome(account, params, timeframe, incomeType)).rejects.toThrow(
        'Incomes are required to calculate income from specific sources.'
      );
    });
  
    it('returns 0 when there are no income transactions', async () => {
      const account = {
        transactions: [],
      };
  
      const params = {};
  
      const timeframe = 'since_1_month';
      const incomeType = 'total';
  
      const totalIncome = await calculateIncome(account, params, timeframe, incomeType);
  
      expect(totalIncome).toBe(0);
    });
  });

  describe('getStartDate', () => {
    const { getStartDate } = require('../../../src/controllers/fact.controller');
  
    it('returns correct date for "since_last_month"', () => {
      const expectedDate = moment().subtract(1, 'month').startOf('day').format();
      const startDate = getStartDate('since_last_month').format();
      expect(startDate).toBe(expectedDate);
    });
  
    it('throws an error for an invalid timeframe', () => {
      expect(() => getStartDate('invalid_timeframe')).toThrow('Invalid timeframe: invalid_timeframe');
    });
  });
  
  describe('shouldCountTransaction', () => {
    const { shouldCountTransaction } = require('../../../src/controllers/fact.controller');
  
    it('returns true when transaction matches primary category', () => {
      const transaction = {
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
      };
      const categories = ['FOOD_AND_DRINK'];
  
      expect(shouldCountTransaction(transaction, categories)).toBe(true);
    });
  
    it('returns true when transaction matches detailed category', () => {
      const transaction = {
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
      };
      const categories = ['RESTAURANTS'];
  
      expect(shouldCountTransaction(transaction, categories)).toBe(true);
    });
  
    it('returns false when transaction does not match any category', () => {
      const transaction = {
        personal_finance_category: { primary: 'HEALTHCARE', detailed: 'DOCTOR' },
      };
      const categories = ['FOOD_AND_DRINK'];
  
      expect(shouldCountTransaction(transaction, categories)).toBe(false);
    });
  
    it('returns false when personal_finance_category is missing', () => {
      const transaction = {};
      const categories = ['FOOD_AND_DRINK'];
  
      expect(shouldCountTransaction(transaction, categories)).toBe(false);
    });
  });

  describe('isIncomeTransaction', () => {
    const { isIncomeTransaction } = require('../../../src/controllers/fact.controller');
  
    it('returns true for incomeType "total" and income transaction', () => {
      const transaction = {
        personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
      };
      const incomeType = 'total';
      const params = {};
  
      expect(isIncomeTransaction(transaction, incomeType, params)).toBe(true);
    });
  
    it('returns true for incomeType "from" when transaction matches incomes', () => {
      const transaction = {
        personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' },
      };
      const incomeType = 'from';
      const params = { incomes: ['INCOME_WAGES'] };
  
      expect(isIncomeTransaction(transaction, incomeType, params)).toBe(true);
    });
  
    it('returns false when incomeType is "from" and transaction does not match incomes', () => {
      const transaction = {
        personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_INTEREST' },
      };
      const incomeType = 'from';
      const params = { incomes: ['INCOME_WAGES'] };
  
      expect(isIncomeTransaction(transaction, incomeType, params)).toBe(false);
    });
  
    it('returns false when transaction is not income', () => {
      const transaction = {
        personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'RESTAURANTS' },
      };
      const incomeType = 'total';
      const params = {};
  
      expect(isIncomeTransaction(transaction, incomeType, params)).toBe(false);
    });
  
    it('returns false when personal_finance_category is missing', () => {
      const transaction = {};
      const incomeType = 'total';
      const params = {};
  
      expect(isIncomeTransaction(transaction, incomeType, params)).toBe(false);
    });
  });

  jest.mock('../../../src/services/exchangeRateService', () => ({
  getExchangeRate: jest.fn().mockImplementation((currency) => {
    if (currency === 'USD') {
      return Promise.resolve({ rate: 1 });
    } else if (currency === 'EUR') {
      return Promise.resolve({ rate: 0.85 });
    } else {
      return Promise.resolve(null); // Simulate missing rate
    }
  }),
}));
