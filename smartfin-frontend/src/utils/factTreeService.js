// src/services/factTreeService.js
export const factTreeService = {
    // Get just banks and their accounts (first two levels)
    getBankAccountOptions: (factTree) => {
      if (!factTree || !Array.isArray(factTree)) return [];
  
      return factTree
        .filter(node => node.value !== 'custom_value') // Filter out the custom value option
        .map(bank => ({
          label: bank.label,
          value: bank.value,
          accounts: bank.children.map(account => ({
            label: account.label,
            value: `${bank.value}/${account.value}`, // Format: bank_name/account_name_mask
            fullPath: `${bank.value}/${account.value}`
          }))
        }));
    },
  
    // Format the full path for fact string
    formatFactString: (bankValue, accountValue, property, subProperty) => {
      return `${bankValue}/${accountValue}/${property}/${subProperty}`;
    }
  };