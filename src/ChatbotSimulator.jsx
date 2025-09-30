import { useState, useEffect, useCallback } from 'react';
import useStore from './store';
import styles from './ChatbotSimulator.module.css';
import { useChatFlow } from './hooks/useChatFlow';
import { validateInput } from './simulatorUtils';
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