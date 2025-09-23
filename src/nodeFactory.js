// src/nodeFactory.js

export const createNodeData = (type) => {
  const baseData = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };

  switch (type) {
    case 'message':
      return { ...baseData, content: 'New text message', replies: [] };
    case 'slotfilling':
      return { ...baseData, content: 'Enter your question.', slot: 'newSlot', replies: [] };
    case 'api':
      // --- 💡 수정된 부분 시작 ---
      return {
        ...baseData,
        isMulti: false, // Multi-API 모드 비활성화가 기본값
        // 단일 API 기본 구조
        method: 'GET',
        url: '',
        headers: '{}',
        body: '{}',
        responseMapping: [],
        // 다중 API를 위한 배열 (초기에는 비어있음)
        apis: [],
      };
    // --- 💡 수정된 부분 끝 ---
    case 'branch':
      return { 
        ...baseData, 
        evaluationType: 'BUTTON', // 'BUTTON' or 'CONDITION'
        conditions: [{
          id: `cond-${Date.now()}`,
          slot: '',
          operator: '==',
          value: ''
        }],
        replies: [{ display: 'Condition 1', value: `cond_${Date.now()}` }, { display: 'Condition 2', value: `cond_${Date.now() + 1}` }] 
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
      return { ...baseData, title: 'Fixed Menu', replies: [{ display: 'Menu 1', value: `menu_${Date.now()}` }, { display: 'Menu 2', value: `menu_${Date.now() + 1}` }] };
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
        toastType: 'info' // info, success, error
      };
    case 'iframe':
      return {
        ...baseData,
        url: 'https://www.example.com',
        width: '250',
        height: '200'
      };
    default:
      return baseData;
  }
};

export const createFormElement = (elementType) => {
    const newId = `${elementType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let newElement;

    switch (elementType) {
        case 'input':
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
                data: Array(rows * columns).fill('')
            };
            break;
        case 'checkbox':
            newElement = { id: newId, type: 'checkbox', name: '', label: 'New Checkbox', options: [], defaultValue: [] };
            break;
        case 'dropbox':
            newElement = { id: newId, type: 'dropbox', name: '', label: 'New Dropbox', options: [], defaultValue: '' };
            break;
        default:
            newElement = { id: newId, type: elementType };
    }
    return newElement;
}