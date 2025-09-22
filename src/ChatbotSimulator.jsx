import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from './store';
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

const evaluateCondition = (slotValue, operator, conditionValue) => {
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
      return slotValue && slotValue.toString().includes(conditionValue);
    case '!contains':
      return !slotValue || !slotValue.toString().includes(conditionValue);
    default:
      return false;
  }
};


const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </svg>
);

const AttachIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8V16" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12H16" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const useDraggableScroll = () => {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e) => {
        setIsDragging(true);
        if (ref.current) {
            setStartX(e.pageX - ref.current.offsetLeft);
            setScrollLeft(ref.current.scrollLeft);
        }
    };

    const onMouseLeave = () => {
        setIsDragging(false);
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2; // multiply for faster scroll
        ref.current.scrollLeft = scrollLeft - walk;
    };

    return { ref, isDragging, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
};


function ChatbotSimulator({ nodes, edges, isVisible, isExpanded, setIsExpanded }) {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [formData, setFormData] = useState({});
  const [fixedMenu, setFixedMenu] = useState(null);
  const historyRef = useRef(null);

  const slots = useStore((state) => state.slots);
  const setSlots = useStore((state) => state.setSlots);

  const currentNode = nodes.find(n => n.id === currentId);

  const quickRepliesSlider = useDraggableScroll();

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots) => {
    if (!sourceNodeId) return;
    
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    let nextEdge;

    if (sourceNode && sourceNode.type === 'llm' && sourceNode.data.conditions?.length > 0) {
        const llmOutput = updatedSlots[sourceNode.data.outputVar] || '';
        
        const matchedCondition = sourceNode.data.conditions.find(cond => 
            llmOutput.toLowerCase().includes(cond.keyword.toLowerCase())
        );

        if (matchedCondition) {
            nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === matchedCondition.id);
        }
    }

    if (sourceNode && sourceNode.type === 'branch' && sourceNode.data.evaluationType === 'CONDITION') {
        const conditions = sourceNode.data.conditions || [];
        for (const condition of conditions) {
            const slotValue = updatedSlots[condition.slot];
            if (evaluateCondition(slotValue, condition.operator, condition.value)) {
                const handleId = sourceNode.data.replies[conditions.indexOf(condition)]?.value;
                if(handleId) {
                  nextEdge = edges.find(edge => edge.source === sourceNodeId && edge.sourceHandle === handleId);
                  if (nextEdge) break;
                }
            }
        }
    }


    if (!nextEdge) {
        if (sourceHandleId) {
            nextEdge = edges.find(
              (edge) => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId
            );
        } else {
            nextEdge = edges.find((edge) => edge.source === sourceNodeId && edge.sourceHandle === 'default') || 
                       edges.find((edge) => edge.source === sourceNodeId && !edge.sourceHandle);
        }
    }

    if (nextEdge) {
      const nextNode = nodes.find((node) => node.id === nextEdge.target);
      if (nextNode) {
        setCurrentId(nextNode.id);
        setTimeout(() => addBotMessage(nextNode.id, updatedSlots), 500);
      }
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      if(sourceNode?.type !== 'fixedmenu' && sourceNode?.type !== 'branch' && sourceNode?.type !== 'api') {
        setTimeout(() => {
          setCurrentId(null);
        }, 500);
      }
    }
  }, [edges, nodes]);

  const addBotMessage = useCallback((nodeId, updatedSlots) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      if (node.id === 'branch-1754639034237-vsol31e') {
        const loadingId = Date.now();
        setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
        setTimeout(() => {
          const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.replies?.length > 0) || node.type === 'slotfilling';
          setHistory(prev => prev.map(item => 
            item.id === loadingId 
              ? { type: 'bot', nodeId: node.id, isCompleted: !isInteractive, id: loadingId } 
              : item
          ));
        }, 2000);
        return;
      }
      
      if (node.type === 'api') {
        handleApiNode(node, updatedSlots);
        return;
      }

      if (node.type === 'llm') {
        handleLlmNode(node, updatedSlots);
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
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
      }

      if (node.type === 'toast') {
        const message = interpolateMessage(node.data.message, updatedSlots);
        alert(`[${node.data.toastType || 'info'}] ${message}`);
        proceedToNextNode(null, nodeId, updatedSlots);
        return;
      }

      if (node.type === 'branch' && node.data.evaluationType === 'CONDITION') {
          proceedToNextNode(null, nodeId, updatedSlots);
          return;
      }
      
      const isInteractive = node.type === 'form' || (node.type === 'branch' && node.data.evaluationType === 'BUTTON' && node.data.replies?.length > 0) || node.type === 'slotfilling';

      setHistory(prev => [...prev, { type: 'bot', nodeId, isCompleted: !isInteractive || node.type === 'iframe', id: Date.now() }]);
    }
  }, [nodes, proceedToNextNode]);

  const handleApiNode = useCallback(async (node, currentSlots) => {
    const loadingId = Date.now();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);

    let isSuccess = false;
    let finalSlots = { ...currentSlots };

    try {
      const { method, url, headers, body, responseMapping } = node.data;
      
      const interpolatedUrl = interpolateMessage(url, currentSlots);
      const interpolatedHeaders = JSON.parse(interpolateMessage(headers || '{}', currentSlots));
      const interpolatedBody = method !== 'GET' && body ? interpolateMessage(body, currentSlots) : undefined;

      const options = {
        method,
        headers: interpolatedHeaders,
        body: interpolatedBody,
      };
      
      console.log("API Request:", { method, url: interpolatedUrl, headers: interpolatedHeaders, body: options.body });
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
      
      finalSlots = { ...currentSlots, ...newSlots };
      setSlots(finalSlots);
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
      proceedToNextNode(isSuccess ? 'onSuccess' : 'onError', node.id, finalSlots);
    }
  }, [proceedToNextNode, setSlots]);

  const handleLlmNode = useCallback(async (node, currentSlots) => {
    const streamingMessageId = Date.now();
    let accumulatedContent = '';
    setHistory(prev => [...prev, { type: 'bot_streaming', id: streamingMessageId, content: '', isStreaming: true }]);

    try {
        const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);

        const response = await fetch('https://musclecat.co.kr/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: interpolatedPrompt }),
        });

        if (!response.body) throw new Error('ReadableStream not available');

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
              setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, isStreaming: false } : item));
              break;
            }
            accumulatedContent += value;
            setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent } : item));
        }
    } catch (error) {
        console.error("LLM Error:", error);
        accumulatedContent = `Error: ${error.message}`;
        setHistory(prev => prev.map(item => item.id === streamingMessageId ? { ...item, content: accumulatedContent, isStreaming: false } : item));
    } finally {
        let finalSlots = { ...currentSlots };
        if (node.data.outputVar) {
            finalSlots[node.data.outputVar] = accumulatedContent;
            setSlots(finalSlots);
        }
        proceedToNextNode(null, node.id, finalSlots);
    }
  }, [proceedToNextNode, setSlots]);
  
  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      const initialSlots = {};
      setSlots(initialSlots);
      setFormData({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(startNode.id);
      addBotMessage(startNode.id, initialSlots);
    }
  }, [nodes, edges, addBotMessage, setSlots]);

  useEffect(() => {
    startSimulation();
  }, [startSimulation]);

  useEffect(() => {
    const node = nodes.find(n => n.id === currentId);
    if (node && (node.type === 'message' || node.type === 'iframe')) {
      const nextEdge = edges.find((edge) => edge.source === node.id && !edge.sourceHandle);
      if (nextEdge) {
        const nextNode = nodes.find((n) => n.id === nextEdge.target);
        if (nextNode) {
          const timer = setTimeout(() => {
            setCurrentId(nextNode.id);
            addBotMessage(nextNode.id, slots);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentId, nodes, edges, addBotMessage, slots]);

  const completeCurrentInteraction = () => {
    setHistory(prev => prev.map(item =>
      (item.nodeId === currentId) ? { ...item, isCompleted: true } : item
    ));
  };

  const handleTextInputSend = () => {
    if (!inputValue.trim() || !currentNode) return;
    setHistory((prev) => [...prev, { type: 'user', message: inputValue }]);

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
      if (element.type === 'input' || element.type === 'date') {
        const value = formData[element.name] || '';
        if (!validateInput(value, element.validation)) {
            let alertMessage = `'${element.label}' input is not valid.`;
            if (element.validation?.type === 'today after') {
                alertMessage = `'${element.label}' must be today or a future date.`;
            } else if (element.validation?.type === 'today before') {
                alertMessage = `'${element.label}' must be today or a past date.`;
            } else if (element.validation?.type === 'custom' && element.validation?.startDate && element.validation?.endDate) {
                alertMessage = `'${element.label}' must be between ${element.validation.startDate} and ${element.validation.endDate}.`;
            }
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
      <div className={`${styles.header} ${isExpanded ? styles.expanded : ''}`}>

          <div className={styles.headerContent}>
            <img src="/images/icon.png" alt="AI Chatbot Icon" className={styles.headerIcon} />
            <div className={styles.headerTextContainer}>
              <span className={styles.headerTitle}>AI ChatBot</span>
              <span className={styles.headerSubtitle}>Booking Master</span>
            </div>
          </div>
          
        <div className={styles.headerButtons}>
          {isVisible && (
            <div className={styles.headerButton} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse" : "Expand"}>
              <img src="/images/expand.png" alt="expand" className={!isExpanded ? styles.expandIcon : styles.collapseIcon} />
            </div>
          )}
          {isVisible && (
            <button className={styles.headerRestartButton} onClick={startSimulation}>
              Restart
            </button>
          )}
        </div>
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
          if (item.type === 'bot_streaming') {
            return (
              <div key={item.id} className={styles.messageRow}>
                <img 
                  src={item.isStreaming ? "/images/avatar-loading.png" : "/images/avatar.png"} 
                  alt="Chatbot Avatar" 
                  className={styles.avatar} 
                />
                <div className={`${styles.message} ${styles.botMessage}`}>{item.content}</div>
              </div>
            );
          }
          if (item.type === 'loading') {
            return (
              <div key={item.id} className={styles.messageRow}>
                <img src="/images/avatar-loading.png" alt="Chatbot Avatar" className={styles.avatar} />
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <img src="/images/Loading.gif" alt="Loading..." style={{ width: '80px', height: '60px' }} />
                </div>
              </div>
            );
          }

          if (item.type === 'bot' && item.nodeId) {
            const node = nodes.find(n => n.id === item.nodeId);
            if (!node) return null;

            if (node.type === 'iframe') {
              return (
                <div key={item.id || index} className={styles.messageRow}>
                  <img src="/images/avatar.png" alt="Chatbot Avatar" className={styles.avatar} />
                  <div className={`${styles.message} ${styles.botMessage} ${styles.iframeContainer}`}>
                    <iframe
                      src={interpolateMessage(node.data.url, slots)}
                      width={node.data.width || '100%'}
                      height={node.data.height || '250'}
                      style={{ border: 'none', borderRadius: '18px' }}
                      title="chatbot-iframe"
                    ></iframe>
                  </div>
                </div>
              );
            }

            if (node.type === 'link') {
              return (
                <div key={item.id || index} className={styles.messageRow}>
                  <img src="/images/avatar.png" alt="Chatbot Avatar" className={styles.avatar} />
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
                  <img src="/images/avatar.png" alt="Chatbot Avatar" className={styles.avatar} />
                  <div className={`${styles.message} ${styles.botMessage} ${styles.formContainer}`}>
                    <h3>{node.data.title}</h3>
                    {node.data.elements?.map(el => {
                      const dateProps = {};
                      if (el.type === 'date') {
                          if (el.validation?.type === 'today after') {
                              dateProps.min = new Date().toISOString().split('T')[0];
                          } else if (el.validation?.type === 'today before') {
                              dateProps.max = new Date().toISOString().split('T')[0];
                          } else if (el.validation?.type === 'custom') {
                              if(el.validation.startDate) dateProps.min = el.validation.startDate;
                              if(el.validation.endDate) dateProps.max = el.validation.endDate;
                          }
                      }
                      return (
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
                            {...dateProps}
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
                    )})}
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
                <img src="/images/avatar.png" alt="Chatbot Avatar" className={styles.avatar} />
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <div>{message}</div>
                  {/* --- 💡 수정된 부분: evaluationType이 'BUTTON'일 때만 버튼을 렌더링 --- */}
                  {node.type === 'branch' && node.data.evaluationType === 'BUTTON' && (
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
                  <img src="/images/avatar.png" alt="Chatbot Avatar" className={styles.avatar} />
                  <div className={`${styles.message} ${styles.botMessage}`}>{item.message}</div>
                </div>
              );
          }
          return null;
        })}
      </div>
      <div className={styles.options}>
        <div className={styles.inputRow}>
            <div className={styles.inputArea}>
                <input
                    type="text"
                    className={styles.textInput}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextInputSend()}
                    placeholder="Ask about this Booking Master Page"
                />
            </div>
        </div>
        <div className={styles.buttonRow}>
            <button className={styles.attachButton}>
                <AttachIcon />
            </button>
            <div
                ref={quickRepliesSlider.ref}
                className={`${styles.quickRepliesContainer} ${quickRepliesSlider.isDragging ? styles.dragging : ''}`}
                onMouseDown={quickRepliesSlider.onMouseDown}
                onMouseLeave={quickRepliesSlider.onMouseLeave}
                onMouseUp={quickRepliesSlider.onMouseUp}
                onMouseMove={quickRepliesSlider.onMouseMove}
            >
                {currentNode && (currentNode.data.replies || []).length > 0 && (currentNode.type === 'message' || currentNode.type === 'slotfilling' || currentNode.type === 'branch') &&
                    (currentNode.data.replies || []).map((answer) => (
                        <button key={answer.value} className={styles.optionButton} onClick={() => handleOptionClick(answer)}>{answer.display}</button>
                    ))
                }
            </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotSimulator;