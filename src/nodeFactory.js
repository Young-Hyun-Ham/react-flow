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
      return {
        ...baseData,
        method: 'GET',
        url: '',
        headers: '{}',
        body: '{}',
        responseMapping: [],
        errorMappingEnabled: true,
      };
    case 'branch':
      return { ...baseData, content: 'Enter your conditional branch question.', replies: [{ display: 'Condition 1', value: `cond_${Date.now()}` }, { display: 'Condition 2', value: `cond_${Date.now() + 1}` }] };
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
    default:
      return baseData;
  }
};

// --- 💡 수정된 부분 시작 ---
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
// --- 💡 수정된 부분 끝 ---