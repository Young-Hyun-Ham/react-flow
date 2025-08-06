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
  const [formContent, setFormContent] = useState(null); // --- 💡 추가된 부분: 폼 데이터 상태

  const currentNode = nodes.find(n => n.id === currentId);

  const startSimulation = useCallback(() => {
    const edgeTargets = new Set(edges.map((edge) => edge.target));
    const startNode = nodes.find((node) => !edgeTargets.has(node.id));

    if (startNode) {
      setSlots({});
      setFormContent(null);
      setCurrentId(startNode.id);
      setHistory([{ type: 'bot', nodeId: startNode.id }]);
    }
  }, [nodes, edges]);

  useEffect(() => {
    startSimulation();
  }, [startSimulation]);

  // --- 💡 수정된 부분: Form 노드 데이터 처리 ---
  useEffect(() => {
    const node = nodes.find(n => n.id === currentId);

    if (node?.type === 'form') {
      const { dataSourceType, dataSource } = node.data;

      if (dataSourceType === 'json') {
        try {
          const jsonData = JSON.parse(dataSource);
          setFormContent(jsonData);
        } catch (error) {
          console.error("Invalid JSON in form data source:", error);
          setFormContent({ error: "Invalid JSON format." });
        }
      } else if (dataSourceType === 'api') {
        fetch(dataSource)
          .then(res => res.json())
          .then(data => setFormContent(data))
          .catch(error => {
            console.error("API fetch error in form data source:", error);
            setFormContent({ error: "Failed to fetch API data." });
          });
      }
      // Form 노드에서는 자동 진행하지 않음
      return;
    }

    // 기존 Text 노드 자동 진행 로직
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
  }, [currentId, nodes, edges]);

  const proceedToNextNode = (sourceHandleId) => {
    if (!currentNode) return;

    const nextEdge = edges.find(
      (edge) =>
        edge.source === currentNode.id &&
        (sourceHandleId ? edge.sourceHandle === sourceHandleId : !edge.sourceHandle)
    );

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
    if (currentSlot && currentNode.type === 'slotFilling') {
      setSlots(prev => ({ ...prev, [currentSlot]: answer.value }));
    }

    const sourceHandleId = currentNode.type === 'confirmation' ? answer.value : null;
    proceedToNextNode(sourceHandleId);
  };

  // --- 💡 추가된 부분: Form 렌더링 로직 ---
  const renderFormContent = () => {
    if (!formContent) return <div>Loading form...</div>;
    if (formContent.error) return <div>{formContent.error}</div>;

    return (
      <div className={styles.formDisplay}>
        <h3>{currentNode.data.title}</h3>
        {currentNode.data.elements?.map((element) => {
          switch(element.type) {
            case 'image':
              const src = interpolateMessage(element.src, formContent);
              return <img key={element.id} src={src} alt={element.alt} className={styles.formImage} />;
            case 'grid':
              // This is a simplified grid rendering. You might need a more complex implementation.
              return (
                <div key={element.id} className={styles.formGrid} style={{ gridTemplateColumns: `repeat(${element.columns}, 1fr)` }}>
                  {formContent.items?.map((item, index) => (
                    <div key={index} className={styles.gridItem}>
                      {item.imageUrl && <img src={item.imageUrl} alt={item.title} />}
                      <p>{item.title}</p>
                    </div>
                  ))}
                </div>
              );
            default:
              return null;
          }
        })}
        <button className={styles.optionButton} onClick={() => proceedToNextNode(null)}>
          다음으로
        </button>
      </div>
    );
  };

  const renderOptions = () => {
    if (!currentNode) {
      return <button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>;
    }
    
    // --- 💡 수정된 부분: Form 노드 렌더링 ---
    if (currentNode.type === 'form') {
      return renderFormContent();
    }

    if (currentNode.type === 'text' && edges.some(edge => edge.source === currentNode.id)) {
      return null;
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
    
    return <button className={`${styles.optionButton} ${styles.restartButton}`} onClick={startSimulation}>대화 다시 시작하기</button>;
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
            const message = interpolateMessage(node.data.content || node.data.label, slots);
            if (node.type === 'form') {
              // 폼 노드는 메시지 버블을 표시하지 않고, renderOptions에서 직접 렌더링
              return null;
            }
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