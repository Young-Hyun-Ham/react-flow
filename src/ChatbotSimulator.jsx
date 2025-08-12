import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ChatbotSimulator.module.css';

const interpolateMessage = (message, slots) => {
  if (!message) return '';
  return message.replace(/\{([^}]+)\}/g, (match, key) => {
    return slots.hasOwnProperty(key) ? slots[key] : match;
  });
};

const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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
  const historyRef = useRef(null);

  const currentNode = nodes.find(n => n.id === currentId);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // 💡 1. 인자로 currentSlots를 받도록 수정
  const handleApiNode = async (node, currentSlots) => {
    const loadingId = Date.now();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);

    let isSuccess = false;
    try {
      const { method, url, headers, body, responseMapping } = node.data;
      
      // 💡 2. 상태(slots) 대신 전달받은 currentSlots 사용
      const interpolatedUrl = interpolateMessage(url, currentSlots);
      const interpolatedHeaders = JSON.parse(interpolateMessage(headers || '{}', currentSlots));
      const interpolatedBody = method !== 'GET' && body ? interpolateMessage(body, currentSlots) : undefined;

      const options = {
        method,
        headers: interpolatedHeaders,
        body: interpolatedBody,
      };
      
      console.log("API Request:", { method, url: interpolatedUrl, headers: interpolatedHeaders, body: options.body });
      //시연을 위해 의도적으로 2초 딜레이를 추가한다 TODO : 서비스 런칭 시 삭제 할 것
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(interpolatedUrl, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const newSlots = {};
      if (responseMapping && responseMapping.length > 0) {
        responseMapping.forEach(mapping => {
          if (mapping.path && mapping.slot) {
            const value = getNestedValue(result, mapping.path);
            if (value !== undefined) {
              newSlots[mapping.slot] = value;
            }
          }
        });
      } else {
        newSlots['api_response'] = JSON.stringify(result, null, 2);
      }

      // 💡 3. 여기서는 기존 슬롯과 새로운 슬롯을 합쳐서 상태 업데이트
      setSlots(prev => ({...prev, ...newSlots}));
      isSuccess = true;

      const resultMessage = `API call successful. Mapped data to slots.`;
      setHistory(prev => prev.map(item => 
        item.id === loadingId 
          ? { type: 'bot', message: resultMessage, id: loadingId }
          : item
      ));

    } catch (error) {
      console.error("API Error:", error);
      setHistory(prev => prev.map(item => 
        item.id === loadingId 
          ? { type: 'bot', message: `Error: ${error.message}`, id: loadingId }
          : item
      ));
    } finally {
      proceedToNextNode(isSuccess ? 'onSuccess' : 'onError', node.id);
    }
  };

  // 💡 4. updatedSlots 인자 추가 (기본값은 현재 상태의 slots)
  const addBotMessage = (nodeId, updatedSlots = slots) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        if (node.type === 'api') {
            // 💡 5. handleApiNode 호출 시 updatedSlots 전달
            handleApiNode(node, updatedSlots);
            return;
        }

      // ... (이하 코드는 동일)
      
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
      
      const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.replies?.length > 0) || node.type === 'slotfilling';
      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: isInteractive ? false : true, id: Date.now() }]);
    }
  };

  // 💡 6. updatedSlots 인자 추가
  const proceedToNextNode = (sourceHandleId, sourceNodeId = currentId, updatedSlots = slots) => {
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
        // 💡 7. addBotMessage 호출 시 updatedSlots 전달
        setTimeout(() => addBotMessage(nextNode.id, updatedSlots), 500);
      }
    } else {
        if(currentNode?.type !== 'fixedmenu' && currentNode?.type !== 'branch' && currentNode?.type !== 'api') {
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
      addBotMessage(startNode.id, {}); // 💡 시작 시 빈 슬롯 전달
    }
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  }, [startSimulation]);

  useEffect(() => {
    const node = nodes.find(n => n.id === currentId);
    if (node && (node.type === 'message')) {
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

    // 💡 8. 새로운 슬롯 객체를 미리 만들고 상태 업데이트와 함수 호출에 모두 사용
    let newSlots = { ...slots };
    const currentSlot = currentNode.data.slot;
    if (currentSlot) {
      newSlots = { ...slots, [currentSlot]: inputValue };
      setSlots(newSlots);
    }

    setInputValue('');
    proceedToNextNode(null, currentId, newSlots);
  };

  const handleOptionClick = (answer, sourceNodeId = currentId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    setHistory((prev) => [...prev, { type: 'user', message: answer.display }]);
    completeCurrentInteraction();

    // 💡 9. 새로운 슬롯 객체를 미리 만들고 상태 업데이트와 함수 호출에 모두 사용
    let newSlots = { ...slots };
    const currentSlot = sourceNode.data.slot;
    if (currentSlot && sourceNode.type === 'slotfilling') {
      newSlots = { ...slots, [currentSlot]: answer.value };
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
    
    // 💡 10. 새로운 슬롯 객체를 미리 만들고 상태 업데이트와 함수 호출에 모두 사용
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
      if (!element.name) return;

      switch (element.type) {
        case 'input':
          if (element.validation?.type === 'email') {
            defaultData[element.name] = 'test@example.com';
          } else if (element.validation?.type === 'phone number') {
            defaultData[element.name] = '010-1234-5678';
          } else if (element.label === 'Estimated Cargo Weight(kg)') {
            defaultData[element.name] = '1000';
          } else {
            defaultData[element.name] = `1`;
          }
          break;
        case 'date':
          // const today = new Date();
          // const year = today.getFullYear();
          // const month = String(today.getMonth() + 1).padStart(2, '0');
          // const day = String(today.getDate()).padStart(2, '0');
          // defaultData[element.name] = `${year}-${month}-${day}`;
          defaultData[element.name] = '2025-08-20';
          break;
        case 'checkbox':
          if (element.options?.length > 0) {
            defaultData[element.name] = [element.options[0]];
          }
          break;
        case 'dropbox':
          if (element.options?.length > 0) {
            defaultData[element.name] = element.options[0];
          }
          break;
        default:
          break;
      }
    });
    setFormData(defaultData);
  };


  const renderOptions = () => {
    if (!currentNode) { return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>Restart Conversation</button>); }

    if (currentNode.type === 'branch' || currentNode.type === 'fixedmenu' || currentNode.type === 'api') {
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
    if (currentNode.type === 'slotfilling') {
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
      <div className={styles.history} ref={historyRef}>
        {history.map((item, index) => {
          if (item.type === 'loading') {
            return (
              <div key={item.id} className={styles.messageRow}>
                <div className={styles.avatar}>🤖</div>
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <img src="/images/Loading.gif" alt="Loading..." style={{ width: '80px', height: '60px' }} />
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
                    <div className={styles.formButtonContainer}>
                      <button className={styles.formDefaultButton} onClick={handleFormDefault} disabled={item.isCompleted}>
                        Default
                      </button>
                      <button className={styles.formSubmitButton} onClick={handleFormSubmit} disabled={item.isCompleted}>
                        Submit
                      </button>
                    </div>
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