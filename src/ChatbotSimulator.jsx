import { useState, useEffect, useCallback } from 'react';
import styles from './ChatbotSimulator.module.css';

const interpolateMessage = (message, slots) => {
  if (!message) return '';
  // --- 💡 이 함수가 {key}를 slots[key]로 교체하는 핵심 역할을 합니다 ---
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return slots[key] || match;
  });
};

function ChatbotSimulator({ nodes, edges }) {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [slots, setSlots] = useState({});
  const [formData, setFormData] = useState({});

  const currentNode = nodes.find(n => n.id === currentId);

  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setSlots({});
      setFormData({});
      setCurrentId(startNode.id);
      setHistory([{ type: 'bot', nodeId: startNode.id }]);
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
            setHistory((prev) => [...prev, { type: 'bot', nodeId: nextNode.id }]);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentId, nodes, edges]);


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
        setTimeout(() => {
          setHistory((prev) => [...prev, { type: 'bot', nodeId: nextNode.id }]);
        }, 500);
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

  // --- 💡 수정된 부분: 폼 데이터를 slots에 병합 ---
  const handleFormSubmit = () => {
    // 1. 현재 폼 데이터를 전역 slots에 병합
    setSlots(prev => ({ ...prev, ...formData }));
    // 2. 다음 폼을 위해 formData 초기화
    setFormData({});
    // 3. 사용자에게 제출 완료 메시지 표시
    setHistory(prev => [...prev, { type: 'user', message: "양식을 제출했습니다." }]);
    // 4. 다음 노드로 진행
    proceedToNextNode(null);
  };

  const renderOptions = () => {
    if (!currentNode) { return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>); }
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
        <button className={styles.headerRestartButton} onClick={startSimulation}>
          다시 시작
        </button>
      </div>
      <div className={styles.history}>
        {history.map((item, index) => {
          if (item.type === 'bot' && item.nodeId) {
            const node = nodes.find(n => n.id === item.nodeId);
            if (!node) return null;

            if (node.type === 'form') {
              return (
                <div key={index} className={styles.messageRow}>
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
                          />
                        )}
                        {el.type === 'date' && (
                           <input
                            type="date"
                            className={styles.formInput}
                            value={formData[el.name] || ''}
                            onChange={(e) => handleFormInputChange(el.name, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                    <button className={styles.formSubmitButton} onClick={handleFormSubmit}>제출</button>
                  </div>
                </div>
              );
            }

            const message = interpolateMessage(node.data.content || node.data.label, slots);
            return (
              <div key={index} className={styles.messageRow}>
                <div className={styles.avatar}>🤖</div>
                <div className={`${styles.message} ${styles.botMessage}`}>{message}</div>
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
                <div key={index} className={styles.messageRow}>
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