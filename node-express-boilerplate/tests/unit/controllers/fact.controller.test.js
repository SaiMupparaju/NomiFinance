// __tests__/fact.controller.test.js

const moment = require('moment');
const factController = require('../controllers/fact.controller');
const BankAccount = require('../models/bankAccount.model');
const { getTransactions } = require('../controllers/plaid.controller');

// Mock the dependencies
jest.mock('../models/bankAccount.model');
jest.mock('../controllers/plaid.controller');
jest.mock('../services/exchangeRateService');

describe('Fact Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('toProperCase', () => {
    test('converts snake_case to proper case', () => {
      expect(factController.toProperCase('bank_of_america')).toBe('Bank Of America');
      expect(factController.toProperCase('plaid_checking')).toBe('Plaid Checking');
    });

    test('handles single word correctly', () => {
      expect(factController.toProperCase('chase')).toBe('Chase');
    });
  });

  describe('getStartDate', () => {
    test('returns correct date for different timeframes', () => {
      const now = moment('2025-01-14'); // Use the current date from the context
      jest.spyOn(moment, 'now').mockImplementation(() => now);

      const testCases = [
        { timeframe: 'since_1_week', expected: now.clone().subtract(1, 'week').startOf('day') },
        { timeframe: 'since_1_month', expected: now.clone().subtract(1, 'month').startOf('day') },
        { timeframe: 'since_1_year', expected: now.clone().subtract(1, 'year').startOf('day') },
        { timeframe: 'since_ytd', expected: now.clone().startOf('year') }
      ];

      testCases.forEach(({ timeframe, expected }) => {
        expect(factController.getStartDate(timeframe).format('YYYY-MM-DD'))
          .toBe(expected.format('YYYY-MM-DD'));
      });
    });

    test('throws error for invalid timeframe', () => {
      expect(() => factController.getStartDate('invalid_timeframe'))
        .toThrow('Invalid timeframe: invalid_timeframe');
    });
  });

  describe('calculateExpenses', () => {
    const mockAccount = {
      accountId: 'test-account',
      transactions: [
        {
          date: '2025-01-14',
          amount: -100,
          personal_finance_category: { primary: 'FOOD_AND_DRINK' }
        },
        {
          date: '2025-01-13',
          amount: -50,
          personal_finance_category: { primary: 'ENTERTAINMENT' }
        }
      ]
    };

    test('calculates expenses correctly with categories', async () => {
      const params = { categories: ['FOOD_AND_DRINK'] };
      const result = await factController.calculateExpenses(
        mockAccount,
        params,
        'since_1_week'
      );
      expect(result).toBe(100);
    });

    test('throws error when categories are missing', async () => {
      await expect(factController.calculateExpenses(
        mockAccount,
        {},
        'since_1_week'
      )).rejects.toThrow('Categories are required to calculate expenses.');
    });
  });

  describe('getFactValue', () => {
    const mockUserId = 'user123';
    const mockAccount = {
      balances: {
        current: 1000,
        available: 900,
        limit: 2000,
        iso_currency_code: 'USD'
      },
      transactions: []
    };

    beforeEach(() => {
      BankAccount.findOne.mockResolvedValue(mockAccount);
    });

    test('returns balance values correctly', async () => {
      const factString = 'chase/checking_1234/balances/current';
      const result = await factController.getFactValue(mockUserId, factString);
      expect(result).toBe(1000);
    });

    test('handles custom values with currency conversion', async () => {
      const factString = 'custom_value';
      const params = { customValue: 100, currency: 'USD' };
      const result = await factController.getFactValue(mockUserId, factString, params);
      expect(result).toBe(100); // Assuming 1:1 conversion for USD
    });

    test('throws error for invalid fact string format', async () => {
      const factString = 'invalid/format';
      await expect(factController.getFactValue(mockUserId, factString))
        .rejects.toThrow('Invalid fact string format.');
    });
  });

  describe('isIncomeTransaction', () => {
    test('identifies income transactions correctly', () => {
      const transaction = {
        personal_finance_category: { primary: 'INCOME', detailed: 'SALARY' }
      };
      expect(factController.isIncomeTransaction(transaction, 'total')).toBe(true);
    });

    test('identifies non-income transactions correctly', () => {
      const transaction = {
        personal_finance_category: { primary: 'FOOD_AND_DRINK' }
      };
      expect(factController.isIncomeTransaction(transaction, 'total')).toBe(false);
    });
  });

  describe('getFactTree', () => {
    const mockBankAccounts = {
      'Chase': [{
        type: 'depository',
        name: 'Checking',
        mask: '1234'
      }]
    };

    test('generates correct fact tree structure', () => {
      const result = factController.getFactTree(mockBankAccounts);
      expect(result).toHaveLength(2); // Including custom_value node
      expect(result[0].label).toBe('Chase');
      expect(result[0].children[0].label).toBe('Checking {1234}');
    });

    test('includes all required fact types', () => {
      const result = factController.getFactTree(mockBankAccounts);
      const accountNode = result[0].children[0];
      
      expect(accountNode.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'balances' }),
          expect.objectContaining({ value: 'expenses' }),
          expect.objectContaining({ value: 'income' }),
          expect.objectContaining({ value: 'contains' })
        ])
      );
    });
  });
});