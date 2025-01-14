// bankCascaderFilter.js (or inside BankCascader.js)

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
  