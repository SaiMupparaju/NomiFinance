import React, { useState, useEffect } from 'react';
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

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'SGD', 'HKD'];

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
      } else if (valueArray.includes('custom_value')) {
        // Handle custom value scenario
        if (params.customValue) {
          setCustomValue(params.customValue);
        }
        setSelectedCurrency(params.currency || 'USD');
        setShowCategories(false); // Hide categories if custom value is selected
        setShowCurrencyDropdown(true);
        setSelectedCategories([]); // Clear selected categories
      } else {
        setShowCategories(false);
        setCustomValue(null);
      }
    }
  }, [value, params]);

  const onChange = (valueArray) => {
    setTempValue(valueArray);
    setConfirmVisible(true);

    if (valueArray.includes('expenses')) {
      setShowCategories(true);
      setCustomValue(null); // Clear custom value when switching to categories
        
    } else if (valueArray.includes('custom_value')) {
      setShowCategories(false); // Hide categories
      setSelectedCategories([]); // Clear selected categories
      setShowCurrencyDropdown(true);
    } else {
      setShowCategories(false);
      setCustomValue(null);
    }
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
    handleConfirm();

    // Automatically update custom value in params
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, { customValue: value , currency: selectedCurrency});
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', { customValue: value, currency: selectedCurrency });
    }

    // Clear selected categories when custom value is updated
    setSelectedCategories([]);
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    if (prop === 'value') {
      updateCondition(sectionIndex, conditionIndex, `${prop}.params`, { customValue: customValue, currency: currency });
    } else {
      updateCondition(sectionIndex, conditionIndex, 'params', { customValue: customValue, currency: currency });
    }
  };


  const handleConfirm = () => {
    let fact = tempValue.join('/');

    // Update the condition with the fact or value, depending on the prop
    updateCondition(sectionIndex, conditionIndex, prop, fact);


    if (showCategories && selectedCategories.length > 0) {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, { categories: selectedCategories });
    } else if (customValue !== null) {
      updateCondition(sectionIndex, conditionIndex, prop === 'fact' ? 'params' : `${prop}.params`, { customValue: customValue, currency: selectedCurrency });
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
        options={options}
        value={tempValue.length > 0 ? tempValue : undefined}  // Display the selected value or placeholder
        onChange={onChange}
        placeholder="Please select"
        style={{ flex: 1, minWidth: '200px' }}
        changeOnSelect
        showSearch
      />

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

      {!showCategories && tempValue.includes('custom_value') && (
        <>
          <InputNumber
            min={0}
            value={customValue}
            onChange={handleCustomValueChange}
            placeholder="Enter custom value"
            style={{ flex: 1, minWidth: '200px' }}
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
