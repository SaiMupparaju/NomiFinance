import React, { useState, useEffect, useRef } from 'react';
import { Cascader, Button, Select, InputNumber } from 'antd';

const { Option } = Select;

const BankCascader = ({ value, params = {}, updateCondition, sectionIndex, conditionIndex, prop, options }) => {
  const [tempValue, setTempValue] = useState([]);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customValue, setCustomValue] = useState(null); // Initialize as null
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Default to USD
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showIncomes, setShowIncomes] = useState(false);
  const [selectedIncomes, setSelectedIncomes] = useState([]);
  const [lastKeyPressTime, setLastKeyPressTime] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showHomeCountry, setShowHomeCountry] = useState(false);
  const [selectedHomeCountry, setSelectedHomeCountry] = useState('US');

  const availableCategories = [
    { label: 'Transfers Out', value: 'TRANSFERS_OUT' },
    { label: 'Loan Payment', value: 'LOAN_PAYMENTS' },
    { label: 'Bank Fees', value: 'BANK_FEES' },
    { label: 'Entertainment', value: 'ENTERTAINMENT' },
    { label: 'Food and Drink', value: 'FOOD_AND_DRINK' },
    { label: 'General Merchandise', value: 'GENERAL_MERCHANDISE' },
    { label: 'Home Improvement', value: 'HOME_IMPROVEMENT' },
    { label: 'Medical', value: 'MEDICAL' },
    { label: 'Personal Care', value: 'PERSONAL_CARE' },
    { label: 'General Services', value: 'GENERAL_SERVICES' },
    { label: 'Government and Non Profit', value: 'GOVERNMENT_AND_NON_PROFIT' },
    { label: 'Transportation', value: 'TRANSPORTATION' },
    { label: 'Travel', value: 'TRAVEL' },
    { label: 'Rent/Utilities', value: 'RENT_AND_UTILITIES' },
  ];

  const availableIncomes = [
    { label: 'Dividends', value: 'INCOME_DIVIDENDS'},
    { label: 'Interest', value: 'INCOME_INTEREST_EARNED'},
    { label: 'Retirement Pension', value: 'INCOME_RETIREMENT_PENSION'},
    { label: 'Tax Refund', value: 'INCOME_TAX_REFUND'},
    { label: 'Unemployment', value: 'INCOME_UNEMPLOYMENT'},
    { label: 'Wages (Including gigs)', value: 'INCOME_WAGES'},
    { label: 'Misc. (Alimony, Social Security, etc.)', value: 'INCOME_OTHER_INCOME'}
  ]

  const countryOptions = ['US', 'CA', 'GB', 'AU', 'IN', 'FR', 'DE', 'JP'];

  function filterCascaderOptions(options, prop) {
    /**
     * We want to:
     *  - If prop === 'fact': remove any node whose `value` is 'custom_value'.
     *  - If prop === 'value': remove any node whose `value` is 'contains' (and their children).
     *
     * Because the factTree is hierarchical (Banks -> Accounts -> Balances/Expenses/etc. -> child-nodes),
     * we'll do a recursive filter to exclude certain `value`s or branches.
     */
  
    return options
      .map((node) => {
        // Potentially filter children recursively
        let filteredChildren = [];
        if (Array.isArray(node.children) && node.children.length > 0) {
          filteredChildren = filterCascaderOptions(node.children, prop);
        }
        return { ...node, children: filteredChildren };
      })
      .filter((node) => {
        // Exclude 'custom_value' if prop === 'fact'
        if (prop === 'fact' && node.value === 'custom_value') {
          return false; // skip
        }
  
        // Exclude 'contains' if prop === 'value'
        if (prop === 'value' && node.value === 'contains') {
          return false; // skip
        }
  
        return true; 
      });
  }

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'SGD', 'HKD'];
  const filteredOptions = filterCascaderOptions(options, prop);

  useEffect(() => {
    if (value) {
      const valueArray = Array.isArray(value) ? value : value?.split('/') || [];
      setTempValue(valueArray);

      if (valueArray.includes('expenses')) {
        // Check if params.categories are available and set them
        if (params.categories) {
          setSelectedCategories(params.categories);
        }
        setShowCategories(true);
        setCustomValue(null); // Ensure custom value is reset when categories are shown
      } else if (valueArray.includes('income') && valueArray.includes('from')) {
        // Handle income/from
        if (params.incomes) {
          setSelectedIncomes(params.incomes);
        }
        setShowIncomes(true);
        setShowCategories(false);
        setCustomValue(null);
    
      } else if (valueArray.includes('custom_value')) {
        // Handle custom value scenario
        if (params.customValue !== undefined && params.customValue !== null) {
          setCustomValue(params.customValue);
        }
        setSelectedCurrency(params.currency || 'USD');
        setShowCategories(false); // Hide categories if custom value is selected
        setShowCurrencyDropdown(true);
        setSelectedCategories([]); // Clear selected categories
      }else if (valueArray.includes('contains') && valueArray.includes('large_foreign_transaction')) {
        setShowHomeCountry(true);
        setSelectedHomeCountry(params.homeCountry || 'US');
      }
      else {
        setShowCategories(false);
        setCustomValue(null);
        setShowHomeCountry(false);
      }
    }
  }, [value, params]);

  const handleKeyDown = (e) => {
    const currentTime = Date.now();
    const timeSinceLastKeyPress = currentTime - lastKeyPressTime;
  
    const typingInterval = 75; // Time in milliseconds (adjust as needed)
  
    if (timeSinceLastKeyPress < typingInterval) {
      // Prevent the key press
      e.preventDefault();
    } else {
      // Update the last key press time
      setLastKeyPressTime(currentTime);
    }
  };

  const onChange = (valueArray) => {
    setTempValue(valueArray);
    setConfirmVisible(true);

    if (valueArray.includes('expenses')) {
      setShowCategories(true);
      setCustomValue(null); // Clear custom value when switching to categories
    } else if (valueArray.includes('income') && valueArray.includes('from')) {
        setShowIncomes(true);
        setShowCategories(false);
        setCustomValue(null);
        setSelectedCategories([]);
      
    } else if (valueArray.includes('custom_value')) {
      setShowCategories(false); // Hide categories
      setSelectedCategories([]); // Clear selected categories
      setShowCurrencyDropdown(true);
    } else {
      setShowCategories(false);
      setCustomValue(null);
    }
  };

  const handleIncomeChange = (value) => {
    setSelectedIncomes(value);
    handleConfirm();
  
    // Update incomes in params
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, { incomes: value });
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', { incomes: value });
    }
  
    // Clear custom value and selected categories
    setCustomValue(null);
    setSelectedCategories([]);
  };

  const handleCategoryChange = (value) => {
    handleConfirm();
    setSelectedCategories(value);

  

    // Automatically update categories in params without waiting for "Confirm"
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, ``)
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, { categories: value });
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', { categories: value });
    }

    // Clear custom value when categories are updated
    
    setCustomValue(null);
  };

  const handleCustomValueChange = (value) => {
    setCustomValue(value);
  
    // Disable the input
    setInputDisabled(true);
  
    // Re-enable after a delay
    setTimeout(() => {
      setInputDisabled(false);
    }, 200); // Time in milliseconds
  
    // Update condition
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, {
        customValue: value,
        currency: selectedCurrency,
      });
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', {
        customValue: value,
        currency: selectedCurrency,
      });
    }
  
    setSelectedCategories([]); // Clear selected categories when custom value is set
  };
  

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, { customValue: customValue, currency: currency });
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', { customValue: customValue, currency: currency });
    }
  };

  const handleCountryChange = (newVal) => {
    // 1) update local state so that next render sees newVal
    console.log(newVal);
    setSelectedHomeCountry(newVal);
  
    // 2) use newVal right here in updateCondition
    const newParams = { ...params, homeCountry: newVal };
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, newParams);
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', newParams);
    }
  };



  const handleConfirm = () => {
    let fact = tempValue.join('/');

    // Update the condition with the fact or value, depending on the prop
    updateCondition(sectionIndex, conditionIndex, prop, fact);


    if (showCategories && selectedCategories.length > 0) {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, { categories: selectedCategories });
    } else if (showIncomes && selectedIncomes.length > 0) {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, { incomes: selectedIncomes });
    } else if (customValue !== null) {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, { customValue: customValue, currency: selectedCurrency });
    } else if (showHomeCountry) {

      if (prop === 'value') {
        updateCondition(sectionIndex, conditionIndex, `${prop}.params`, {
          ...params,
          homeCountry: selectedHomeCountry
        });
      } else {
        updateCondition(sectionIndex, conditionIndex, 'params', {
          ...params,
          homeCountry: selectedHomeCountry
        });
      }
      
    } else {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, null);
    }

    setConfirmVisible(false);
  };

  const handleCancel = () => {
    setTempValue(value ? value.split(' ') : []);
    setConfirmVisible(false);
    setShowCategories(false);
  };

  

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
      <Cascader
        options={filteredOptions}
        value={tempValue.length > 0 ? tempValue : undefined}  // Display the selected value or placeholder
        onChange={onChange}
        placeholder="Please select"
        style={{ flex: 1, minWidth: '200px' }}
        changeOnSelect
        showSearch
        allowClear={false}
      />

        {showCategories && (
          <span style={{ alignSelf: 'center' }}>on</span>
        )}

      {showCategories && (
        <Select
          mode="multiple"
          style={{ flex: 1, minWidth: '200px' }}
          placeholder="Select categories"
          value={selectedCategories}
          onChange={handleCategoryChange}
          optionFilterProp="children"
          showSearch
        >
          {availableCategories.map((category) => (
            <Option key={category.value} value={category.value}>
              {category.label}
            </Option>
          ))}
        </Select>
      )}

      {showIncomes && (
        <>
          <span style={{ alignSelf: 'center' }}>from</span>
          <Select
            mode="multiple"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Select income types"
            value={selectedIncomes}
            onChange={handleIncomeChange}
            optionFilterProp="children"
            showSearch
          >
            {availableIncomes.map((income) => (
              <Option key={income.value} value={income.value}>
                {income.label}
              </Option>
            ))}
          </Select>
        </>
      )}

      {!(showCategories || showIncomes) && tempValue.includes('custom_value') && (
        <>
          <InputNumber
            min={0}
            value={customValue}
            onChange={handleCustomValueChange}
            placeholder="Enter custom value"
            style={{ flex: 1, minWidth: '200px' }}
            // parser={(value) => value.replace(/[^\d.\d]/g, '')} // Allow only digits and decimal points
            // formatter={(value) => (value ? String(value).replace(/[^\d.\d]/g, '') : '')} // Allow display of decimals
            onKeyDown={handleKeyDown}
            //disabled={inputDisabled} 
          />

          <Select
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              placeholder="Select currency"
              style={{ flex: 1, minWidth: '120px' }}
              showSearch
              optionFilterProp="children"
            >
              {currencyOptions.map((currency) => (
                <Option key={currency} value={currency}>
                  {currency}
                </Option>
              ))}
            </Select>
          </>
      )}

      {showHomeCountry && (
        <Select
          value={selectedHomeCountry}
          onChange={handleCountryChange}
          style={{ flex: 1, minWidth: '120px' }}
          placeholder="Select your home country"
        >
          {countryOptions.map((code) => (
            <Option key={code} value={code}>{code}</Option>
          ))}
        </Select>
      )}

      {isConfirmVisible && (
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '8px' }}>
          <Button type="primary" onClick={handleConfirm}>
            Confirm
          </Button>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default BankCascader;
