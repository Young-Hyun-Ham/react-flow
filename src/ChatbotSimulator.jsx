import { useState, useEffect, useCallback } from 'react';
import useStore from './store';
import styles from './ChatbotSimulator.module.css';
import { useChatFlow } from './hooks/useChatFlow';
import { validateInput, interpolateMessage } from './simulatorUtils';
import SimulatorHeader from './components/simulator/SimulatorHeader';
import MessageHistory from './components/simulator/MessageHistory';
import UserInput from './components/simulator/UserInput';

function ChatbotSimulator({ nodes, edges, isVisible, isExpanded, setIsExpanded }) {
  const { history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode } = useChatFlow(nodes, edges);
  const { slots, setSlots } = useStore();
  const [formData, setFormData] = useState({});

  const completeCurrentInteraction = () => {
    setHistory(prev => prev.map(item => item.nodeId === currentId ? { ...item, isCompleted: true } : item));
  };

  const handleTextInputSend = (text) => {
    if (!currentNode) return;
    setHistory(prev => [...prev, { type: 'user', message: text }]);
    let newSlots = { ...slots };
    if (currentNode.data.slot) {
      newSlots[currentNode.data.slot] = text;
      setSlots(newSlots);
    }
    proceedToNextNode(null, currentId, newSlots);
  };

  const handleOptionClick = (answer, sourceNodeId = currentId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    setHistory(prev => [...prev, { type: 'user', message: answer.display }]);
    completeCurrentInteraction();

    let newSlots = { ...slots };
    if (sourceNode.data.slot && sourceNode.type === 'slotfilling') {
      newSlots[sourceNode.data.slot] = answer.value;
      setSlots(newSlots);
    }

    const sourceHandleId = (sourceNode.type === 'branch' || sourceNode.type === 'fixedmenu') ? answer.value : null;
    proceedToNextNode(sourceHandleId, sourceNodeId, newSlots);
  };

  const handleFormInputChange = (elementName, value) => {
    setFormData(prev => ({ ...prev, [elementName]: value }));
  };

  const handleFormMultiInputChange = (elementName, value, checked) => {
    setFormData(prev => {
      const existingValues = prev[elementName] || [];
      const newValues = checked ? [...existingValues, value] : existingValues.filter(v => v !== value);
      return { ...prev, [elementName]: newValues };
    });
  };

  const handleFormSubmit = () => {
    for (const element of currentNode.data.elements) {
      if (element.type === 'input' || element.type === 'date') {
        const value = formData[element.name] || '';
        if (!validateInput(value, element.validation)) {
            let alertMessage = `'${element.label}' input is not valid.`;
            if (element.validation?.type === 'today after') alertMessage = `'${element.label}' must be today or a future date.`;
            else if (element.validation?.type === 'today before') alertMessage = `'${element.label}' must be today or a past date.`;
            else if (element.validation?.type === 'custom' && element.validation?.startDate && element.validation?.endDate) alertMessage = `'${element.label}' must be between ${element.validation.startDate} and ${element.validation.endDate}.`;
            alert(alertMessage);
            return;
        }
      }
    }
    completeCurrentInteraction();
    const newSlots = { ...slots, ...formData };
    setSlots(newSlots);
    setFormData({});
    setHistory(prev => [...prev, { type: 'user', message: "Form submitted." }]);
    proceedToNextNode(null, currentId, newSlots);
  };
  
  const handleFormDefault = () => {
    if (!currentNode || currentNode.type !== 'form') return;
    const defaultData = {};
    currentNode.data.elements.forEach(element => {
      if (element.name && element.defaultValue !== undefined) {
        defaultData[element.name] = element.defaultValue;
      }
    });
    setFormData(defaultData);
  };

  const handleFormElementApiCall = useCallback(async (clickedElement) => {
    if (!currentNode || currentNode.type !== 'form') {
        return;
    }
    const element = currentNode.data.elements.find(e => e.id === clickedElement.id);

    if (!element || !element.apiConfig || !element.resultSlot) {
      alert("Search element is not configured correctly. (Missing API URL or Result Slot)");
      return;
    }

    const { apiConfig, resultSlot } = element;
    const searchTerm = formData[element.name] || '';
    const allValues = { ...slots, value: searchTerm };
    const method = apiConfig.method || 'POST'; 

    try {
      const interpolatedUrl = interpolateMessage(apiConfig.url, allValues);

      const fetchOptions = {
        method: method,
        headers: {},
      };

      if (method === 'POST') {
        const interpolatedBody = interpolateMessage(apiConfig.bodyTemplate, allValues);
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = interpolatedBody;
      }
      
      const response = await fetch(interpolatedUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const responseData = await response.json();

      const newSlots = { ...slots, [resultSlot]: responseData };
      setSlots(newSlots);
      
    } catch (error) {
      console.error("Form element API call failed:", error);
      alert(`Search failed: ${error.message}`);
    }
  }, [formData, slots, setSlots, currentNode]);

  const handleGridRowClick = (rowData, gridElement) => {
    if (!currentNode || currentNode.type !== 'form' || !gridElement) {
      return;
    }

    // 1. 클릭된 행에서 첫 번째 컬럼 값 찾기
    const gridKeys = (gridElement.displayKeys && gridElement.displayKeys.length > 0) 
      ? gridElement.displayKeys.map(k => k.key) 
      : Object.keys(rowData);
      
    const firstColumnKey = gridKeys[0];
    const firstColumnValue = firstColumnKey ? rowData[firstColumnKey] : '';

    // 2. 이 그리드와 연결된 'search' 엘리먼트 찾기
    const searchElement = currentNode.data.elements.find(
      e => e.type === 'search' && e.resultSlot === gridElement.optionsSlot
    );

    if (!searchElement || !searchElement.name) {
      // 3. (Fallback)
      completeCurrentInteraction();
      const newSlots = { ...slots, ...formData, selectedRow: rowData };
      setSlots(newSlots);
      setFormData({});
      setHistory(prev => [...prev, { type: 'user', message: "Row selected." }]);
      proceedToNextNode(null, currentId, newSlots);
      return;
    }

    // 4. (성공) formData 업데이트 (검색창 값 변경)
    setFormData(prevData => ({
      ...prevData,
      [searchElement.name]: firstColumnValue
    }));

    // 5. slots 업데이트 (그리드 데이터 지우기 + selectedRow 설정)
    const newSlots = {
      ...slots,
      [gridElement.optionsSlot]: [], // 그리드 숨기기
      selectedRow: rowData        // selectedRow는 여전히 저장
    };
    setSlots(newSlots);
  };

  const handleExcelUpload = () => {
    alert('Excel Upload button clicked! (Logic not implemented yet)');
  };

  return (
    <div className={`${styles.simulator} ${isExpanded ? styles.expanded : ''}`}>
      <SimulatorHeader isVisible={isVisible} isExpanded={isExpanded} setIsExpanded={setIsExpanded} onStart={() => startSimulation()} />
      
      {fixedMenu && (
        <div className={styles.fixedMenuContainer}>
          <p className={styles.fixedMenuTitle}>{fixedMenu.content}</p>
          <div className={styles.fixedMenuButtons}>
            {fixedMenu.replies?.map(reply => (
              <button key={reply.value} className={styles.fixedMenuButton} onClick={() => handleOptionClick(reply, fixedMenu.nodeId)}>
                {reply.display}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isStarted ? (
        <div className={styles.history}>
            <div className={styles.startScreen}></div>
        </div>
       ) : (
         <MessageHistory
            history={history}
            nodes={nodes}
            onOptionClick={handleOptionClick}
            handleFormSubmit={handleFormSubmit}
            handleFormDefault={handleFormDefault}
            formData={formData}
            handleFormInputChange={handleFormInputChange}
            handleFormMultiInputChange={handleFormMultiInputChange}
            handleGridRowClick={handleGridRowClick}
            onExcelUpload={handleExcelUpload}
            handleFormElementApiCall={handleFormElementApiCall} 
        />
       )
      }
      
      <UserInput 
        currentNode={currentNode}
        isStarted={isStarted}
        onTextInputSend={handleTextInputSend}
        onOptionClick={handleOptionClick} 
      />
    </div>
  );
}

export default ChatbotSimulator;