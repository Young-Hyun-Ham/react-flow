// src/nodeFactory.js

export const createNodeData = (type) => {
  const baseData = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };

  switch (type) {
    case 'start':
      return { ...baseData, description: 'Scenario starts here.' };
    case 'message':
      return { ...baseData, content: 'New text message', replies: [] };
    case 'slotfilling':
      return { ...baseData, content: 'Enter your question.', slot: 'newSlot', replies: [] };
    case 'api':
      return {
        ...baseData,
        isMulti: false,
        method: 'GET',
        url: '',
        headers: '{}',
        body: '{}',
        responseMapping: [],
        apis: [],
      };
    case 'branch':
      return {
        ...baseData,
        evaluationType: 'BUTTON',
        conditions: [{
          id: `cond-${Date.now()}`,
          slot: '',
          operator: '==',
          value: '',
          valueType: 'value'
        }],
        replies: [{ display: 'Condition 1', value: `cond_${Date.now()}` }]
      };
    case 'form':
      return {
        ...baseData,
        title: 'new form',
        elements: [],
        dataSourceType: 'json',
        dataSource: ''
      };
    case 'fixedmenu':
      return { ...baseData, content: 'Fixed Menu', replies: [{ display: 'Menu 1', value: `menu_${Date.now()}` }] };
    case 'link':
      return { ...baseData, content: 'https://', display: 'Link' };
    case 'llm':
      return {
        ...baseData,
        prompt: 'Ask me anything...',
        outputVar: 'llm_output',
        conditions: []
      };
    case 'toast':
      return {
        ...baseData,
        message: 'This is a toast message.',
        toastType: 'info'
      };
    case 'iframe':
      return {
        ...baseData,
        url: 'https://www.example.com',
        width: '250',
        height: '200'
      };
    case 'scenario':
        return { ...baseData, label: 'Imported Scenario', scenarioId: null };
    case 'setSlot':
        return { ...baseData, assignments: [{ key: 'newSlot', value: 'someValue' }] };
    // <<< [추가] 딜레이 노드 기본 데이터 >>>
    case 'delay':
        return { ...baseData, duration: 1000 }; // 기본 1초 (1000ms)
    // <<< [추가 끝] >>>
    default:
      return baseData;
  }
};

export const createFormElement = (elementType) => {
    const newId = `${elementType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let newElement;

    switch (elementType) {
        case 'input':
            // --- 💡 수정: defaultValueSlot 제거, defaultValue 추가 ---
            newElement = { id: newId, type: 'input', name: '', label: 'New Input', placeholder: '', validation: { type: 'text' }, defaultValue: '' };
            break;
        case 'date':
            newElement = { id: newId, type: 'date', name: '', label: 'New Date', defaultValue: '' };
            break;
        case 'grid':
            const rows = 2;
            const columns = 2;
            newElement = {
                id: newId,
                type: 'grid',
                name: '',
                label: 'New Grid',
                rows: rows,
                columns: columns,
                data: Array(rows * columns).fill(''),
                displayKeys: [], // --- 💡 수정된 부분 ---
            };
            break;
        case 'checkbox':
            newElement = { id: newId, type: 'checkbox', name: '', label: 'New Checkbox', options: [], defaultValue: [] };
            break;
        case 'dropbox':
            newElement = { id: newId, type: 'dropbox', name: '', label: 'New Dropbox', options: [], optionsSlot: '', defaultValue: '' };
            break;
        default:
            newElement = { id: newId, type: elementType };
    }
    return newElement;
}