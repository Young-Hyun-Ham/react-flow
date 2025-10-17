export const interpolateMessage = (message, slots) => {
  // message가 문자열이 아닐 경우를 대비해 String으로 변환합니다.
  const messageStr = String(message || '');
  if (!messageStr) return '';
  
  // --- 💡 수정된 부분: Slot 참조 방식을 {{slotName}}으로 변경 ---
  return messageStr.replace(/{{([^}]+)}}/g, (match, key) => {
    // getNestedValue를 사용하여 슬롯 내부의 객체 값에도 접근 가능하도록 수정
    const value = getNestedValue(slots, key);
    // 값이 객체나 배열인 경우 JSON 문자열로 변환하여 반환
    if (typeof value === 'object' && value !== null) {
      // 💡 중요: JSON Body 내에서 객체/배열 슬롯을 사용할 때 따옴표 문제를 피하기 위해
      // JSON.stringify 결과를 반환하지 않고, 직접 객체를 주입해야 합니다.
      // 이 부분은 handleApiNode에서 처리하도록 하고, 여기서는 문자열화합니다.
      return JSON.stringify(value);
    }
    return value !== undefined ? value : match;
  });
};

export const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    return normalizedPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

export const validateInput = (value, validation) => {
  if (!validation) return true;

  switch (validation.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone number':
      return /^\d{2,3}-\d{3,4}-\d{4}$/.test(value);
    case 'custom':
        if (validation.regex) {
            try {
                return new RegExp(validation.regex).test(value);
            } catch (e) {
                console.error("Invalid regex:", validation.regex);
                return false;
            }
        } else if (validation.startDate && validation.endDate) {
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

export const evaluateCondition = (slotValue, operator, condition, slots) => {
  let conditionValue = condition.value;
  if (condition.valueType === 'slot') {
    conditionValue = getNestedValue(slots, condition.value);
  }
  
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
      return slotValue && String(slotValue).includes(conditionValue);
    case '!contains':
      return !slotValue || !String(slotValue).includes(conditionValue);
    default:
      return false;
  }
};