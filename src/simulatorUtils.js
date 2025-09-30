export const interpolateMessage = (message, slots) => {
  if (!message) return '';
  return message.replace(/\{([^}]+)\}/g, (match, key) => {
    return slots.hasOwnProperty(key) ? slots[key] : match;
  });
};

export const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const validateInput = (value, validation) => {
  if (!validation) return true;

  switch (validation.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone number':
      return /^\d{2,3}-\d{3,4}-\d{4}$/.test(value);
    case 'custom':
        if (validation.regex) { // Input type custom
            try {
                return new RegExp(validation.regex).test(value);
            } catch (e) {
                console.error("Invalid regex:", validation.regex);
                return false;
            }
        } else if (validation.startDate && validation.endDate) { // Date type custom
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const selectedDate = new Date(value);
            const startDate = new Date(validation.startDate);
            const endDate = new Date(validation.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return selectedDate >= startDate && selectedDate <= endDate;
        }
        return true;
    case 'today after':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const selectedDateAfter = new Date(value);
      const todayAfter = new Date();
      todayAfter.setHours(0, 0, 0, 0);
      return selectedDateAfter >= todayAfter;
    case 'today before':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const selectedDateBefore = new Date(value);
      const todayBefore = new Date();
      todayBefore.setHours(23, 59, 59, 999);
      return selectedDateBefore <= todayBefore;
    default:
      return true;
  }
};

export const evaluateCondition = (slotValue, operator, conditionValue) => {
  const lowerCaseConditionValue = String(conditionValue).toLowerCase();
  if (lowerCaseConditionValue === 'true' || lowerCaseConditionValue === 'false') {
    const boolConditionValue = lowerCaseConditionValue === 'true';
    const boolSlotValue = String(slotValue).toLowerCase() === 'true';

    switch (operator) {
      case '==':
        return boolSlotValue === boolConditionValue;
      case '!=':
        return boolSlotValue !== boolConditionValue;
      default:
        return false;
    }
  }

  const numSlotValue = parseFloat(slotValue);
  const numConditionValue = parseFloat(conditionValue);

  switch (operator) {
    case '==':
      return slotValue == conditionValue;
    case '!=':
      return slotValue != conditionValue;
    case '>':
      return !isNaN(numSlotValue) && !isNaN(numConditionValue) && numSlotValue > numConditionValue;
    case '<':
      return !isNaN(numSlotValue) && !isNaN(numConditionValue) && numSlotValue < numConditionValue;
    case '>=':
      return !isNaN(numSlotValue) && !isNaN(numConditionValue) && numSlotValue >= numConditionValue;
    case '<=':
      return !isNaN(numSlotValue) && !isNaN(numConditionValue) && numSlotValue <= numConditionValue;
    case 'contains':
      return slotValue && slotValue.toString().includes(conditionValue);
    case '!contains':
      return !slotValue || !slotValue.toString().includes(conditionValue);
    default:
      return false;
  }
};