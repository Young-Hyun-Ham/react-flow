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
  const [fixedMenu, setFixedMenu] = useState(null);

  const currentNode = nodes.find(n => n.id === currentId);

  const addBotMessage = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // --- 💡 수정된 부분: API 노드 타입에 대한 로딩 처리 ---
      if (node.type === 'api') {
        const loadingId = Date.now();
        setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
        
        setTimeout(() => {
          setHistory(prev => prev.map(item => 
            item.id === loadingId 
              ? { type: 'bot', nodeId, isCompleted: node.data.replies?.length > 0 ? false : true, id: loadingId }
              : item
          ));
        }, 2000);
        return;
      }
      
      if (node.type === 'fixedmenu') {
        setHistory([]);
        setFixedMenu({ nodeId: node.id, ...node.data });
        setCurrentId(node.id);
        return;
      }

      if (node.type === 'link') {
        setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: true, id: Date.now() }]);
        if (node.data.content) {
            window.open(node.data.content, '_blank', 'noopener,noreferrer');
        }
        proceedToNextNode(null, nodeId);
        return;
      }

      const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.replies?.length > 0);
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: isInteractive ? false : true, id: Date.now() }]);
    }
  };

  const proceedToNextNode = (sourceHandleId, sourceNodeId = currentId) => {
    if (!sourceNodeId) return;
    let nextEdge;
    if (sourceHandleId) {
      nextEdge = edges.find(
        (edge) => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId
      );
    } else {
      nextEdge = edges.find((edge) => edge.source === sourceNodeId && !edge.sourceHandle);
    }

    if (nextEdge) {
      const nextNode = nodes.find((node) => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        setTimeout(() => addBotMessage(nextNode.id), 500);
      }
    } else {
        if(currentNode?.type !== 'fixedmenu' && currentNode?.type !== 'branch') {
            setTimeout(() => {
                setHistory((prev) => [...prev, { type: 'bot', message: 'The conversation has ended.' }]);
                setCurrentId(null);
            }, 500);
        }
    }
  };


  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setSlots({});
      setFormData({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(startNode.id);
      addBotMessage(startNode.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = nodes.find(n => n.id === currentId);
    if (node && (node.type === 'message' || (node.type === 'api' && !node.data.replies?.length))) {
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

  const handleOptionClick = (answer, sourceNodeId = currentId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    setHistory((prev) => [...prev, { type: 'user', message: answer.display }]);
    completeCurrentInteraction();

    const currentSlot = sourceNode.data.slot;
    if (currentSlot && sourceNode.type === 'api') {
      setSlots(prev => ({ ...prev, [currentSlot]: answer.value }));
    }

    const sourceHandleId = (sourceNode.type === 'branch' || sourceNode.type === 'fixedmenu') ? answer.value : null;
    proceedToNextNode(sourceHandleId, sourceNodeId);
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
          alert(`'${element.label}' input is not valid.`);
          return;
        }
      }
    }

    completeCurrentInteraction();
    setSlots(prev => ({ ...prev, ...formData }));
    setFormData({});
    setHistory(prev => [...prev, { type: 'user', message: "Form submitted." }]);
    proceedToNextNode(null);
  };

  const renderOptions = () => {
    if (!currentNode) { return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>Restart Conversation</button>); }

    if (currentNode.type === 'branch' || currentNode.type === 'fixedmenu') {
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
          <input type="text" className={styles.textInput} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTextInputSend()} placeholder="Enter a message..."/>
          <button className={styles.sendButton} onClick={handleTextInputSend}>Send</button>
        </div>
      );
    }
    if (currentNode.type === 'form') {
      return null;
    }
    return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>Restart Conversation</button>);
  };

  return (
    <div className={styles.simulator}>
      <div className={styles.header}>
        <span>Chatbot</span>
        {isVisible && (
          <button className={styles.headerRestartButton} onClick={startSimulation}>
            Restart
          </button>
        )}
      </div>
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
      <div className={styles.history}>
        {history.map((item, index) => {
          // --- 💡 추가된 부분: 로딩 상태 렌더링 ---
          if (item.type === 'loading') {
            return (
              <div key={item.id} className={styles.messageRow}>
                <div className={styles.avatar}>🤖</div>
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <img src="/images/Loading.gif" alt="Loading..." style={{ width: '40px', height: '30px' }} />
                </div>
              </div>
            );
          }

          if (item.type === 'bot' && item.nodeId) {
            const node = nodes.find(n => n.id === item.nodeId);
            if (!node) return null;

            if (node.type === 'link') {
              return (
                <div key={item.id || index} className={styles.messageRow}>
                  <div className={styles.avatar}>🤖</div>
                  <div className={`${styles.message} ${styles.botMessage}`}>
                    <span>Opening link in a new tab: </span>
                    <a href={node.data.content} target="_blank" rel="noopener noreferrer">{node.data.display || node.data.content}</a>
                  </div>
                </div>
              );
            }

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
                            type="text"
                            placeholder="YYYY-MM-DD"
                            className={styles.formInput}
                            value={formData[el.name] || ''}
                            onChange={(e) => handleFormInputChange(el.name, e.target.value)}
                            onFocus={(e) => (e.target.type = 'date')}
                            onBlur={(e) => {
                                if (!e.target.value) {
                                    e.target.type = 'text';
                                }
                            }}
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
                            <option value="" disabled>Select...</option>
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
                    <button className={styles.formSubmitButton} onClick={handleFormSubmit} disabled={item.isCompleted}>Submit</button>
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