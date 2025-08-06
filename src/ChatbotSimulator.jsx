import { useState, useEffect, useCallback } from 'react';
import styles from './ChatbotSimulator.module.css';

const interpolateMessage = (message, slots) => {
  if (!message) return '';
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return slots[key] || match;
  });
};

function ChatbotSimulator({ nodes, edges }) {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [slots, setSlots] = useState({});

  const currentNode = nodes.find(n => n.id === currentId);

  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setSlots({});
      setCurrentId(startNode.id);
      setHistory([{ type: 'bot', nodeId: startNode.id }]);
    }
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 💡 수정된 부분 ---
  useEffect(() => {
    // currentNode는 currentId와 nodes가 바뀌면 자연스럽게 바뀌므로,
    // 이 effect 자체는 currentNode의 변화에 직접 반응할 필요가 없습니다.
    const node = nodes.find(n => n.id === currentId);

    if (node && node.type === 'text') {
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
  }, [currentId, nodes, edges]); // 의존성 배열을 최소화하여 무한 루프 방지


  const proceedToNextNode = (newSlots, sourceHandleId) => {
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
    const newSlots = { ...slots };
    if (currentSlot) {
      newSlots[currentSlot] = inputValue;
      setSlots(newSlots);
    }
    
    setInputValue('');
    proceedToNextNode(newSlots, null);
  };

  const handleOptionClick = (answer) => {
    if (!currentNode) return;
    setHistory((prev) => [...prev, { type: 'user', message: answer.display }]);
    
    const currentSlot = currentNode.data.slot;
    const newSlots = { ...slots };
    if (currentSlot && currentNode.type === 'slotFilling') {
      newSlots[currentSlot] = answer.value;
      setSlots(newSlots);
    }

    const sourceHandleId = currentNode.type === 'confirmation' ? answer.value : null;
    proceedToNextNode(newSlots, sourceHandleId);
  };
  
  const renderOptions = () => {
    if (!currentNode) { return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>); }
    if (currentNode.type === 'text') {
      if (edges.some(edge => edge.source === currentNode.id)) {
        return null; 
      }
    }
    const replies = currentNode.data.replies || [];
    if (replies.length > 0) {
      return replies.map((answer, index) => (
        <button key={index} className={styles.optionButton} onClick={() => handleOptionClick(answer)}>{answer.display}</button>
      ));
    }
    if (currentNode.type === 'slotFilling') {
      return (
        <div className={styles.inputArea}>
          <input type="text" className={styles.textInput} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTextInputSend()} placeholder="메시지를 입력하세요..."/>
          <button className={styles.sendButton} onClick={handleTextInputSend}>전송</button>
        </div>
      );
    }
    return (<button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>);
  };

  return (
    <div className={styles.simulator}>
      {/* --- 💡 수정된 부분: 헤더에 버튼 추가 --- */}
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