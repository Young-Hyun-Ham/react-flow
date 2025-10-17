export const interpolateMessage = (message, slots) => {
  // message가 문자열이 아닐 경우를 대비해 String으로 변환합니다.
  const messageStr = String(message || '');
  if (!messageStr) return '';
  
  return messageStr.replace(/\{([^}]+)\}/g, (match, key) => {
    // getNestedValue를 사용하여 슬롯 내부의 객체 값에도 접근 가능하도록 수정
    const value = getNestedValue(slots, key);
    // 값이 객체나 배열인 경우 JSON 문자열로 변환하여 반환
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value !== undefined ? value : match;
  });
};

export const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    // 대괄호([]) 안의 숫자(인덱스)를 점(.) 표기법으로 변환합니다. 예: 'items[0]' -> 'items.0'
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    // 점(.)을 기준으로 경로를 분리하여 객체를 탐색합니다.
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

// --- 💡 수정된 부분 시작 ---
export const evaluateCondition = (slotValue, operator, condition, slots) => {
  let conditionValue = condition.value;
  // valueType이 'slot'이면, slots 객체에서 값을 가져옴
  if (condition.valueType === 'slot') {
    conditionValue = getNestedValue(slots, condition.value);
  }
  
  const lowerCaseConditionValue = String(conditionValue).toLowerCase();
  // --- 💡 수정된 부분 끝 ---
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