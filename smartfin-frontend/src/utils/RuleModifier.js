class RuleModifier {
    constructor() {
      this.rule = {
        conditions: {
          all: [],
        },
        event: {
          type: 'custom-rule',
          params: {},
        },
      };
    }
  
    addCondition(sectionIndex, condition) {
      const conditionGroup = this.rule.conditions.all[sectionIndex];
      if (conditionGroup) {
        conditionGroup.conditions.push(condition);
      } else {
        this.rule.conditions.all[sectionIndex] = {
          conditions: [condition],
          operator: 'all',
        };
      }
    }
  
    addSection() {
      this.rule.conditions.all.push({
        conditions: [],
        operator: 'all',
      });
    }
  
    updateCondition(sectionIndex, conditionIndex, key, value) {
      const conditionGroup = this.rule.conditions.all[sectionIndex];
      if (conditionGroup) {
        const condition = conditionGroup.conditions[conditionIndex];
        if (condition) {
          condition[key] = value;
        }
      }
    }
  
    removeCondition(sectionIndex, conditionIndex) {
      const conditionGroup = this.rule.conditions.all[sectionIndex];
      if (conditionGroup) {
        conditionGroup.conditions.splice(conditionIndex, 1);
      }
    }
  
    removeSection(sectionIndex) {
      this.rule.conditions.all.splice(sectionIndex, 1);
    }
  
    getRule() {
      return this.rule;
    }
  
    setEventParams(params) {
      this.rule.event.params = params;
    }
  }
  
  export default RuleModifier;
  