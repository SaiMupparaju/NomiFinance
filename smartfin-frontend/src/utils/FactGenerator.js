// FactGenerate.js

export const accountPropertyMapping = {
    balance: 'balances.current',
    available: 'balances.available',
    limit: 'balances.limit',
    currency: 'balances.iso_currency_code'
  };
  
  export const generateFacts = (bankAccounts, accountIndexMap) => {
    const facts = {};
  
    bankAccounts.forEach((account, index) => {
      Object.keys(accountPropertyMapping).forEach((property) => {
        const factName = `${account.name} ${account.mask} ${property}`;
        const factPath = accountPropertyMapping[property];
        const factValue = eval(`account.${factPath}`);
        facts[factName] = factValue;
      });
    });
  
    return facts;
  };
  
  export const convertToRuleEnginePath = (str, accountIndexMap) => {
    if (str === "value") {
      return str;
    }
  
    const regex = /(.*?)\s\{(\d+)\}\s(\w+)/;
    const match = str.match(regex);
  
    if (match) {
      const accountName = match[1].trim();
      const mask = match[2];
      const property = match[3].toLowerCase();
  
      const key = `${accountName} {${mask}}`;
      const index = accountIndexMap[key];
  
      if (index !== undefined) {
        const propertyPath = accountPropertyMapping[property];
        if (propertyPath) {
          return `accounts[${index}].${propertyPath}`;
        } else {
          console.error('Invalid property:', property);
          return null;
        }
      } else {
        console.error('Invalid account key:', key);
        return null;
      }
    } else {
      console.error('Invalid string format:', str);
      return null;
    }
  };
  