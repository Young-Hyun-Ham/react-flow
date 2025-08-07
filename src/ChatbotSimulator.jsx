import { useState, useEffect, useCallback } from 'react';
import styles from './ChatbotSimulator.module.css';

const interpolateMessage = (message, slots) => {
  if (!message) return '';
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return slots[key] || match;
  });
};

const validateInput = (value, validation) => {
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
      }
      return true;
    default:
      return true;
  }
};


function ChatbotSimulator({ nodes, edges, isVisible }) {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [slots, setSlots] = useState({});
  const [formData, setFormData] = useState({});

  const currentNode = nodes.find(n => n.id === currentId);

  const addBotMessage = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.replies?.length > 0);
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: isInteractive ? false : true, id: Date.now() }]);
    }
  };

  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setSlots({});
      setFormData({});
      setCurrentId(startNode.id);
      
      const isInteractive = startNode.type === 'form' || (startNode.type === 'branch' && startNode.data.replies?.length > 0);
      setHistory([{ type: 'bot', nodeId: startNode.id, isCompleted: isInteractive ? false : true, id: Date.now() }]);
    }
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = nodes.find(n => n.id === currentId);

    if (node && node.type === 'message') {
      const nextEdge = edges.find((edge) => edge.source === node.id && !edge.sourceHandle);
      if (nextEdge) {
        const nextNode = nodes.find((n) => n.id === nextEdge.target);
        if (nextNode) {
          const timer = setTimeout(() => {
            setCurrentId(nextNode.id);
            addBotMessage(nextNode.id);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentId, nodes, edges]);

  const completeCurrentInteraction = () => {
    setHistory(prev => prev.map(item => 
      (item.nodeId === currentId) ? { ...item, isCompleted: true } : item
    ));
  };


  const proceedToNextNode = (sourceHandleId) => {
    if (!currentNode) return;
    let nextEdge;
    if (sourceHandleId) {
      nextEdge = edges.find(
        (edge) => edge.source === currentNode.id && edge.sourceHandle === sourceHandleId
      );
    } else {
      nextEdge = edges.find((edge) => edge.source === currentNode.id && !edge.sourceHandle);
    }

    if (nextEdge) {
      const nextNode = nodes.find((node) => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        setTimeout(() => addBotMessage(nextNode.id), 500);
      }
    } else {
      setTimeout(() => {
        setHistory((prev) => [...prev, { type: 'bot', message: '대화가 종료되었습니다.' }]);
        setCurrentId(null);
      }, 500);
    }
  };

  const handleTextInputSend = () => {
    if (!inputValue.trim() || !currentNode) return;
    setHistory((prev) => [...prev, { type: 'user', message: inputValue }]);

    const currentSlot = currentNode.data.slot;
    if (currentSlot) {
      setSlots(prev => ({ ...prev, [currentSlot]: inputValue }));
    }

    setInputValue('');
    proceedToNextNode(null);
  };

  const handleOptionClick = (answer) => {
    if (!currentNode) return;
    setHistory((prev) => [...prev, { type: 'user', message: answer.display }]);
    completeCurrentInteraction();

    const currentSlot = currentNode.data.slot;
    if (currentSlot && currentNode.type === 'api') {
      setSlots(prev => ({ ...prev, [currentSlot]: answer.value }));
    }

    const sourceHandleId = currentNode.type === 'branch' ? answer.value : null;
    proceedToNextNode(sourceHandleId);
  };

  const handleFormInputChange = (elementName, value) => {
    setFormData(prev => ({ ...prev, [elementName]: value }));
  };
  
  const handleFormMultiInputChange = (elementName, value, checked) => {
    setFormData(prev => {
      const existingValues = prev[elementName] || [];
      const newValues = checked
        ? [...existingValues, value]
        : existingValues.filter(v => v !== value);
      return { ...prev, [elementName]: newValues };
    });
  };

  const handleFormSubmit = () => {
    for (const element of currentNode.data.elements) {
      if (element.type === 'input') {
        const value = formData[element.name] || '';
        if (!validateInput(value, element.validation)) {
          alert(`'${element.label}' 입력값이 유효하지 않습니다.`);
          return;
        }
      }
    }
    
    completeCurrentInteraction();
    setSlots(prev => ({ ...prev, ...formData }));
    setFormData({});
    setHistory(prev => [...prev, { type: 'user', message: "양식을 제출했습니다." }]);
    proceedToNextNode(null);
  };

  const renderOptions = () => {
    if (!currentNode) { return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>); }
    
    if (currentNode.type === 'branch') {
      return null;
    }

    if (currentNode.type === 'message') {
      if (edges.some(edge => edge.source === currentNode.id)) {
        return null;
      }
    }
    const replies = currentNode.data.replies || [];
    if (replies.length > 0) {
      return replies.map((answer) => (
        <button key={answer.value} className={styles.optionButton} onClick={() => handleOptionClick(answer)}>{answer.display}</button>
      ));
    }
    if (currentNode.type === 'api') {
      return (
        <div className={styles.inputArea}>
          <input type="text" className={styles.textInput} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTextInputSend()} placeholder="메시지를 입력하세요..."/>
          <button className={styles.sendButton} onClick={handleTextInputSend}>전송</button>
        </div>
      );
    }
    if (currentNode.type === 'form') {
      return null;
    }
    return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>);
  };

  return (
    <div className={styles.simulator}>
      <div className={styles.header}>
        <span>챗봇</span>
        {/* --- 💡 수정: isVisible prop에 따라 버튼 렌더링 --- */}
        {isVisible && (
          <button className={styles.headerRestartButton} onClick={startSimulation}>
            다시 시작
          </button>
        )}
      </div>
      <div className={styles.history}>
        {history.map((item, index) => {
          if (item.type === 'bot' && item.nodeId) {
            const node = nodes.find(n => n.id === item.nodeId);
            if (!node) return null;

            if (node.type === 'form') {
              return (
                <div key={item.id || index} className={styles.messageRow}>
                  <div className={styles.avatar}>🤖</div>
                  <div className={`${styles.message} ${styles.botMessage} ${styles.formContainer}`}>
                    <h3>{node.data.title}</h3>
                    {node.data.elements?.map(el => (
                      <div key={el.id} className={styles.formElement}>
                        <label className={styles.formLabel}>{el.label}</label>
                        {el.type === 'input' && (
                          <input
                            type={el.validation?.type === 'email' ? 'email' : 'text'}
                            className={styles.formInput}
                            placeholder={el.placeholder}
                            value={formData[el.name] || ''}
                            onChange={(e) => handleFormInputChange(el.name, e.target.value)}
                            disabled={item.isCompleted}
                          />
                        )}
                        {el.type === 'date' && (
                           <input
                            type="date"
                            className={styles.formInput}
                            value={formData[el.name] || ''}
                            onChange={(e) => handleFormInputChange(el.name, e.target.value)}
                            disabled={item.isCompleted}
                          />
                        )}
                        {el.type === 'checkbox' && el.options?.map(opt => (
                          <div key={opt} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              id={`${el.id}-${opt}`}
                              value={opt}
                              checked={(formData[el.name] || []).includes(opt)}
                              onChange={(e) => handleFormMultiInputChange(el.name, opt, e.target.checked)}
                              disabled={item.isCompleted}
                            />
                            <label htmlFor={`${el.id}-${opt}`}>{opt}</label>
                          </div>
                        ))}
                        {el.type === 'dropbox' && (
                          <select
                            className={styles.formInput}
                            value={formData[el.name] || ''}
                            onChange={(e) => handleFormInputChange(el.name, e.target.value)}
                            disabled={item.isCompleted}
                          >
                            <option value="" disabled>선택...</option>
                            {el.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {el.type === 'grid' && (
                          <table className={styles.formGridTable}>
                            <tbody>
                              {[...Array(el.rows || 2)].map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                  {[...Array(el.columns || 2)].map((_, colIndex) => {
                                    const cellIndex = rowIndex * (el.columns || 2) + colIndex;
                                    const cellData = el.data[cellIndex] || '';
                                    return (
                                      <td key={colIndex}>
                                        {interpolateMessage(cellData, slots)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                    <button className={styles.formSubmitButton} onClick={handleFormSubmit} disabled={item.isCompleted}>제출</button>
                  </div>
                </div>
              );
            }

            const message = interpolateMessage(node.data.content || node.data.label, slots);
            return (
              <div key={item.id || index} className={styles.messageRow}>
                <div className={styles.avatar}>🤖</div>
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <div>{message}</div>
                  {node.type === 'branch' && (
                    <div className={styles.branchButtonsContainer}>
                      {node.data.replies?.map((reply) => (
                        <button
                          key={reply.value}
                          className={styles.branchButton}
                          onClick={() => handleOptionClick(reply)}
                          disabled={item.isCompleted}
                        >
                          {reply.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          if (item.type === 'user') {
            return (
              <div key={index} className={`${styles.messageRow} ${styles.userRow}`}>
                <div className={`${styles.message} ${styles.userMessage}`}>{item.message}</div>
              </div>
            );
          }
          if (item.type === 'bot' && item.message) {
            return (
                <div key={item.id || index} className={styles.messageRow}>
                  <div className={styles.avatar}>🤖</div>
                  <div className={`${styles.message} ${styles.botMessage}`}>{item.message}</div>
                </div>
              );
          }
          return null;
        })}
      </div>
      <div className={styles.options}>
        {renderOptions()}
      </div>
    </div>
  );
}

export default ChatbotSimulator;